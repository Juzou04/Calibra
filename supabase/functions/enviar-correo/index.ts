/*
  Calibra · enviar-correo
  ---------------------------------------------------------------------------
  Cuando se confirma una cita manda dos correos: la confirmación al estudiante
  (la hora que quedó bloqueada, cómo paga, su diagnóstico y el contacto del
  monitor) y el brief de la sesión al monitor (contacto del estudiante y en qué
  falla).

  Vive fuera de index.html a propósito. El navegador no puede armar estos
  correos: la llave que viaja en el HTML es anónima y no tiene permiso de
  lectura sobre citas, estudiantes, leads ni resultados_diagnostico. Esta
  función sí, porque usa la llave secreta del proyecto, que nunca sale de aquí.

  Cómo se dispara: un Database Webhook de Supabase en INSERT sobre public.citas.
  Una cita ya trae ligados al estudiante, la franja y el diagnóstico (los ata la
  función reservar_franja en una sola transacción), así que aquí no hay carrera
  entre el insert del lead y el del diagnóstico. Todo se lee de la vista
  public.brief_cita. Los pasos de despliegue están en el README de esta carpeta.

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

  Qué pasa cuando un envío falla (una sola marca, citas.correo_enviado_en):
    - Falla el correo del estudiante: 502 y no se marca nada. El webhook puede
      reintentar sin duplicar, porque tampoco se intentó el del monitor.
    - Sale el del estudiante y falla el del monitor: se marca igual (para no
      repetirle la confirmación al estudiante en un reintento), se responde 200
      con monitor:"fallo" y el error queda en los logs. El brief del monitor no
      se reenvía solo.
*/

import {
  armarCorreoEstudiante,
  armarCorreoMonitor,
  type Brief,
} from "./correo.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY =
  Deno.env.get("CALIBRA_SERVICE_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const REMITENTE = Deno.env.get("CALIBRA_REMITENTE") ?? "";
const WEBHOOK_TOKEN = Deno.env.get("CALIBRA_WEBHOOK_TOKEN") ?? "";
const PAGO = Deno.env.get("CALIBRA_PAGO") ?? "";

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

async function marcarEnviado(citaId: number): Promise<void> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/citas?id=eq.${citaId}`, {
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

  let cita: any = null;
  try {
    const cuerpo = await req.json();
    cita = cuerpo && (cuerpo.record ?? cuerpo.cita ?? cuerpo);
  } catch {
    return responder(400, { error: "cuerpo no es JSON" });
  }
  const citaId = cita && Number(cita.id);
  if (!citaId || !Number.isFinite(citaId)) {
    return responder(400, { error: "el cuerpo no trae una fila de citas" });
  }

  try {
    /* Todo lo de la cita sale de la vista; del cuerpo del webhook solo se usa
       el id, que es lo único que no puede estar desactualizado. */
    const filas = await leer("brief_cita", `cita_id=eq.${citaId}&limit=1`);
    const brief: (Brief & { correo_enviado_en?: string | null }) | undefined = filas[0];
    if (!brief) return responder(404, { error: "no hay una cita con ese id", cita: citaId });

    if (brief.estado !== "confirmada") {
      return responder(200, { ignorado: "estado " + brief.estado });
    }
    if (brief.correo_enviado_en) {
      return responder(200, { ignorado: "ya se habia enviado" });
    }
    if (!brief.estudiante_correo) {
      return responder(422, { error: "la cita no tiene correo del estudiante", cita: citaId });
    }

    /* Contacto del monitor. Vive en leads (rol monitor), que no tiene lectura
       pública; se llega por la clave del perfil, que es el id del navegador
       desde el que se publicó. Se toma el correo y el teléfono más recientes
       que no sean nulos, aunque estén en filas distintas. */
    let monitorCorreo = "";
    let monitorTelefono = "";
    if (brief.monitor_clave) {
      const contactos = await leer(
        "leads",
        `sesion_id=eq.${encodeURIComponent(brief.monitor_clave)}&rol=eq.monitor` +
          `&select=correo,telefono&order=creado_en.desc&limit=10`,
      );
      monitorCorreo = contactos.find((c: any) => c.correo)?.correo ?? "";
      monitorTelefono = contactos.find((c: any) => c.telefono)?.telefono ?? "";
    }

    /* 1. Estudiante. Si falla, 502 y nada queda marcado. */
    const paraEstudiante = armarCorreoEstudiante(brief, { monitorTelefono, pago: PAGO });
    try {
      await enviarConResend(brief.estudiante_correo, paraEstudiante.asunto, paraEstudiante.texto);
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : String(e);
      console.error("[enviar-correo] fallo el correo del estudiante:", mensaje);
      return responder(502, { error: mensaje, cita: citaId, estudiante: "fallo" });
    }

    /* 2. Monitor. Sin correo o con fallo no tumba la confirmación ya enviada. */
    let estadoMonitor = "sin correo";
    if (monitorCorreo) {
      const paraMonitor = armarCorreoMonitor(brief);
      try {
        await enviarConResend(monitorCorreo, paraMonitor.asunto, paraMonitor.texto);
        estadoMonitor = "enviado";
      } catch (e) {
        estadoMonitor = "fallo";
        console.error(
          "[enviar-correo] salio el del estudiante y fallo el del monitor:",
          e instanceof Error ? e.message : String(e),
        );
      }
    }

    await marcarEnviado(citaId);

    return responder(200, {
      enviado: true,
      cita: citaId,
      estudiante: "enviado",
      monitor: estadoMonitor,
      conTelefonoDelMonitor: Boolean(monitorTelefono),
      conDiagnostico: Boolean(brief.diagnostico_id),
      pagoEsMarcador: !PAGO,
    });
  } catch (e) {
    // El mensaje no lleva llaves: solo tabla y código HTTP.
    const mensaje = e instanceof Error ? e.message : String(e);
    console.error("[enviar-correo] fallo:", mensaje);
    return responder(500, { error: mensaje });
  }
});
