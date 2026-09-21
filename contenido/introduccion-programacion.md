---
id: introduccion-programacion
codigo: ISIS-1221
nombre: Introducción a la Programación
libro: Wentworth, Elkner, Downey y Meyers, How to Think Like a Computer Scientist (Python 3), 2018. Material del curso por niveles.
contexto: antes del examen escrito de nivel 2
activa: true
longitud: 12
---

Subtemas tomados del material de los niveles 1 y 2 del curso (`recursos de cursos anteriores/ip`): tipos y operadores, funciones, booleanos y condicionales, cadenas y diccionarios. El proyecto de nivel 2 es Cinema, que usa diccionarios de diccionarios.
El examen de cada nivel es escrito y en papel, así que todas las preguntas son de rastrear código a mano: leer un programa corto y decir qué imprime. En el enunciado, " | " separa las líneas del programa.
Cada respuesta se comprobó ejecutando el código en Python 3.12. El código ISIS-1221 no está confirmado contra el programa oficial.

## tipos · Tipos, operadores y conversión

Errores que vale la pena cazar: confundir `//`, `/` y `%`, creer que un texto con dígitos se comporta como número, y olvidar que `input()` siempre devuelve un str.

### P1 · dificultad 1
¿Qué imprime print(17 % 5)?

- A) 2 · CORRECTA
- B) 3 · confundes % (el residuo) con // (el cociente de la división entera)
- C) 3.4 · confundes % con la división normal /
- D) 0.85 · crees que % calcula un porcentaje, el 17 % de 5

### P2 · dificultad 2
¿Qué imprime este programa? x = "3" | y = 4 | print(x * 2 + str(y))

- A) 334 · CORRECTA
- B) 10 · tratas "3" como el número 3 aunque está entre comillas
- C) 64 · multiplicas "3" como número pero después concatenas el 4 como texto
- D) TypeError · crees que un str no se puede multiplicar por un int, cuando eso lo repite

### P3 · dificultad 2
El programa es n = input("Edad: ") | print(n + 1), y el usuario escribe 20. ¿Qué pasa?

- A) Sale un TypeError, porque no se puede sumar un str con un int · CORRECTA
- B) Imprime 21 · olvidas que input() siempre devuelve un str, aunque el usuario escriba un número
- C) Imprime 201 · crees que Python convierte el 1 en texto por su cuenta para concatenar
- D) Imprime 20 1 · confundes el + con la coma de print, que separa valores con un espacio

## funciones · Funciones, return y variables locales

Errores que vale la pena cazar: confundir `print` con `return`, creer que asignar una variable dentro de una función cambia la de afuera, y emparejar argumentos por el nombre de la variable en vez de por la posición.

### P4 · dificultad 2
¿Qué imprime este programa? def doble(x): print(x * 2) | r = doble(5) | print(r)

- A) 10 y luego None · CORRECTA
- B) 10 y luego 10 · crees que print dentro de la función también devuelve el valor
- C) Solo None · crees que la función no imprime nada cuando su resultado se guarda en una variable
- D) Un error, porque doble no tiene return · crees que una función sin return no se puede asignar a una variable

### P5 · dificultad 2
¿Qué imprime este programa? x = 5 | def cambiar(): x = 10 | cambiar() | print(x)

- A) 5 · CORRECTA
- B) 10 · crees que asignar x dentro de la función cambia la x de afuera, cuando crea una variable local
- C) None · confundes el valor de x con lo que devuelve cambiar(), que no tiene return
- D) Un error, porque x no está definida dentro de la función · crees que una función no puede crear una variable con el mismo nombre de una de afuera

### P6 · dificultad 3
¿Qué imprime este programa? def dividir(a, b): return a // b | x = 3 | y = 12 | print(dividir(y, x))

- A) 4 · CORRECTA
- B) 0 · crees que x va con a y y va con b porque x se definió primero, cuando manda la posición en la llamada
- C) 4.0 · crees que // siempre devuelve un float
- D) 0.25 · divides x entre y y además usas la división normal

## condicionales · Booleanos y condicionales

Errores que vale la pena cazar: aplicar mal las leyes de De Morgan, creer que un if/elif ejecuta todas las ramas verdaderas, y escribir `color == "azul" or "verde"` creyendo que compara con los dos valores.

### P7 · dificultad 2
¿Cuál expresión es equivalente a not (a and b)?

- A) not a or not b · CORRECTA
- B) not a and not b · niegas cada parte pero dejas el and, cuando De Morgan lo cambia por or
- C) a or b · cambias el and por or pero te olvidas de negar cada parte
- D) not a and b · aplicas el not solo al primer término

### P8 · dificultad 2
¿Qué imprime este programa? nota = 4.5 | if nota >= 3: print("aprobó") | elif nota >= 4: print("excelente") | else: print("reprobó")

- A) aprobó · CORRECTA
- B) excelente · crees que Python escoge la condición más específica, cuando ejecuta la primera que sea verdadera
- C) aprobó y luego excelente · crees que un if/elif ejecuta todas las ramas cuya condición es verdadera
- D) Un error, porque dos condiciones son verdaderas a la vez · crees que las condiciones de un if/elif tienen que ser excluyentes

### P9 · dificultad 3
¿Qué imprime este programa? color = "rojo" | if color == "azul" or "verde": print("frío") | else: print("cálido")

- A) frío · CORRECTA
- B) cálido · crees que or compara color con cada valor, cuando "verde" por sí solo ya cuenta como verdadero
- C) Un error de sintaxis · crees que no se puede poner un str suelto en una condición
- D) No imprime nada · crees que si la primera comparación es falsa el if se salta también el else

## cadenas-diccionarios · Cadenas y diccionarios

Errores que vale la pena cazar: contar los índices desde 1, incluir el índice final en un corte, creer que un método de str modifica el texto original, y creer que una función recibe una copia del diccionario.

### P10 · dificultad 2
¿Qué imprime este programa? s = "Python" | print(s[1:4])

- A) yth · CORRECTA
- B) Pyt · cuentas las posiciones desde 1 en vez de desde 0
- C) ytho · incluyes el índice final del corte, cuando el corte se detiene antes de él
- D) Pyth · cuentas desde 1 y además incluyes el índice final

### P11 · dificultad 2
¿Qué imprime este programa? s = "hola" | s.upper() | print(s)

- A) hola · CORRECTA
- B) HOLA · crees que upper() cambia el string original, cuando devuelve uno nuevo que aquí nadie guarda
- C) Hola · confundes upper() con capitalize(), que solo pone en mayúscula la primera letra
- D) None · crees que upper() deja la variable vacía después de usarla

### P12 · dificultad 3
¿Qué imprime este programa? sala = {"vendidas": 0} | def vender(d, n): d["vendidas"] += n | vender(sala, 5) | print(sala["vendidas"])

- A) 5 · CORRECTA
- B) 0 · crees que la función trabaja sobre una copia del diccionario, cuando recibe el mismo diccionario y lo modifica
- C) None · confundes el valor de la llave con lo que devuelve vender(), que no tiene return
- D) {'vendidas': 5} · confundes el valor de una llave con el diccionario completo
