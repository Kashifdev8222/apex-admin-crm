export function PageSkeleton() {
  return (
    <div className="stack" style={{ gap: "1rem" }}>
      <div className="stats">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat" style={{ minHeight: 78, opacity: 0.55 }} />
        ))}
      </div>
      <div className="panel" style={{ minHeight: 220, opacity: 0.5 }} />
    </div>
  );
}
