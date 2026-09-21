/*
  Pruebas del armado de los dos correos de una cita (correo.ts). Solo logica
  pura: no hay red ni Supabase.

  Con Deno:  deno test supabase/functions/enviar-correo/correo.test.ts
  Sin Deno:  node supabase/functions/enviar-correo/correo.test.ts
             (Node 22.18 o mas nuevo, que quita los tipos solo)
*/
import {
  armarCorreoEstudiante,
  armarCorreoMonitor,
  detalleKcs,
  formatoFranja,
  PAGO_MARCADOR,
  type Brief,
} from "./correo.ts";

// 29 de septiembre de 2026, 21:00 UTC = 4:00 p. m. en Bogota (UTC-5, sin horario de verano).
const BASE: Brief = {
  cita_id: 7,
  estado: "confirmada",
  inicia_en: "2026-09-29T21:00:00Z",
  duracion_min: 60,
  monitor_nombre: "Camila R.",
  monitor_clave: "clave-1",
  precio_hora: 25000,
  estudiante_correo: "ana@uniandes.edu.co",
  estudiante_telefono: "3001234567",
  diagnostico_id: 3,
  materia_nombre: "Cálculo Integral",
  subtema_debil: "Integración por partes",
  error_detectado_texto: "eliges u = $\\ln(x)$ sin mirar $dv$",
  kcs: {
    kcs: [
      { kc: "partes-eleccion-u", estado: "debil", aciertos: 0, total: 2 },
      { kc: "partes-formula", estado: "logrado", aciertos: 2, total: 2 },
    ],
    misconcepciones: [{ texto: "olvidas restar $\\int v\\,du$" }, "signo de la fórmula"],
  },
};

type Caso = { nombre: string; ok: boolean; detalle?: string };
const casos: Caso[] = [];
function caso(nombre: string, ok: boolean, detalle = "") {
  casos.push({ nombre, ok, detalle });
}
const contiene = (t: string, s: string) => t.includes(s);

/* Franja en hora de Bogota: 4:00 p. m., no las 21:00 de UTC. */
const franja = formatoFranja(BASE.inicia_en, BASE.duracion_min);
caso("franja: dice 29 de septiembre de 2026", contiene(franja, "29 de septiembre de 2026"), franja);
caso("franja: hora de Bogota (4:00), no UTC (21:00)", contiene(franja, "4:00") && !contiene(franja, "21:00"), franja);
caso("franja: trae la duracion", contiene(franja, "(60 min)"), franja);
caso("franja: sin nbsp ni nnbsp", !/[\u00a0\u202f]/.test(franja));
caso("franja: fecha ilegible -> vacio, no 'Invalid Date'", formatoFranja("no es fecha", 60) === "");
caso("franja: sin fecha -> vacio", formatoFranja(null, 60) === "");

/* Estudiante. */
const est = armarCorreoEstudiante(BASE, { monitorTelefono: "3109998877", pago: "Transfiere y responde con el comprobante." });
caso("estudiante: asunto con el monitor", est.asunto === "Tu sesión con Camila R. está confirmada", est.asunto);
caso("estudiante: trae la hora agendada", contiene(est.texto, "29 de septiembre de 2026") && contiene(est.texto, "4:00"));
caso("estudiante: trae el telefono del monitor", contiene(est.texto, "Camila R.: 3109998877"));
caso("estudiante: trae materia y subtema", contiene(est.texto, "Materia: Cálculo Integral") && contiene(est.texto, "Integración por partes"));
const lineaError = est.texto.split("\n").filter((l) => l.includes("Qué pasó")).join();
caso("estudiante: aplana la matematica del error", contiene(lineaError, "u = ln (x)") && !contiene(lineaError, "$"), lineaError);
caso("estudiante: tarifa y pago", contiene(est.texto, "$25.000 por hora") && contiene(est.texto, "Transfiere y responde"));
caso("estudiante: sin texto de comision", !/comisi[oó]n/i.test(est.texto));

const sinNada = armarCorreoEstudiante(
  { cita_id: 8, inicia_en: "2026-09-29T21:00:00Z", monitor_nombre: null, diagnostico_id: null },
  { monitorTelefono: "", pago: "" },
);
caso("estudiante sin diagnostico ni monitor: asunto generico", sinNada.asunto === "Tu sesión en Calibra está confirmada", sinNada.asunto);
caso("estudiante sin diagnostico: lo dice", contiene(sinNada.texto, "Todavía no tenemos tu diagnóstico"));
caso("estudiante sin telefono del monitor: no inventa numero", contiene(sinNada.texto, "Todavía no tenemos su número"));
caso("estudiante sin pago definido: sale el marcador", contiene(sinNada.texto, PAGO_MARCADOR));
caso("estudiante sin franja legible: no escribe Invalid Date", !contiene(armarCorreoEstudiante({ ...BASE, inicia_en: "x" }, { monitorTelefono: "", pago: "" }).texto, "Invalid"));

/* Monitor. */
const mon = armarCorreoMonitor(BASE);
caso("monitor: asunto con materia y hora", contiene(mon.asunto, "Cálculo Integral") && contiene(mon.asunto, "4:00"), mon.asunto);
caso("monitor: saluda por nombre", mon.texto.startsWith("Hola Camila R.,"));
caso("monitor: contacto del estudiante", contiene(mon.texto, "ana@uniandes.edu.co") && contiene(mon.texto, "3001234567"));
caso("monitor: brief con subtema y error", contiene(mon.texto, "Subtema débil: Integración por partes") && contiene(mon.texto, "Error detectado: eliges u = ln (x)"));
caso("monitor: habilidades con estado y conteo", contiene(mon.texto, "partes-eleccion-u: debil (0/2)") && contiene(mon.texto, "partes-formula: logrado (2/2)"));
caso("monitor: errores a trabajar aplanados", contiene(mon.texto, "olvidas restar ∫ v du") && contiene(mon.texto, "signo de la fórmula"));
caso("monitor: sin texto de comision ni de precio", !/comisi[oó]n/i.test(mon.texto) && !contiene(mon.texto, "25.000"));

const monSinDiag = armarCorreoMonitor({ ...BASE, diagnostico_id: null, estudiante_telefono: null });
caso("monitor sin diagnostico: lo dice", contiene(monSinDiag.texto, "sin hacer la prueba diagnóstica"));
caso("monitor sin telefono del estudiante: 'no lo dejó'", contiene(monSinDiag.texto, "Teléfono: no lo dejó"));

/* kcs. */
caso("detalleKcs: null -> vacio", JSON.stringify(detalleKcs(null)) === JSON.stringify({ habilidades: "", errores: "" }));
caso("detalleKcs: basura no lanza", (() => {
  try { detalleKcs({ kcs: [null, {}, { kc: 5 }], misconcepciones: [null, 3] }); return true; } catch { return false; }
})());
caso("detalleKcs: maximo 3 errores", detalleKcs({ misconcepciones: ["a", "b", "c", "d"] }).errores === "a; b; c");

const g = globalThis as any;
if (g.Deno && typeof g.Deno.test === "function") {
  for (const c of casos) {
    g.Deno.test(`correo ${c.nombre}`, () => {
      if (!c.ok) throw new Error(`fallo: ${c.nombre} ${c.detalle}`);
    });
  }
} else {
  let fallas = 0;
  for (const c of casos) {
    if (!c.ok) fallas++;
    console.log(`${c.ok ? "OK   " : "FALLA"} ${c.nombre}${!c.ok && c.detalle ? " -> " + JSON.stringify(c.detalle) : ""}`);
  }
  console.log(fallas ? `${fallas} fallas` : "todo OK");
  if (g.process) g.process.exitCode = fallas ? 1 : 0;
}
