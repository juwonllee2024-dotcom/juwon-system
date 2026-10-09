export interface AgeInput {
  birthYear: number;
  isAtLeast13: boolean;
}

export type AgeBand = 'UNDER_13' | 'TEEN' | 'OUT_OF_SCOPE';

export function classifyAge(input: AgeInput, currentYear: number): AgeBand {
  const maximumAge = currentYear - input.birthYear;
  if (maximumAge < 13 || (maximumAge === 13 && !input.isAtLeast13)) return 'UNDER_13';
  if (maximumAge > 17) return 'OUT_OF_SCOPE';
  return 'TEEN';
}
