import path from 'path';

/**
 * Single-lesson print PDFs (Daniel, 2026-10-03): one A4 file for each lesson of a book, for
 * teachers and parents to print. scripts/print/make-lesson-pdfs.ts renders them.
 */

/**
 * The file name of a lesson PDF.
 * @param bookName The book name with its number ("Origins 3.2").
 * @param lessonNumber The lesson's place in the book.
 * @param title The lesson title.
 * @returns For example "Primary-Advantage-Origins-3.2-Lesson-05-At-the-Market.pdf".
 */
export function lessonPdfName(bookName: string, lessonNumber: number, title: string): string {
    const words = (s: string) => s.replace(/['’]/g, '').replace(/[^A-Za-z0-9.]+/g, '-').replace(/^-+|-+$/g, '');
    return `Primary-Advantage-${words(bookName)}-Lesson-${String(lessonNumber).padStart(2, '0')}-${words(title).replace(/\./g, '')}.pdf`;
}

/**
 * Points the pictures of a rendered document at local files, so Chrome does not wait on the network:
 * bucket pictures go to a cache folder (the caller downloads the missing ones), dashboard file-route
 * pictures (/api/files?root=content&path=..., also HTML-escaped) go to content/primary.
 * @param html The document.
 * @param cacheDir Folder for the bucket pictures.
 * @param contentDir The content/primary folder.
 * @returns The document and the bucket pictures to download.
 */
export function localPictures(html: string, cacheDir: string, contentDir: string): { html: string; downloads: { url: string; file: string }[] } {
    const downloads = new Map<string, string>();
    let out = html.replace(/https:\/\/storage\.googleapis\.com\/primary-app-storage\/images\/([A-Za-z0-9_.-]+)/g, (url, name: string) => {
        const file = path.join(cacheDir, name);
        downloads.set(url, file);
        return `file://${file}`;
    });
    out = out.replace(/\/api\/files\?root(?:=|&#x3D;)content(?:&amp;|&)path(?:=|&#x3D;)/g, `file://${contentDir}/`);
    return { html: out, downloads: [...downloads].map(([url, file]) => ({ url, file })) };
}
