/*
  Calibra · armado de los dos correos de una cita
  ---------------------------------------------------------------------------
  Funciones puras: reciben la fila de la vista brief_cita (mas lo que salga de
  leads) y devuelven asunto y texto. No leen variables de entorno ni llaman a la
  red, asi que corren igual en Deno y en Node (ver correo.test.ts). El texto de
  cobro entra como parametro para que la prueba no dependa de secretos.

  El correo es texto plano. Subtema, error detectado y misconcepciones pueden
  traer matematica como $...$; pasan por textoPlano antes de entrar al cuerpo.
  Nunca se escribe una cifra de comision.
*/

import { textoPlano } from "./textoPlano.ts";

/* Fila de public.brief_cita (solo la lee la llave secreta). Todas las columnas
   pueden venir nulas: la vista une con LEFT JOIN diagnostico y materia. */
export type Brief = {
  cita_id: number;
  estado?: string | null;
  inicia_en?: string | null;
  duracion_min?: number | null;
  monitor_nombre?: string | null;
  monitor_clave?: string | null;
  precio_hora?: number | null;
  estudiante_correo?: string | null;
  estudiante_telefono?: string | null;
  diagnostico_id?: number | null;
  materia_nombre?: string | null;
  subtema_debil?: string | null;
  error_detectado_texto?: string | null;
  kcs?: any;
};

export const PAGO_MARCADOR =
  "PENDIENTE: aquí va cómo se paga. Mientras nadie llene la variable " +
  "CALIBRA_PAGO, el correo sale con esta línea tal cual.";

/* "martes, 29 de septiembre de 2026, 4:00 p. m. (60 min)" en hora de Bogota.
   Si la fecha no se puede leer devuelve "" y el correo cae a un texto sin hora
   en vez de escribir "Invalid Date". Los espacios raros del ICU (nbsp y nnbsp)
   pasan a espacios normales: en texto plano se ven como cuadros en algunos
   clientes. */
export function formatoFranja(iniciaEn?: string | null, duracionMin?: number | null): string {
  if (!iniciaEn) return "";
  const d = new Date(iniciaEn);
  if (Number.isNaN(d.getTime())) return "";
  const texto = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "full",
    timeStyle: "short",
  })
    .format(d)
    .replace(/[\u00a0\u202f]/g, " ");
  return duracionMin && duracionMin > 0 ? `${texto} (${duracionMin} min)` : texto;
}

function tarifa(precioHora?: number | null): string {
  return precioHora && precioHora > 0
    ? `La tarifa de tu monitor es de $${precioHora.toLocaleString("es-CO")} por hora.`
    : "";
}

/* Habilidades (kc) y errores de razonamiento (misconcepciones) del diagnostico,
   en una linea cada uno. kcs es {kcs:[{kc,estado,aciertos,total}],
   misconcepciones:[string | {texto}]} o null en las materias sin kc. */
export function detalleKcs(kcs: any): { habilidades: string; errores: string } {
  let habilidades = "";
  let errores = "";
  if (kcs && Array.isArray(kcs.kcs) && kcs.kcs.length) {
    habilidades = kcs.kcs
      .slice(0, 6)
      .map((k: any) => {
        const nombre = textoPlano(String((k && (k.nombre ?? k.kc)) ?? "")).trim();
        if (!nombre) return "";
        const estado = k.estado ? `: ${k.estado}` : "";
        const cuenta = Number.isFinite(k.aciertos) && Number.isFinite(k.total)
          ? ` (${k.aciertos}/${k.total})`
          : "";
        return `${nombre}${estado}${cuenta}`;
      })
      .filter(Boolean)
      .join("; ");
  }
  if (kcs && Array.isArray(kcs.misconcepciones) && kcs.misconcepciones.length) {
    errores = kcs.misconcepciones
      .map((m: any) => (typeof m === "string" ? m : m && m.texto))
      .filter(Boolean)
      .slice(0, 3)
      .map((t: string) => textoPlano(String(t)))
      .join("; ");
  }
  return { habilidades, errores };
}

/* Lo que ve el estudiante de su diagnostico. */
export function lineasDiagnosticoEstudiante(b: Brief): string[] {
  if (!b.diagnostico_id) {
    return [
      "Todavía no tenemos tu diagnóstico. Si hiciste la prueba y esto te parece un error, respóndenos este correo.",
    ];
  }
  const lineas: string[] = [];
  if (b.materia_nombre) lineas.push(`Materia: ${b.materia_nombre}`);
  if (b.subtema_debil) lineas.push(`El subtema donde se te fue la mano: ${textoPlano(b.subtema_debil)}`);
  if (b.error_detectado_texto) {
    lineas.push(`Qué pasó exactamente: ${textoPlano(b.error_detectado_texto)}`);
  }
  const { errores } = detalleKcs(b.kcs);
  if (errores) lineas.push(`Para revisar con tu monitor: ${errores}`);
  if (lineas.length <= 1) {
    lineas.push("Tu monitor recibe el detalle completo antes de la sesión.");
  }
  return lineas;
}

/* Lo que ve el monitor: el brief de la sesion. */
export function lineasBriefMonitor(b: Brief): string[] {
  if (!b.diagnostico_id) {
    return ["El estudiante agendó sin hacer la prueba diagnóstica, así que no hay brief. Pregúntale en qué está trabado."];
  }
  const lineas: string[] = [];
  if (b.materia_nombre) lineas.push(`Materia: ${b.materia_nombre}`);
  if (b.subtema_debil) lineas.push(`Subtema débil: ${textoPlano(b.subtema_debil)}`);
  if (b.error_detectado_texto) {
    lineas.push(`Error detectado: ${textoPlano(b.error_detectado_texto)}`);
  }
  const { habilidades, errores } = detalleKcs(b.kcs);
  if (habilidades) lineas.push(`Habilidades: ${habilidades}`);
  if (errores) lineas.push(`Errores a trabajar: ${errores}`);
  if (lineas.length === 0) lineas.push("El diagnóstico no trae detalle.");
  return lineas;
}

/* Confirmacion al estudiante. */
export function armarCorreoEstudiante(
  b: Brief,
  extra: { monitorTelefono: string; pago: string },
): { asunto: string; texto: string } {
  const monitor = b.monitor_nombre ?? "";
  const franja = formatoFranja(b.inicia_en, b.duracion_min);

  const asunto = monitor
    ? `Tu sesión con ${monitor} está confirmada`
    : "Tu sesión en Calibra está confirmada";

  const bloques: string[] = [];
  bloques.push("Hola,");
  bloques.push(
    (monitor ? `Tu sesión con ${monitor} quedó agendada` : "Tu sesión quedó agendada") +
      (franja ? ` para el ${franja}.` : ".") +
      " La hora ya es tuya: nadie más puede tomarla.",
  );

  if (extra.monitorTelefono) {
    bloques.push(
      `Contacto de tu monitor\n${monitor || "Tu monitor"}: ${extra.monitorTelefono}\nEscríbele para acordar el lugar y cómo conectarse. Si prefieres que lo hagamos nosotros, respóndenos este correo.`,
    );
  } else {
    bloques.push(
      "Contacto de tu monitor\nTodavía no tenemos su número. Respóndenos este correo y los ponemos en contacto hoy mismo.",
    );
  }

  bloques.push(`Tu diagnóstico\n${lineasDiagnosticoEstudiante(b).join("\n")}`);
  bloques.push(`Cómo pagar\n${[tarifa(b.precio_hora), extra.pago || PAGO_MARCADOR].filter(Boolean).join("\n")}`);
  bloques.push(
    "Calibra es un prototipo del curso de Diseño de Productos de la Universidad de los Andes. Si algo no cuadra, responde este correo.",
  );

  return { asunto, texto: bloques.join("\n\n") };
}

/* Brief para el monitor. */
export function armarCorreoMonitor(b: Brief): { asunto: string; texto: string } {
  const monitor = b.monitor_nombre ?? "";
  const franja = formatoFranja(b.inicia_en, b.duracion_min);

  const asunto = "Nueva sesión agendada" +
    (b.materia_nombre ? ` · ${b.materia_nombre}` : "") +
    (franja ? ` · ${franja}` : "");

  const bloques: string[] = [];
  bloques.push(monitor ? `Hola ${monitor},` : "Hola,");
  bloques.push("Un estudiante agendó una sesión contigo y la hora quedó bloqueada.");
  if (franja) bloques.push(`Cuándo\n${franja}`);
  bloques.push(
    "Contacto del estudiante\n" +
      `Correo: ${b.estudiante_correo ?? "no disponible"}\n` +
      `Teléfono: ${b.estudiante_telefono ? b.estudiante_telefono : "no lo dejó"}\n` +
      "Escríbele para acordar el lugar y cómo conectarse.",
  );
  bloques.push(`Brief de la sesión\n${lineasBriefMonitor(b).join("\n")}`);
  bloques.push(
    "Calibra es un prototipo del curso de Diseño de Productos de la Universidad de los Andes. Si algo no cuadra, responde este correo.",
  );

  return { asunto, texto: bloques.join("\n\n") };
}
