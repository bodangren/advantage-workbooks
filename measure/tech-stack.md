# Technology Stack

## Core Technologies
- **JavaScript (ES6+):** Used for the workbook compiler logic and browser-based rendering.
- **Node.js:** Powers the development environment, dependency management (npm), and automated testing.
- **Python 3:** Used for server-side or CLI-based content validation scripts.

## Rendering & Templating
- **Handlebars.js:** The primary templating engine for merging JSON content into HTML structures.
- **Paged.js:** A polyfill for paginating content in the browser, enabling professional print layouts (headers, footers, page numbers).
- **HTML5 / CSS3:** Standard web technologies for visual presentation, utilizing `@page` rules for print optimization.

## Libraries & Utilities
- **qrcode-generator:** Used to dynamically generate QR codes from article URLs for inclusion in the workbook.
- **jsonschema (Python):** Validates content files against `schema.json`.
- **@google/generative-ai:** SDK for integrating Gemini models for content augmentation.

## Development & Testing
- **Vitest:** The primary framework for unit testing JavaScript/TypeScript logic.
- **JSDOM:** Provides a mock DOM environment for testing browser-based logic in Node.js.
- **Zod / JSON Schema:** Used for strict data modeling and schema definition of the workbook content.

## Data & Infrastructure
- **JSON:** The source of truth for all lesson content, metadata, and preface data.

## Print output (track print_ready_pdf_20261002)
- **Ghostscript (`gs`) and poppler (`pdfinfo`, `pdffonts`, `pdfimages`):** `dashboard/scripts/print/make-pdfx.ts` converts a Chrome PDF to PDF/X-1a:2001 (CMYK, Japan Color 2001 Coated output intent) and checks the result. System tools, not npm packages. The printer uses Adobe Acrobat 9 Pro.
- **Print fonts:** static font files only. Chrome writes variable fonts (what Google Fonts serves) as Type 3 fonts, which the printer cannot use.

## Book covers (track book_covers_20261007)
- **Cover pipeline:** `dashboard/lib/covers/` and `dashboard/scripts/covers/`. `extract-kit.ts` cuts the fixed layers (frame, badge, back panel) from Daniel's Canva SVG export with jsdom and Chrome; `make-cover.ts` puts the art, the kit layers, and the text together with sharp and Chrome. One opaque JPEG for each side keeps the PDF free of transparency; `--print` writes the PDF/X-1a file with `make-pdfx.ts --keep-fonts`.
- **Cover fonts:** League Spartan 700 (Latin) and Noto Sans Thai 400/700 (Thai), static Fontsource 5.3.0 files with their OFL files in `dashboard/assets/print-fonts/`. These are the faces in the Canva covers (measured by pixel overlap; Canva gives Thai the Noto fallback).
- **Cover art:** Muse (`meta/muse-image` through OpenRouter, key in `dashboard/.env.local`) with the cast and style pictures in `assets/cover-kit/refs/` as references. One wide picture for each book gives the back (left) and the front (right). mmx image-01 lost the cast faces and the painted style on covers.
