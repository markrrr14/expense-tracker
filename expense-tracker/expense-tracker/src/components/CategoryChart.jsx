import { colorOf, peso } from '../utils';

export default function CategoryChart({ rows, total }) {
  return (
    <div className="card">
      <h2>Spending by category</h2>
      {rows.length === 0 ? (
        <p className="muted">No expenses this month.</p>
      ) : (
        rows.map(({ category, total: amount }) => {
          const pct = total ? (amount / total) * 100 : 0;
          return (
            <div key={category} className="cat-row">
              <div className="cat-head">
                <span>{category}</span>
                <span>{peso(amount)} &middot; {Math.round(pct)}%</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${pct}%`, background: colorOf(category) }} />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
