import { describe, it, expect } from 'vitest';
import { generateQRCode, generateQRCodeDataURL } from '@/lib/qr-generator';

describe('QR Code Generator', () => {
  describe('generateQRCode', () => {
    it('should generate a valid SVG string from a URL', () => {
      const url = 'https://example.com/article/123';
      const svg = generateQRCode(url);
      
      expect(svg).toBeDefined();
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('should generate SVG with correct dimensions', () => {
      const url = 'https://example.com/article/123';
      const svg = generateQRCode(url);
      
      expect(svg).toMatch(/width="\d+"/);
      expect(svg).toMatch(/height="\d+"/);
    });

    it('should include crisp-edge rendering and a standard quiet zone', () => {
      const url = 'https://example.com/article/123';
      const svg = generateQRCode(url);

      expect(svg).toContain('shape-rendering="crispEdges"');
      expect(svg).toContain('transform="translate(40, 40)"');
    });

    it('should generate different QR codes for different URLs', () => {
      const url1 = 'https://example.com/article/1';
      const url2 = 'https://example.com/article/2';
      
      const svg1 = generateQRCode(url1);
      const svg2 = generateQRCode(url2);
      
      expect(svg1).not.toBe(svg2);
    });

    it('should generate same QR code for same URL', () => {
      const url = 'https://example.com/article/123';
      
      const svg1 = generateQRCode(url);
      const svg2 = generateQRCode(url);
      
      expect(svg1).toBe(svg2);
    });
  });

  describe('generateQRCodeDataURL', () => {
    it('should generate a valid data URL from a URL', () => {
      const url = 'https://example.com/article/123';
      const dataUrl = generateQRCodeDataURL(url);
      
      expect(dataUrl).toBeDefined();
      expect(dataUrl).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    it('should generate a decodable base64 string', () => {
      const url = 'https://example.com/article/123';
      const dataUrl = generateQRCodeDataURL(url);
      
      expect(dataUrl).toBeTruthy();
      const base64Part = dataUrl!.replace('data:image/svg+xml;base64,', '');
      const decoded = Buffer.from(base64Part, 'base64').toString('utf-8');
      
      expect(decoded).toContain('<svg');
    });
  });

  describe('edge cases', () => {
    it('should return null for null URL', () => {
      const result = generateQRCode(null as unknown as string);
      expect(result).toBeNull();
    });

    it('should return null for empty string URL', () => {
      const result = generateQRCode('');
      expect(result).toBeNull();
    });

    it('should return null for undefined URL', () => {
      const result = generateQRCode(undefined as unknown as string);
      expect(result).toBeNull();
    });

    it('should return null for whitespace-only URL', () => {
      const result = generateQRCode('   ');
      expect(result).toBeNull();
    });

    it('should handle very long URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(500);
      const svg = generateQRCode(longUrl);
      
      expect(svg).toBeDefined();
      expect(svg).toContain('<svg');
    });

    it('should handle URLs with special characters', () => {
      const specialUrl = 'https://example.com/article?foo=bar&baz=qux#section';
      const svg = generateQRCode(specialUrl);
      
      expect(svg).toBeDefined();
      expect(svg).toContain('<svg');
    });

    it('should handle Unicode URLs', () => {
      const unicodeUrl = 'https://example.com/文章/123';
      const svg = generateQRCode(unicodeUrl);
      
      expect(svg).toBeDefined();
      expect(svg).toContain('<svg');
    });
  });
});
