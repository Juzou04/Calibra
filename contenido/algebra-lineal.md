---
id: algebra-lineal
codigo: MATE-1105
nombre: Álgebra Lineal
libro: Winklmeier, Notas de clase Álgebra Lineal. Complementario Grossman, Álgebra Lineal.
contexto: antes del parcial 1
activa: true
longitud: 12
---

Subtemas tomados del programa oficial de MATE-1105 y de la guía `ALGuiaParcial1.pdf`, que ya trae la lista de habilidades evaluables del curso.
Faltan las 12 preguntas.

## vectores · Vectores, rectas y planos

La guía del parcial 1 lista estas habilidades, y cada una es una pregunta posible:
calcular la magnitud de un vector, encontrar un vector unitario en una dirección dada, calcular el producto punto, calcular el ángulo entre dos vectores, calcular el vector proyección de un vector sobre otro, calcular el producto cruz, encontrar un vector perpendicular a dos vectores dados, calcular el área del paralelogramo y el volumen del paralelepípedo, hallar ecuaciones paramétricas de una recta, calcular la distancia de un punto a una recta y de un punto a un plano, y determinar si dos rectas se intersectan, son paralelas o se cruzan.

Errores que vale la pena cazar: proyectar sobre el vector equivocado (proy de a sobre b no es proy de b sobre a), usar producto punto donde se pide producto cruz, olvidar normalizar al buscar un unitario, y confundir rectas que se cruzan con rectas paralelas.

### P1 · dificultad 2
Dado el vector v = (3, -4), ¿cuál es el vector unitario en la dirección de v?

- A) (3/5, -4/5) · CORRECTA
- B) (3, -4) · olvidas normalizar el vector dividiendo por su magnitud
- C) (-4/5, 3/5) · confundes las componentes del vector original
- D) (1, 1) · crees que un vector unitario siempre tiene componentes iguales

### P2 · dificultad 2
Sean a = (2, 1, -1) y b = (1, 3, 2). Calcula la proyección de a sobre b.

- A) (5/14, 15/14, 10/14) · CORRECTA
- B) (2/6, 6/6, -2/6) · proyectas b sobre a en lugar de a sobre b
- C) 5 · confundes la proyección vectorial con la proyección escalar
- D) (-1, 2, 3) · usas producto cruz en lugar de la fórmula de proyección

### P3 · dificultad 2
Encuentra un vector perpendicular a u = (1, 2, 3) y v = (4, 5, 6).

- A) (-3, 6, -3) · CORRECTA
- B) 32 · calculas el producto punto en lugar del producto cruz
- C) (5, 7, 9) · sumas los vectores creyendo que eso da perpendicularidad
- D) (4, 10, 18) · multiplicas componente a componente

## sistemas · Sistemas lineales y Gauss-Jordan

Errores que vale la pena cazar: parar en forma escalón cuando se pedía escalón reducida, leer un sistema con infinitas soluciones como inconsistente, y perder soluciones al no marcar las variables libres.

### P4 · dificultad 2
Resuelve el sistema usando Gauss-Jordan: x + y = 2, 2x + 2y = 4.

- A) Infinitas soluciones: x = 2 - t, y = t · CORRECTA
- B) x = 1, y = 1 · detienes en forma escalón sin reducir completamente
- C) Sin solución · confundes un sistema consistente dependiente con uno inconsistente
- D) x = 2, y = 0 · olvidas identificar la variable libre y pierdes soluciones

### P5 · dificultad 2
Reduce a forma escalón reducida la matriz: [[1, 2, 3], [0, 0, 1], [0, 0, 0]].

- A) [[1, 2, 0], [0, 0, 1], [0, 0, 0]] · CORRECTA
- B) [[1, 2, 3], [0, 0, 1], [0, 0, 0]] · te detienes en forma escalón sin reducir
- C) [[1, 0, 0], [0, 0, 1], [0, 0, 0]] · eliminas una columna pivote válida incorrectamente
- D) No tiene forma escalón reducida · crees que matrices con filas de ceros no pueden reducirse

### P6 · dificultad 2
¿Cuántas soluciones tiene el sistema representado por [[1, 0, 2], [0, 1, -1], [0, 0, 0]]?

- A) Infinitas soluciones (x = 2 - 2t, y = -1 + t, z = t) · CORRECTA
- B) Única solución: x = 2, y = -1, z = 0 · no reconoces que z es variable libre
- C) Sin solución · confundes una fila de ceros con inconsistencia
- D) Dos soluciones · cuentas mal las variables libres

## determinantes · Determinantes e inversas

Errores que vale la pena cazar: equivocar el signo del cofactor, creer que el determinante de una suma es la suma de determinantes, y concluir que una matriz con determinante cero tiene inversa.

### P7 · dificultad 2
Calcula el determinante de la matriz A = [[2, 1], [3, 4]].

- A) 5 · CORRECTA
- B) -5 · te equivocas en el signo del cofactor
- C) 11 · sumas las diagonales en lugar de restar (det = ad - bc)
- D) 20 · multiplicas todos los elementos creyendo que eso es el determinante

### P8 · dificultad 2
Si det(A) = 3 y det(B) = 2, ¿cuál es det(A + B)?

- A) No se puede determinar sin conocer A y B · CORRECTA
- B) 5 · crees que det(A + B) = det(A) + det(B)
- C) 6 · confundes la suma con el producto de matrices
- D) 1 · restas los determinantes incorrectamente

### P9 · dificultad 2
La matriz C = [[1, 2], [2, 4]] tiene determinante cero. ¿Qué puedes concluir?

- A) C no tiene inversa · CORRECTA
- B) C tiene inversa igual a [[4, -2], [-2, 1]] · crees que det = 0 no impide inversión
- C) C es la matriz identidad · confundes determinante cero con propiedades de la identidad
- D) Las filas de C son perpendiculares · confundes dependencia lineal con perpendicularidad

## espacios · Espacios vectoriales e independencia lineal

Errores que vale la pena cazar: confundir generar con ser linealmente independiente, olvidar que un subespacio tiene que contener el vector cero, y contar mal la dimensión al no verificar que la base sea independiente.

### P10 · dificultad 2
¿El conjunto {(1, 0), (0, 1), (1, 1)} forma una base de ℝ²?

- A) No, porque tiene más de 2 vectores (no es linealmente independiente) · CORRECTA
- B) Sí, porque genera ℝ² · confundes generar el espacio con ser base
- C) Sí, es una base válida · olvidas verificar independencia lineal
- D) No, porque no contiene el vector cero · crees que una base debe contener el vector cero

### P11 · dificultad 2
Sea S = {(x, y) : 2x + 3y = 0}. ¿S es un subespacio de ℝ²?

- A) Sí, contiene el origen y es cerrado bajo suma y multiplicación escalar · CORRECTA
- B) No, porque no contiene el vector (1, 1) · confundes no contener un vector específico con no ser subespacio
- C) No, porque la ecuación tiene constantes · olvidas verificar si el origen satisface la ecuación
- D) Sí, cualquier recta es un subespacio · generalizas incorrectamente sin verificar el origen

### P12 · dificultad 2
Si dim(V) = 3 y tenemos 4 vectores en V, ¿qué podemos concluir?

- A) Los 4 vectores son linealmente dependientes · CORRECTA
- B) Los 4 vectores forman una base de V · cuentas mal la dimensión olvidando que una base debe ser independiente
- C) Exactamente 3 de los 4 vectores son independientes · asumes sin verificar cuáles son independientes
- D) Los vectores no pertenecen a V · confundes dependencia lineal con pertenencia al espacio
