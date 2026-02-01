const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const qrcode = require('qrcode-generator');
const Compiler = require('../compiler_logic.js');

describe('Workbook Compiler Logic', () => {

    describe('generateQRCode', () => {
        test('should generate a data URL for a valid string', () => {
            const url = 'https://example.com';
            const result = Compiler.generateQRCode(url, qrcode);
            expect(result).not.toBeNull();
            expect(result.startsWith('data:image/svg+xml;base64,')).toBe(true);
        });

        test('should return null for empty input', () => {
            const result = Compiler.generateQRCode('', qrcode);
            expect(result).toBeNull();
        });
    });

    describe('processLessons', () => {
        test('should inject metadata and lesson numbers', () => {
            const rawLessons = [
                { lesson_title: 'Lesson A', article_url: 'https://a.com' },
                { lesson_title: 'Lesson B' }
            ];
            const filenames = ['file1', 'file2'];
            const imgMap = { 'file1': 'data:image/png;base64,fake' };

            const processed = Compiler.processLessons(
                rawLessons,
                imgMap,
                filenames,
                'Series Name',
                'Tagline',
                'A1',
                qrcode
            );

            expect(processed).toHaveLength(2);
            
            // Check Metadata
            expect(processed[0].lesson_number).toBe('Lesson 1');
            expect(processed[1].lesson_number).toBe('Lesson 2');
            expect(processed[0].series_name).toBe('Series Name');
            expect(processed[0].series_level).toBe('A1');

            // Check QR Codes
            // Lesson 1 has manual image in imgMap
            expect(processed[0].qr_code_url).toBe('data:image/png;base64,fake');
            
            // Lesson 2 has no URL and no image -> undefined qr_code_url
            expect(processed[1].qr_code_url).toBeUndefined();
        });

        test('should auto-generate QR code if no manual image provided', () => {
            const rawLessons = [{ lesson_title: 'Lesson A', article_url: 'https://example.com' }];
            const filenames = ['file1'];
            const imgMap = {};

            const processed = Compiler.processLessons(
                rawLessons,
                imgMap,
                filenames,
                'Series',
                'Tag',
                'A1',
                qrcode
            );

            expect(processed[0].qr_code_url).toMatch(/^data:image\/svg\+xml/);
        });
    });

    describe('compileWorkbook', () => {
        const mockTemplate = `
<html>
<head>
    <style>
        body { color: red; }
        h1 { font-size: 20px; }
    </style>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="workbook-container">
        <h1>{{lesson_title}}</h1>
        <p>{{series_name}}</p>
    </div>
</body>
</html>
        `;

        const lessons = [
            { lesson_number: 'Lesson 1', lesson_title: 'Test Lesson', series_name: 'Test Series', genre: 'Fiction', article_type: 'Story' }
        ];

        const preface = { text: "Hello\n\nWorld" };

        test('should generate final HTML with preface and TOC', () => {
            const html = Compiler.compileWorkbook(
                lessons,
                mockTemplate,
                preface,
                'Test Series',
                'The Best',
                'B2',
                Handlebars,
                null // No DOMParser in Node (uses regex fallback)
            );

            // Check Title Page
            expect(html).toContain('<h2 class="tp-series-title">Test Series</h2>');
            expect(html).toContain('Level B2');

            // Check Preface
            expect(html).toContain('<p>Hello</p><p>World</p>');

            // Check TOC
            expect(html).toContain('Lesson 1: Test Lesson');
            expect(html).toContain('(Fiction / Story)');

            // Check Lesson Content (Handlebars compiled)
            expect(html).toContain('<h1>Test Lesson</h1>');
            expect(html).toContain('<p>Test Series</p>');

            // Check Styles Extraction
            // "body { color: red; }" should be replaced by the default font
            expect(html).toContain('body { font-family: "Open Sans", sans-serif; }');
            // "h1 { font-size: 20px; }" should be preserved
            expect(html).toContain('h1 { font-size: 20px; }');
        });
    });

});
