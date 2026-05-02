/**
 * Calling codes used by our phone UI — sorted longest-first so `+1` does not
 * consume the first digit of a NANP number (e.g. `+11235556767` must split as
 * `+1` + `1235556767`, not `+112` + `35556767`).
 */
const UNIQUE_PREFIXES: readonly string[] = [
  '+971',
  '+966',
  '+65',
  '+86',
  '+82',
  '+81',
  '+61',
  '+55',
  '+52',
  '+49',
  '+46',
  '+44',
  '+39',
  '+34',
  '+33',
  '+31',
  '+91',
  '+7',
  '+1',
].sort((a, b) => b.length - a.length);

export type SplitInternationalPhone = {
  phoneCode: string;
  phoneNumber: string;
};

/**
 * Split an E.164 or stored concatenated phone into country prefix (with +) and
 * national digits only.
 */
export function splitInternationalPhone(raw: string): SplitInternationalPhone {
  const normalized = raw.trim();
  if (!normalized) return { phoneCode: '+1', phoneNumber: '' };

  const digitsOnly = (s: string) => s.replace(/\D/g, '');

  if (!normalized.startsWith('+')) {
    return { phoneCode: '+1', phoneNumber: digitsOnly(normalized) };
  }

  for (const prefix of UNIQUE_PREFIXES) {
    if (normalized.startsWith(prefix)) {
      return {
        phoneCode: prefix,
        phoneNumber: digitsOnly(normalized.slice(prefix.length)),
      };
    }
  }

  const fallback = normalized.match(/^\+(\d{1,3})([\s\d]*)$/);
  if (fallback) {
    return {
      phoneCode: `+${fallback[1]}`,
      phoneNumber: digitsOnly(fallback[2] ?? ''),
    };
  }

  return { phoneCode: '+1', phoneNumber: digitsOnly(normalized) };
}
