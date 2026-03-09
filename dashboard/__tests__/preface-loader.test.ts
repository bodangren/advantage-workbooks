import { describe, it, expect } from 'vitest';
import { getPrefaceByCefrLevel } from '@/lib/preface-loader';

describe('Preface Loader', () => {
  describe('getPrefaceByCefrLevel', () => {
    it('should return preface data for A1 level', () => {
      const result = getPrefaceByCefrLevel('A1');
      
      expect(result).toBeDefined();
      expect(result?.title).toContain('Origins');
      expect(result?.text).toBeDefined();
      expect(result?.text.length).toBeGreaterThan(100);
    });

    it('should return preface data for A2 level', () => {
      const result = getPrefaceByCefrLevel('A2');
      
      expect(result).toBeDefined();
      expect(result?.title).toContain('Quest');
    });

    it('should return preface data for B1 level', () => {
      const result = getPrefaceByCefrLevel('B1');
      
      expect(result).toBeDefined();
      expect(result?.title).toContain('Adventure');
    });

    it('should return preface data for B2 level', () => {
      const result = getPrefaceByCefrLevel('B2');
      
      expect(result).toBeDefined();
      expect(result?.title).toContain('Hero');
    });

    it('should return preface data for C1 level', () => {
      const result = getPrefaceByCefrLevel('C1');
      
      expect(result).toBeDefined();
      expect(result?.title).toContain('Legend');
    });

    it('should be case-insensitive for CEFR levels', () => {
      const lower = getPrefaceByCefrLevel('a1');
      const upper = getPrefaceByCefrLevel('A1');
      
      expect(lower).toEqual(upper);
    });

    it('should return null for unknown CEFR level', () => {
      const result = getPrefaceByCefrLevel('Z9');
      
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = getPrefaceByCefrLevel('');
      
      expect(result).toBeNull();
    });

    it('should return null for null/undefined', () => {
      expect(getPrefaceByCefrLevel(null as unknown as string)).toBeNull();
      expect(getPrefaceByCefrLevel(undefined as unknown as string)).toBeNull();
    });

    it('should handle Pre-A1 level by falling back to A1', () => {
      const result = getPrefaceByCefrLevel('Pre-A1');
      
      expect(result).toBeDefined();
      expect(result?.title).toContain('Origins');
    });

    it('should return preface data with valid text structure', () => {
      const result = getPrefaceByCefrLevel('A1');
      
      expect(result?.text).toContain('\n\n');
      expect(result?.text).toContain('workbook');
    });
  });
});
