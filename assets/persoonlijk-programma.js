/* Persoonlijk programma: zoekt de deelnemer op via /api/persoonlijk-programma en toont de eigen dag.
   Alle tekst wordt met textContent geplaatst, zodat ingevoerde namen nooit als HTML worden uitgelegd. */
(function () {
  "use strict";

  var API = "/api/persoonlijk-programma";
  var DATA = "assets/data/programma-sessies.json";
  var MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
  var SLOT_VOLGORDE = { lang: 0, kort1: 1, kort2: 2, kort: 3 };

  var form = document.getElementById("pp-form");
  if (!form) return;
  var zoek = document.getElementById("pp-zoek");
  var resultaat = document.getElementById("pp-resultaat");
  var voornaamVeld = document.getElementById("pp-voornaam");
  var achternaamVeld = document.getElementById("pp-achternaam");
  var melding = document.getElementById("pp-melding");
  var knop = document.getElementById("pp-knop");
  var knopTekst = knop.firstChild.textContent;
  var standEl = document.getElementById("pp-stand");

  var catalogusBelofte = fetch(DATA).then(function (r) {
    if (!r.ok) throw new Error("catalogus");
    return r.json();
  });
  catalogusBelofte.then(function (cat) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(cat.stand || "");
    if (m && standEl) standEl.textContent = parseInt(m[3], 10) + " " + MAANDEN[parseInt(m[2], 10) - 1] + " " + m[1];
  }).catch(function () {});

  function el(tag, klasse, tekst) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (tekst != null) e.textContent = tekst;
    return e;
  }

  function toonMelding(tekst, linkTekst) {
    melding.textContent = tekst;
    if (linkTekst) {
      melding.appendChild(document.createTextNode(" "));
      var a = el("a", null, linkTekst);
      a.href = "contact.html";
      melding.appendChild(a);
      melding.appendChild(document.createTextNode("."));
    }
    melding.hidden = false;
  }

  function bezig(aan) {
    knop.disabled = aan;
    knop.firstChild.textContent = aan ? "Even zoeken… " : knopTekst;
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    melding.hidden = true;
    var voornaam = voornaamVeld.value.trim();
    var achternaam = achternaamVeld.value.trim();
    if (!voornaam || !achternaam) {
      toonMelding("Vul zowel je voornaam als je achternaam in.");
      (voornaam ? achternaamVeld : voornaamVeld).focus();
      return;
    }
    bezig(true);
    Promise.all([
      fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ voornaam: voornaam, achternaam: achternaam }) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, json: j }; }); }),
      catalogusBelofte
    ]).then(function (res) {
      var antwoord = res[0], cat = res[1];
      if (antwoord.status === 200) {
        toon(antwoord.json, achternaam, cat);
      } else if (antwoord.status === 404) {
        var stand = standEl ? standEl.textContent : "recent";
        toonMelding("We konden je niet vinden. Controleer of je voor- en achternaam gespeld zijn zoals bij je inschrijving. Heb je je pas recent ingeschreven? De deelnemerslijst is bijgewerkt tot " + stand + ". Kom later terug of neem", "contact met ons op");
      } else if (antwoord.status === 409) {
        toonMelding("Er zijn meerdere deelnemers met deze naam, dus we kunnen je programma hier niet veilig tonen. Neem", "contact met ons op");
      } else if (antwoord.status === 429) {
        toonMelding("Je hebt te vaak gezocht. Probeer het over enkele minuten opnieuw.");
      } else if (antwoord.status === 400) {
        toonMelding("Vul zowel je voornaam als je achternaam in.");
      } else {
        toonMelding("Er ging iets mis aan onze kant. Probeer het later opnieuw of neem", "contact met ons op");
      }
    }).catch(function () {
      toonMelding("We konden je programma niet ophalen. Controleer je internetverbinding en probeer het opnieuw.");
    }).then(function () { bezig(false); });
  });

  function icoon(svgTekst) {
    var s = el("span", "session-card__visual-icon");
    s.setAttribute("aria-hidden", "true");
    s.innerHTML = svgTekst || ""; // eigen, vertrouwde SVG uit de programmapagina
    return s;
  }

  function sessieKaart(nr, slot, cat) {
    var s = cat.sessies[String(nr)];
    var slotInfo = cat.slots[slot] || {};
    var type = cat.typen[s.typeSlug] || { label: s.type, icoon: "" };
    var kaart = el("article", "session-card pp-card");

    var visual = el("div", "session-card__visual session-card__visual--" + s.typeSlug);
    visual.appendChild(icoon(type.icoon));
    visual.appendChild(el("span", "pp-type", type.label));
    var rechts = el("div", "session-card__visual-right");
    rechts.appendChild(el("span", "session-card__nr", "Nr. " + String(nr).padStart(2, "0")));
    visual.appendChild(rechts);
    kaart.appendChild(visual);

    var body = el("div", "session-card__body");
    body.appendChild(el("h4", "pp-titel", s.titel));
    if (s.ondertitel) body.appendChild(el("p", "subtitle", s.ondertitel));

    var feiten = el("dl", "pp-feiten");
    var tijd = el("div");
    tijd.appendChild(el("dt", null, "Tijd"));
    var tijdDd = el("dd");
    tijdDd.appendChild(el("span", "pp-feit-groot", slotInfo.tijd || s.tijdvak));
    if (slotInfo.label) tijdDd.appendChild(el("span", "pp-deel", slotInfo.label));
    tijd.appendChild(tijdDd);
    feiten.appendChild(tijd);

    var zaal = el("div");
    zaal.appendChild(el("dt", null, "Zaal"));
    var zaalDd = el("dd");
    var zaalNaam = cat.zalen && cat.zalen[String(nr)];
    if (zaalNaam) zaalDd.appendChild(el("span", "pp-feit-groot", zaalNaam));
    else zaalDd.appendChild(el("span", "pp-nog", "Wordt nog bekendgemaakt"));
    zaal.appendChild(zaalDd);
    feiten.appendChild(zaal);

    var wie = el("div");
    wie.appendChild(el("dt", null, s.sprekers.length > 1 ? "Sprekers" : (s.sprekers.length ? "Spreker" : "Aangeboden door")));
    var wieDd = el("dd");
    if (s.sprekers.length) {
      var lijst = el("ul", "pp-sprekers");
      s.sprekers.forEach(function (sp) {
        var li = el("li");
        li.appendChild(el("b", null, sp.naam));
        if (sp.rol) li.appendChild(el("span", null, sp.rol));
        lijst.appendChild(li);
      });
      wieDd.appendChild(lijst);
    } else {
      wieDd.appendChild(el("b", null, s.organisatie || "Consortium Beroepsonderwijs"));
    }
    wie.appendChild(wieDd);
    feiten.appendChild(wie);
    body.appendChild(feiten);

    if (s.toelichting && s.toelichting.length) {
      body.appendChild(el("p", "pp-toelichting-kop", "Toelichting"));
      var toel = el("div", "pp-toelichting");
      s.toelichting.forEach(function (p) { toel.appendChild(el("p", null, p)); });
      body.appendChild(toel);
    }
    kaart.appendChild(body);
    return kaart;
  }

  function slotRang(slot) {
    var m = /^r\d_(.+)$/.exec(slot);
    return m && SLOT_VOLGORDE[m[1]] != null ? SLOT_VOLGORDE[m[1]] : 9;
  }

  function item(klasse, tijdTekst) {
    var li = el("li", "pp-item" + (klasse ? " " + klasse : ""));
    li.appendChild(el("div", "pp-tijd", tijdTekst));
    var inhoud = el("div", "pp-inhoud");
    li.appendChild(inhoud);
    return { li: li, inhoud: inhoud };
  }

  function toon(antwoord, achternaam, cat) {
    resultaat.textContent = "";

    var kop = el("div", "pp-kop");
    var links = el("div");
    links.appendChild(el("span", "eyebrow", "Jouw programma"));
    var h2 = el("h2", null, "Hallo " + antwoord.voornaam + ", dit is jouw dag");
    h2.tabIndex = -1;
    links.appendChild(h2);
    var datum = el("p", "pp-datum");
    var d1 = el("span", null, cat.evenement.datum);
    var d2 = el("span", null, cat.evenement.locatie);
    datum.appendChild(d1);
    datum.appendChild(d2);
    links.appendChild(datum);
    kop.appendChild(links);
    var ander = el("button", "btn btn--ghost", "Andere naam zoeken");
    ander.type = "button";
    ander.addEventListener("click", reset);
    kop.appendChild(ander);
    resultaat.appendChild(kop);

    var perRonde = { 1: [], 2: [], 3: [] };
    antwoord.sessies.forEach(function (x) {
      var s = cat.sessies[String(x.nr)];
      if (s && perRonde[s.ronde]) perRonde[s.ronde].push(x);
    });

    var lijst = el("ol", "pp-dag");
    cat.dag.forEach(function (blok) {
      var it;
      if (blok.type === "ronde") {
        it = item("pp-item--ronde", cat.rondes[String(blok.ronde)]);
        var kopje = el("div", "pp-ronde-kop");
        kopje.appendChild(el("h3", "pp-ronde-titel", "Ronde " + blok.ronde));
        it.inhoud.appendChild(kopje);
        var keuzes = perRonde[blok.ronde].slice().sort(function (a, b) { return slotRang(a.slot) - slotRang(b.slot); });
        if (!keuzes.length) {
          it.inhoud.appendChild(el("p", "pp-leeg", "Je hebt je in deze ronde niet ingeschreven voor een presentatie."));
        } else {
          keuzes.forEach(function (x) { it.inhoud.appendChild(sessieKaart(x.nr, x.slot, cat)); });
        }
      } else if (blok.type === "opening") {
        it = item("", blok.tijd);
        it.inhoud.appendChild(el("h3", "pp-moment-titel", blok.titel));
        var regels = el("div", "pp-regels");
        blok.regels.forEach(function (r) {
          var p = el("p", "pp-regel");
          p.appendChild(el("strong", null, r.label));
          p.appendChild(document.createTextNode(r.tekst));
          regels.appendChild(p);
        });
        it.inhoud.appendChild(regels);
      } else {
        it = item("", blok.tijd);
        it.inhoud.appendChild(el("h3", "pp-moment-titel", blok.titel));
        if (blok.sub) it.inhoud.appendChild(el("p", "pp-sub", blok.sub));
      }
      lijst.appendChild(it.li);
    });
    resultaat.appendChild(lijst);

    var voet = el("p", "pp-voet");
    voet.appendChild(document.createTextNode("Programma onder voorbehoud van wijzigingen. Klopt er iets niet in jouw programma? "));
    var a = el("a", null, "Neem contact met ons op");
    a.href = "contact.html";
    voet.appendChild(a);
    voet.appendChild(document.createTextNode("."));
    resultaat.appendChild(voet);

    zoek.hidden = true;
    resultaat.hidden = false;
    var reduceer = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    h2.focus({ preventScroll: true });
    kop.scrollIntoView({ behavior: reduceer ? "auto" : "smooth", block: "start" });
  }

  function reset() {
    resultaat.hidden = true;
    resultaat.textContent = "";
    form.reset();
    melding.hidden = true;
    zoek.hidden = false;
    voornaamVeld.focus();
  }
})();
