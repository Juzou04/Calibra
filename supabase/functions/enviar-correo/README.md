# enviar-correo

Cuando se confirma una cita manda dos correos:

- **Al estudiante:** la hora que quedó bloqueada (en hora de Bogotá), cómo paga,
  su diagnóstico y el contacto del monitor.
- **Al monitor:** el brief de la sesión (materia, subtema débil, error detectado,
  habilidades y errores a trabajar), la hora y el contacto del estudiante.

El correo es texto plano. El subtema, el error detectado y las misconcepciones
pueden traer matemática como `$...$` (TeX); antes de entrar al cuerpo pasan por
`textoPlano` (`textoPlano.ts`), que la aplana a Unicode (`$\frac{4}{3}\pi r^3$`
sale `4/3 πr³`). `index.html` tiene una copia de la misma función: si se toca
una, se toca la otra y se corren los casos.

## Archivos

| Archivo | Qué hace |
| --- | --- |
| `index.ts` | El servidor: valida el token, lee la cita, manda los correos y la marca. Es lo único que toca la red. |
| `correo.ts` | Armado de los dos correos. Funciones puras, sin red ni variables de entorno. |
| `textoPlano.ts` | Aplana `$...$` a Unicode. |
| `correo.test.ts`, `textoPlano.test.ts` | Pruebas de lo anterior. |

```bash
deno test supabase/functions/enviar-correo/
# o, sin Deno (Node 22.18 o más nuevo, que quita los tipos solo):
node supabase/functions/enviar-correo/correo.test.ts
node supabase/functions/enviar-correo/textoPlano.test.ts
```

Está fuera de `index.html` porque tiene que estarlo. La llave que viaja en el
HTML es anónima y RLS no le da lectura sobre `citas`, `estudiantes`, `leads` ni
`resultados_diagnostico`, así que el navegador no puede leer ni los correos, ni
los teléfonos, ni el diagnóstico de nadie. Esta función usa la llave secreta del
proyecto, que nunca sale del lado del servidor.

## De dónde sale la información

El webhook solo aporta el `id` de la cita. Todo lo demás se lee de la vista
`public.brief_cita` (solo `service_role`), que une la cita con el estudiante, la
franja, el monitor y el diagnóstico que `reservar_franja` dejó ligados en la
misma transacción. Por eso ya no hay carrera entre el insert del lead y el del
diagnóstico, que era el problema del disparador anterior sobre `leads`.

El correo y el teléfono del monitor siguen en `leads` (`rol = 'monitor'`) y se
buscan por `sesion_id = brief_cita.monitor_clave`. Se toma el correo más reciente
y el teléfono más reciente que no sean nulos, aunque estén en filas distintas.

## Antes de desplegar

1. Las migraciones `001` a `004` de `supabase/migraciones/` ya corrieron en el
   proyecto. Sin las tablas `citas` y `estudiantes` y la vista `brief_cita` (las
   crea la `004`), la función responde 500 al leer.
2. Una cuenta de Resend con una llave de API.

**El detalle que tumba a todo el mundo:** Resend solo deja mandar correos a
terceros desde un dominio verificado. Con el remitente de prueba
`onboarding@resend.dev` el correo **solo llega a la dirección dueña de la
cuenta**; a un estudiante ni a un monitor les llega nada y Resend responde 403.
Dos salidas:

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
npx supabase secrets set CALIBRA_PAGO='Transfiere $XX.XXX a ... y responde este correo con el comprobante.'   # comillas simples: con dobles, la terminal toma $XX como variable
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

Supabase → Database → Webhooks → **Create a new hook**. Si ya existe el hook
`correo-de-confirmacion` sobre `public.leads`, **bórralo o cámbiale la tabla**:
con los dos activos el estudiante recibiría dos avisos distintos.

| Campo | Valor |
| --- | --- |
| Name | `correo-de-confirmacion` |
| Table | `public.citas` |
| Events | solo `Insert` |
| Type | HTTP Request |
| Method | `POST` |
| URL | `https://uotlhaitdkfroavqkvee.supabase.co/functions/v1/enviar-correo` |
| HTTP Headers | `x-calibra-token: <el token que pusiste arriba>` |

La función ignora por su cuenta las citas que no están `confirmada` y las que ya
tienen `correo_enviado_en`, así que el webhook puede disparar en todos los
inserts sin filtro.

## Qué pasa si un envío falla

Hay una sola marca, `citas.correo_enviado_en`, y dos correos. La regla:

| Resultado | Respuesta | ¿Queda marcada? |
| --- | --- | --- |
| Salen los dos | 200, `estudiante: "enviado"`, `monitor: "enviado"` | Sí |
| El monitor no dejó correo | 200, `monitor: "sin correo"` | Sí |
| Falla el del estudiante | **502** | **No.** Tampoco se intentó el del monitor, así que un reintento del webhook no duplica nada. |
| Sale el del estudiante y falla el del monitor | 200, `monitor: "fallo"` | Sí. Se marca para no repetirle la confirmación al estudiante. El error queda en los logs. |

**El límite:** el brief del monitor no se reenvía solo. Con una sola columna no
hay forma de saber cuál de los dos correos salió. Si en los logs aparece
`salio el del estudiante y fallo el del monitor`, hay que mandarle el brief a
mano. Vaciar `correo_enviado_en` para que reintente reenvía también al
estudiante. Si esto pasa a menudo, la salida limpia es una segunda columna
(`correo_monitor_enviado_en`) en una migración `005`.

## Probar sin esperar a un estudiante

```bash
curl -X POST "https://uotlhaitdkfroavqkvee.supabase.co/functions/v1/enviar-correo" \
  -H "Content-Type: application/json" \
  -H "x-calibra-token: <tu token>" \
  -d '{"record":{"id":1}}'
```

Solo hace falta el `id`: lo demás se lee de la base. Responde un JSON que dice
qué encontró: `estudiante`, `monitor`, `conTelefonoDelMonitor`,
`conDiagnostico` y `pagoEsMarcador`. Si `pagoEsMarcador` es `true`, el correo
salió con el texto de relleno y hay que llenar `CALIBRA_PAGO`.

Códigos: `404` si no hay una cita con ese id, `422` si la cita no tiene correo
del estudiante, `401` con el token equivocado.

Ojo: con un id real, marca esa cita como enviada y manda los correos de verdad.
Para probar sin tocar datos, usa un id que no exista (`999999`): responde `404`
sin mandar nada.

Los logs: Supabase → Edge Functions → `enviar-correo` → Logs. Nunca se escribe
una llave ahí.

## Lo que este correo todavía no sabe hacer

- **El diagnóstico detallado solo existe en Cálculo Integral.** Es la única
  materia con knowledge components; en las otras seis el correo lleva subtema
  débil y el error detectado, y nada más.
- **Si el monitor no dejó su celular**, el correo lo dice y ofrece que el equipo
  los ponga en contacto. No inventa un número. Si no dejó correo, no recibe el
  brief (el estudiante sí recibe el suyo).
- **No confirma el pago.** El pago sigue siendo un texto en `CALIBRA_PAGO`; la
  hora queda bloqueada al confirmar, no al pagar.
- **Sin autenticación**, cualquiera puede llamar a `reservar_franja` y provocar un
  correo a la dirección que quiera. Para un piloto de un curso es aceptable; para
  abrirlo al público hay que poner un captcha o autenticación antes.
- **Se asume que `brief_cita.subtema_debil` es el nombre del subtema**, no su
  clave, y que `kcs` conserva la forma `{kcs: [...], misconcepciones: [...]}` que
  guarda `guardarDiagnosticoSupabase` en `index.html`. Si la vista devuelve otra
  cosa, cambia `correo.ts`.
