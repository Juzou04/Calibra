# enviar-correo

Manda el correo de confirmación al estudiante: la hora agendada, cómo paga, su
diagnóstico y el contacto del monitor.

Está fuera de `index.html` porque tiene que estarlo. La llave que viaja en el
HTML es anónima y RLS no le da lectura sobre `leads` ni sobre
`resultados_diagnostico`, así que el navegador no puede leer ni el correo, ni el
teléfono, ni el diagnóstico de nadie. Esta función usa la llave secreta del
proyecto, que nunca sale del lado del servidor.

## Antes de desplegar

1. La migración `supabase/migraciones/001-telefonos-y-correo.sql` ya corrió en el
   proyecto. Sin `leads.sesion_id` y `monitores.clave` la función no encuentra
   nada que mandar.
2. Una cuenta de Resend con una llave de API.

**El detalle que tumba a todo el mundo:** Resend solo deja mandar correos a
terceros desde un dominio verificado. Con el remitente de prueba
`onboarding@resend.dev` el correo **solo llega a la dirección dueña de la
cuenta**; a un estudiante no le llega nada y Resend responde 403. Dos salidas:

- Verificar un dominio en Resend (registros DNS, entre 15 minutos y unas horas
  en propagar). Es lo que hay que hacer para el piloto de verdad.
- Si esta noche no hay dominio: usar un proveedor con verificación de remitente
  suelto, como Brevo o SendGrid, que dejan mandar desde un Gmail verificado sin
  dominio propio. Solo cambia la función `enviarConResend` en `index.ts`: es una
  sola llamada `fetch`.

## Despliegue

```bash
# Desde la raíz del repo. No hace falta instalar nada global.
npx supabase login
npx supabase link --project-ref uotlhaitdkfroavqkvee

# Secretos (no quedan en el repo; .env está en .gitignore)
npx supabase secrets set RESEND_API_KEY=re_xxxxxxxx
npx supabase secrets set CALIBRA_REMITENTE="Calibra <hola@tudominio.com>"
npx supabase secrets set CALIBRA_PAGO="Transfiere $XX.XXX a ... y responde este correo con el comprobante."
npx supabase secrets set CALIBRA_WEBHOOK_TOKEN=una-cadena-larga-que-inventes

# La función no valida JWT: la llama un webhook de la base, no un usuario.
# El token de arriba es lo que la protege.
npx supabase functions deploy enviar-correo --no-verify-jwt
```

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` las inyecta Supabase sola. Si tu
proyecto usa el sistema nuevo de llaves (`sb_secret_…`) y la inyectada no
funciona, agrégala explícita:

```bash
npx supabase secrets set CALIBRA_SERVICE_KEY=sb_secret_xxxxxxxx
```

## El disparador

Supabase → Database → Webhooks → **Create a new hook**:

| Campo | Valor |
| --- | --- |
| Name | `correo-de-confirmacion` |
| Table | `public.leads` |
| Events | solo `Insert` |
| Type | HTTP Request |
| Method | `POST` |
| URL | `https://uotlhaitdkfroavqkvee.supabase.co/functions/v1/enviar-correo` |
| HTTP Headers | `x-calibra-token: <el token que pusiste arriba>` |

La función ignora por su cuenta los leads con `rol = 'monitor'` y los que ya
tienen `correo_enviado_en`, así que el webhook puede disparar en todos los
inserts sin filtro.

## Probar sin esperar a un estudiante

```bash
curl -X POST "https://uotlhaitdkfroavqkvee.supabase.co/functions/v1/enviar-correo" \
  -H "Content-Type: application/json" \
  -H "x-calibra-token: <tu token>" \
  -d '{"record":{"id":1,"correo":"tu.correo@uniandes.edu.co","rol":"estudiante","monitor_id":null,"sesion_id":null}}'
```

Responde un JSON que dice qué encontró: `conMonitor`, `conTelefonoDelMonitor`,
`conDiagnostico` y `pagoEsMarcador`. Si `pagoEsMarcador` es `true`, el correo
salió con el texto de relleno y hay que llenar `CALIBRA_PAGO`.

Ojo: con `"id":1` marca esa fila como enviada. Para probar sin tocar datos
reales, usa un id que no exista (`999999`); el envío ocurre igual y solo falla el
paso de marcar.

Los logs: Supabase → Edge Functions → `enviar-correo` → Logs. Nunca se escribe
una llave ahí.

## Lo que este correo todavía no sabe hacer

- **No hay hora concreta.** La app no agenda: no existe tabla de citas ni
  selección de fecha. El correo dice "acuerden la hora" y da el número del
  monitor. Si hace falta hora real, hay que agendar de verdad primero.
- **El diagnóstico detallado solo existe en Cálculo Integral.** Es la única
  materia con knowledge components; en las otras seis el correo lleva subtema
  débil y el error detectado, y nada más.
- **Si el monitor no dejó su celular**, el correo lo dice y ofrece que el equipo
  los ponga en contacto. No inventa un número.
- **Sin autenticación**, cualquiera puede insertar un lead y provocar un correo a
  la dirección que quiera. Para un piloto de un curso es aceptable; para abrirlo
  al público hay que poner un captcha o autenticación antes.
