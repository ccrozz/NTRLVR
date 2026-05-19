export class TrefleRateLimitError extends Error {
  constructor(message = "Trefle API rate limit (429)") {
    super(message);
    this.name = "TrefleRateLimitError";
  }
}

export class TrefleAuthError extends Error {
  constructor(message = "Invalid or missing Trefle API token") {
    super(message);
    this.name = "TrefleAuthError";
  }
}
