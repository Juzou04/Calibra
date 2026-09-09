# Cómo recolectar las preguntas

Esta carpeta es de donde Calibra saca su contenido. Un archivo por materia. Se escriben en Markdown para que cualquiera del equipo pueda llenarlos sin programar, y un script los convierte al formato que consume el prototipo.

## Lo que hay que buscar no son temarios

El temario da los subtemas y ya lo tenemos para casi todas las materias. Lo que falta, y lo que hace que Calibra sirva para algo, es el **catálogo de errores**: qué se equivoca la gente exactamente, y por qué.

Una opción incorrecta cualquiera no sirve. Si en una pregunta de conteo la respuesta correcta es 120 y las otras son 118, 122 y 150, el estudiante que falla no aprende nada y nosotros tampoco. Si en cambio las otras son 720, 1000 y 30, cada una delata un error distinto: usó permutación, contó con repetición, o multiplicó en vez de contar subconjuntos. Eso es lo que le permite a Calibra decir "tu problema es que no distingues permutación de combinación" en vez de "sacaste 3 de 4".

Tres fuentes, en orden de utilidad:

1. **Preguntarle a un monitor o a un compañero que ya pasó la materia:** "¿cuáles son los tres errores que más ves en este subtema?". Es la fuente más rápida y la mejor. Además nos sirve como evidencia de entrevistas para la entrega del 23 de septiembre, que es requisito de la rúbrica y de la que hoy tenemos cero.
2. **Parciales con solución.** La solución muestra el camino correcto, y de ahí se deducen las bifurcaciones donde la gente se sale.
3. **Tu propia experiencia si cursaste la materia.** Los errores que tú cometiste sirven igual.

## Cómo llenar un archivo

Copia `plantilla-materia.md`, renómbralo con el id de la materia y llénalo. El formato es este:

```
## clave-del-subtema · Nombre visible del subtema

### P1 · dificultad 2
Aquí va el enunciado completo.

- A) primera opción · CORRECTA
- B) segunda opción · texto del error conceptual
- C) tercera opción · texto del error conceptual
- D) cuarta opción · texto del error conceptual
```

Reglas del formato:

- La clave del subtema va en minúscula, sin tildes y sin espacios. El nombre visible sí lleva tildes y es lo que ve el estudiante.
- Cada pregunta lleva un id único dentro de la materia (P1, P2, P3...) y una dificultad de 1 a 3. Si no sabes qué dificultad ponerle, pon 2.
- Exactamente una opción lleva `CORRECTA`. Las otras tres llevan su error.
- El texto del error se escribe en segunda persona y describe **qué pensó el estudiante**, no qué le faltó. "Usas permutación y cuentas como si el orden importara" funciona. "No sabe combinatoria" no sirve, porque no se puede convertir en un plan de sesión.
- El error va sin punto final y sin mayúscula inicial, porque en pantalla aparece detrás de "Error detectado: ".

## Cuántas preguntas

Con 3 preguntas por subtema la prueba ya puede adaptarse: pregunta una, y si fallas profundiza en ese subtema en vez de seguir de largo. Con 1 por subtema solo alcanza para el modo fijo.

Apunten a 4 subtemas por materia y 3 preguntas por subtema. Son 12 preguntas por materia. Es alcanzable y es suficiente para que la demo se sienta distinta cada vez.

## Estado

| Materia | Código | Subtemas | Preguntas | Quién |
|---|---|---|---|---|
| Cálculo Integral | MATE-1214 | 3 | 4 | listo, viene del brief |
| Probabilidad y Estadística | IIND-2106 | 4 | 2 de 12 | |
| Álgebra Lineal | MATE-1105 | 4 | 0 de 12 | |
| Cálculo Vectorial | MATE-1207 | 4 | 0 de 12 | |
| Física I | sin código | 4 | 0 de 12 | |
| Cálculo Diferencial | sin código | 0 | 0 | falta conseguir el temario |

De Cálculo Diferencial no hay un solo archivo en el disco de Juan David. Si la quieren cubrir, alguien tiene que conseguir el programa del curso primero.

## Qué pasa cuando estén llenos

Se corre el conversor y el prototipo queda con las materias nuevas activas. No hay que tocar código.

```bash
node contenido/convertir.js
```
