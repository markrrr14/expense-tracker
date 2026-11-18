import { CATEGORIES, colorOf, formatDate, peso } from '../utils';

export default function ExpenseList({
  expenses, loading, search, setSearch, category, setCategory, onEdit, onDelete, onExport,
}) {
  return (
    <div className="card">
      <div className="row">
        <h2>Expenses</h2>
        <button className="btn btn-light" onClick={onExport} disabled={expenses.length === 0}>
          Export CSV
        </button>
      </div>

      <div className="filters">
        <input
          type="search"
          placeholder="Search notes"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoComplete="off"
          aria-label="Search expenses by note"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.name}>{c.name}</option>)}
        </select>
        {(search || category) && (
          <button type="button" className="link" onClick={() => { setSearch(''); setCategory(''); }}>
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : expenses.length === 0 ? (
        <p className="muted">
          {search || category ? 'No expenses match your filters.' : 'No expenses to show.'}
        </p>
      ) : (
        <ul className="list">
          {expenses.map((e) => (
            <li key={e.id}>
              <span className="dot" style={{ background: colorOf(e.category) }} />
              <div className="grow">
                <strong>{e.note || e.category}</strong>
                <div className="muted small">{e.category} &middot; {formatDate(e.date)}</div>
              </div>
              <span className="amount">{peso(e.amount)}</span>
              <button className="link" onClick={() => onEdit(e)}>Edit</button>
              <button className="link danger" onClick={() => onDelete(e.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
