const fs = require('fs');
const path = require('path');

// =====================================================================
// 🎛️ BUILD KONFIGURATION
// Hier steuerst du, was generiert wird. 
// Setze den Wert auf true, um den Bereich zu aktivieren.
// =====================================================================
const BUILD_CONFIG = {
    parkplatz: true,       // Parkfirmen & Supermärkte (Silo 1 & 2)
    ordnungsamt: true,     // Staatliche Knöllchen / Park-Szenarien (Silo 4)
    bahn_oepnv: true,      // Bahn / ÖPNV / 60€ (Silo 10)
    
    // Später nach und nach auf true setzen:
    blitzer: false,        // Silo 5
    abstand: false,        // Silo 6
    ampel: false,          // Silo 7
    handy: false,          // Silo 9
    lkw: false,            // Silo 8
    ausland: false,        // Silo 11
    abschleppen: false,    // Silo 12
    maut: false            // Silo 13
};

// Output-Ordner erstellen (Kein /de/ Ordner für dieses Projekt!)
const outputDir = path.join(__dirname, 'docs');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

console.log('🚀 Starte finale Generierung (Gefiltert nach BUILD_CONFIG)...\n');

// --- HILFSFUNKTIONEN ---
const loadTemplate = (name) => {
    const filePath = path.join(__dirname, name);
    if (!fs.existsSync(filePath)) return ""; // Fallback, falls Template noch nicht existiert
    return fs.readFileSync(filePath, 'utf8');
};

function generateCrossLinks(allItems, currentItem, urlGenerator, nameGenerator, maxLinks = 6) {
    if (!allItems || allItems.length === 0) return '';
    let otherItems = allItems.filter(item => item.slug !== currentItem.slug);
    // Fisher-Yates Shuffle
    for (let i = otherItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherItems[i], otherItems[j]] = [otherItems[j], otherItems[i]];
    }
    const selectedItems = otherItems.slice(0, maxLinks);
    
    let html = '';
    selectedItems.forEach(item => {
        html += `<a href="${urlGenerator(item)}">${nameGenerator(item)}</a>\n`;
    });
    return html;
}

// 1. Dateien einlesen (Wir laden alles, aber verarbeiten nur das Aktivierte)
// Hinweis: Wenn eine JSON-Datei noch nicht existiert, würde das hier crashen. 
// Gehe davon aus, dass die Dateien bereits im Ordner liegen.
const parkfirmen = JSON.parse(fs.readFileSync(path.join(__dirname, 'parkfirmen.json'), 'utf8'));
const supermaerkte = JSON.parse(fs.readFileSync(path.join(__dirname, 'supermaerkte.json'), 'utf8'));
const verkehrsbetriebe = JSON.parse(fs.readFileSync(path.join(__dirname, 'verkehrsbetriebe.json'), 'utf8'));
const laender = JSON.parse(fs.readFileSync(path.join(__dirname, 'laender.json'), 'utf8'));
const mautbetreiber = JSON.parse(fs.readFileSync(path.join(__dirname, 'mautbetreiber.json'), 'utf8'));

const abschleppSzenarien = JSON.parse(fs.readFileSync(path.join(__dirname, 'abschlepp-szenarien.json'), 'utf8'));
const abstandSzenarien = JSON.parse(fs.readFileSync(path.join(__dirname, 'abstand-szenarien.json'), 'utf8'));
const ampelSzenarien = JSON.parse(fs.readFileSync(path.join(__dirname, 'ampel-szenarien.json'), 'utf8'));
const blitzerSzenarien = JSON.parse(fs.readFileSync(path.join(__dirname, 'blitzer-szenarien.json'), 'utf8'));
const handySzenarien = JSON.parse(fs.readFileSync(path.join(__dirname, 'handy-szenarien.json'), 'utf8'));
const lkwSzenarien = JSON.parse(fs.readFileSync(path.join(__dirname, 'lkw-szenarien.json'), 'utf8'));
const parkSzenarien = JSON.parse(fs.readFileSync(path.join(__dirname, 'park-szenarien.json'), 'utf8'));

// Templates laden
const masterTpl = loadTemplate('parkplatz-master.html');
const ordnungsamtTpl = loadTemplate('ordnungsamt-master.html');
const blitzerTpl = loadTemplate('blitzer-master.html');
const abstandTpl = loadTemplate('abstand-master.html');
const ampelTpl = loadTemplate('ampel-master.html');
const lkwTpl = loadTemplate('lkw-master.html');
const handyTpl = loadTemplate('handy-master.html');
const ebeTpl = loadTemplate('ebe-master.html');
const auslandTpl = loadTemplate('ausland-master.html');
const abschleppTpl = loadTemplate('abschleppen-master.html');
const mautTpl = loadTemplate('maut-master.html');

// 2. ALLE Sammel-Variablen sauber am Anfang deklarieren
let optFirmen = "", linkFirmen = "";
let optSupermaerkte = "", linkSupermaerkte = "";
let optOrdnungsamt = "", linkOrdnungsamt = "";
let optBlitzer = "", linkBlitzer = "";
let optAbstand = "", linkAbstand = ""; 
let optAmpel = "", linkAmpel = "";
let optLkw = "", linkLkw = "";
let optHandy = "", linkHandy = "";
let optEbe = "", linkEbe = "";
let optAusland = "", linkAusland = "";
let optAbschleppen = "", linkAbschleppen = "";
let optMaut = "", linkMaut = "";

// =====================================================================
// SILO 1 & 2: PARKFIRMEN & SUPERMÄRKTE
// =====================================================================
if (BUILD_CONFIG.parkplatz) {
    console.log('🅿️ Generiere Parkplatz-Knöllchen (Firmen & Supermärkte)...');
    
    parkfirmen.forEach(p => {
        let fName = `knoellchen-widerspruch-${p.slug}.html`;
        let crossLinks = generateCrossLinks(parkfirmen, p, item => `knoellchen-widerspruch-${item.slug}.html`, item => item.name);
        let content = masterTpl
            .replace(/\{\{FIRMA_NAME\}\}/g, p.name)
            .replace(/\{\{FIRMA_EMAIL\}\}/g, p.email)
            .replace(/\{\{AUFTRAGGEBER\}\}/g, "dem Supermarkt") 
            .replace(/\{\{STADT_NAME\}\}/g, "Ihrer Stadt") 
            .replace(/\{\{STADT_KUERZEL\}\}/g, "Stadt")     
            .replace(/value="dem Supermarkt, Ihrer Stadt"/g, 'value="" placeholder="z.B. Lidl, Braunschweig"') 
            .replace(/\{\{DATEINAME\}\}/g, fName)
            .replace(/\{\{PORTAL_URL\}\}/g, p.portal_url || '#')
            .replace(/\{\{BELIEBTE_LINKS\}\}/g, crossLinks)
            .replace(/\{\{STADT_INFOBOX\}\}/g, p.infobox || "");

        fs.writeFileSync(path.join(outputDir, fName), content, 'utf8');
        optFirmen += `<option value="${fName}">${p.name}</option>\n`;
        linkFirmen += `<a href="${fName}">${p.name}</a>\n`;
    });

    supermaerkte.forEach(s => {
        let fName = `parkplatz-strafe-${s.slug}.html`;
        let crossLinks = generateCrossLinks(supermaerkte, s, item => `parkplatz-strafe-${item.slug}.html`, item => `${item.name} Parkplatz`);
        let content = masterTpl
            .replace(/\{\{FIRMA_NAME\}\} Ticket erhalten\? Wehren Sie sich erfolgreich!/g, `Knöllchen auf dem ${s.name}-Parkplatz? So wehren Sie sich!`)
            .replace(/Widerspruch Parkknöllchen \{\{FIRMA_NAME\}\} \(\{\{STADT_NAME\}\}\)/g, `${s.name} Parkplatz Strafe: Widerspruch & Abzocke abwehren`)
            .replace(/\{\{FIRMA_NAME\}\}/g, "der Parkfirma") 
            .replace(/\{\{FIRMA_EMAIL\}\}/g, "") 
            .replace(/\{\{AUFTRAGGEBER\}\}/g, s.name)
            .replace(/\{\{STADT_NAME\}\}/g, "Ihrer Stadt")
            .replace(/\{\{STADT_KUERZEL\}\}/g, "Stadt") 
            .replace(/value="der Parkfirma"/g, 'value="" placeholder="Name der Parkfirma eintragen"')
            .replace(/value="\{\{FIRMA_EMAIL\}\}"/g, 'value="" placeholder="info@parkfirma.de"')
            .replace(/value=".*, Ihrer Stadt"/g, `value="${s.name}, " placeholder="${s.name}, Stadt eintragen"`)
            .replace(/\{\{DATEINAME\}\}/g, fName)
            .replace(/\{\{BELIEBTE_LINKS\}\}/g, crossLinks)
            .replace(/\{\{STADT_INFOBOX\}\}/g, s.infobox || "");

        fs.writeFileSync(path.join(outputDir, fName), content, 'utf8');
        optSupermaerkte += `<option value="${fName}">${s.name} Parkplatz</option>\n`;
        linkSupermaerkte += `<a href="${fName}">${s.name} Parkplatz</a>\n`;
    });
}

// =====================================================================
// SILO 4: ORDNUNGSAMT / STAATLICHE KNÖLLCHEN
// =====================================================================
if (BUILD_CONFIG.ordnungsamt) {
    console.log('👮 Generiere Ordnungsamt-Knöllchen...');
    parkSzenarien.forEach(s => {
        let fName = `einspruch-ordnungsamt-${s.slug}.html`;
        let crossLinks = generateCrossLinks(parkSzenarien, s, item => `einspruch-ordnungsamt-${item.slug}.html`, item => item.fall_titel);

        let content = ordnungsamtTpl
            .replace(/\{\{FALL_TITEL\}\}/g, s.fall_titel || "")
            .replace(/\{\{H1_TITEL\}\}/g, s.h1_titel || "")
            .replace(/\{\{META_DESCRIPTION\}\}/g, s.meta_description || "")
            .replace(/\{\{EINLEITUNGSTEXT\}\}/g, s.einleitungstext || "")
            .replace(/\{\{FALL_INFOBOX\}\}/g, s.fall_infobox || "")
            .replace(/\{\{DEFAULT_STRATEGIE\}\}/g, s.default_strategie || "")
            .replace(/\{\{DATEINAME\}\}/g, fName)
            .replace(/\{\{BELIEBTE_LINKS\}\}/g, crossLinks);

        fs.writeFileSync(path.join(outputDir, fName), content, 'utf8');
        optOrdnungsamt += `<option value="${fName}">${s.fall_titel}</option>\n`;
        linkOrdnungsamt += `<a href="${fName}">${s.fall_titel}</a>\n`;
    });
}

// =====================================================================
// SILO 10: ÖPNV / ERHÖHTES BEFÖRDERUNGSENTGELT (60€ Strafe)
// =====================================================================
if (BUILD_CONFIG.bahn_oepnv) {
    console.log('🚆 Generiere Bahn / ÖPNV Strafen...');
    verkehrsbetriebe.forEach(v => {
        let fName = `einspruch-60-euro-${v.slug}.html`;
        let crossLinks = generateCrossLinks(verkehrsbetriebe, v, item => `einspruch-60-euro-${item.slug}.html`, item => item.name);

        let content = ebeTpl
            .replace(/\{\{VERKEHRSBETRIEB_NAME\}\}/g, v.name)
            .replace(/\{\{VERKEHRSBETRIEB_EMAIL\}\}/g, v.email)
            .replace(/\{\{STADT_NAME\}\}/g, v.stadt)
            .replace(/\{\{DATEINAME\}\}/g, fName)
            .replace(/\{\{PORTAL_URL\}\}/g, v.portal_url || '#')
            .replace(/\{\{BELIEBTE_LINKS\}\}/g, crossLinks)
            .replace(/\{\{STADT_INFOBOX\}\}/g, v.infobox || "");

        fs.writeFileSync(path.join(outputDir, fName), content, 'utf8');
        optEbe += `<option value="${fName}">${v.name}</option>\n`;
        linkEbe += `<a href="${fName}">60€ Strafe ${v.name} (${v.stadt})</a>\n`;
    });
}

// =====================================================================
// DEAKTIVIERTE SILOS (Später hier aktivieren)
// =====================================================================
if (BUILD_CONFIG.blitzer) {
    console.log('📸 Generiere Blitzer-Szenarien...');
    blitzerSzenarien.forEach(s => {
        let fName = `einspruch-blitzer-${s.slug}.html`;
        let crossLinks = generateCrossLinks(blitzerSzenarien, s, item => `einspruch-blitzer-${item.slug}.html`, item => item.fall_titel);
        let content = blitzerTpl.replace(/\{\{FALL_TITEL\}\}/g, s.fall_titel || "").replace(/\{\{H1_TITEL\}\}/g, s.h1_titel || "").replace(/\{\{META_DESCRIPTION\}\}/g, s.meta_description || "").replace(/\{\{EINLEITUNGSTEXT\}\}/g, s.einleitungstext || "").replace(/\{\{FALL_INFOBOX\}\}/g, s.fall_infobox || "").replace(/\{\{DEFAULT_STRATEGIE\}\}/g, s.default_strategie || "").replace(/\{\{DATEINAME\}\}/g, fName).replace(/\{\{BELIEBTE_LINKS\}\}/g, crossLinks);
        fs.writeFileSync(path.join(outputDir, fName), content, 'utf8');
        optBlitzer += `<option value="${fName}">${s.fall_titel}</option>\n`;
        linkBlitzer += `<a href="${fName}">${s.fall_titel}</a>\n`;
    });
}

if (BUILD_CONFIG.abstand) {
    console.log('📏 Generiere Abstandsverstöße...');
    abstandSzenarien.forEach(s => {
        let fName = `einspruch-abstandsverstoss-${s.slug}.html`;
        let crossLinks = generateCrossLinks(abstandSzenarien, s, item => `einspruch-abstandsverstoss-${item.slug}.html`, item => item.fall_titel);
        let content = abstandTpl.replace(/\{\{FALL_TITEL\}\}/g, s.fall_titel || "").replace(/\{\{H1_TITEL\}\}/g, s.h1_titel || "").replace(/\{\{META_DESCRIPTION\}\}/g, s.meta_description || "").replace(/\{\{EINLEITUNGSTEXT\}\}/g, s.einleitungstext || "").replace(/\{\{FALL_INFOBOX\}\}/g, s.fall_infobox || "").replace(/\{\{DEFAULT_STRATEGIE\}\}/g, s.default_strategie || "").replace(/\{\{DATEINAME\}\}/g, fName).replace(/\{\{BELIEBTE_LINKS\}\}/g, crossLinks);
        fs.writeFileSync(path.join(outputDir, fName), content, 'utf8');
        optAbstand += `<option value="${fName}">${s.fall_titel}</option>\n`;
        linkAbstand += `<a href="${fName}">${s.fall_titel}</a>\n`;
    });
}

if (BUILD_CONFIG.ampel) {
    console.log('🚦 Generiere Rote Ampel Szenarien...');
    ampelSzenarien.forEach(s => {
        let fName = `einspruch-rote-ampel-${s.slug}.html`;
        let crossLinks = generateCrossLinks(ampelSzenarien, s, item => `einspruch-rote-ampel-${item.slug}.html`, item => item.fall_titel);
        let content = ampelTpl.replace(/\{\{FALL_TITEL\}\}/g, s.fall_titel || "").replace(/\{\{H1_TITEL\}\}/g, s.h1_titel || "").replace(/\{\{META_DESCRIPTION\}\}/g, s.meta_description || "").replace(/\{\{EINLEITUNGSTEXT\}\}/g, s.einleitungstext || "").replace(/\{\{FALL_INFOBOX\}\}/g, s.fall_infobox || "").replace(/\{\{DEFAULT_STRATEGIE\}\}/g, s.default_strategie || "").replace(/\{\{DATEINAME\}\}/g, fName).replace(/\{\{BELIEBTE_LINKS\}\}/g, crossLinks);
        fs.writeFileSync(path.join(outputDir, fName), content, 'utf8');
        optAmpel += `<option value="${fName}">${s.fall_titel}</option>\n`;
        linkAmpel += `<a href="${fName}">${s.fall_titel}</a>\n`;
    });
}

if (BUILD_CONFIG.handy) {
    console.log('📱 Generiere Handy am Steuer Szenarien...');
    handySzenarien.forEach(s => {
        let fName = `einspruch-handy-am-steuer-${s.slug}.html`;
        let crossLinks = generateCrossLinks(handySzenarien, s, item => `einspruch-handy-am-steuer-${item.slug}.html`, item => item.fall_titel);
        let content = handyTpl.replace(/\{\{FALL_TITEL\}\}/g, s.fall_titel || "").replace(/\{\{H1_TITEL\}\}/g, s.h1_titel || "").replace(/\{\{META_DESCRIPTION\}\}/g, s.meta_description || "").replace(/\{\{EINLEITUNGSTEXT\}\}/g, s.einleitungstext || "").replace(/\{\{FALL_INFOBOX\}\}/g, s.fall_infobox || "").replace(/\{\{DEFAULT_STRATEGIE\}\}/g, s.default_strategie || "").replace(/\{\{DATEINAME\}\}/g, fName).replace(/\{\{BELIEBTE_LINKS\}\}/g, crossLinks);
        fs.writeFileSync(path.join(outputDir, fName), content, 'utf8');
        optHandy += `<option value="${fName}">${s.fall_titel}</option>\n`;
        linkHandy += `<a href="${fName}">${s.fall_titel}</a>\n`;
    });
}

if (BUILD_CONFIG.lkw) {
    console.log('🚛 Generiere LKW Szenarien...');
    lkwSzenarien.forEach(s => {
        let fName = `einspruch-lkw-bussgeld-${s.slug}.html`;
        let crossLinks = generateCrossLinks(lkwSzenarien, s, item => `einspruch-lkw-bussgeld-${item.slug}.html`, item => item.fall_titel);
        let content = lkwTpl.replace(/\{\{FALL_TITEL\}\}/g, s.fall_titel || "").replace(/\{\{H1_TITEL\}\}/g, s.h1_titel || "").replace(/\{\{META_DESCRIPTION\}\}/g, s.meta_description || "").replace(/\{\{EINLEITUNGSTEXT\}\}/g, s.einleitungstext || "").replace(/\{\{FALL_INFOBOX\}\}/g, s.fall_infobox || "").replace(/\{\{DEFAULT_STRATEGIE\}\}/g, s.default_strategie || "").replace(/\{\{DATEINAME\}\}/g, fName).replace(/\{\{BELIEBTE_LINKS\}\}/g, crossLinks);
        fs.writeFileSync(path.join(outputDir, fName), content, 'utf8');
        optLkw += `<option value="${fName}">${s.fall_titel}</option>\n`;
        linkLkw += `<a href="${fName}">${s.fall_titel}</a>\n`;
    });
}

if (BUILD_CONFIG.ausland) {
    console.log('🌍 Generiere Auslands-Bußgelder...');
    laender.forEach(l => {
        let fName = `einspruch-ausland-${l.slug}.html`;
        let crossLinks = generateCrossLinks(laender, l, item => `einspruch-ausland-${item.slug}.html`, item => item.name);
        let content = auslandTpl.replace(/\{\{LAND_NAME\}\}/g, l.name).replace(/\{\{BEHOERDE_EMAIL\}\}/g, l.email).replace(/\{\{DATEINAME\}\}/g, fName).replace(/\{\{BELIEBTE_LINKS\}\}/g, crossLinks).replace(/\{\{PORTAL_URL\}\}/g, l.portal_url || '#').replace(/\{\{LAND_INFOBOX\}\}/g, l.infobox || "");
        fs.writeFileSync(path.join(outputDir, fName), content, 'utf8');
        optAusland += `<option value="${fName}">Bußgeld aus ${l.name}</option>\n`;
        linkAusland += `<a href="${fName}">Strafzettel in ${l.name} abwehren</a>\n`;
    });
}

if (BUILD_CONFIG.abschleppen) {
    console.log('🏎️ Generiere Abschlepp-Szenarien...');
    abschleppSzenarien.forEach(s => {
        let fName = `einspruch-abschleppen-${s.slug}.html`;
        let crossLinks = generateCrossLinks(abschleppSzenarien, s, item => `einspruch-abschleppen-${item.slug}.html`, item => item.fall_titel);
        let content = abschleppTpl.replace(/\{\{FALL_TITEL\}\}/g, s.fall_titel || "").replace(/\{\{H1_TITEL\}\}/g, s.h1_titel || "").replace(/\{\{META_DESCRIPTION\}\}/g, s.meta_description || "").replace(/\{\{EINLEITUNGSTEXT\}\}/g, s.einleitungstext || "").replace(/\{\{FALL_INFOBOX\}\}/g, s.fall_infobox || "").replace(/\{\{DEFAULT_STRATEGIE\}\}/g, s.default_strategie || "").replace(/\{\{DATEINAME\}\}/g, fName).replace(/\{\{BELIEBTE_LINKS\}\}/g, crossLinks);
        fs.writeFileSync(path.join(outputDir, fName), content, 'utf8');
        optAbschleppen += `<option value="${fName}">${s.fall_titel}</option>\n`;
        linkAbschleppen += `<a href="${fName}">${s.fall_titel}</a>\n`;
    });
}

if (BUILD_CONFIG.maut) {
    console.log('🛣️ Generiere LKW Maut-Verstöße...');
    mautbetreiber.forEach(m => {
        let fName = `einspruch-mautstrafe-${m.slug}.html`;
        let crossLinks = generateCrossLinks(mautbetreiber, m, item => `einspruch-mautstrafe-${item.slug}.html`, item => item.name);
        let content = mautTpl.replace(/\{\{BETREIBER_NAME\}\}/g, m.name).replace(/\{\{BETREIBER_EMAIL\}\}/g, m.email).replace(/\{\{DATEINAME\}\}/g, fName).replace(/\{\{BELIEBTE_LINKS\}\}/g, crossLinks).replace(/\{\{PORTAL_URL\}\}/g, m.portal_url || '#').replace(/\{\{MAUT_INFOBOX\}\}/g, m.infobox || "");
        fs.writeFileSync(path.join(outputDir, fName), content, 'utf8');
        optMaut += `<option value="${fName}">Bescheid von ${m.name}</option>\n`;
        linkMaut += `<a href="${fName}">Maut-Strafe von ${m.name} abwehren</a>\n`;
    });
}

// =====================================================================
// HUB-SEITEN GENERIEREN
// =====================================================================

// HUB 1: Parkplatz (Enthält auch Ordnungsamt, falls aktiviert)
if (BUILD_CONFIG.parkplatz || BUILD_CONFIG.ordnungsamt) {
    const hubTpl = loadTemplate('hub-parkplatz-master.html');
    if (hubTpl) {
        let hubContent = hubTpl
            .replace(/\{\{OPT_FIRMEN\}\}/g, optFirmen)
            .replace(/\{\{LINK_FIRMEN\}\}/g, linkFirmen)
            .replace(/\{\{OPT_SUPERMAERKTE\}\}/g, optSupermaerkte)
            .replace(/\{\{LINK_SUPERMAERKTE\}\}/g, linkSupermaerkte)
            .replace(/\{\{OPT_STAEDTE\}\}/g, "") 
            .replace(/\{\{LINK_STAEDTE\}\}/g, "") 
            .replace(/\{\{OPT_ORDNUNGSAMT\}\}/g, optOrdnungsamt)
            .replace(/\{\{LINK_ORDNUNGSAMT\}\}/g, linkOrdnungsamt);
            
        fs.writeFileSync(path.join(outputDir, 'parkplatz-info.html'), hubContent, 'utf8');
        console.log('✅ Hub-Seite für Parkplätze (inkl. Ordnungsamt) generiert.');
    }
}

// HUB 4: Bahn / ÖPNV
if (BUILD_CONFIG.bahn_oepnv) {
    const hubTpl = loadTemplate('hub-bahn-master.html');
    if (hubTpl) {
        let hubBahnContent = hubTpl
            .replace(/\{\{OPT_EBE\}\}/g, optEbe)       
            .replace(/\{\{LINK_EBE\}\}/g, linkEbe);    
            
        fs.writeFileSync(path.join(outputDir, 'bahn-bussgeld-info.html'), hubBahnContent, 'utf8');
        console.log('✅ Hub-Seite für Bahn & ÖPNV generiert.');
    }
}

// (Die anderen Hubs werden übersprungen, wenn ihre Config auf false steht. 
// Wenn du sie später aktivierst, werden sie automatisch mitgeneriert.)

if (BUILD_CONFIG.blitzer || BUILD_CONFIG.abstand || BUILD_CONFIG.ampel || BUILD_CONFIG.handy) {
    const hubTpl = loadTemplate('hub-blitzer-master.html');
    if (hubTpl) {
        let hubBlitzerContent = hubTpl
            .replace(/\{\{OPT_BLITZER\}\}/g, optBlitzer)
            .replace(/\{\{LINK_BLITZER\}\}/g, linkBlitzer)
            .replace(/\{\{OPT_ABSTAND\}\}/g, optAbstand)
            .replace(/\{\{LINK_ABSTAND\}\}/g, linkAbstand)
            .replace(/\{\{OPT_AMPEL\}\}/g, optAmpel)       
            .replace(/\{\{LINK_AMPEL\}\}/g, linkAmpel)    
            .replace(/\{\{OPT_HANDY\}\}/g, optHandy)       
            .replace(/\{\{LINK_HANDY\}\}/g, linkHandy);    
        fs.writeFileSync(path.join(outputDir, 'blitzer-bussgeld-info.html'), hubBlitzerContent, 'utf8');
        console.log('✅ Hub-Seite für Blitzer/Abstand/Ampel/Handy generiert.');
    }
}

if (BUILD_CONFIG.lkw) {
    const hubTpl = loadTemplate('hub-lkw-master.html');
    if (hubTpl) {
        let hubLkwContent = hubTpl.replace(/\{\{OPT_LKW\}\}/g, optLkw).replace(/\{\{LINK_LKW\}\}/g, linkLkw);    
        fs.writeFileSync(path.join(outputDir, 'lkw-bussgeld-info.html'), hubLkwContent, 'utf8');
        console.log('✅ Hub-Seite für LKW generiert.');
    }
}

if (BUILD_CONFIG.ausland) {
    const hubTpl = loadTemplate('hub-ausland-master.html');
    if (hubTpl) {
        let hubAuslandContent = hubTpl.replace(/\{\{OPT_AUSLAND\}\}/g, optAusland).replace(/\{\{LINK_AUSLAND\}\}/g, linkAusland);    
        fs.writeFileSync(path.join(outputDir, 'ausland-bussgeld-info.html'), hubAuslandContent, 'utf8');
        console.log('✅ Hub-Seite für Auslands-Bußgelder generiert.');
    }
}

if (BUILD_CONFIG.abschleppen) {
    const hubTpl = loadTemplate('hub-abschleppen-master.html');
    if (hubTpl) {
        let hubAbschleppContent = hubTpl.replace(/\{\{OPT_ABSCHLEPPEN\}\}/g, optAbschleppen).replace(/\{\{LINK_ABSCHLEPPEN\}\}/g, linkAbschleppen);    
        fs.writeFileSync(path.join(outputDir, 'abschleppen-bussgeld-info.html'), hubAbschleppContent, 'utf8');
        console.log('✅ Hub-Seite für Abschleppen generiert.');
    }
}

if (BUILD_CONFIG.maut) {
    const hubTpl = loadTemplate('hub-maut-master.html');
    if (hubTpl) {
        let hubMautContent = hubTpl.replace(/\{\{OPT_MAUT\}\}/g, optMaut).replace(/\{\{LINK_MAUT\}\}/g, linkMaut);    
        fs.writeFileSync(path.join(outputDir, 'lkw-maut-bussgeld.html'), hubMautContent, 'utf8');
        console.log('✅ Hub-Seite für LKW-Maut generiert.');
    }
}

console.log('\n🎉 Fertig! Der Build lief erfolgreich durch (im teilweise gefilterten Modus).');