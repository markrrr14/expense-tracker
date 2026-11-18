import { useEffect, useState } from 'react';
import { peso } from '../utils';

export default function BudgetCard({ budget, spent, onSave }) {
  const [value, setValue] = useState(budget || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setValue(budget || '');
  }, [budget]);

  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  const state = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok';
  const dirty = (parseFloat(value) || 0) !== (budget || 0);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    await onSave(parseFloat(value) || 0);
    setBusy(false);
  };

  return (
    <div className="card">
      <h2>Monthly budget</h2>
      <form className="form budget-form" onSubmit={submit}>
        <label>Budget limit (PHP)
          <input
            type="number" min="0" step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Set a budget"
          />
        </label>
        <button className="btn" disabled={busy || !dirty}>{busy ? 'Saving…' : 'Save budget'}</button>
      </form>

      {budget > 0 && (
        <>
          <div className="bar-track">
            <div className={`bar-fill ${state}`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <p className="muted">
            {peso(spent)} of {peso(budget)} used ({Math.round(pct)}%)
          </p>
          {state === 'over' && <p className="error">You are over budget by {peso(spent - budget)}.</p>}
          {state === 'warn' && <p className="warning">Careful: you have used over 80% of your budget.</p>}
          {state === 'ok' && <p className="success">{peso(budget - spent)} left to spend.</p>}
        </>
      )}
    </div>
  );
}
