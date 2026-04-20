import { describe, expect, it } from 'vitest';
import {
  ensureMetadataLevelOption,
  getWorkbookLevelOptions,
  PRIMARY_LEVELS,
} from '@/lib/constants';

describe('workbook level constants', () => {
  it('includes Adventures 1.0 as a primary workbook option', () => {
    expect(PRIMARY_LEVELS).toContainEqual({
      value: '1.0',
      series: 'Adventures',
      cefr: 'A1',
      label: '1.0 - Adventures',
    });
  });

  it('returns primary options for primary projects', () => {
    const options = getWorkbookLevelOptions('primary');

    expect(options).toBe(PRIMARY_LEVELS);
  });

  it('preserves metadata levels that are not in the predefined catalogue', () => {
    const options = ensureMetadataLevelOption(PRIMARY_LEVELS, {
      seriesName: 'Custom Primary',
      levelNumber: '0.5',
      cefrLevel: 'Pre-A1',
    });

    expect(options[0]).toEqual({
      value: '0.5',
      series: 'Custom Primary',
      cefr: 'Pre-A1',
      label: '0.5 - Custom Primary',
    });
  });

  it('does not duplicate metadata levels already in the catalogue', () => {
    const options = ensureMetadataLevelOption(PRIMARY_LEVELS, {
      seriesName: 'Adventures',
      levelNumber: '1.0',
      cefrLevel: 'A1',
    });

    expect(options.filter(option => option.value === '1.0')).toHaveLength(1);
  });
});
