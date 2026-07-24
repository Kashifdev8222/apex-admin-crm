export function PageSkeleton() {
  return (
    <div className="page-skeleton" aria-busy="true" aria-label="Loading">
      <div className="page-skeleton__bar" />
      <div className="stats">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat skeleton-block" style={{ minHeight: 88 }} />
        ))}
      </div>
      <div className="panel skeleton-block" style={{ minHeight: 280 }} />
    </div>
  );
}
