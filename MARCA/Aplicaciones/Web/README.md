# Web

Incluye la landing, la autenticación, la aplicación web y futuras propiedades web de AiDEN.

## Piezas

| Elemento | Pieza | Archivo |
| --- | --- | --- |
| Cabecera y pie | Logotipo a color (A) | `src/assets/marca/aiden-logotipo.png` (master: `a-logotipo-color.svg`) |
| Isotipo de la interfaz | Isotipo a color (A) | `src/assets/marca/aiden-isotipo.png` |
| Favicon | Favicon claro (B) | `public/favicon.ico`, `favicon-96x96.png` |
| Ícono iOS | Favicon claro sobre placa | `public/apple-touch-icon.png` (180 px) |
| App instalable (PWA) | Favicon claro | `public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `site.webmanifest` |
| Vista previa de enlaces | Logo a color sobre Paper | `public/marca/og-image.png` (1200 × 630) |

Copia de trabajo del set de favicon en `Identidad visual/Logo/favicon/` y de la imagen Open Graph en `archivos/`.

## Metadatos (`index.html`)

- `og:image` apunta a `og-image.png` con `og:image:width` y `og:image:height`, y `twitter:card` es `summary_large_image`.
- `theme-color` `#0d3826`.
- Título: «AiDEN | Gestión para viveros».

## Reglas

- La marca en la web es siempre a color.
- En fondos oscuros, isotipo sobre placa clara (ver `Identidad visual/Logo/`).
- Cualquier cambio de assets se verifica en el navegador a 375, 768 y 1440 px, en modo claro y oscuro (ver `CLAUDE.md`).
