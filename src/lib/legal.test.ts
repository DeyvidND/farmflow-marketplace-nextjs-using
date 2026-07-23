import { describe, it, expect } from 'vitest';
import { legalIdLine } from './legal';

describe('legalIdLine', () => {
  it('prefers ЕИК over Рег. № when both are present', () => {
    expect(legalIdLine({ eik: '123', regNo: '456' })).toBe('ЕИК/БУЛСТАТ 123');
  });

  it('falls back to Рег. № зем. производител when no ЕИК is on file', () => {
    expect(legalIdLine({ regNo: '456' })).toBe('Рег. № зем. производител 456');
  });

  it('appends ДДС № and address when present', () => {
    expect(legalIdLine({ eik: '123', vatNumber: 'BG123', address: 'с. Труд' })).toBe(
      'ЕИК/БУЛСТАТ 123 · ДДС № BG123 · с. Труд',
    );
  });

  it('returns an empty string when nothing is set', () => {
    expect(legalIdLine({})).toBe('');
  });

  it('omits ДДС № when absent but keeps address', () => {
    expect(legalIdLine({ eik: '123', address: 'гр. Пловдив' })).toBe('ЕИК/БУЛСТАТ 123 · гр. Пловдив');
  });
});
