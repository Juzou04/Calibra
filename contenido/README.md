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
