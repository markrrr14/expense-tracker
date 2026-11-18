import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';
import BudgetCard from './BudgetCard';
import CategoryChart from './CategoryChart';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { budgetApi, expensesApi, summaryApi } from '../api';
import { currentMonth, downloadCSV, monthLabel, monthOf, peso, sortExpenses } from '../utils';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [month, setMonth] = useState(currentMonth());
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const requestRef = useRef(null);
  const summaryRef = useRef(null);
  const monthRef = useRef(month);
  monthRef.current = month;

  const load = useCallback(async (selectedMonth) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    setLoading(true);
    setError('');
    try {
      const [list, stats] = await Promise.all([
        expensesApi.list({ month: selectedMonth, signal: controller.signal }),
        summaryApi(selectedMonth, { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;
      setExpenses(list);
      setSummary(stats);
    } catch (err) {
      if (err.name === 'AbortError' || controller.signal.aborted) return;
      setError(err.message);
    } finally {
      if (requestRef.current === controller) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(month);
    return () => requestRef.current?.abort();
  }, [month, load]);

  const refreshSummary = useCallback(async (selectedMonth) => {
    summaryRef.current?.abort();
    const controller = new AbortController();
    summaryRef.current = controller;

    try {
      const stats = await summaryApi(selectedMonth, { signal: controller.signal });
      if (!controller.signal.aborted && monthRef.current === selectedMonth) setSummary(stats);
    } catch (err) {
      if (err.name !== 'AbortError' && !controller.signal.aborted) setError(err.message);
    }
  }, []);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return expenses.filter(
      (e) =>
        (!category || e.category === category) &&
        (!needle || (e.note || '').toLowerCase().includes(needle)),
    );
  }, [expenses, category, search]);

  const save = async (data) => {
    setError('');
    try {
      const saved = editing
        ? await expensesApi.update(editing.id, data)
        : await expensesApi.create(data);

      setEditing(null);
      setExpenses((list) => {
        const rest = list.filter((e) => e.id !== saved.id);
        return monthOf(saved.date) === monthRef.current ? sortExpenses([...rest, saved]) : rest;
      });
      refreshSummary(monthRef.current);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    setError('');
    try {
      await expensesApi.remove(id);
      if (editing?.id === id) setEditing(null);
      setExpenses((list) => list.filter((e) => e.id !== id));
      refreshSummary(monthRef.current);
    } catch (err) {
      setError(err.message);
    }
  };

  const saveBudget = async (value) => {
    setError('');
    try {
      await budgetApi(value);
      setSummary((s) =>
        s
          ? {
              ...s,
              budget: value,
              budget_used_percent: value > 0 ? Math.round((s.total / value) * 1000) / 10 : 0,
            }
          : s,
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const total = summary?.total ?? 0;

  const changeMonth = (value) => {
    if (!value) return;
    setEditing(null);
    setMonth(value);
  };

  return (
    <>
      <header className="navbar">
        <h1 className="brand"><Logo /> Expense Tracker</h1>
        <div className="nav-right">
          <label className="month">
            Month
            <input type="month" value={month} onChange={(e) => changeMonth(e.target.value)} />
          </label>
          <span className="nav-user">{user?.name}</span>
          <button className="btn btn-light btn-small" onClick={logout}>Log out</button>
        </div>
      </header>

      <main className="container">
        {error && <p className="error global-error">{error}</p>}

        <section className="stats">
          <div className="stat">
            <span className="muted small">Total spent in {monthLabel(month)}</span>
            <strong>{peso(total)}</strong>
          </div>
          <div className="stat">
            <span className="muted small">Transactions</span>
            <strong>{summary?.transactions ?? 0}</strong>
          </div>
          <div className="stat">
            <span className="muted small">Average per day with spending</span>
            <strong>{peso(summary?.average_per_day ?? 0)}</strong>
          </div>
        </section>

        <div className="grid">
          <div className="col">
            <ExpenseForm key={editing?.id ?? 'new'} initial={editing} onSave={save} onCancel={() => setEditing(null)} />
            <BudgetCard budget={summary?.budget ?? 0} spent={total} onSave={saveBudget} />
            <CategoryChart rows={summary?.by_category ?? []} total={total} />
          </div>
          <div className="col">
            <ExpenseList
              expenses={visible}
              loading={loading}
              search={search} setSearch={setSearch}
              category={category} setCategory={setCategory}
              onEdit={setEditing} onDelete={remove}
              onExport={() => downloadCSV(visible, month)}
            />
          </div>
        </div>
      </main>
    </>
  );
}
