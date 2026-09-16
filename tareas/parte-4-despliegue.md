# Calibra — Parte 4: Rama de producción, Vercel y verificación

**Sugerido para:** David (cualquiera puede tomarla, es intercambiable con las otras 3)

## Cómo trabajar esta tarea con tu agente de IA

Abre este repositorio con tu agente (Claude Code, Cowork o el que uses) y pídele que lea este archivo completo antes de empezar, junto con `esquema.md` en la raíz del repo.

- Si un paso lo puede hacer el agente solo (editar archivos del repo, correr comandos, escribir código), que lo haga directamente, sin pedirte permiso paso a paso.
- Si un paso requiere que TÚ hagas algo (crear una cuenta, hacer clic en un dashboard web, pegar una API key, aprobar un push a GitHub), que te lo explique claro y te guíe uno por uno, esperando que confirmes cada uno antes de seguir.

No necesitas leer las tareas de tus compañeros ni el chat donde se armó este plan: este archivo y `esquema.md` tienen todo el contexto que tu agente necesita.

## Contexto (para una sesión de IA que arranca desde cero)

Calibra es un prototipo web que conecta estudiantes de pregrado de Uniandes con monitores de materias de ciclo básico. Su diferenciador es una prueba de opción múltiple calibrada: cada opción incorrecta delata un error conceptual específico, y el resultado le entrega al estudiante su punto débil y al monitor un brief automático de la sesión.

El repositorio ya existe en GitHub (`github.com/dvarela5101/Calibra`), pero todo el trabajo vive en la rama `juzouy`; no hay una rama `main`. Hay un arnés de verificación con Playwright (`verificar.cmd` / `verificar.js`) que recorre los dos flujos (estudiante y monitor) a 390×844 y compara contra un oráculo interno; hoy pasa 174 de 195 chequeos porque el oráculo todavía espera 4 preguntas por materia y ahora hay 12 (las 21 fallas son consecuencia de eso, no bugs reales). El equipo decidió desplegar en Vercel y mover la persistencia a Supabase. **Antes de hacer nada, lee `esquema.md` en la raíz de este repositorio** para entender la arquitectura completa a la que esta parte conecta.

## Tu tarea

1. **Rama de producción**: crea `main` a partir de `juzouy` (o renombra `juzouy` a `main`) y ajusta el "default branch" del repositorio en GitHub para que sea `main`.
2. **Vercel**: importa el repositorio en Vercel, framework preset "Other" (sitio estático, sin build, directorio raíz), apuntando a la rama `main`. Confirma que el deploy inicial (con el `index.html` actual, sin Supabase todavía) carga bien.
3. **Oráculo de verificación**: actualiza `verificar.js` para que espere 12 preguntas por materia en vez de 4, de forma que las 21 fallas conocidas desaparezcan y las 195 comprobaciones reflejen el estado real del contenido.
4. **Checklist de integración final** (documéntalo en `tareas/integracion-final.md`): los pasos para cuando las Partes 1, 2 y 3 ya tengan su trabajo listo — fusionar sus ramas/PRs a `main`, poner la `Project URL` y `anon key` reales de Supabase en `index.html`, poner las variables de entorno reales en donde corra `convertir.js`, redesplegar en Vercel, y correr `verificar.cmd` contra la app ya integrada antes de dar por cerrada la entrega.

## Por qué esta parte no depende de las otras 3 para EMPEZAR

Arreglar la rama, configurar Vercel y actualizar el oráculo de pruebas son trabajo de infraestructura y de testing que no requieren que Supabase ni el frontend adaptado ya existan — se puede hacer con el `index.html` de hoy, tal cual está. Solo el paso 4 (la integración final) espera a que las Partes 1–3 terminen, y por eso está escrito como el último paso: es una tarea de coordinación, no un bloqueo para arrancar las otras tres partes.

## No toques

`contenido/convertir.js` y la lógica interna de `index.html` (sí puedes tocar configuración de Vercel, la rama, y `verificar.js`) — el contenido y el frontend son de las otras 2 partes.

## Definición de hecho

- [ ] Existe una rama `main` en GitHub y es el default branch.
- [ ] Hay un proyecto en Vercel desplegando `main` con éxito.
- [ ] `verificar.js` ya no reporta las 21 fallas esperadas por el conteo de preguntas.
- [ ] Existe `tareas/integracion-final.md` con el checklist de integración.
