type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function leaderReceipts(receipt: UnknownRecord): UnknownRecord[] {
  const consensus = isRecord(receipt.consensus_data)
    ? receipt.consensus_data
    : isRecord(receipt.consensusData)
      ? receipt.consensusData
      : undefined;
  if (!consensus) return [];
  const raw = consensus.leader_receipt ?? consensus.leaderReceipt;
  if (Array.isArray(raw)) return raw.filter(isRecord);
  return isRecord(raw) ? [raw] : [];
}

function parseNumericReturnValue(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isSafeInteger(raw) && raw >= 0) return raw;
  if (typeof raw === "bigint" && raw >= BigInt(0) && raw <= BigInt(Number.MAX_SAFE_INTEGER)) return Number(raw);
  if (typeof raw === "string") {
    const value = raw.trim();
    if (/^0x[0-9a-fA-F]+$/.test(value) || /^\d+$/.test(value)) {
      try {
        const decoded = Number(BigInt(value));
        return Number.isSafeInteger(decoded) && decoded >= 0 ? decoded : null;
      } catch {
        return null;
      }
    }
    try {
      return parseNumericReturnValue(JSON.parse(value));
    } catch {
      return null;
    }
  }
  if (isRecord(raw)) {
    for (const key of ["readable", "payload", "assessment_id", "returnValue"] as const) {
      if (key in raw) {
        const decoded = parseNumericReturnValue(raw[key]);
        if (decoded !== null) return decoded;
      }
    }
  }
  if (Array.isArray(raw) && raw.length === 1) return parseNumericReturnValue(raw[0]);
  return null;
}

/** Decode the ID returned by this exact write. Never fall back to a global counter. */
export function decodeReturnedAssessmentId(transaction: unknown): number {
  if (!isRecord(transaction)) throw new Error("Cannot decode assessment ID from a non-object transaction");
  for (const leader of leaderReceipts(transaction)) {
    const result = leader.result;
    const payload = isRecord(result) ? result.payload : result;
    const decoded = parseNumericReturnValue(payload ?? leader.payload ?? leader.returnValue);
    if (decoded !== null) return decoded;
  }
  const decoded = parseNumericReturnValue(
    transaction.result ?? transaction.txExecutionResultPayload ?? transaction.returnValue,
  );
  if (decoded !== null) return decoded;
  throw new Error("Accepted open_assessment transaction did not contain a decodable assessment_id");
}

export function decodeReturnedAssessmentIdFromCandidates(...candidates: unknown[]): number {
  for (const candidate of candidates) {
    try {
      return decodeReturnedAssessmentId(candidate);
    } catch {
      // The SDK may expose the leader return in either getTransaction or the accepted receipt.
    }
  }
  throw new Error("Accepted open_assessment transaction did not contain a decodable assessment_id");
}
