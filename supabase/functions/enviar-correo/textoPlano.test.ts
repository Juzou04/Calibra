/*
  Casos de textoPlano. index.html es la referencia: verificar.js (bloque
  matematica) lee estos tres arreglos y compara cada caso con la version del
  navegador. Si una salida cambia alla, cambia aqui.

  Con Deno:  deno test supabase/functions/enviar-correo/textoPlano.test.ts
  Sin Deno:  node supabase/functions/enviar-correo/textoPlano.test.ts
             (Node 22.18 o mas nuevo, que quita los tipos solo)
*/
import { textoPlano } from "./textoPlano.ts";

export const CASOS: [string, string][] = [
  ["$\\frac{4}{3}\\pi r^3$", "4/3 πr³"],
  ["$\\int_0^{\\pi/2} \\sen^2 x \\cos x\\,dx$", "∫ de 0 a π/2 sen²x cos x dx"],
  ["$\\lim_{x\\to 2} \\frac{x^2-4}{x-2}$", "lim(x→2) (x²−4)/(x−2)"],
  ["$\\sqrt{x^2+4}$", "√(x²+4)"],
  ["$\\sum_{n=1}^{\\infty} \\frac{1}{n^2}$", "∑ de n=1 a ∞ 1/n²"],
  ["cuesta \\$5", "cuesta $5"],
  ["sin matematicas", "sin matematicas"],
];

/* Reglas de espaciado y de raices que index.html fija (salida real del
   navegador; verificar.js las compara con la copia de index.html). */
export const REGLAS: [string, string][] = [
  ["$q_1 = +2\\mu C$", "q₁=+2μC"], // operadores pegados, sin espacios
  ["$x \\le 3$", "x≤3"],
  ["$a, b; c$", "a, b; c"], // espacio tras , y ;
  ["$f(x) = \\sen x$", "f(x)= sen x"], // espacio delante y detras de una funcion
  ["$\\int x\\,dx$", "∫ x dx"],
  ["$\\sqrt[3]{x}$", "∛x"],
  ["$\\sqrt[4]{16}$", "∜16"],
  ["$\\sqrt[n]{x}$", "ⁿ√x"],
  ["$0,05 \\cdot 10^{-3}$", "0,05·10⁻³"], // coma decimal: un solo numero
  ["$\\left( \\frac{1}{2} \\right)^2$", "(1/2)²"],
  ["$\\frac{\\frac{1}{2}}{3}$", "(1/2)/3"],
  ["$e^{x+1}$", "eˣ⁺¹"],
  ["$\\text{m/s}$", "m/s"],
  ["$\\Delta v$", "Δv"],
  ["precio \\$ y $x$", "precio $ y x"],
];

/* Entradas rotas: no puede lanzar. Una formula que no se entiende sale tal
   cual, sin los $; un $ sin pareja queda literal con lo que le sigue. */
export const ROBUSTEZ: [string, string][] = [
  ["cuesta $5", "cuesta $5"], // $ sin pareja queda literal
  ["$a$ y $b", "a y $b"],
  ["$\\frac{1}{$", "\\frac{1}{"],
  ["$x^$", "x^"],
  ["$x^2^3$", "x^2^3"], // doble ^
  ["$\\foo{x}$", "\\foo{x}"], // comando desconocido
  ["$\\vec{v}$", "v⃗"],
  ["$\\left( x \\right.$", "(x"],
  ["$$", ""], // formula vacia
  ["\\", "\\"],
  ["$" + "{".repeat(500) + "x$", "{".repeat(500) + "x"], // falta }
];

type Resultado = { entrada: string; esperado: string; obtenido: string; ok: boolean };

function correr(casos: [string, string][]): Resultado[] {
  return casos.map(([entrada, esperado]) => {
    let obtenido: string;
    try {
      obtenido = textoPlano(entrada);
    } catch (e) {
      obtenido = "LANZO: " + (e instanceof Error ? e.message : String(e));
    }
    return { entrada, esperado, obtenido, ok: obtenido === esperado };
  });
}

const g = globalThis as any;
if (g.Deno && typeof g.Deno.test === "function") {
  for (const r of [...correr(CASOS), ...correr(REGLAS), ...correr(ROBUSTEZ)]) {
    g.Deno.test(`textoPlano ${JSON.stringify(r.entrada)}`, () => {
      if (!r.ok) {
        throw new Error(`esperaba ${JSON.stringify(r.esperado)}, salio ${JSON.stringify(r.obtenido)}`);
      }
    });
  }
} else {
  let fallas = 0;
  for (const r of [...correr(CASOS), ...correr(REGLAS), ...correr(ROBUSTEZ)]) {
    if (!r.ok) fallas++;
    console.log(`${r.ok ? "OK   " : "FALLA"} ${JSON.stringify(r.entrada).slice(0, 60)} -> ${JSON.stringify(r.obtenido)}`);
  }
  console.log(fallas ? `${fallas} fallas` : "todo OK");
  if (g.process) g.process.exitCode = fallas ? 1 : 0;
}
