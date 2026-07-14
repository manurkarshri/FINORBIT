export class DatabaseError extends Error {
  constructor(code, message, options = {}) {
    super(message, options);
    this.name = "DatabaseError";
    this.code = code;
    this.recoverable = options.recoverable ?? true;
  }
}

export function classifyDatabaseError(error) {
  if (error instanceof DatabaseError) return error;
  const name = error?.name ?? "UnknownError";
  const code = ({ AbortError: "TRANSACTION_ABORTED", ConstraintError: "CONSTRAINT", QuotaExceededError: "QUOTA", VersionError: "VERSION", InvalidStateError: "CONNECTION_CLOSED" })[name] ?? "DATABASE_FAILURE";
  return new DatabaseError(code, "FinOrbit could not safely complete the local-data operation. Your existing data was not intentionally reset.", { cause: error });
}
