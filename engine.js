// Ada Mathe-Sprint — Aufgaben-Engine
// Nichts ist hartcodiert: jede Aufgabe wird aus zufälligen Zahlen berechnet,
// nie als fertiger Text gespeichert. test-engine.mjs prüft die Invarianten.

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const CATEGORY_META = {
  addsub:    { label: "Plus & Minus bis 100", icon: "➕", short: "Plus/Minus" },
  muldiv:    { label: "Mal & Geteilt bis 100", icon: "✖️", short: "Mal/Geteilt" },
  fachbegriff: { label: "Fachbegriffe", icon: "🏷️", short: "Fachbegriffe" },
  punktstrich: { label: "Punkt vor Strich", icon: "⚙️", short: "Punkt/Strich" },
  divrest:   { label: "Geteilt mit Rest", icon: "🔟", short: "Rest" },
  gleichung: { label: "Gleichungen & Ungleichungen", icon: "🔍", short: "Gleichungen" },
  sachaufgabe: { label: "Sachaufgaben", icon: "📖", short: "Sachaufgaben" },
};

let uid = 1;
function task(category, prompt, answer, explain, extra) {
  return { id: uid++, category, prompt, answer, explain, ...extra };
}

// ---------- 1. Plus & Minus bis 100 ----------
export function genAddSub(opts = {}) {
  const forceBorrow = !!opts.forceBorrow;
  const op = opts.op || pick(["add", "sub"]);
  if (op === "add") {
    let a, b;
    do {
      a = randInt(14, 89);
      b = randInt(9, 89);
    } while (a + b > 100 || a + b < 10);
    const answer = a + b;
    return task("addsub", `${a} + ${b} = ?`, answer, [
      `${a} + ${b}`,
      `Ergebnis (Summe): ${answer}`,
    ]);
  } else {
    let a, b;
    do {
      a = randInt(20, 99);
      b = randInt(9, a);
      if (forceBorrow) {
        // Einerstelle von a kleiner als von b erzwingt einen Zehnerübergang
        if (a % 10 >= b % 10) continue;
      }
    } while (a - b < 0 || a === b && randInt(0,1)===0 && false);
    const answer = a - b;
    const borrow = a % 10 < b % 10;
    return task("addsub", `${a} - ${b} = ?`, answer, [
      borrow
        ? `Bei ${a} reicht die Einerstelle nicht: 1 Zehner wird zu 10 Einern getauscht.`
        : `${a} - ${b}`,
      `Ergebnis (Differenz): ${answer}`,
    ]);
  }
}

// ---------- 2. Mal & Geteilt bis 100 (Einmaleins 1-10) ----------
export function genMulDiv(opts = {}) {
  const mode = opts.mode || pick(["mul", "div"]);
  if (mode === "mul") {
    const a = randInt(2, 10), b = randInt(2, 10);
    const answer = a * b;
    return task("muldiv", `${a} · ${b} = ?`, answer, [`${a} · ${b} = ${answer}`]);
  } else {
    const b = randInt(2, 10), q = randInt(2, 10);
    const a = b * q;
    return task("muldiv", `${a} : ${b} = ?`, q, [`${a} : ${b} = ${q}`]);
  }
}

// ---------- 3. Fachbegriffe (Summe/Differenz/Produkt/Quotient) ----------
const TERM = { add: "Summe", sub: "Differenz", mul: "Produkt", div: "Quotient" };
const SYMB = { add: "+", sub: "-", mul: "·", div: ":" };

function makeOperands(op) {
  if (op === "add") { const a = randInt(11, 79), b = randInt(9, 79); return [a, b, a + b]; }
  if (op === "sub") { const a = randInt(20, 99), b = randInt(9, a); return [a, b, a - b]; }
  if (op === "mul") { const a = randInt(2, 10), b = randInt(2, 10); return [a, b, a * b]; }
  const b = randInt(2, 10), q = randInt(2, 10); return [b * q, b, q];
}

export function genFachbegriff(opts = {}) {
  const op = opts.op || pick(["add", "sub", "mul", "div"]);
  const [a, b, val] = makeOperands(op);
  const mode = opts.mode || pick(["compute", "name"]);
  const word = TERM[op];
  if (mode === "compute") {
    const templates = {
      add: [`Berechne die Summe aus ${a} und ${b}.`, `Addiere ${a} und ${b}.`],
      sub: [`Berechne die Differenz aus ${a} und ${b}.`, `Subtrahiere ${b} von ${a}.`],
      mul: [`Multipliziere ${a} und ${b}. Wie heißt das Produkt?`, `Bilde das Produkt aus ${a} und ${b}.`],
      div: [`Dividiere ${a} durch ${b}. Wie heißt der Quotient?`],
    };
    return task("fachbegriff", pick(templates[op]), val, [
      `${a} ${SYMB[op]} ${b} = ${val}`,
      `Das Ergebnis von "${word.toLowerCase()==='summe'?'plus':word}" heißt ${word}.`,
    ], { inputType: "number" });
  } else {
    const options = shuffle(["Summe", "Differenz", "Produkt", "Quotient"]);
    return task(
      "fachbegriff",
      `${a} ${SYMB[op]} ${b} = ${val}. Wie heißt das Ergebnis dieser Aufgabe?`,
      word,
      [`${a} ${SYMB[op]} ${b} ist eine ${op === "add" ? "Plus" : op === "sub" ? "Minus" : op === "mul" ? "Mal" : "Geteilt"}-Aufgabe.`, `Das Ergebnis heißt ${word}.`],
      { inputType: "choice", options }
    );
  }
}

// ---------- 4. Punkt vor Strich ----------
export function genPunktStrich(opts = {}) {
  const kind = opts.kind || (Math.random() < 0.6 ? "wordchain" : "equation");
  if (kind === "equation") {
    const patterns = ["a+b*c", "a-b*c", "a+b:c", "a-b:c"];
    const p = pick(patterns);
    let a, b, c, answer, text, steps;
    if (p === "a+b*c") {
      b = randInt(2, 9); c = randInt(2, 9); a = randInt(2, 40);
      answer = a + b * c;
      text = `${a} + ${b} · ${c} = ?`;
      steps = [`Punkt zuerst: ${b} · ${c} = ${b * c}`, `Dann Strich: ${a} + ${b * c} = ${answer}`];
    } else if (p === "a-b*c") {
      b = randInt(2, 9); c = randInt(2, 9);
      a = randInt(b * c, b * c + 40);
      answer = a - b * c;
      text = `${a} - ${b} · ${c} = ?`;
      steps = [`Punkt zuerst: ${b} · ${c} = ${b * c}`, `Dann Strich: ${a} - ${b * c} = ${answer}`];
    } else if (p === "a+b:c") {
      c = randInt(2, 9); const q = randInt(2, 9); b = c * q; a = randInt(2, 60);
      answer = a + q;
      text = `${a} + ${b} : ${c} = ?`;
      steps = [`Punkt zuerst: ${b} : ${c} = ${q}`, `Dann Strich: ${a} + ${q} = ${answer}`];
    } else {
      c = randInt(2, 9); const q = randInt(2, 9); b = c * q; a = randInt(q, q + 60);
      answer = a - q;
      text = `${a} - ${b} : ${c} = ?`;
      steps = [`Punkt zuerst: ${b} : ${c} = ${q}`, `Dann Strich: ${a} - ${q} = ${answer}`];
    }
    return task("punktstrich", text, answer, steps);
  }

  // wordchain: genau die Aufgabenform, die auf den Übungsblättern zu Fehlern führte
  const a = randInt(2, 10), b = randInt(2, 10);
  const prod = a * b;
  const templates = [
    () => { const c = randInt(5, 40); return {
      text: `Multipliziere ${a} mit ${b} und addiere ${c}.`,
      answer: prod + c,
      steps: [`1. Schritt (Punkt): ${a} · ${b} = ${prod}`, `2. Schritt (Strich): ${prod} + ${c} = ${prod + c}`],
    }; },
    () => { const c = randInt(5, 40); return {
      text: `Addiere ${c} zu dem Produkt aus ${a} und ${b}.`,
      answer: prod + c,
      steps: [`Zuerst das Produkt bilden: ${a} · ${b} = ${prod}`, `Dann ${c} addieren: ${prod} + ${c} = ${prod + c}`],
    }; },
    () => { const c = randInt(1, Math.max(1, prod - 1)); return {
      text: `Berechne das Produkt aus ${a} und ${b}. Subtrahiere dann ${c}.`,
      answer: prod - c,
      steps: [`Zuerst das Produkt: ${a} · ${b} = ${prod}`, `Dann ${c} subtrahieren: ${prod} - ${c} = ${prod - c}`],
    }; },
    () => { return {
      text: `Bilde das Produkt aus ${a} und ${b} und verdoppele es.`,
      answer: prod * 2,
      steps: [`Zuerst das Produkt: ${a} · ${b} = ${prod}`, `Verdoppeln heißt mal 2: ${prod} · 2 = ${prod * 2}`],
    }; },
    () => {
      let aa = a, bb = b, pp = prod;
      if (pp % 2 !== 0) { bb = bb % 2 === 0 ? bb : bb + 1; pp = aa * bb; }
      return {
        text: `Bilde das Produkt aus ${aa} und ${bb} und halbiere es.`,
        answer: pp / 2,
        steps: [`Zuerst das Produkt: ${aa} · ${bb} = ${pp}`, `Halbieren heißt geteilt durch 2: ${pp} : 2 = ${pp / 2}`],
      };
    },
    () => { const d = randInt(2, 10); const q = randInt(2, 9); const dividend = d * q; const c = randInt(3, 30); return {
      text: `Dividiere ${dividend} durch ${d} und addiere ${c}.`,
      answer: q + c,
      steps: [`Zuerst teilen: ${dividend} : ${d} = ${q}`, `Dann ${c} addieren: ${q} + ${c} = ${q + c}`],
    }; },
  ];
  const r = pick(templates)();
  return task("punktstrich", r.text, r.answer, r.steps);
}

// ---------- 5. Geteilt mit Rest ----------
export function genDivRest(opts = {}) {
  const b = randInt(2, 9);
  const q = randInt(1, 11);
  const restZero = Math.random() < 0.15;
  const r = restZero ? 0 : randInt(1, b - 1);
  const a = b * q + r;
  return task(
    "divrest",
    `${a} : ${b} = ? R ?`,
    { quotient: q, rest: r },
    [`${b} passt ${q}-mal in ${a} (${b} · ${q} = ${b * q}).`, `Rest: ${a} - ${b * q} = ${r}`],
    { inputType: "divrest" }
  );
}

// ---------- 6. Gleichungen & Ungleichungen ----------
export function genGleichung(opts = {}) {
  const type = opts.type || pick(["add", "sub", "mul", "div"]);
  if (type === "add") {
    const k = randInt(5, 50), x = randInt(5, 49);
    const sum = x + k;
    return task("gleichung", `Addiere ${k} zu einer Zahl. Die Summe ist ${sum}. Wie heißt die Zahl?`, x, [
      `Zahl + ${k} = ${sum}`, `Zahl = ${sum} - ${k} = ${x}`,
    ], { inputType: "number" });
  }
  if (type === "sub") {
    const k = randInt(5, 40), d = randInt(5, 55);
    const x = d + k;
    return task("gleichung", `Subtrahiere ${k} von einer Zahl. Die Differenz ist ${d}. Wie heißt die Zahl?`, x, [
      `Zahl - ${k} = ${d}`, `Zahl = ${d} + ${k} = ${x}`,
    ], { inputType: "number" });
  }
  if (type === "mul") {
    const k = randInt(2, 9), x = randInt(2, 11);
    const p = x * k;
    return task("gleichung", `Multipliziere eine Zahl mit ${k}. Das Produkt ist ${p}. Wie heißt die Zahl?`, x, [
      `Zahl · ${k} = ${p}`, `Zahl = ${p} : ${k} = ${x}`,
    ], { inputType: "number" });
  }
  const k = randInt(2, 9), x = randInt(2, 11);
  const dnd = x * k;
  return task("gleichung", `Teile eine Zahl durch ${k}. Der Quotient ist ${x}. Wie heißt die Zahl?`, dnd, [
    `Zahl : ${k} = ${x}`, `Zahl = ${x} · ${k} = ${dnd}`,
  ], { inputType: "number" });
}

export function genUngleichung() {
  function expr() {
    const kind = pick(["mul", "div", "addsmall"]);
    if (kind === "mul") { const a = randInt(2, 10), b = randInt(2, 10); return { text: `${a} · ${b}`, val: a * b }; }
    if (kind === "div") { const b = randInt(2, 9), q = randInt(2, 10); return { text: `${b * q} : ${b}`, val: q }; }
    const a = randInt(10, 80), b = randInt(2, 19); return { text: `${a} + ${b}`, val: a + b };
  }
  let left = expr(), right = expr(), tries = 0;
  while (left.val === right.val && tries++ < 5) right = expr();
  const symbol = left.val < right.val ? "<" : left.val > right.val ? ">" : "=";
  return task("gleichung", `${left.text}  ___  ${right.text}`, symbol, [
    `${left.text} = ${left.val}`, `${right.text} = ${right.val}`, `${left.val} ${symbol} ${right.val}`,
  ], { inputType: "choice", options: ["<", ">", "="] });
}

// ---------- 7. Sachaufgaben ----------
const NAMES = ["Lena", "Finn", "Mia", "Leon", "Emma", "Noah", "Ada", "Paul"];
const SACHAUFGABEN = [
  // Drei-Summanden — genau die Stelle, an der oft ein Summand vergessen wird
  () => {
    const items = pick([
      ["Zimtschnecken", "Nussecken", "Salzbrezel", "Bäcker"],
      ["rote Äpfel", "grüne Äpfel", "gelbe Äpfel", "Marktfrau"],
      ["Fußbälle", "Basketbälle", "Tennisbälle", "Sportlehrer"],
    ]);
    const a = randInt(12, 35), b = randInt(8, 25), c = randInt(5, 20);
    const answer = a + b + c;
    return {
      text: `${items[3]} X hat ${a} ${items[0]}, ${b} ${items[1]} und ${c} ${items[2]} gebacken bzw. sortiert. Wie viele sind es insgesamt?`,
      answer,
      antwortsatz: `Es sind insgesamt ${answer} ${items[0]}.`,
      steps: [`${a} + ${b} + ${c}`, `Wichtig: alle drei Zahlen zählen! = ${answer}`],
    };
  },
  // Subtraktions-Kette
  () => {
    const total = randInt(50, 90);
    const s1 = randInt(15, 35), s2 = randInt(1, 5);
    const answer = total - s1 - s2;
    const name = pick(NAMES);
    return {
      text: `In einem Regal stehen ${total} Bücher. In einer Woche werden ${s1} Bücher verkauft. ${name} nimmt noch ${s2} für sich mit. Wie viele Bücher bleiben im Regal?`,
      answer,
      antwortsatz: `Es sind noch ${answer} Bücher im Regal.`,
      steps: [`${total} - ${s1} = ${total - s1}`, `${total - s1} - ${s2} = ${answer}`],
    };
  },
  // Vergleich mit Zielgröße — genau der zweite, oft vergessene Schritt
  () => {
    const baked = randInt(24, 40);
    const gone1 = randInt(2, 5), gone2 = randInt(1, 4);
    const left = baked - gone1 - gone2;
    const klasse = randInt(left - 6, left + 6 > 0 ? left + 6 : left + 3);
    const klasseSafe = Math.max(10, Math.min(klasse, left + 8));
    const diff = left - klasseSafe;
    const genug = diff >= 0;
    return {
      text: `Eine Oma backt ${baked} Muffins. Vor der Schule nascht das Geburtstagskind ${gone1} und verschenkt ${gone2}. In der Klasse sind ${klasseSafe} Kinder. Reichen die Muffins für die ganze Klasse? Wie viele bleiben übrig oder fehlen?`,
      answer: diff,
      antwortsatz: genug
        ? `Ja, es reicht. Es bleiben noch ${diff} Muffins übrig.`
        : `Nein, es reicht nicht. Es fehlen ${-diff} Muffins.`,
      steps: [`${baked} - ${gone1} - ${gone2} = ${left}`, `${left} - ${klasseSafe} (Kinder) = ${diff}`, genug ? "Zahl ≥ 0 → es reicht, Rest bleibt übrig" : "Zahl < 0 → es reicht nicht, so viele fehlen"],
    };
  },
  // Multiplikation im Sachkontext
  () => {
    const tier = pick([["Spinnen", 8], ["Hunde", 4], ["Hühner", 2], ["Dreiräder", 3]]);
    const n = randInt(3, 9);
    const answer = tier[1] * n;
    return {
      text: `Ein/e ${tier[0].slice(0, -1)} hat ${tier[1]} Beine bzw. Räder. Auf dem Hof gibt es ${n} davon. Wie viele Beine/Räder sind das insgesamt?`,
      answer,
      antwortsatz: `Das sind insgesamt ${answer}.`,
      steps: [`${tier[1]} · ${n} = ${answer}`],
    };
  },
  // Division mit Rest im Sachkontext
  () => {
    const b = randInt(3, 8);
    const q = randInt(4, 10);
    const r = randInt(1, b - 1);
    const total = b * q + r;
    const name = pick(NAMES);
    return {
      text: `${name} hat ${total} Gummibärchen und teilt sie gerecht an ${b} Kinder auf. Wie viele bekommt jedes Kind, und wie viele bleiben übrig?`,
      answer: q,
      rest: r,
      antwortsatz: `Jedes Kind bekommt ${q} Gummibärchen, ${r} bleiben übrig.`,
      steps: [`${total} : ${b} = ${q} Rest ${r}`],
      inputType: "divrest",
    };
  },
];

export function genSachaufgabe() {
  const r = pick(SACHAUFGABEN)();
  return task("sachaufgabe", r.text, r.rest !== undefined ? { quotient: r.answer, rest: r.rest } : r.answer, [
    ...r.steps,
    `Antwortsatz: ${r.antwortsatz}`,
  ], { inputType: r.inputType || "number", antwortsatz: r.antwortsatz });
}

// ---------- Dispatcher ----------
export function generateTask(category) {
  switch (category) {
    case "addsub": return genAddSub();
    case "muldiv": return genMulDiv();
    case "fachbegriff": return genFachbegriff();
    case "punktstrich": return genPunktStrich();
    case "divrest": return genDivRest();
    case "gleichung": return Math.random() < 0.4 ? genUngleichung() : genGleichung();
    case "sachaufgabe": return genSachaufgabe();
    default: throw new Error("unknown category " + category);
  }
}

export function checkAnswer(t, userAnswer) {
  if (t.inputType === "divrest" || (t.answer && typeof t.answer === "object")) {
    return Number(userAnswer.quotient) === t.answer.quotient && Number(userAnswer.rest) === t.answer.rest;
  }
  if (typeof t.answer === "string") {
    return String(userAnswer).trim() === t.answer;
  }
  return Number(userAnswer) === t.answer;
}

// Gewichtung für die Prüfungssimulation: bekannte Schwachstellen häufiger
export const EXAM_PLAN = [
  "addsub", "addsub", "addsub",
  "muldiv", "muldiv", "muldiv",
  "fachbegriff", "fachbegriff",
  "punktstrich", "punktstrich", "punktstrich", "punktstrich",
  "divrest", "divrest",
  "gleichung", "gleichung", "gleichung",
  "sachaufgabe", "sachaufgabe", "sachaufgabe",
];
