/* Persoonlijk programma: zoekt de deelnemer op via /api/persoonlijk-programma en toont de eigen dag.
   Alle tekst wordt met textContent geplaatst, zodat ingevoerde namen nooit als HTML worden uitgelegd. */
(function () {
  "use strict";

  var API = "/api/persoonlijk-programma";
  var DATA = "assets/data/programma-sessies.json";
  var LOOPROUTE = "https://dewereltlunteren.nl/uploads/pdf/routebeschrijving-de-werelt.pdf";
  var TIMETABLE = "assets/files/timetable-2026.pdf?v=16"; // bij een nieuwe PDF: zelfde versienummer als in programma.html
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

  // Duur per sessietype in minuten. "ronde" = tot het einde van de ronde
  // (workshop en worldcafé: ronde 1 is 90 min, ronde 2 is 75 min).
  // Dialoogtafel en inspiratiesessie hebben (nog) geen vaste regel: in een korte sessie 30 min, in een lange tot het einde van de ronde.
  var DUUR = { presentatie: 30, pitch: 15, partnerpitch: 15, workshop: "ronde", worldcafe: "ronde", wandeling: "ronde" };
  var KORT_STANDAARD = 30;

  // Overal in het persoonlijk programma tijden zonder het woord "uur", zodat het consistent is.
  function zonderUur(tekst) {
    return String(tekst == null ? "" : tekst).replace(/\s*uur\b/gi, "").trim();
  }

  function minuten(hhmm) {
    var m = /(\d{1,2})[.:](\d{2})/.exec(hhmm || "");
    return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
  }
  function klok(min) {
    return String(Math.floor(min / 60)).padStart(2, "0") + "." + String(min % 60).padStart(2, "0");
  }
  function eindVanRonde(tekst) {
    var tijden = String(tekst || "").match(/\d{1,2}[.:]\d{2}/g);
    return tijden && tijden.length > 1 ? minuten(tijden[tijden.length - 1]) : null;
  }

  // Starttijd uit de timetable (het slot), eindtijd volgens het type sessie, nooit later dan het einde van de ronde.
  function sessieTijd(s, slotInfo, cat) {
    var basis = slotInfo.tijd || s.tijdvak;
    var start = minuten(basis);
    var rondeEind = eindVanRonde(cat.rondes[String(s.ronde)]);
    if (start == null || rondeEind == null) return zonderUur(basis);
    var duur = DUUR[s.typeSlug];
    var lang = /_lang$/.test(slotInfo.slot || "") || s.duur === "Lange sessie";
    if (duur == null) duur = lang ? "ronde" : KORT_STANDAARD;
    var eind = duur === "ronde" ? rondeEind : Math.min(start + duur, rondeEind);
    return klok(start) + " \u2013 " + klok(eind);
  }

  function sessieKaart(nr, slot, cat) {
    var s = cat.sessies[String(nr)];
    var slotInfo = Object.assign({ slot: slot }, cat.slots[slot] || {});
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
    tijdDd.appendChild(el("span", "pp-feit-groot", sessieTijd(s, slotInfo, cat)));
    if (slotInfo.label) tijdDd.appendChild(el("span", "pp-deel", slotInfo.label));
    tijd.appendChild(tijdDd);
    feiten.appendChild(tijd);

    var zaal = el("div");
    zaal.appendChild(el("dt", null, "Zaal"));
    var zaalDd = el("dd");
    var zaalNaam = cat.zalen && cat.zalen[String(nr)];
    if (zaalNaam) {
      var info = zaalInfo(cat, zaalNaam);
      zaalDd.appendChild(el("span", "pp-feit-groot", zaalNaam));
      if (info && info.toevoeging) zaalDd.appendChild(el("span", "pp-deel", info.toevoeging));
      if (info && info.verdieping != null) {
        var toonKaart = el("a", "pp-kaartlink", "Toon op plattegrond");
        toonKaart.href = "#pp-plattegrond-" + info.verdieping;
        toonKaart.addEventListener("click", function (ev) {
          ev.preventDefault();
          kaartPopup(zaalNaam, info, toonKaart);
        });
        zaalDd.appendChild(toonKaart);
      }
    } else {
      zaalDd.appendChild(el("span", "pp-nog", "Wordt nog bekendgemaakt"));
    }
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
    li.appendChild(el("div", "pp-tijd", zonderUur(tijdTekst)));
    var inhoud = el("div", "pp-inhoud");
    li.appendChild(inhoud);
    return { li: li, inhoud: inhoud };
  }

  // Pendelbusschema (uit praktische-informatie.html, via het build-script) voor wie Ja heeft bij Pendelservice
  function pendelTabel(rit) {
    var wrap = el("div", "pendel__scroll");
    var tabel = el("table", "pendel__tabel");
    var thead = el("thead"), tr = el("tr");
    rit.kop.forEach(function (k, i) { tr.appendChild(el("th", i === rit.bus ? "bus" : null, k)); });
    thead.appendChild(tr);
    tabel.appendChild(thead);
    var tbody = el("tbody");
    rit.rijen.forEach(function (rij) {
      var r = el("tr");
      rij.forEach(function (c, i) { r.appendChild(el("td", i === rit.bus ? "bus" : null, zonderUur(c))); });
      tbody.appendChild(r);
    });
    tabel.appendChild(tbody);
    wrap.appendChild(tabel);
    return wrap;
  }

  function pendelItem(pendel, rit, titel, tekst, metNoot) {
    var it = item("pp-item--pendel", rit.tijd);
    it.inhoud.appendChild(el("h3", "pp-moment-titel", titel));
    it.inhoud.appendChild(el("p", "pp-sub", tekst));
    var kaart = el("div", "pp-pendel");
    kaart.appendChild(el("h4", null, rit.titel));
    kaart.appendChild(pendelTabel(rit));
    if (metNoot) {
      var p = el("p", "pendel__note");
      p.appendChild(el("strong", null, "Net te laat voor een van de bussen?"));
      p.appendChild(document.createTextNode(" Dan loop je zelf van het station naar De Werelt of andersom. Dat is ongeveer 15 minuten lopen. "));
      var a = el("a", null, "Bekijk hier de looproute");
      a.href = LOOPROUTE;
      a.target = "_blank";
      a.rel = "noopener";
      p.appendChild(a);
      kaart.appendChild(p);
    }
    it.inhoud.appendChild(kaart);
    return it.li;
  }

  // ---- Plattegrond: de zalen van deze deelnemer gemarkeerd ----
  var VERDIEPINGEN = [
    { titel: "Begane grond", beeld: "assets/img/plattegrond/plattegrond-begane-grond.webp", b: 1800, h: 1274 },
    { titel: "1e verdieping", beeld: "assets/img/plattegrond/plattegrond-1e-verdieping.webp", b: 1800, h: 669 }
  ];

  function zaalInfo(cat, naam) {
    return cat.zaalinfo ? cat.zaalinfo[naam] || null : null;
  }

  function zaalSleutel(naam) {
    return String(naam).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  // Pop-up met de plattegrond van één zaal. Gebruikt <dialog>: sluiten met het kruisje, Esc of een klik naast de kaart.
  var popup = null;
  function kaartPopup(naam, info, terugFocus) {
    var v = VERDIEPINGEN[info.verdieping];
    if (!v) return;
    if (!popup) {
      popup = el("dialog", "pp-popup");
      popup.setAttribute("aria-labelledby", "pp-popup-titel");
      popup.addEventListener("click", function (ev) { if (ev.target === popup) popup.close(); });
      popup.addEventListener("close", function () {
        document.documentElement.classList.remove("pp-popup-open");
        if (popup._terug) popup._terug.focus();
      });
      document.body.appendChild(popup);
    }
    popup.textContent = "";
    popup._terug = terugFocus || null;

    var kop = el("div", "pp-popup-kop");
    var tekst = el("div");
    tekst.appendChild(el("span", "eyebrow", v.titel));
    var titel = el("h2", null, naam);
    titel.id = "pp-popup-titel";
    tekst.appendChild(titel);
    if (info.toevoeging) tekst.appendChild(el("p", "pp-popup-route", info.toevoeging));
    kop.appendChild(tekst);
    var sluit = el("button", "pp-popup-sluit");
    sluit.type = "button";
    sluit.setAttribute("aria-label", "Plattegrond sluiten");
    sluit.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
    sluit.addEventListener("click", function () { popup.close(); });
    kop.appendChild(sluit);
    popup.appendChild(kop);

    // Op mobiel is de kaart breder dan het scherm: horizontaal scrollen, met de zaal in beeld.
    var scroll = el("div", "pp-popup-scroll");
    var kaart = el("div", "pp-kaart pp-popup-kaart");
    var img = el("img");
    img.src = v.beeld;
    img.alt = "Plattegrond " + v.titel.toLowerCase() + " van De Werelt met " + naam + " gemarkeerd";
    img.width = v.b;
    img.height = v.h;
    kaart.appendChild(img);
    var m = el("span", "pp-markering pp-markering--popup");
    m.setAttribute("aria-hidden", "true");
    m.style.left = info.x + "%";
    m.style.top = info.y + "%";
    m.style.width = info.w + "%";
    m.style.height = info.h + "%";
    kaart.appendChild(m);
    // Label "Jouw zaal" boven de zaal, of eronder als de zaal bovenaan de kaart ligt
    var label = el("span", "pp-popup-label" + (info.y < 18 ? " pp-popup-label--onder" : ""), "Jouw zaal");
    label.setAttribute("aria-hidden", "true");
    label.style.left = Math.min(Math.max(info.x + info.w / 2, 8), 92) + "%";
    label.style.top = (info.y < 18 ? info.y + info.h : info.y) + "%";
    kaart.appendChild(label);
    scroll.appendChild(kaart);
    popup.appendChild(scroll);
    popup.appendChild(el("p", "pp-popup-hint", "Tip: veeg over de kaart om de rest van de verdieping te zien."));

    document.documentElement.classList.add("pp-popup-open");
    if (typeof popup.showModal === "function") popup.showModal();
    else popup.setAttribute("open", "");
    sluit.focus();

    function centreer() {
      var doel = (info.x + info.w / 2) / 100 * kaart.offsetWidth - scroll.clientWidth / 2;
      scroll.scrollLeft = Math.max(0, doel);
    }
    if (img.complete) centreer(); else img.addEventListener("load", centreer);
    requestAnimationFrame(centreer);
  }

  // Bouwt de plattegrond met per verdieping een markering op elke zaal waar de deelnemer een sessie heeft.
  function plattegrond(sessies, cat) {
    var perVerdieping = [[], []], buiten = [];
    sessies.forEach(function (x) {
      var naam = cat.zalen && cat.zalen[String(x.nr)];
      var info = naam && zaalInfo(cat, naam);
      if (!naam) return;
      var regel = { nr: x.nr, slot: x.slot, zaal: naam, info: info, s: cat.sessies[String(x.nr)] };
      if (info && info.verdieping != null && perVerdieping[info.verdieping]) perVerdieping[info.verdieping].push(regel);
      else buiten.push(regel);
    });

    var sectie = el("section", "pp-plattegrond");
    sectie.id = "pp-plattegrond";
    sectie.setAttribute("aria-labelledby", "pp-plattegrond-kop");
    sectie.appendChild(el("span", "eyebrow", "Plattegrond De Werelt"));
    var h = el("h2", null, "Hier vind je jouw zalen");
    h.id = "pp-plattegrond-kop";
    sectie.appendChild(h);
    var heeftZalen = perVerdieping[0].length || perVerdieping[1].length;
    sectie.appendChild(el("p", "pp-plattegrond-intro", heeftZalen
      ? "De zalen van jouw sessies zijn roze gemarkeerd. Het nummer in de markering is de ronde."
      : "Zo ziet De Werelt eruit. Je vindt hier de zalen, het netwerk- en funplein en de koffie."));

    // verdieping met eigen zalen eerst
    var volgorde = [0, 1];
    if (!perVerdieping[0].length && perVerdieping[1].length) volgorde = [1, 0];

    volgorde.forEach(function (v) {
      var eigen = perVerdieping[v];
      var fig = el("figure", "pp-verdieping");
      fig.id = "pp-plattegrond-" + v;
      var kop = el("figcaption", "pp-verdieping-kop");
      kop.appendChild(el("h3", null, VERDIEPINGEN[v].titel));
      if (eigen.length) kop.appendChild(el("span", "pp-verdieping-tel",
        eigen.length === 1 ? "1 sessie" : eigen.length + " sessies"));
      fig.appendChild(kop);

      var kaart = el("div", "pp-kaart");
      var img = el("img");
      img.src = VERDIEPINGEN[v].beeld;
      img.alt = "Plattegrond " + VERDIEPINGEN[v].titel.toLowerCase() + " van De Werelt" +
        (eigen.length ? ", met jouw zalen gemarkeerd" : "");
      img.loading = "lazy";
      img.width = VERDIEPINGEN[v].b;
      img.height = VERDIEPINGEN[v].h;
      kaart.appendChild(img);

      var perZaal = {};
      eigen.forEach(function (r) { (perZaal[r.zaal] = perZaal[r.zaal] || []).push(r); });
      Object.keys(perZaal).forEach(function (naam) {
        var i = zaalInfo(cat, naam);
        var m = el("span", "pp-markering");
        m.setAttribute("data-zaal", zaalSleutel(naam));
        m.setAttribute("aria-hidden", "true");
        m.style.left = i.x + "%";
        m.style.top = i.y + "%";
        m.style.width = i.w + "%";
        m.style.height = i.h + "%";
        var rondes = [];
        perZaal[naam].forEach(function (r) { if (r.s && rondes.indexOf(r.s.ronde) < 0) rondes.push(r.s.ronde); });
        var badges = el("span", "pp-markering-rondes");
        rondes.sort().forEach(function (rn) { badges.appendChild(el("b", "pp-markering-ronde", String(rn))); });
        m.appendChild(badges);
        kaart.appendChild(m);
      });
      fig.appendChild(kaart);

      if (eigen.length) {
        var legenda = el("ul", "pp-legenda");
        eigen.slice().sort(function (a, b) {
          return (a.s ? a.s.ronde : 9) - (b.s ? b.s.ronde : 9) || slotRang(a.slot) - slotRang(b.slot);
        }).forEach(function (r) {
          var li = el("li");
          li.appendChild(el("b", "pp-markering-ronde", String(r.s ? r.s.ronde : "")));
          var tekst = el("span");
          tekst.appendChild(el("strong", null, r.zaal));
          var slotInfo = Object.assign({ slot: r.slot }, cat.slots[r.slot] || {});
          tekst.appendChild(document.createTextNode(" \u00b7 " + (r.s ? sessieTijd(r.s, slotInfo, cat) + " \u00b7 " + r.s.titel : "")));
          if (r.info && r.info.toevoeging) tekst.appendChild(el("small", null, r.info.toevoeging));
          li.appendChild(tekst);
          legenda.appendChild(li);
        });
        fig.appendChild(legenda);
      }
      var groot = el("a", "pp-kaart-groot", "Open de plattegrond groot");
      groot.href = VERDIEPINGEN[v].beeld;
      groot.target = "_blank";
      groot.rel = "noopener";
      fig.appendChild(groot);
      sectie.appendChild(fig);
    });

    if (buiten.length) {
      var p = el("p", "pp-buiten");
      p.appendChild(el("strong", null, "Buiten: "));
      p.appendChild(document.createTextNode(buiten.map(function (r) { return r.s ? r.s.titel : ""; }).join(", ") +
        ". Deze sessie vindt buiten plaats en staat daarom niet op de plattegrond."));
      sectie.appendChild(p);
    }
    return sectie;
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
    // Link naar de volledige timetable (zelfde PDF en versie als op programma.html)
    var timetable = el("a", "btn btn--ghost", "Bekijk de timetable");
    timetable.href = TIMETABLE;
    timetable.target = "_blank";
    timetable.rel = "noopener";
    var knoppen = el("div", "pp-kop-knoppen");
    var naarKaart = el("a", "btn btn--ghost", "Bekijk de plattegrond");
    naarKaart.href = "#pp-plattegrond";
    knoppen.appendChild(naarKaart);
    knoppen.appendChild(timetable);
    kop.appendChild(knoppen);
    resultaat.appendChild(kop);

    var perRonde = { 1: [], 2: [], 3: [] };
    antwoord.sessies.forEach(function (x) {
      var s = cat.sessies[String(x.nr)];
      if (s && perRonde[s.ronde]) perRonde[s.ronde].push(x);
    });

    var lijst = el("ol", "pp-dag");
    var pendel = antwoord.pendel && cat.pendel ? cat.pendel : null;
    if (pendel) {
      lijst.appendChild(pendelItem(pendel, pendel.heen, "Pendelbus naar De Werelt",
        "Je hebt aangegeven dat je de pendelbus wilt gebruiken. " + pendel.intro, true));
    }
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
    if (pendel) {
      lijst.appendChild(pendelItem(pendel, pendel.terug, "Pendelbus terug naar station Lunteren",
        "Na de borrel brengt de pendelbus je terug naar het station.", true));
    }
    resultaat.appendChild(lijst);
    resultaat.appendChild(plattegrond(antwoord.sessies, cat));

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
})();
