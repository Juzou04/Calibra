/*
  Calibra · enviar-correo
  ---------------------------------------------------------------------------
  Manda el correo de confirmación al estudiante: la hora que quedó agendada,
  cómo paga, su diagnóstico y el contacto del monitor.

  Vive fuera de index.html a propósito. El navegador no puede armar este correo:
  la llave que viaja en el HTML es anónima y no tiene permiso de lectura sobre
  leads ni sobre resultados_diagnostico. Esta función sí, porque usa la llave
  secreta del proyecto, que nunca sale de aquí.

  Cómo se dispara: un Database Webhook de Supabase en INSERT sobre public.leads.
  Los pasos de despliegue están en el README de esta carpeta.

  Variables de entorno (Edge Function secrets):
    RESEND_API_KEY          obligatoria. Llave de Resend.
    CALIBRA_REMITENTE       obligatoria. "Calibra <hola@tudominio.com>".
                            Resend solo deja mandar a terceros desde un dominio
                            verificado; con onboarding@resend.dev el correo solo
                            llega a la cuenta dueña de la llave.
    CALIBRA_PAGO            texto del bloque de pago. Sin definir, sale el
                            marcador y el correo lo dice sin disimular.
    CALIBRA_WEBHOOK_TOKEN   opcional. Si está, se exige la cabecera
                            x-calibra-token con ese valor.
    CALIBRA_SERVICE_KEY     opcional. Llave secreta, si no se quiere depender de
                            la SUPABASE_SERVICE_ROLE_KEY que inyecta Supabase.

  Nunca escribe una llave en la respuesta ni en los logs.
*/

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY =
  Deno.env.get("CALIBRA_SERVICE_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const REMITENTE = Deno.env.get("CALIBRA_REMITENTE") ?? "";
const WEBHOOK_TOKEN = Deno.env.get("CALIBRA_WEBHOOK_TOKEN") ?? "";
const PAGO = Deno.env.get("CALIBRA_PAGO") ?? "";

const PAGO_MARCADOR =
  "PENDIENTE: aquí va cómo se paga. Mientras nadie llene la variable " +
  "CALIBRA_PAGO, el correo sale con esta línea tal cual.";

/* --------------------------------------------------------------------------
   PostgREST con la llave secreta. Una sola puerta, para que ninguna consulta
   se vaya por su cuenta.
   -------------------------------------------------------------------------- */
async function leer(tabla: string, consulta: string): Promise<any[]> {
  const url = `${SUPABASE_URL}/rest/v1/${tabla}?${consulta}`;
  const r = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Accept: "application/json",
    },
  });
  if (!r.ok) {
    throw new Error(`leer ${tabla}: HTTP ${r.status} ${await r.text()}`);
  }
  return await r.json();
}

async function marcarEnviado(id: number): Promise<void> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ correo_enviado_en: new Date().toISOString() }),
  });
  if (!r.ok) throw new Error(`marcar enviado: HTTP ${r.status} ${await r.text()}`);
}

/* --------------------------------------------------------------------------
   Armado del correo
   -------------------------------------------------------------------------- */
function lineasDiagnostico(
  diag: any,
  subtema: string,
  materia: string,
): string[] {
  if (!diag) {
    return [
      "Todavía no tenemos tu diagnóstico. Si hiciste la prueba y esto te parece un error, respóndenos este correo.",
    ];
  }
  const lineas: string[] = [];
  if (materia) lineas.push(`Materia: ${materia}`);
  if (subtema) lineas.push(`El subtema donde se te fue la mano: ${subtema}`);
  if (diag.error_detectado_texto) {
    lineas.push(`Qué pasó exactamente: ${diag.error_detectado_texto}`);
  }
  const kcs = diag.kcs;
  if (kcs && Array.isArray(kcs.misconcepciones) && kcs.misconcepciones.length) {
    const textos = kcs.misconcepciones
      .map((m: any) => (typeof m === "string" ? m : m && m.texto))
      .filter(Boolean)
      .slice(0, 3);
    if (textos.length) lineas.push(`Para revisar con tu monitor: ${textos.join("; ")}`);
  }
  if (lineas.length <= 1) {
    lineas.push("Tu monitor recibe el detalle completo antes de la sesión.");
  }
  return lineas;
}

function armarCorreo(datos: {
  monitorNombre: string;
  monitorTelefono: string;
  precioHora: number | null;
  diagnostico: string[];
}): { asunto: string; texto: string } {
  const { monitorNombre, monitorTelefono, precioHora, diagnostico } = datos;

  const asunto = monitorNombre
    ? `Tu sesión con ${monitorNombre} está confirmada`
    : "Tu sesión en Calibra está confirmada";

  const bloques: string[] = [];
  bloques.push("Hola,");
  bloques.push(
    monitorNombre
      ? `Tu sesión con ${monitorNombre} quedó apartada. El siguiente paso es acordar la hora directamente con ${monitorNombre} y hacer el pago.`
      : "Tu sesión quedó apartada. El siguiente paso es acordar la hora y hacer el pago.",
  );

  if (monitorTelefono) {
    bloques.push(
      `Contacto de tu monitor\n${monitorNombre || "Tu monitor"}: ${monitorTelefono}\nEscríbele y acuerden hora y lugar. Si prefieres que lo hagamos nosotros, respóndenos este correo.`,
    );
  } else {
    bloques.push(
      "Contacto de tu monitor\nTodavía no tenemos su número. Nosotros los ponemos en contacto: respóndenos este correo y te escribimos hoy mismo.",
    );
  }

  bloques.push(`Tu diagnóstico\n${diagnostico.join("\n")}`);

  const tarifa = precioHora && precioHora > 0
    ? `La tarifa de tu monitor es de $${precioHora.toLocaleString("es-CO")} por hora.`
    : "";
  bloques.push(`Cómo pagar\n${[tarifa, PAGO || PAGO_MARCADOR].filter(Boolean).join("\n")}`);

  bloques.push(
    "Calibra es un prototipo del curso de Diseño de Productos de la Universidad de los Andes. Si algo no cuadra, responde este correo.",
  );

  return { asunto, texto: bloques.join("\n\n") };
}

async function enviarConResend(para: string, asunto: string, texto: string) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: REMITENTE, to: [para], subject: asunto, text: texto }),
  });
  const cuerpo = await r.text();
  if (!r.ok) throw new Error(`Resend: HTTP ${r.status} ${cuerpo}`);
  return cuerpo;
}

/* --------------------------------------------------------------------------
   Entrada
   -------------------------------------------------------------------------- */
Deno.serve(async (req: Request) => {
  const responder = (estado: number, cuerpo: Record<string, unknown>) =>
    new Response(JSON.stringify(cuerpo), {
      status: estado,
      headers: { "Content-Type": "application/json" },
    });

  if (req.method !== "POST") return responder(405, { error: "solo POST" });

  if (WEBHOOK_TOKEN && req.headers.get("x-calibra-token") !== WEBHOOK_TOKEN) {
    return responder(401, { error: "token invalido" });
  }
  for (const [nombre, valor] of Object.entries({ SUPABASE_URL, SERVICE_KEY, RESEND_API_KEY, REMITENTE })) {
    if (!valor) return responder(500, { error: `falta la variable ${nombre}` });
  }

  let lead: any = null;
  try {
    const cuerpo = await req.json();
    lead = cuerpo && (cuerpo.record ?? cuerpo.lead ?? cuerpo);
  } catch {
    return responder(400, { error: "cuerpo no es JSON" });
  }
  if (!lead || !lead.id || !lead.correo) {
    return responder(400, { error: "el cuerpo no trae una fila de leads" });
  }

  // Al monitor no se le manda nada: su fila solo guarda el contacto.
  if (lead.rol !== "estudiante") {
    return responder(200, { ignorado: "rol " + lead.rol });
  }
  if (lead.correo_enviado_en) {
    return responder(200, { ignorado: "ya se habia enviado" });
  }

  try {
    /* Monitor elegido, su tarifa y su clave pública. */
    let monitorNombre = "";
    let monitorClave = "";
    let precioHora: number | null = null;
    if (lead.monitor_id) {
      const filas = await leer(
        "monitores",
        `id=eq.${lead.monitor_id}&select=nombre,clave,precio_hora&limit=1`,
      );
      if (filas[0]) {
        monitorNombre = filas[0].nombre ?? "";
        monitorClave = filas[0].clave ?? "";
        precioHora = filas[0].precio_hora ?? null;
      }
    }

    /* El teléfono del monitor vive en leads, que no tiene lectura pública. Se
       llega a él por la clave del perfil, que es la sesión de ese navegador. */
    let monitorTelefono = "";
    if (monitorClave) {
      const filas = await leer(
        "leads",
        `sesion_id=eq.${encodeURIComponent(monitorClave)}&rol=eq.monitor` +
          `&telefono=not.is.null&select=telefono&order=creado_en.desc&limit=1`,
      );
      if (filas[0]) monitorTelefono = filas[0].telefono ?? "";
    }

    /* Diagnóstico de esta misma sesión. */
    let diag: any = null;
    if (lead.sesion_id) {
      const filas = await leer(
        "resultados_diagnostico",
        `sesion_id=eq.${encodeURIComponent(lead.sesion_id)}` +
          `&select=materia_id,subtema_debil_id,error_detectado_texto,kcs` +
          `&order=creado_en.desc&limit=1`,
      );
      diag = filas[0] ?? null;
    }

    let subtema = "";
    let materia = "";
    if (diag && diag.subtema_debil_id) {
      const filas = await leer("subtemas", `id=eq.${diag.subtema_debil_id}&select=nombre&limit=1`);
      subtema = filas[0]?.nombre ?? "";
    }
    if (diag && diag.materia_id) {
      const filas = await leer("materias", `id=eq.${diag.materia_id}&select=nombre&limit=1`);
      materia = filas[0]?.nombre ?? "";
    }

    const { asunto, texto } = armarCorreo({
      monitorNombre,
      monitorTelefono,
      precioHora,
      diagnostico: lineasDiagnostico(diag, subtema, materia),
    });

    await enviarConResend(lead.correo, asunto, texto);
    await marcarEnviado(lead.id);

    return responder(200, {
      enviado: true,
      lead: lead.id,
      conMonitor: Boolean(monitorNombre),
      conTelefonoDelMonitor: Boolean(monitorTelefono),
      conDiagnostico: Boolean(diag),
      pagoEsMarcador: !PAGO,
    });
  } catch (e) {
    // El mensaje no lleva llaves: solo tabla y código HTTP.
    const mensaje = e instanceof Error ? e.message : String(e);
    console.error("[enviar-correo] fallo:", mensaje);
    return responder(500, { error: mensaje });
  }
});
