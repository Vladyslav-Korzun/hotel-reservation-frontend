/**
 * Formats an international phone number for display while preserving E.164 limits.
 * Examples:
 *   "+421987654321" -> "+421 987 654 321"
 *   "421 987 654 321" -> "+421 987 654 321"
 *   "00421987654321" -> "+421 987 654 321"
 */
export function formatInternationalPhone(value: string, maxDigits = 15): string {
  const raw = value ?? '';
  const trimmed = raw.trimStart();
  const digitsSource = trimmed.startsWith('00') ? trimmed.slice(2) : trimmed;
  const digits = digitsSource.replace(/\D/g, '').slice(0, maxDigits);
  const grouped = digits.match(/.{1,3}/g)?.join(' ') ?? '';

  return digits ? `+${grouped}` : trimmed.startsWith('+') ? '+' : '';
}
