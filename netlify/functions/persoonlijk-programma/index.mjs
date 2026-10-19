// Zoekt het persoonlijke programma van één deelnemer op, op voor- en achternaam.
// De deelnemerslijst staat versleuteld in data.mjs; de sleutel staat alleen als
// geheime omgevingsvariabele op Netlify. De lijst zelf gaat nooit naar de browser: er wordt uitsluitend
// het programma van de ene gevonden persoon teruggegeven. Namen worden niet gelogd.
import { createDecipheriv } from "node:crypto";
import versleuteld from "./data.mjs";

const SLEUTEL_ENV = "PERSOONLIJK_PROGRAMMA_SLEUTEL";
const MAX_POGINGEN = 15;
const VENSTER_MS = 10 * 60 * 1000;
const TUSSENVOEGSELS = new Set(["van", "de", "der", "den", "te", "ten", "ter", "het", "t", "op", "in", "aan", "bij", "von", "el", "al", "vd", "v"]);

export const config = { path: "/api/persoonlijk-programma" };

const norm = (tekst) =>
  String(tekst ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]/g, "");

// Alle naamdelen zonder tussenvoegsels: 'Maaike van der Snoek' en 'Maaike Snoek' geven dezelfde kern.
const kern = (voornaam, achternaam) =>
  `${voornaam} ${achternaam}`
    .normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .split(/[\s\-]+/).map((d) => d.replace(/[^a-z0-9]/g, ""))
    .filter((d) => d && !TUSSENVOEGSELS.has(d)).join("");

let index = null;
function laadIndex() {
  if (index) return index;
  const sleutelHex = process.env[SLEUTEL_ENV] || "";
  if (!/^[0-9a-f]{64}$/i.test(sleutelHex)) throw new Error("sleutel ontbreekt of is ongeldig");
  const buf = Buffer.from(versleuteld, "base64");
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(sleutelHex, "hex"), buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(buf.length - 16));
  const tekst = Buffer.concat([decipher.update(buf.subarray(12, buf.length - 16)), decipher.final()]).toString("utf8");
  const { deelnemers } = JSON.parse(tekst);
  const volledig = new Map();
  const kernen = new Map();
  for (const d of deelnemers) {
    for (const [map, sleutel] of [[volledig, norm(d.v) + norm(d.a)], [kernen, kern(d.v, d.a)]]) {
      if (!sleutel) continue;
      if (!map.has(sleutel)) map.set(sleutel, []);
      map.get(sleutel).push(d);
    }
  }
  index = { volledig, kernen };
  return index;
}

function zoek(voornaam, achternaam) {
  const { volledig, kernen } = laadIndex();
  const kandidaten = volledig.get(norm(voornaam) + norm(achternaam)) ?? kernen.get(kern(voornaam, achternaam)) ?? [];
  if (kandidaten.length === 0) return { status: "niet_gevonden" };
  const verschillend = new Set(kandidaten.map((k) => JSON.stringify(k.s)));
  if (verschillend.size > 1) return { status: "meerdere" };
  return { status: "gevonden", deelnemer: kandidaten[0] };
}

const pogingen = new Map();
function teVeel(ip) {
  const nu = Date.now();
  const recent = (pogingen.get(ip) ?? []).filter((t) => nu - t < VENSTER_MS);
  recent.push(nu);
  pogingen.set(ip, recent);
  if (pogingen.size > 5000) for (const [sleutel, tijden] of pogingen) if (nu - tijden[tijden.length - 1] > VENSTER_MS) pogingen.delete(sleutel);
  return recent.length > MAX_POGINGEN;
}

const antwoord = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });

export default async (request, context) => {
  if (request.method !== "POST") return antwoord(405, { fout: "methode" });

  const ip = context?.ip || request.headers.get("x-nf-client-connection-ip") || "onbekend";
  if (teVeel(ip)) return antwoord(429, { fout: "te_veel" });

  let invoer;
  try {
    const tekst = await request.text();
    if (tekst.length > 2000) return antwoord(400, { fout: "ongeldig" });
    invoer = JSON.parse(tekst);
  } catch {
    return antwoord(400, { fout: "ongeldig" });
  }
  const voornaam = typeof invoer?.voornaam === "string" ? invoer.voornaam.trim() : "";
  const achternaam = typeof invoer?.achternaam === "string" ? invoer.achternaam.trim() : "";
  if (!voornaam || !achternaam || voornaam.length > 80 || achternaam.length > 80) return antwoord(400, { fout: "ongeldig" });

  try {
    const resultaat = zoek(voornaam, achternaam);
    if (resultaat.status === "gevonden") {
      return antwoord(200, { voornaam: resultaat.deelnemer.v, sessies: resultaat.deelnemer.s.map(([slot, nr]) => ({ slot, nr })) });
    }
    return antwoord(resultaat.status === "meerdere" ? 409 : 404, { fout: resultaat.status });
  } catch (fout) {
    console.error("persoonlijk-programma: kon de lijst niet laden:", fout.message);
    return antwoord(500, { fout: "serverfout" });
  }
};
