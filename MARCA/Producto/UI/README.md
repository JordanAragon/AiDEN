# UI

| Lugar | Pieza de marca | Implementación |
| --- | --- | --- |
| Landing: cabecera y pie | Logotipo a color (A) | `LogotipoAiden` |
| Autenticación, panel oscuro | Isotipo a color (A) sobre placa clara + «AiDEN» en blanco | `IsotipoAiden placa` |
| Autenticación móvil y 404 | Logotipo a color (A) | `LogotipoAiden` |
| Barra lateral | Isotipo a color (A); placa clara en modo oscuro | `IsotipoAiden` + `aiden-isotipo-adaptable` |
| Pestaña del navegador, app instalada | Favicon claro (B) y sus íconos | `public/` + `site.webmanifest` |
| Enlaces compartidos | Imagen Open Graph (logo a color sobre Paper) | `public/marca/og-image.png` |

Los componentes están en `src/components/ui/MarcaAiden.jsx` y sus assets en `src/assets/marca/`. Reglas completas en `DESIGN.md`, sección *Brand*.

- Fondo de la app `#f5f7f5`; Paper y Cream en la landing y la autenticación.
- Modo oscuro obligatorio (`aiden-dark`): todo elemento de marca se verifica en los dos modos.
- La marca nunca se dibuja con íconos de Lucide.
