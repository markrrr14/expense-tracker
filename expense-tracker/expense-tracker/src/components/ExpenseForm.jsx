import { useState } from 'react';
import { CATEGORIES, dateInputValue, today } from '../utils';

// `initial` is set when editing. App gives this component a new `key` per expense,
// so the form resets itself when switching between add and edit.
export default function ExpenseForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial
      ? { ...initial, date: dateInputValue(initial.date) || today() }
      : { amount: '', category: CATEGORIES[0].name, date: today(), note: '' },
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return setError('Enter an amount greater than 0.');
    if (!form.date) return setError('Pick a date.');
    setError('');
    setBusy(true);
    const saved = await onSave({ ...form, amount, note: form.note.trim() });
    setBusy(false);
    if (saved && !initial) setForm({ ...form, amount: '', note: '' });
  };

  return (
    <form className="card form" onSubmit={submit}>
      <h2>{initial ? 'Edit expense' : 'Add expense'}</h2>
      {error && <p className="error">{error}</p>}
      <label>Amount (PHP)
        <input type="number" step="0.01" min="0" value={form.amount} onChange={set('amount')} placeholder="0.00" />
      </label>
      <label>Category
        <select value={form.category} onChange={set('category')}>
          {CATEGORIES.map((c) => <option key={c.name}>{c.name}</option>)}
        </select>
      </label>
      <label>Date
        <input type="date" value={form.date} onChange={set('date')} />
      </label>
      <label>Note (optional)
        <input value={form.note} onChange={set('note')} maxLength={80} placeholder="e.g. Lunch at canteen" />
      </label>
      <div className="actions">
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Add expense'}</button>
        {initial && <button type="button" className="btn btn-light" onClick={onCancel} disabled={busy}>Cancel</button>}
      </div>
    </form>
  );
}
