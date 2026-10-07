// jsdom is a dependency (the vitest environment) without its @types package. The cover kit
// (`kit.ts`) uses only the constructor and the window.
declare module 'jsdom' {
    export class JSDOM {
        constructor(html?: string, options?: { contentType?: string });
        readonly window: Window & typeof globalThis;
    }
}
