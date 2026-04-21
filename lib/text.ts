const MOJIBAKE_PATTERN = /(Ã.|Â.|â.|ðŸ|�)/;

function mojibakeScore(value: string): number {
  const matches = value.match(/(Ã.|Â.|â.|ðŸ|�)/g);
  return matches ? matches.length : 0;
}

function decodeLatin1AsUtf8(value: string): string {
  const bytes = Uint8Array.from(Array.from(value), (char) => char.charCodeAt(0) & 0xff);
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export function looksMojibake(value: string | null | undefined): boolean {
  if (!value) return false;
  return MOJIBAKE_PATTERN.test(value);
}

export function normalizeMaybeMojibake(value: string | null | undefined): string {
  if (!value) return "";

  let current = value;
  for (let i = 0; i < 2; i += 1) {
    if (!looksMojibake(current)) break;
    const candidate = decodeLatin1AsUtf8(current);
    if (mojibakeScore(candidate) <= mojibakeScore(current)) {
      current = candidate;
    } else {
      break;
    }
  }

  return current.trim();
}

export function displayOrFallback(
  value: string | null | undefined,
  fallback = "Not provided"
): string {
  const normalized = normalizeMaybeMojibake(value);
  return normalized || fallback;
}

export function getDisplayInitial(name: string | null | undefined): string {
  const normalized = normalizeMaybeMojibake(name);
  const source = normalized.split(/\s+/).find(Boolean) || normalized;
  const firstChar = Array.from(source)[0];
  return firstChar ? firstChar.toLocaleUpperCase() : "?";
}

export function getMembershipMonths(membershipType: string | null | undefined): number {
  const normalized = normalizeMaybeMojibake(membershipType);
  const match = normalized.match(/(\d+)/);
  return match ? Math.max(1, parseInt(match[1], 10)) : 1;
}

export function addMonthsToIsoDate(dateString: string, months: number): string {
  const next = new Date(dateString);
  next.setHours(0, 0, 0, 0);
  next.setMonth(next.getMonth() + months);
  return next.toISOString().split("T")[0];
}
