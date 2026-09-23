import { genAddSub, genMulDiv, genFachbegriff, genPunktStrich, genDivRest, genGleichung, genUngleichung, genSachaufgabe, genZahlenmauer, genMalhaus, checkAnswer } from "./engine.js";

let checks = 0, failures = [];
function assert(cond, msg) {
  checks++;
  if (!cond) failures.push(msg);
}

const N = 20000;

for (let i = 0; i < N; i++) {
  const t = genAddSub();
  const [a, opSym, b] = t.prompt.split(" ");
  const av = Number(a), bv = Number(b);
  if (opSym === "+") assert(av + bv === t.answer, `addsub add ${t.prompt} -> ${t.answer}`);
  else assert(av - bv === t.answer && av - bv >= 0, `addsub sub ${t.prompt} -> ${t.answer}`);
  assert(checkAnswer(t, t.answer), "addsub checkAnswer");
}

for (let i = 0; i < N; i++) {
  const t = genMulDiv();
  assert(checkAnswer(t, t.answer), "muldiv checkAnswer " + t.prompt);
  if (t.prompt.includes("·")) {
    const [a, , b] = t.prompt.replace("= ?", "").trim().split(" ");
    assert(Number(a) * Number(b) === t.answer, "mul " + t.prompt);
  } else {
    const [a, , b] = t.prompt.replace("= ?", "").trim().split(" ");
    assert(Number(a) === t.answer * Number(b), "div " + t.prompt);
  }
}

for (let i = 0; i < N; i++) {
  const t = genFachbegriff();
  assert(checkAnswer(t, t.answer), "fachbegriff checkAnswer " + t.prompt);
  if (t.inputType === "choice") {
    assert(["Summe", "Differenz", "Produkt", "Quotient"].includes(t.answer), "fachbegriff term valid");
    assert(t.options.length === 4 && new Set(t.options).size === 4, "fachbegriff options unique");
  } else {
    assert(Number.isInteger(t.answer) && t.answer >= 0, "fachbegriff compute non-negative int " + t.prompt + " = " + t.answer);
  }
}

for (let i = 0; i < N; i++) {
  const t = genPunktStrich();
  assert(Number.isInteger(t.answer), "punktstrich integer " + t.prompt + " = " + t.answer);
  assert(t.answer >= 0, "punktstrich non-negative " + t.prompt + " = " + t.answer);
  assert(checkAnswer(t, t.answer), "punktstrich checkAnswer");
  assert(t.explain.length >= 1, "punktstrich has explanation");
}

for (let i = 0; i < N; i++) {
  const t = genDivRest();
  const m = t.prompt.match(/^(\d+) : (\d+)/);
  const a = Number(m[1]), b = Number(m[2]);
  assert(b * t.answer.quotient + t.answer.rest === a, `divrest reconstruct ${t.prompt} q=${t.answer.quotient} r=${t.answer.rest}`);
  assert(t.answer.rest >= 0 && t.answer.rest < b, `divrest rest range ${t.prompt}`);
  assert(checkAnswer(t, t.answer), "divrest checkAnswer");
}

for (let i = 0; i < N; i++) {
  const t = genGleichung();
  assert(Number.isInteger(t.answer) && t.answer >= 0, "gleichung int " + t.prompt + " = " + t.answer);
  assert(checkAnswer(t, t.answer), "gleichung checkAnswer " + t.prompt);
}

for (let i = 0; i < N; i++) {
  const t = genUngleichung();
  const parts = t.prompt.split("___").map((s) => s.trim());
  // re-evaluate each side independently
  function evalSide(s) {
    if (s.includes("·")) { const [a, b] = s.split("·").map(Number); return a * b; }
    if (s.includes(":")) { const [a, b] = s.split(":").map(Number); return a / b; }
    const [a, b] = s.split("+").map(Number); return a + b;
  }
  const l = evalSide(parts[0]), r = evalSide(parts[1]);
  const expected = l < r ? "<" : l > r ? ">" : "=";
  assert(expected === t.answer, `ungleichung ${t.prompt} expected ${expected} got ${t.answer}`);
  assert(checkAnswer(t, t.answer), "ungleichung checkAnswer");
}

for (let i = 0; i < N; i++) {
  const t = genSachaufgabe();
  assert(checkAnswer(t, t.answer), "sachaufgabe checkAnswer " + t.prompt);
  if (t.inputType === "divrest") {
    assert(t.answer.rest >= 0, "sachaufgabe divrest rest >=0");
  } else {
    assert(typeof t.answer === "number", "sachaufgabe numeric answer " + t.prompt);
  }
}

for (let i = 0; i < N; i++) {
  const t = genZahlenmauer();
  const c = t.answer; // { ...unknownKeys: value }
  const cells = t.cells;
  // jede Zelle muss aus den beiden Steinen darunter berechnet werden können
  assert(cells.midLeft === cells.botLeft + cells.botMid, `zahlenmauer midLeft ${JSON.stringify(cells)}`);
  assert(cells.midRight === cells.botMid + cells.botRight, `zahlenmauer midRight ${JSON.stringify(cells)}`);
  assert(cells.top === cells.midLeft + cells.midRight, `zahlenmauer top ${JSON.stringify(cells)}`);
  assert(Object.values(cells).every(v => Number.isInteger(v) && v > 0 && v <= 100), `zahlenmauer cell range ${JSON.stringify(cells)}`);
  assert(t.knownKeys.length === 3 && t.unknownKeys.length === 3, "zahlenmauer 3 known + 3 unknown");
  assert(new Set([...t.knownKeys, ...t.unknownKeys]).size === 6, "zahlenmauer keys cover all 6 cells");
  t.unknownKeys.forEach(k => assert(c[k] === cells[k], `zahlenmauer answer matches cells for ${k}`));
  assert(checkAnswer(t, c), "zahlenmauer checkAnswer correct");
  const wrong = { ...c }; wrong[t.unknownKeys[0]] = cells[t.unknownKeys[0]] + 1;
  assert(!checkAnswer(t, wrong), "zahlenmauer checkAnswer rejects wrong value");
}

for (let i = 0; i < N; i++) {
  const t = genMalhaus();
  assert(t.factors.length === 4 && new Set(t.factors).size === 4, "malhaus 4 distinct factors " + t.factors);
  t.factors.forEach((f, idx) => assert(f * t.m === t.answer[idx], `malhaus product ${f}*${t.m} = ${t.answer[idx]}`));
  assert(checkAnswer(t, t.answer), "malhaus checkAnswer correct");
  const wrong = [...t.answer]; wrong[0] = wrong[0] + 1;
  assert(!checkAnswer(t, wrong), "malhaus checkAnswer rejects wrong value");
}

console.log(`${checks} Prüfungen gelaufen, ${failures.length} Fehler.`);
if (failures.length) {
  console.log("Erste Fehler:");
  failures.slice(0, 20).forEach((f) => console.log(" -", f));
  process.exit(1);
} else {
  console.log("Alle Generatoren rechnen richtig. ✅");
}
