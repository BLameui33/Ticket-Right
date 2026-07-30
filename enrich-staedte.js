// ==========================================
// In-Place Nachschärfung für *_optimiert.json
// ==========================================
const fs = require('fs');
const path = require('path');

// 1. DEIN OPENAI API-KEY
const API_KEY = ""; 

// Alle bereits erstellten optimierten Dateien durchgehen
const OPTIMIZED_FILES = [
  'abschlepp-szenarien_optimiert.json',
  'abstand-szenarien_optimiert.json',
  'ampel-szenarien_optimiert.json',
  'blitzer-szenarien_optimiert.json',
  'handy-szenarien_optimiert.json',
  'lkw-szenarien_optimiert.json',
  'park-szenarien_optimiert.json'
];

const delay = ms => new Promise(res => setTimeout(res, ms));

// ==========================================
// SAFETY NET: Titel per Code säubern & "| PDF" anhängen
// ==========================================
function cleanAndFormatTitle(rawTitle) {
  if (!rawTitle) return "Einspruch Muster | PDF";

  let t = rawTitle;

  // 1. Unerwünschte Begriffe & Phrasen entfernen/ersetzen
  t = t.replace(/\|\s*PDF/gi, '')                   // Altes "| PDF" kurz entfernen
       .replace(/per\s*PDF/gi, '')                  // "per PDF" entfernen
       .replace(/per\s*Einspruch/gi, '')            // "per Einspruch" entfernen
       .replace(/\bprüfen\b/gi, 'anfechten')         // "prüfen" -> "anfechten"
       .replace(/\bPrüfung\b/gi, 'Einspruch')       // "Prüfung" -> "Einspruch"
       .replace(/\.\./g, '')                        // Pünktchen ".." entfernen
       .replace(/\s+/g, ' ')                        // Mehrfache Leerzeichen korrigieren
       .trim();

  // 2. Trailing-Satzzeichen am Ende entfernen (z.B. Doppelpunkte, Bindestriche, Kommas)
  t = t.replace(/[:\-,\.]\s*$/, '').trim();

  // 3. Auf optimale Länge stutzen (ohne Suffix max 48 Zeichen, damit es inkl. " | PDF" unter 58 bleibt)
  if (t.length > 48) {
    t = t.substring(0, 48).replace(/\s+\S*$/, '').trim();
  }

  // 4. GARANTIERT " | PDF" ans Ende hängen
  return `${t} | PDF`;
}

async function sharpenCases(casesArray, fileName) {
  const topicName = fileName.replace('-szenarien_optimiert.json', '').replace('_optimiert.json', '');

  const prompt = `
Du bist ein knallharter SEO-Copywriter und Fachanwalt für deutsches Verkehrsrecht.
Deine Aufgabe: Gehe jeden Fall durch und überarbeite ihn radikal nach folgenden STRIKTEN QUALITÄTSKRITERIEN:

---
1. "fall_titel" (Meta-Title):
   - MUSS extrem klickstark sein.
   - STRIKT VERBOTEN: Verwende NIEMALS die Wörter "prüfen", "Prüfung", "per PDF", "per Einspruch" oder Pünktchen "..".
   - HÄNGE KEIN "| PDF" AN DIE KI-ANTWORT! (Das macht das Skript im Nachgang automatisch per Code).
   - Länge des Kern-Titels: Ca. 35 bis 45 Zeichen.
   - Baue gezielt Suchbegriffe ein: "26 km/h", "Fahrverbot", "1 Punkt", "Muster", "Einspruch", "Probezeit", "kostenlos".
   
   FALSCH: "Privatgrund-Abschleppen: Überhöhte Kosten per PDF prüfen"
   FALSCH: "Punkte wegen Wiederholung"
   RICHTIG: "Privatgrund-Abschleppen: Kosten anfechten"
   RICHTIG: "26 km/h zu schnell: 2x26-Regel & Fahrverbot stoppen"
   RICHTIG: "Probezeit & 21 km/h zu schnell: Aufbauseminar stoppen"

---
2. "fall_infobox" (HTML-Infobox mit ECHTEM MEHRWERT):
   - VERBOTEN sind Allgemeinplätze wie "Strafen können ansteigen" oder "Handeln Sie schnell".
   - PFLICHT: Nenne konkrete Paragraphen, Messfehler, Fristen oder rechtliche Kniffe (z.B. § 26 Abs. 3 StVG 3-Monats-Verjährung, 2x26-km/h-Regel für Wiederholungstäter, ASF Aufbauseminar, Umwandlung Fahrverbot in höhere Geldbuße bei Existenzbedrohung, 3%-Toleranzabzug ab 100 km/h, Eichschein-Pflicht der PTB, Beschilderungsplan-Fehler, Ortsschild-Abstand, Ortsüblichkeit bei Abschleppkosten).
   - Format: <h4 style='margin-top:0;'>Knackiger Titel</h4><p>Ausführlicher, wertvoller Tipp (90-120 Wörter)...</p>

---
3. "einleitungstext":
   - Ca. 50-70 Wörter. Konkreten Schmerz des Nutzers aufgreifen (z. B. drohender Jobverlust, Punkte in Flensburg, Post von der Bußgeldstelle), Hoffnung machen und direkt zum Ausfüllen motivieren.

---
4. "meta_description":
   - Max. 150-155 Zeichen mit klarem CTA zum PDF-Generator.

INPUT-DATEN (${fileName}):
${JSON.stringify(casesArray, null, 2)}

Antworte AUSSCHLIESSLICH als valides JSON-Objekt mit dem Key "faelle":
{
  "faelle": [ ... ]
}
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.4", 
        response_format: { type: "json_object" },
        messages: [
          { 
            role: "system", 
            content: "Du bist ein extrem präziser Rechts- und SEO-Texter. Du lieferst tiefgründige, fachlich korrekte und klickstarke Inhalte im geforderten JSON-Format." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`API Fehler: ${response.status} - ${errBody}`);
    }

    const data = await response.json();
    const parsedContent = JSON.parse(data.choices[0].message.content);
    let faelle = parsedContent.faelle || parsedContent;

    // POST-PROCESSING: Jeden Titel per Code säubern und "| PDF" anhängen
    if (Array.isArray(faelle)) {
      faelle = faelle.map(f => {
        if (f.fall_titel) {
          f.fall_titel = cleanAndFormatTitle(f.fall_titel);
        }
        return f;
      });
    }

    return faelle;

  } catch (error) {
    console.error(`❌ Fehler bei der Verarbeitung von ${fileName}:`, error.message);
    return null;
  }
}

async function startSharpening() {
  console.log(`🔥 Starte IN-PLACE Nachschärfung der optimierten Dateien...\n`);

  if (!API_KEY) {
    console.error('❌ Fehler: Bitte API-Key eintragen!');
    return;
  }

  for (let i = 0; i < OPTIMIZED_FILES.length; i++) {
    const fileName = OPTIMIZED_FILES[i];
    const filePath = path.join(__dirname, fileName);

    console.log(`--------------------------------------------------`);
    console.log(`📂 [${i + 1}/${OPTIMIZED_FILES.length}] Schärfe nach: ${fileName}`);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Datei "${fileName}" nicht gefunden. Überspringe.`);
      continue;
    }

    const rawData = fs.readFileSync(filePath, 'utf8');
    const casesArray = JSON.parse(rawData);

    console.log(`⏳ Sende ${casesArray.length} Fälle an GPT-4o für professionelle Texte...`);

    const resultFaelle = await sharpenCases(casesArray, fileName);

    if (resultFaelle && Array.isArray(resultFaelle)) {
      fs.writeFileSync(filePath, JSON.stringify(resultFaelle, null, 2), 'utf8');
      console.log(`✅ FERTIG! ${fileName} überschrieben.`);
      console.log(`   Vorschau Titel 1: "${resultFaelle[0]?.fall_titel}"`);
      if (resultFaelle[1]) console.log(`   Vorschau Titel 2: "${resultFaelle[1]?.fall_titel}"`);
    } else {
      console.error(`❌ Nachschärfung fehlgeschlagen für ${fileName}`);
    }

    if (i < OPTIMIZED_FILES.length - 1) {
      console.log(`☕ Warten (3s)...`);
      await delay(3000);
    }
  }

  console.log(`\n🎉 ALLE DATEIEN ERFOLGREICH AUF HIGH-QUALITY NIVEAU GEBRACHT!`);
}

startSharpening();