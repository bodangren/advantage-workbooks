(function (global, factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        // Node.js
        module.exports = factory();
    } else {
        // Browser
        global.WorkbookCompiler = factory();
    }
})(typeof self !== "undefined" ? self : this, function () {

    /**
     * Generates a QR code SVG data URL.
     * @param {string} url - The URL to encode.
     * @param {function} qrcodeLib - The qrcode-generator function (e.g. window.qrcode or require('qrcode-generator')).
     * @returns {string|null} - The data URL or null if failed.
     */
    function generateQRCode(url, qrcodeLib) {
        if (!url || !qrcodeLib) return null;
        try {
            // Error correction level: M=15%
            const typeNumber = 0; // Auto-detect size
            const errorCorrectionLevel = 'M';
            const qr = qrcodeLib(typeNumber, errorCorrectionLevel);
            qr.addData(url);
            qr.make();

            // Generate SVG with proper scaling for print
            const cellSize = 10; // pixels per module
            const margin = 1; // quiet zone
            const size = qr.getModuleCount();
            const totalSize = (size + margin * 2) * cellSize;

            let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}">`;
            svg += `<rect width="100%" height="100%" fill="#ffffff"/>`;
            svg += `<g transform="translate(${margin * cellSize}, ${margin * cellSize})">`;

            for (let row = 0; row < size; row++) {
                for (let col = 0; col < size; col++) {
                    if (qr.isDark(row, col)) {
                        svg += `<rect x="${col * cellSize}" y="${row * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000000"/>`;
                    }
                }
            }

            svg += '</g></svg>';

            // Convert SVG to data URL
            // In Node, btoa/unescape might not be available globally same as browser, 
            // but for simplicity we'll assume a polyfill or environment support, 
            // or use Buffer in Node. 
            // However, to keep this "universal" without complex checks, let's try a simple approach.
            
            const svgString = unescape(encodeURIComponent(svg));
            let b64;
            if (typeof btoa === 'function') {
                b64 = btoa(svgString);
            } else if (typeof Buffer !== 'undefined') {
                 b64 = Buffer.from(svgString).toString('base64');
            } else {
                return null; // Cannot encode
            }

            return 'data:image/svg+xml;base64,' + b64;
        } catch (error) {
            console.error('QR code generation failed:', error);
            return null;
        }
    }

    /**
     * Processes raw lesson objects and injects metadata.
     * @param {Array<Object>} lessons - Array of lesson objects (parsed JSON).
     * @param {Object} imgMap - Map of filename (base) -> data URL.
     * @param {Object} filenames - Array of filenames corresponding to lessons (for matching images).
     * @param {string} seriesName 
     * @param {string} seriesTagline 
     * @param {string} seriesLevel 
     * @param {function} qrcodeLib 
     * @returns {Array<Object>} - Processed lessons.
     */
    function processLessons(lessons, imgMap, filenames, seriesName, seriesTagline, seriesLevel, qrcodeLib) {
        return lessons.map((json, i) => {
            const fileBaseName = filenames[i]; // Expect filenames to be passed to match images
            
            // Clone to avoid mutating original if needed, though usually fine here
            const lesson = JSON.parse(JSON.stringify(json));

            // FORCE SEQUENTIAL NUMBERING
            lesson.lesson_number = `Lesson ${i + 1}`;

            // INJECT METADATA
            lesson.series_name = seriesName;
            lesson.series_level = seriesLevel;
            lesson.series_tagline = seriesTagline;

            // INJECT QR CODE
            // Priority 1: Manual QR image (if provided)
            if (imgMap && imgMap[fileBaseName]) {
                lesson.qr_code_url = imgMap[fileBaseName];
            }
            // Priority 2: Auto-generate from article_url
            else if (lesson.article_url) {
                const qrDataUrl = generateQRCode(lesson.article_url, qrcodeLib);
                if (qrDataUrl) {
                    lesson.qr_code_url = qrDataUrl;
                }
            }
            
            return lesson;
        });
    }

    /**
     * Compiles the final HTML string.
     * @param {Array<Object>} lessons - Processed lesson objects.
     * @param {string} templateHtml - The raw HTML template string.
     * @param {Object} prefaceData - The preface data object.
     * @param {string} seriesName 
     * @param {string} seriesTagline 
     * @param {string} levelKey 
     * @param {Object} handlebarsLib - The Handlebars object.
     * @param {Object} domParser - Optional DOMParser instance (for Node support).
     * @returns {string} - The final HTML document.
     */
    function compileWorkbook(lessons, templateHtml, prefaceData, seriesName, seriesTagline, levelKey, handlebarsLib, domParser) {
        // 1. Extract Styles from Template
        // In Browser: use native DOMParser
        // In Node: might need a mock or JSDOM, but we can try regex if we want to avoid JSDOM dep here.
        // Let's rely on the passed domParser if available, or basic regex fallback for styles.
        
        let styles = "";
        let links = "";
        let bodyTemplate = "";

        // Helper to strip tags
        const getInnerHtml = (html) => {
             const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
             return match ? match[1] : html;
        };

        if (domParser) {
            const doc = domParser.parseFromString(templateHtml, 'text/html');
            styles = Array.from(doc.querySelectorAll('style')).map(s => s.textContent).join('\n');
            links = Array.from(doc.querySelectorAll('link')).map(l => l.outerHTML).join('\n');
            // Use regex for body to preserve Handlebars syntax that DOMParser might mangle in tables
            bodyTemplate = getInnerHtml(templateHtml);
        } else {
            // Regex Fallback (mostly for Node without JSDOM)
            const styleMatches = templateHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
            styles = styleMatches.map(s => s.replace(/<\/?style[^>]*>/gi, '')).join('\n');
            
            const linkMatches = templateHtml.match(/<link[^>]*>/gi) || [];
            links = linkMatches.join('\n');

            bodyTemplate = getInnerHtml(templateHtml);
        }

        // Clean CSS
        styles = styles
            .replace(/\.workbook-container\s*{[^}]*}/g, '')
            .replace(/@page\s*{[^}]*}/g, '')
            .replace(/body\s*{[^}]*}/g, 'body { font-family: "Open Sans", sans-serif; }');

        // 2. Compile Handlebars
        const hbTemplate = handlebarsLib.compile(bodyTemplate);

        let lessonsHtml = "";
        let tocItems = "";

        lessons.forEach((lesson, index) => {
            const lessonId = `lesson-${index}`;

            // Generate Lesson Content
            let content = hbTemplate(lesson);

            // Unwrap .workbook-container if present (simple regex replace)
            // We want the inner content of <div class="workbook-container">...</div>
            // This regex is naive but likely sufficient for the specific template structure
            const containerMatch = content.match(/<div class="workbook-container">([\s\S]*)<\/div>/);
            if (containerMatch) {
                // Check if it's the outer wrapper. If the template has it.
                // A safer way without DOM is tricky.
                // Let's assume the user template matches the standard format.
                // If specific start/end tags exist, remove them.
                 content = content.replace(/<div class="workbook-container"[^>]*>/, '').replace(/<\/div>\s*$/, '');
            }

            lessonsHtml += `<div id="${lessonId}" class="lesson-section">${content}</div>`;

            // Generate TOC Item
            tocItems += `
                <li class="toc-item">
                    <a href="#${lessonId}">
                        <span class="toc-text">${lesson.lesson_number}: ${lesson.lesson_title}</span>
                        <span class="toc-meta">(${lesson.genre} / ${lesson.article_type})</span>
                    </a>
                </li>
            `;
        });

        // 3. Preface
        const prefaceText = (prefaceData && prefaceData.text) ? prefaceData.text : "";
        const formattedPreface = prefaceText.split('\n\n')
            .map(p => `<p>${p}</p>`)
            .join('');

        // 4. Final Assembly
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Reading Advantage Workbook - ${seriesName}</title>
    <script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"><\/script>
    ${links}
    <style>
        ${styles}

        /* --- Paged.js Configuration ---
        @page {
            size: 210mm 285mm;
            margin: 20mm;
            
            @bottom-center {
                content: "Page " counter(page);
                font-family: 'Open Sans', sans-serif;
                font-size: 10pt;
            }
        }

        @page:first {
            margin: 0;
            @bottom-center { content: none; }
        }
        
        body {
            background-color: #555;
            margin: 0;
            padding: 0; 
        }
        .pagedjs_pages {
            display: flex;
            width: calc(var(--pagedjs-width) * 2);
            min-width: 200%;
            flex-direction: column;
            align-items: center;
            margin: 0 auto;
            padding: 20px 0;
        }
        .pagedjs_page {
            background: white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            margin-bottom: 20px;
        }

        @media print {
            body { 
                background: white; 
                width: 100%;
                margin: 0;
                padding: 0;
            }
            .pagedjs_pages {
                display: block !important;
                width: 100% !important;
                min-width: 0 !important;
                transform: none !important;
            }
            .pagedjs_page {
                margin: 0 !important;
                box-shadow: none !important;
                page-break-after: always;
            }
            .pagedjs_margin-bottom-center {
                transform: translateY(-6mm) !important;
            }
        }

        /* --- Title Page ---
        .title-page {
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            break-after: page;
            background: white;
            color: black;
            padding: 40px;
            box-sizing: border-box;
        }
        .tp-main-title { 
            font-size: 24pt; 
            margin-bottom: 20px; 
            font-weight: normal; 
            font-family: 'Merriweather', serif;
        }
        .tp-series-title { 
            font-size: 48pt; 
            font-weight: bold; 
            margin-bottom: 10px; 
            text-transform: uppercase; 
            font-family: 'Open Sans', sans-serif;
            color: #1e40af;
        }
        .tp-level-info { 
            font-size: 18pt; 
            margin-bottom: 50px; 
            color: #555;
        }
        .tp-tagline { 
            font-size: 16pt; 
            font-style: italic; 
            margin-top: auto; 
            margin-bottom: 80px; 
        }
        .tp-publisher { 
            font-size: 10pt; 
            margin-bottom: 40px; 
            color: #888;
        }

        /* --- Sections ---
        .section-preface, .section-toc {
            break-after: page;
            padding-top: 40px; 
            font-family: 'Open Sans', sans-serif;
        }
        
        .section-header {
            font-size: 24pt;
            border-bottom: 2px solid #1e40af;
            color: #1e40af;
            padding-bottom: 10px;
            margin-bottom: 30px;
            text-align: left;
        }

        .preface-content {
            font-size: 12pt;
            line-height: 1.6;
            text-align: left;
        }

        ul.toc-list {
            list-style: none;
            padding: 0;
        }
        
        li.toc-item {
            margin-bottom: 12px;
        }
        
        li.toc-item a {
            text-decoration: none;
            color: inherit;
            display: flex;
            align-items: baseline;
        }
        
        li.toc-item a::after {
            content: target-counter(attr(href), page);
            float: right;
            font-weight: bold;
            margin-left: 10px;
        }
        
        li.toc-item a .toc-text { font-weight: bold; }
        
        li.toc-item a .toc-meta {
            font-size: 0.9em;
            color: #666;
            margin-left: 10px;
            font-style: italic;
            flex-grow: 1;
            border-bottom: 1px dotted #ccc;
            margin-right: 5px;
        }

        .lesson-section {
            break-after: page;
        }
        
        .lesson-section > *:last-child {
            margin-bottom: 0 !important;
        }
        
        .lesson-header { margin-top: 0; }
        
        .question-box, .practice-box, .vocab-table tr {
            break-inside: avoid;
        }
    </style>
</head>
<body>
    <div class="title-page">
        <h1 class="tp-main-title">Reading Advantage</h1>
        <h2 class="tp-series-title">${seriesName}</h2>
        <div class="tp-level-info">Level ${levelKey}</div>
        <div class="tp-tagline">${seriesTagline}</div>
        <div class="tp-publisher">Reading Advantage Series • 2025 Edition</div>
    </div>

    <div class="section-preface">
        <h2 class="section-header">Preface</h2>
        <div class="preface-content">
            ${formattedPreface}
        </div>
    </div>

    <div class="section-toc">
        <h2 class="section-header">Table of Contents</h2>
        <ul class="toc-list">
            ${tocItems}
        </ul>
    </div>

    ${lessonsHtml}
</body>
</html>`;
    }

    return {
        generateQRCode,
        processLessons,
        compileWorkbook
    };

});
