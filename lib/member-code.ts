export function normalizeMembershipCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function getMembershipCodeLookupCandidates(value: string) {
  const normalized = normalizeMembershipCode(value);
  const candidates = new Set<string>();

  if (normalized) {
    candidates.add(normalized);
  }

  const digitsOnly = normalized.replace(/\D/g, "");
  if (digitsOnly.length === 4) {
    candidates.add(digitsOnly);
    candidates.add(`FIT-${digitsOnly}`);
    candidates.add(`FL-${digitsOnly}`);
  }

  return {
    normalized,
    digitsOnly,
    candidates: Array.from(candidates),
  };
}
