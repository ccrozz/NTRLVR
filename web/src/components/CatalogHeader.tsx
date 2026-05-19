export function CatalogHeader({
  stateName,
  total,
  loading,
}: {
  stateName?: string;
  total?: number;
  loading?: boolean;
}) {
  return (
    <header className="catalog-page-header">
      <h1>Plant catalog</h1>
      <p>
        {stateName ? (
          loading ? (
            <>Loading plants for {stateName}…</>
          ) : (
            <>
              <strong>{total?.toLocaleString() ?? "—"}</strong> species that can
              grow in {stateName}
            </>
          )
        ) : (
          <>Choose your state below to see what can grow in your area.</>
        )}
      </p>
    </header>
  );
}
