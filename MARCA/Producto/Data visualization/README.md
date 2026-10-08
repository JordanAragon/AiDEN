# Data visualization

Las gráficas toman sus colores de `src/hooks/useColoresGrafica.js`, que cambia con el modo oscuro.

| Serie | Claro | Oscuro |
| --- | --- | --- |
| Principal | `#176b45` | `#3fae74` |
| Secundaria | `#2f9d65` | `#68d391` |
| Advertencia | `#d97706` | `#f4c96b` |
| Crítica | `#dc2626` | `#f28b96` |
| Rejilla | `#e2e8f0` | `#26332d` |
| Ejes y etiquetas | `#64748b` | `#91a098` |

Reglas para Producción, Ambiental, Calidad, Costos y Reportes:

- Una serie principal en verde; las demás en neutros o en la secundaria. Ámbar y rojo solo para umbrales y alertas.
- Rangos aceptables como banda suave, no como líneas extra.
- Ejes con unidad y periodo; tooltips con valor, unidad y fecha.
- Sin gráficos 3D, sin tartas de más de cuatro partes.
- Cada gráfica tiene un título que dice la conclusión y una alternativa en texto o tabla para lectores de pantalla.
- En informes impresos: la misma lógica en escala de verdes (Forest, Moss, Verde 700) para que funcione en blanco y negro.
