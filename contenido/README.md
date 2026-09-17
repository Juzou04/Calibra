# Cómo recolectar las preguntas

Esta carpeta es de donde Calibra saca su contenido. Un archivo por materia, en Markdown para que cualquiera del equipo pueda llenarlo sin programar. Un script los convierte al formato que consume el prototipo.

**Esta carpeta manda.** El `index.html` se genera desde aquí, así que no edites las preguntas allá: se pierden en la siguiente conversión.

## Lo que hay que buscar no son temarios

El temario da los subtemas y ya lo tenemos para casi todas las materias. Lo que falta, y lo que hace que Calibra sirva para algo, es el **catálogo de errores**: qué se equivoca la gente exactamente, y por qué.

Una opción incorrecta cualquiera no sirve. Si en una pregunta de conteo la respuesta correcta es 120 y las otras son 118, 122 y 150, el estudiante que falla no aprende nada y nosotros tampoco. Si en cambio las otras son 720, 1000 y 30, cada una delata un error distinto: usó permutación, contó con repetición, o multiplicó en vez de contar subconjuntos. Eso es lo que le permite a Calibra decir "tu problema es que no distingues permutación de combinación" en vez de "sacaste 3 de 4".

Tres fuentes, en orden de utilidad:

1. **Preguntarle a un monitor o a un compañero que ya pasó la materia:** "¿cuáles son los tres errores que más ves en este subtema?". Es la fuente más rápida y la mejor. Además nos sirve como evidencia de entrevistas para la entrega del 23 de septiembre, que es requisito de la rúbrica y de la que hoy tenemos cero.
2. **Parciales con solución.** La solución muestra el camino correcto, y de ahí se deducen las bifurcaciones donde la gente se sale.
3. **Tu propia experiencia si cursaste la materia.** Los errores que tú cometiste sirven igual.

## Cómo llenar un archivo

Copia `plantilla-materia.md`, renómbralo con el id de la materia y llénalo. Mira `calculo-integral.md`, que está completo, o `probabilidad-estadistica.md`, que tiene dos preguntas de referencia.

```
## clave-del-subtema · Nombre visible del subtema

### P1 · dificultad 2
Aquí va el enunciado completo.

- A) primera opción · CORRECTA
- B) segunda opción · el error conceptual que delata elegir esta
- C) tercera opción · el error conceptual que delata elegir esta
- D) cuarta opción · el error conceptual que delata elegir esta
```

Reglas del formato:

- La clave del subtema va en minúscula, sin tildes y sin espacios. El nombre visible sí lleva tildes y es lo que ve el estudiante.
- Cada pregunta lleva un id único dentro de la materia (P1, P2, P3...) y una dificultad de 1 a 3. Si no sabes qué ponerle, pon 2.
- Exactamente una opción lleva `CORRECTA`. Las otras tres llevan su error.
- El texto del error se escribe en segunda persona y describe **qué pensó el estudiante**, no qué le faltó. "Usas permutación y cuentas como si el orden importara" funciona. "No sabe combinatoria" no sirve, porque no se puede convertir en un plan de sesión.
- El error va sin punto final y sin mayúscula inicial, porque en pantalla aparece detrás de "Error detectado: ".

Dos reglas que no son obvias y que cuestan un rato si se descubren tarde:

- **El separador es un punto medio con espacio a cada lado.** El punto medio pegado es multiplicación y no separa nada, así que `x·ln(x)` se escribe tal cual y `x·eˣ − eˣ + C · CORRECTA` se lee bien. Lo que no puedes hacer es meter un ` · ` suelto dentro del texto del error.
- **El orden de las preguntas lo manda el id, no el archivo.** Puedes agrupar por subtema como quieras: el conversor ordena por P1, P2, P3... Eso importa porque la prueba de Cálculo Integral tiene dos preguntas del mismo subtema separadas.

## Knowledge components y misconcepciones (opcional, piloto en Cálculo Integral)

El subtema dice *dónde* falla el estudiante; esto dice *qué habilidad* le falta y *qué error de razonamiento* comete, y le permite a la prueba confirmar un patrón en vez de adivinarlo. Una materia sin líneas `kc:` funciona exactamente como antes.

```
## partes · Integración por partes

kc: partes-eleccion-u · Elegir u y dv con la prioridad ILATE
kc: partes-formula · Aplicar uv − ∫v du con signos y términos correctos
mc: u-orden-aparicion · partes-eleccion-u · eliges u por orden de aparición, no por la prioridad ILATE
mc: signo-partes · partes-formula · te equivocas en el signo de la fórmula uv − ∫v du

### P1 · dificultad 2 · kc: partes-eleccion-u
En ∫ x·ln(x) dx, ¿qué eliges como u?

- A) x · [u-orden-aparicion] eliges u por orden de aparición, no por prioridad ILATE
- B) ln(x) · CORRECTA

### P13 · dificultad 2 · kc: partes-eleccion-u · borrador
```

- **kc** (knowledge component): una habilidad concreta, verificable con una pregunta. `kc: clave · Nombre`, dentro del subtema al que pertenece. Apunten a 2 o 3 por subtema.
- **mc** (misconcepción): un error de razonamiento que **se repite entre preguntas**. `mc: clave · kc-al-que-pertenece · texto`. El texto sigue las mismas reglas del error (segunda persona, minúscula, sin punto).
- Cada pregunta dice qué kc mide con `· kc: clave` en el encabezado (pueden ser dos, separados por coma).
- Cada opción incorrecta dice qué mc delata con `[clave]` al inicio de su error. El texto de la opción puede ser más específico que el de la mc: el de la opción es el que sale en "Error detectado", el de la mc es el que sale en "Lo que detectamos" y en el brief del monitor.
- **Para que la prueba pueda confirmar un error, esa mc tiene que salir como trampa en al menos 2 preguntas distintas**, y cada kc necesita al menos 2 preguntas. El conversor avisa cuando no se cumple.
- `· borrador` marca preguntas que aún no revisó alguien que sepa la materia. No entran a la app salvo que se convierta con `--borradores`. Revisar = leer la pregunta, confirmar la respuesta y los errores, y borrar `· borrador`.

Cómo usa esto la prueba: si el estudiante cae en una mc, la siguiente pregunta le ofrece esa misma trampa. Si vuelve a caer, sale **Confirmado**; si acierta, se descarta. Además, cada intento sale con preguntas distintas.

```bash
node contenido/convertir.js --cobertura                # cuántas preguntas tiene cada kc y cada mc
node contenido/convertir.js --escribir --borradores    # incluye los borradores en index.html
```

## Cuántas preguntas

Con 3 preguntas por subtema la prueba ya puede adaptarse: pregunta una, y si fallas profundiza en ese subtema en vez de seguir de largo. Con 1 por subtema solo alcanza para recorrer.

Apunten a 4 subtemas por materia y 3 preguntas por subtema. Son 12 por materia, y es lo que hace que la prueba se sienta distinta en cada intento.

Para activar una materia, cambia `activa: false` a `activa: true` en su frontmatter. Hazlo solo cuando tenga al menos una pregunta por subtema, o el diagnóstico saldrá a medias.

## Estado

| Materia | Código | Subtemas | Preguntas | Quién |
|---|---|---|---|---|
| Cálculo Integral | MATE-1214 | 3 | 4, completa y activa | viene del brief |
| Probabilidad y Estadística | IIND-2106 | 4 | 2 de 12 | |
| Álgebra Lineal | MATE-1105 | 4 | 0 de 12 | |
| Cálculo Vectorial | MATE-1207 | 4 | 0 de 12 | |
| Física I | sin código | 4 | 0 de 12 | |
| Cálculo Diferencial | sin código | 4 | 0 de 12 | falta el temario |

Probabilidad es la que más cerca está: sus 16 objetivos de aprendizaje ya están escritos como capacidades verificables y hay 6 pares de enunciado y solución en el disco. Álgebra Lineal va después: la guía del parcial 1 ya trae la lista de habilidades del curso, así que solo faltan los errores.

De Cálculo Diferencial no hay un solo archivo. Sus subtemas son los estándar y hay que confirmarlos con el programa real. De Física I tampoco hay programa; sus subtemas salieron de los talleres y los laboratorios.

## Convertir

```bash
node contenido/convertir.js
```

Así solo revisa y dice qué haría. Avisa de las preguntas vacías, y si algo está mal formado señala el archivo y la línea sin tocar nada.

```bash
node contenido/convertir.js --escribir
```

Aplica el cambio al `index.html` y deja una copia previa en `index.html.bak.convertir`. Después corre `verificar.cmd` para comprobar que nada se rompió.

## Subir a Supabase

El mismo script llena las tablas `materias`, `subtemas`, `preguntas` y `opciones` del proyecto Supabase (esquema en [`../supabase/schema.sql`](../supabase/schema.sql)). Solo la primera vez, instala el cliente:

```bash
cd contenido && npm install && cd ..
```

Para ver qué filas subiría, sin conectarse a nada:

```bash
node contenido/convertir.js --supabase --dry-run
```

Para subirlas de verdad, copia `.env.example` a `.env` en la raíz del repo y llena `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. La `service_role key` se pide por un canal privado del equipo: **nunca** va al repo ni al chat, y `.env` ya está en `.gitignore`. Luego:

```bash
node --env-file=.env contenido/convertir.js --supabase
```

- `--supabase` solo escribe en Supabase y no toca `index.html`. Con `--supabase --escribir` hace las dos cosas.
- Se puede correr las veces que quieras: cada fila se reconoce por su llave natural (código de la materia, clave del subtema, número de la pregunta, letra de la opción), así que lo que ya está igual no se toca, lo que cambió se actualiza y lo nuevo se inserta. Nunca duplica.
- Toda materia necesita `codigo` en el frontmatter: en Supabase es obligatorio y es lo que la identifica.
- **Limitación:** no borra. Si quitas una pregunta o un subtema de un `.md`, su fila sigue en Supabase y hay que borrarla a mano desde el dashboard.
- Corre esto cada vez que cambien las preguntas, antes de cada entrega: nada lo hace automáticamente.
