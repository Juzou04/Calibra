/*
  Calibra · textoPlano
  ---------------------------------------------------------------------------
  Aplana la notacion matematica del contenido ($...$, un subconjunto de TeX) a
  texto Unicode legible. El correo sale en texto plano, asi que nunca debe
  mostrar TeX crudo.

  Es una copia al pie de la letra de textoPlano() en index.html (bloque
  "4a. Matematicas": partirMate, analizarMate y planoDe). index.html manda: si
  se cambia alla, se cambia aqui. verificar.js (bloque matematica) corre cada
  caso de textoPlano.test.ts contra la version del navegador y falla si las
  dos dan distinto.

  Casos que tienen que salir exactos (los mismos del test):
    $\frac{4}{3}\pi r^3$                         -> 4/3 πr³
    $\int_0^{\pi/2} \sen^2 x \cos x\,dx$         -> ∫ de 0 a π/2 sen²x cos x dx
    $\lim_{x\to 2} \frac{x^2-4}{x-2}$            -> lim(x→2) (x²−4)/(x−2)
    $\sqrt{x^2+4}$                               -> √(x²+4)
    $\sum_{n=1}^{\infty} \frac{1}{n^2}$          -> ∑ de n=1 a ∞ 1/n²
    cuesta \$5                                   -> cuesta $5
    sin matematicas                              -> sin matematicas

  Reglas (las de index.html):
  - Fuera de $...$ solo cambia \$ por $. $$ es una formula vacia.
  - \frac -> a/b, con parentesis si el numerador o el denominador tiene mas de
    un elemento.
  - ^ y _ -> super/subindice Unicode si todos los caracteres lo tienen; si no
    ^(...) / _(...) (o ^x con un solo caracter).
  - \sqrt de un solo elemento -> √x, si no √(...). \sqrt[3] -> ∛, \sqrt[4] -> ∜.
  - Griegas y operadores -> Unicode. El - sale como U+2212 (−).
  - \, \; \quad -> espacio. Tras funciones, fracciones, operadores grandes y
    , o ; va un espacio, y otro delante de una funcion. Entre letras, cifras y
    operadores no va ninguno ($q_1 = +2\mu C$ -> q₁=+2μC).
  - Los espacios repetidos se colapsan.
  - Nunca lanza. Una formula que no se entiende (comando desconocido, llave
    sin pareja...) se devuelve tal cual, sin los $. Un $ sin pareja queda
    literal junto con lo que le sigue.
*/

type Nodo = {
  t: string; // num id op fn texto espacio fila frac raiz guion grande cerca acento
  v?: string;
  recta?: boolean;
  c?: Nodo[] | Nodo;
  a?: Nodo;
  b?: Nodo;
  n?: Nodo | null;
  base?: Nodo;
  sub?: Nodo | null;
  sup?: Nodo | null;
  abre?: string;
  cierra?: string;
};

const MATE_LETRAS: Record<string, string> = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ϵ", varepsilon: "ε",
  theta: "θ", lambda: "λ", mu: "μ", nu: "ν", pi: "π", rho: "ρ", sigma: "σ",
  tau: "τ", phi: "ϕ", varphi: "φ", omega: "ω", infty: "∞", partial: "∂", nabla: "∇",
  Delta: "Δ", Sigma: "Σ", Omega: "Ω", Gamma: "Γ", Phi: "Φ",
};
const MATE_OPERADORES: Record<string, string> = {
  le: "≤", leq: "≤", ge: "≥", geq: "≥", ne: "≠", neq: "≠", approx: "≈",
  pm: "±", mp: "∓", to: "→", rightarrow: "→", cdot: "·", times: "×", div: "÷",
};
const MATE_FUNCIONES: Record<string, number> = {
  sen: 1, sin: 1, cos: 1, tan: 1, sec: 1, csc: 1, cot: 1, ln: 1, log: 1, exp: 1,
};
const MATE_GRANDES: Record<string, string> = {
  int: "∫", iint: "∬", oint: "∮", sum: "∑", prod: "∏", lim: "lim",
};
const MATE_ESPACIOS: Record<string, string> = { ",": "0.1667em", ";": "0.2778em", quad: "1em" };
const MATE_ACENTOS_PLANO: Record<string, string> = { vec: "⃗", bar: "̄", hat: "̂" };
const MATE_SIMBOLOS = "+-=<>()[]|/'!,;:.*";
const MATE_CIFRAS_UNICODE = "⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉";
const MATE_SUPER: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "−": "⁻", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾",
  a: "ᵃ", b: "ᵇ", c: "ᶜ", d: "ᵈ", e: "ᵉ", f: "ᶠ", g: "ᵍ", h: "ʰ", i: "ⁱ", j: "ʲ", k: "ᵏ",
  l: "ˡ", m: "ᵐ", n: "ⁿ", o: "ᵒ", p: "ᵖ", r: "ʳ", s: "ˢ", t: "ᵗ", u: "ᵘ", v: "ᵛ", w: "ʷ",
  x: "ˣ", y: "ʸ", z: "ᶻ",
};
const MATE_SUB: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "+": "₊", "−": "₋", "-": "₋", "=": "₌", "(": "₍", ")": "₎",
  a: "ₐ", e: "ₑ", h: "ₕ", i: "ᵢ", j: "ⱼ", k: "ₖ", l: "ₗ", m: "ₘ", n: "ₙ", o: "ₒ", p: "ₚ",
  r: "ᵣ", s: "ₛ", t: "ₜ", u: "ᵤ", v: "ᵥ", x: "ₓ",
};

type Trozo = { mate: boolean; texto: string; abierto?: boolean };

/* Parte el texto en trozos {mate, texto}. \$ fuera de formula es un $ literal.
   Un $ sin pareja deja el ultimo trozo con abierto = true. */
function partirMate(texto: string): Trozo[] {
  const trozos: Trozo[] = [];
  let actual = "";
  let enMate = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto.charAt(i);
    if (c === "\\" && texto.charAt(i + 1) === "$") {
      actual += enMate ? "\\$" : "$";
      i++;
    } else if (c === "$") {
      if (actual || enMate) trozos.push({ mate: enMate, texto: actual });
      actual = "";
      enMate = !enMate;
    } else {
      actual += c;
    }
  }
  if (enMate) trozos.push({ mate: true, texto: actual, abierto: true });
  else if (actual) trozos.push({ mate: false, texto: actual });
  return trozos;
}

/* Analizador recursivo: de la cadena TeX a un arbol pequeno de nodos. Lanza
   Error con el motivo si algo no cuadra. */
function analizarMate(fuente: string): Nodo {
  const s = fuente;
  let pos = 0;
  let corchete = false;

  function blancos(): void { while (pos < s.length && /\s/.test(s.charAt(pos))) pos++; }
  function fallo(msg: string): never { throw new Error(msg + " (posicion " + pos + ")"); }

  function comando(): string {
    pos++;
    if (pos >= s.length) fallo("barra invertida al final");
    const c = s.charAt(pos);
    if (!/[A-Za-z]/.test(c)) { pos++; return c; }
    const ini = pos;
    while (pos < s.length && /[A-Za-z]/.test(s.charAt(pos))) pos++;
    return s.slice(ini, pos);
  }

  function crudoEntreLlaves(): string {
    blancos();
    if (s.charAt(pos) !== "{") fallo("se esperaba {");
    let nivel = 1;
    const ini = ++pos;
    while (pos < s.length) {
      const c = s.charAt(pos);
      if (c === "\\") { pos += 2; continue; }
      if (c === "{") nivel++;
      else if (c === "}" && --nivel === 0) { pos++; return s.slice(ini, pos - 1); }
      pos++;
    }
    return fallo("falta }");
  }

  function fila(hijos: Nodo[]): Nodo {
    return hijos.length === 1 ? hijos[0] : { t: "fila", c: hijos };
  }

  function secuencia(): Nodo[] {
    const hijos: Nodo[] = [];
    for (;;) {
      blancos();
      if (pos >= s.length) break;
      const c = s.charAt(pos);
      if (c === "}") break;
      if (c === "]" && corchete) break;
      if (c === "\\" && /^\\right(?![A-Za-z])/.test(s.slice(pos))) break;
      hijos.push(conGuiones());
    }
    return hijos;
  }

  function grupo(): Nodo {
    pos++;
    const hijos = secuencia();
    if (s.charAt(pos) !== "}") fallo("falta }");
    pos++;
    return fila(hijos);
  }

  function argumento(): Nodo {
    blancos();
    if (pos >= s.length) fallo("falta un argumento");
    if (s.charAt(pos) === "{") return grupo();
    return atomo();
  }

  function delimitador(): string {
    blancos();
    const c = s.charAt(pos);
    if (!c) fallo("falta el delimitador de \\left o \\right");
    if ("()[]|.".indexOf(c) === -1) fallo("delimitador no admitido: " + c);
    pos++;
    return c;
  }

  function atomo(): Nodo {
    blancos();
    const c = s.charAt(pos);
    if (c === "{") return grupo();
    if (c === "}") fallo("} sin pareja");
    if (c === "^" || c === "_") return { t: "fila", c: [] };
    if (/[0-9]/.test(c)) {
      const m = /^[0-9]+(?:[.,][0-9]+)*/.exec(s.slice(pos)) as RegExpExecArray;
      pos += m[0].length;
      return { t: "num", v: m[0] };
    }
    if (/[A-Za-z]/.test(c)) { pos++; return { t: "id", v: c }; }
    if (c === "\\") {
      const nombre = comando();
      if (nombre === "$") return { t: "op", v: "$" };
      if (MATE_ESPACIOS[nombre]) return { t: "espacio", v: nombre };
      if (MATE_LETRAS[nombre]) return { t: "id", v: MATE_LETRAS[nombre], recta: /^[A-Z]/.test(nombre) };
      if (MATE_OPERADORES[nombre]) return { t: "op", v: MATE_OPERADORES[nombre] };
      if (MATE_FUNCIONES[nombre]) return { t: "fn", v: nombre };
      if (MATE_GRANDES[nombre]) return { t: "grande", v: nombre };
      if (MATE_ACENTOS_PLANO[nombre]) return { t: "acento", v: nombre, base: argumento() };
      if (nombre === "frac") {
        const num = argumento();
        return { t: "frac", a: num, b: argumento() };
      }
      if (nombre === "sqrt") {
        let indice: Nodo | null = null;
        blancos();
        if (s.charAt(pos) === "[") {
          pos++;
          const antes = corchete;
          corchete = true;
          try { indice = fila(secuencia()); } finally { corchete = antes; }
          if (s.charAt(pos) !== "]") fallo("falta ] en \\sqrt[n]");
          pos++;
        }
        return { t: "raiz", a: argumento(), n: indice };
      }
      if (nombre === "text") return { t: "texto", v: crudoEntreLlaves() };
      if (nombre === "mathrm") return { t: "id", v: crudoEntreLlaves(), recta: true };
      if (nombre === "left") {
        const abre = delimitador();
        const cuerpo = secuencia();
        if (!/^\\right(?![A-Za-z])/.test(s.slice(pos))) fallo("\\left sin \\right");
        pos += 6;
        return { t: "cerca", abre: abre, cierra: delimitador(), c: fila(cuerpo) };
      }
      if (nombre === "right") fallo("\\right sin \\left");
      fallo("comando desconocido: \\" + nombre);
    }
    let ch = c;
    const cod = c.charCodeAt(0);
    if (cod >= 0xD800 && cod <= 0xDBFF) ch = s.slice(pos, pos + 2);
    pos += ch.length;
    if (MATE_SIMBOLOS.indexOf(ch) !== -1) {
      if (ch === "-") ch = "−";
      else if (ch === "'") ch = "′";
      return { t: "op", v: ch };
    }
    if (cod < 128) fallo("caracter no admitido: " + ch);
    if (MATE_CIFRAS_UNICODE.indexOf(ch) !== -1) return { t: "num", v: ch };
    if (ch.toLowerCase() !== ch.toUpperCase()) return { t: "id", v: ch };
    return { t: "op", v: ch };
  }

  function conGuiones(): Nodo {
    const base = atomo();
    let sub: Nodo | null = null;
    let sup: Nodo | null = null;
    for (;;) {
      blancos();
      const c = s.charAt(pos);
      if (c === "^" && !sup) { pos++; sup = argumento(); }
      else if (c === "_" && !sub) { pos++; sub = argumento(); }
      else if (c === "^" || c === "_") fallo("doble " + c);
      else break;
    }
    if (base.t === "grande") { base.sub = sub; base.sup = sup; return base; }
    if (!sub && !sup) return base;
    return { t: "guion", base: base, sub: sub, sup: sup };
  }

  const todo = secuencia();
  if (pos < s.length) fallo(s.charAt(pos) + " sin pareja");
  return fila(todo);
}

function hijosDe(nodo: Nodo): Nodo[] {
  return Array.isArray(nodo.c) ? nodo.c : [];
}

function esFuncionMate(nodo: Nodo): boolean {
  return nodo.t === "fn" || (nodo.t === "guion" && (nodo.base as Nodo).t === "fn");
}

function planoGuion(nodo: Nodo, mapa: Record<string, string>, marca: string): string {
  const t = planoDe(nodo).s.replace(/\s+/g, "");
  let salida: string | null = "";
  for (let i = 0; i < t.length; i++) {
    if (!mapa[t.charAt(i)]) { salida = null; break; }
    salida += mapa[t.charAt(i)];
  }
  if (salida !== null && t) return salida;
  return t.length === 1 ? marca + t : marca + "(" + t + ")";
}

function cuentaMate(nodo: Nodo): number {
  if (nodo.t !== "fila") return 1;
  return hijosDe(nodo).filter((h) => h.t !== "espacio").length;
}

function planoEnvuelto(nodo: Nodo): string {
  const s = planoDe(nodo).s.trim();
  return cuentaMate(nodo) > 1 || nodo.t === "frac" ? "(" + s + ")" : s;
}

// Devuelve { s: texto, sp: si pide un espacio detras }.
function planoDe(nodo: Nodo): { s: string; sp: boolean } {
  switch (nodo.t) {
    case "num": case "id": return { s: nodo.v as string, sp: false };
    case "op": return { s: nodo.v as string, sp: nodo.v === "," || nodo.v === ";" };
    case "fn": return { s: nodo.v as string, sp: true };
    case "texto": return { s: nodo.v as string, sp: false };
    case "espacio": return { s: " ", sp: false };
    case "fila": {
      let s = "";
      let sp = false;
      hijosDe(nodo).forEach((h) => {
        const r = planoDe(h);
        if ((sp || (esFuncionMate(h) && !/[\s(]$/.test(s))) && s) s += " ";
        s += r.s;
        sp = r.sp;
      });
      return { s: s, sp: sp };
    }
    case "frac": return { s: planoEnvuelto(nodo.a as Nodo) + "/" + planoEnvuelto(nodo.b as Nodo), sp: true };
    case "raiz": {
      const a = nodo.a as Nodo;
      const dentro = cuentaMate(a) > 1 ? "(" + planoDe(a).s.trim() + ")" : planoDe(a).s;
      if (!nodo.n) return { s: "√" + dentro, sp: false };
      const n = planoDe(nodo.n).s.trim();
      if (n === "3") return { s: "∛" + dentro, sp: false };
      if (n === "4") return { s: "∜" + dentro, sp: false };
      return { s: planoGuion(nodo.n, MATE_SUPER, "^") + "√" + dentro, sp: false };
    }
    case "guion": {
      const b = nodo.base as Nodo;
      const base = b.t === "fila" && cuentaMate(b) > 1 ? planoEnvuelto(b) : planoDe(b).s;
      return {
        s: base + (nodo.sub ? planoGuion(nodo.sub, MATE_SUB, "_") : "") +
          (nodo.sup ? planoGuion(nodo.sup, MATE_SUPER, "^") : ""),
        sp: false,
      };
    }
    case "grande": {
      const simbolo = MATE_GRANDES[nodo.v as string];
      const abajo = nodo.sub ? planoDe(nodo.sub).s.trim() : "";
      const arriba = nodo.sup ? planoDe(nodo.sup).s.trim() : "";
      if (nodo.v === "lim") return { s: "lim" + (abajo ? "(" + abajo + ")" : ""), sp: true };
      if (abajo && arriba) return { s: simbolo + " de " + abajo + " a " + arriba, sp: true };
      if (abajo) return { s: simbolo + planoGuion(nodo.sub as Nodo, MATE_SUB, "_"), sp: true };
      if (arriba) return { s: simbolo + planoGuion(nodo.sup as Nodo, MATE_SUPER, "^"), sp: true };
      return { s: simbolo, sp: true };
    }
    case "cerca":
      return {
        s: (nodo.abre === "." ? "" : nodo.abre) + planoDe(nodo.c as Nodo).s.trim() +
          (nodo.cierra === "." ? "" : nodo.cierra),
        sp: false,
      };
    case "acento":
      return { s: planoDe(nodo.base as Nodo).s + MATE_ACENTOS_PLANO[nodo.v as string], sp: false };
  }
  return { s: "", sp: false };
}

/* Texto con $...$ -> texto plano Unicode. Sin $ devuelve el mismo texto. */
export function textoPlano(texto: unknown): string {
  const fuente = String(texto === undefined || texto === null ? "" : texto);
  if (fuente.indexOf("$") === -1) return fuente;
  return partirMate(fuente).map((trozo) => {
    if (!trozo.mate) return trozo.texto;
    if (trozo.abierto) return "$" + trozo.texto;
    try {
      return planoDe(analizarMate(trozo.texto)).s.replace(/\s+/g, " ").trim();
    } catch {
      return trozo.texto;
    }
  }).join("");
}
