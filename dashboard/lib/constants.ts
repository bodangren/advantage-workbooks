export interface WorkbookLevelOption {
  value: string;
  series: string;
  cefr: string;
  label: string;
}

export const SECONDARY_LEVELS: WorkbookLevelOption[] = [
  { value: '1', series: 'Origins', cefr: 'A1', label: '1 - Origins' },
  { value: '2', series: 'Origins', cefr: 'A1', label: '2 - Origins' },
  { value: '3.1', series: 'Origins', cefr: 'A1', label: '3.1 - Origins' },
  { value: '3.2', series: 'Origins', cefr: 'A1', label: '3.2 - Origins' },
  { value: '4', series: 'Quest', cefr: 'A2', label: '4 - Quest' },
  { value: '5', series: 'Quest', cefr: 'A2', label: '5 - Quest' },
  { value: '6.1', series: 'Quest', cefr: 'A2', label: '6.1 - Quest' },
  { value: '6.2', series: 'Quest', cefr: 'A2', label: '6.2 - Quest' },
  { value: '7.1', series: 'Adventure', cefr: 'B1', label: '7.1 - Adventure' },
  { value: '7.2', series: 'Adventure', cefr: 'B1', label: '7.2 - Adventure' },
  { value: '8.1', series: 'Adventure', cefr: 'B1', label: '8.1 - Adventure' },
  { value: '8.2', series: 'Adventure', cefr: 'B1', label: '8.2 - Adventure' },
  { value: '8.3', series: 'Adventure', cefr: 'B1', label: '8.3 - Adventure' },
  { value: '9.1', series: 'Adventure', cefr: 'B1', label: '9.1 - Adventure' },
  { value: '9.2', series: 'Adventure', cefr: 'B1', label: '9.2 - Adventure' },
  { value: '9.3', series: 'Adventure', cefr: 'B1', label: '9.3 - Adventure' },
  { value: '10.1', series: 'Hero', cefr: 'B2', label: '10.1 - Hero' },
  { value: '10.2', series: 'Hero', cefr: 'B2', label: '10.2 - Hero' },
  { value: '11.1', series: 'Hero', cefr: 'B2', label: '11.1 - Hero' },
  { value: '11.2', series: 'Hero', cefr: 'B2', label: '11.2 - Hero' },
  { value: '11.3', series: 'Hero', cefr: 'B2', label: '11.3 - Hero' },
  { value: '12.1', series: 'Hero', cefr: 'B2', label: '12.1 - Hero' },
  { value: '12.2', series: 'Hero', cefr: 'B2', label: '12.2 - Hero' },
  { value: '12.3', series: 'Hero', cefr: 'B2', label: '12.3 - Hero' },
  { value: '13.1', series: 'Legend', cefr: 'C1', label: '13.1 - Legend' },
  { value: '13.2', series: 'Legend', cefr: 'C1', label: '13.2 - Legend' },
  { value: '14.1', series: 'Legend', cefr: 'C1', label: '14.1 - Legend' },
  { value: '14.2', series: 'Legend', cefr: 'C1', label: '14.2 - Legend' },
  { value: '14.3', series: 'Legend', cefr: 'C1', label: '14.3 - Legend' },
  { value: '15.1', series: 'Legend', cefr: 'C1', label: '15.1 - Legend' },
  { value: '15.2', series: 'Legend', cefr: 'C1', label: '15.2 - Legend' },
  { value: '15.3', series: 'Legend', cefr: 'C1', label: '15.3 - Legend' },
];

export const PRIMARY_LEVELS: WorkbookLevelOption[] = [
  { value: '1.0', series: 'Adventures', cefr: 'A1', label: '1.0 - Adventures' },
  { value: '1.1', series: 'Phonics', cefr: 'Pre-A1', label: '1.1 - Phonics' },
  { value: '1.2', series: 'Phonics', cefr: 'Pre-A1', label: '1.2 - Phonics' },
  { value: '2.1', series: 'Starters', cefr: 'Pre-A1', label: '2.1 - Starters' },
  { value: '2.2', series: 'Starters', cefr: 'Pre-A1', label: '2.2 - Starters' },
  { value: '3.1', series: 'Movers', cefr: 'A1', label: '3.1 - Movers' },
  { value: '3.2', series: 'Movers', cefr: 'A1', label: '3.2 - Movers' },
  { value: '4.1', series: 'Flyers', cefr: 'A2', label: '4.1 - Flyers' },
  { value: '4.2', series: 'Flyers', cefr: 'A2', label: '4.2 - Flyers' },
];

export interface WorkbookLevelMetadata {
  seriesName: string;
  levelNumber: string;
  cefrLevel: string;
}

export function getWorkbookLevelOptions(type: 'primary' | 'secondary'): WorkbookLevelOption[] {
  return type === 'primary' ? PRIMARY_LEVELS : SECONDARY_LEVELS;
}

export function ensureMetadataLevelOption(
  options: WorkbookLevelOption[],
  metadata?: WorkbookLevelMetadata | null
): WorkbookLevelOption[] {
  if (!metadata) return options;

  const hasExistingOption = options.some(option => option.value === metadata.levelNumber);
  if (hasExistingOption) return options;

  return [
    {
      value: metadata.levelNumber,
      series: metadata.seriesName,
      cefr: metadata.cefrLevel,
      label: `${metadata.levelNumber} - ${metadata.seriesName}`,
    },
    ...options,
  ];
}
