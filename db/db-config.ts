export function usePostgres(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function dbBackend(): "postgres" | "sqlite" {
  return usePostgres() ? "postgres" : "sqlite";
}
