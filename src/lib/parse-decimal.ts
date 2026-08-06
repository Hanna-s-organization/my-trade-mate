export function parseDecimalInput(value: string) {
  const normalized = value.replace(/\s+/g, '').replace(/,/g, '.');
  return Number.parseFloat(normalized);
}
