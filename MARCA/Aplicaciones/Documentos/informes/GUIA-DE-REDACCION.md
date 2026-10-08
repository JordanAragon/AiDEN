# Guía de redacción de informes AiDEN

Un informe de AiDEN se entiende en la primera lectura. Quien lo abre sabe en un minuto qué pasa, qué tan grave es y qué hay que hacer.

## Cinco reglas

1. **La conclusión primero.** La portada y el primer párrafo de cada sección dicen el resultado, no el tema. «El frontend tiene los 9 módulos funcionando; faltan 4 arreglos para cerrarlo», no «Análisis del estado del frontend».
2. **Una idea por bloque.** Si un párrafo necesita «además» dos veces, son dos bloques.
3. **Cifras con unidad y fuente.** «16 fallos de contraste en 11 pantallas (axe, 2026-10-05)», no «varios problemas de accesibilidad».
4. **Palabras de todos los días.** Como se lo explicarías a alguien del vivero: «la prueba falla porque busca un botón que ya no está», no «se evidencia una discrepancia en la suite de validación».
5. **Decir lo que no se sabe.** Si algo no se verificó, se dice y se dice cómo verificarlo. Nunca se rellena.

## Estructura de un informe

| Parte | Qué lleva |
| --- | --- |
| Portada | Título que dice la conclusión, una frase de resumen y 3–4 cifras clave. |
| Sección 1 | La respuesta corta: qué hay, qué falta, qué se recomienda. |
| Secciones siguientes | El detalle, de lo más importante a lo menos. |
| Penúltima | Qué hacer, en orden, con responsable y tamaño. |
| Final | Fuentes y método: de dónde sale cada dato. |

Títulos de sección: frases que se entienden solas («Lo que falta para cerrar el frontend»), no etiquetas («Hallazgos»).

## Frases que no se usan

Suenan a texto de relleno o de IA y no dicen nada. Se borran o se cambian por el dato concreto.

| No | En su lugar |
| --- | --- |
| «En el dinámico mundo de…», «En la era digital…» | Empezar por el dato. |
| «Es importante destacar que…», «Cabe resaltar…», «Vale la pena mencionar…» | Decirlo directamente. |
| «En resumen», «En conclusión», «Para finalizar» | El resumen va al inicio. |
| «Robusto», «integral», «holístico», «de vanguardia», «innovador», «sin precedentes» | El adjetivo concreto o la cifra. |
| «Potenciar», «optimizar» (sin decir qué y cuánto), «aprovechar al máximo», «sinergia», «impulsar» | El verbo real: reducir, corregir, agregar, quitar. |
| «Solución», «ecosistema», «experiencia» usados como relleno | Nombrar la cosa: módulo, pantalla, botón. |
| «No solo… sino también…» | Dos frases. |
| «Un viaje», «un camino», «dar un paso más allá» | Lo que se hace, en una línea. |
| «Esto permite…», «Esto garantiza…» sin decir a quién y qué | Sujeto y resultado concretos. |
| Preguntas retóricas («¿Qué significa esto?») | La respuesta, sin la pregunta. |
| Exclamaciones y emojis | Nada. |

## Antes y después

> **Antes:** Es importante destacar que el sistema presenta una solución robusta que potencia la gestión integral de los viveros, aunque existen oportunidades de mejora en materia de accesibilidad.
>
> **Después:** Los 9 módulos funcionan. Hay 16 textos con poco contraste en 11 pantallas: se corrigen cambiando el color de esos textos.

> **Antes:** Se recomienda abordar de manera prioritaria la optimización del pipeline de pruebas.
>
> **Después:** Las pruebas automáticas fallan desde antes de esta revisión porque buscan el campo «Contraseña» de una forma que hoy encuentra dos elementos. Arreglarlo es cambiar una línea.

## Estados

En tablas y listas se usa siempre la misma escala, con chip de color:

| Chip | Significa |
| --- | --- |
| `[[ok:Listo]]` | Funciona y está verificado. |
| `[[alerta:Parcial]]` | Funciona con limitaciones conocidas. |
| `[[critico:Falta]]` | No existe o está roto; bloquea el cierre. |
| `[[info:Decisión]]` | Depende de una decisión de David, no de trabajo técnico. |
| `[[neutro:Fuera de alcance]]` | No corresponde a este informe. |

## Revisión antes de entregar

- [ ] ¿La portada dice la conclusión?
- [ ] ¿Cada cifra tiene unidad, fecha o fuente?
- [ ] ¿Hay alguna frase de la lista de «No»? Buscar y quitar.
- [ ] ¿Se entiende sin haber visto el código ni la conversación?
- [ ] ¿Está claro qué es dato verificado y qué es opinión o recomendación?
- [ ] ¿Las acciones tienen orden, responsable y tamaño?
