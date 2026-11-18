import { useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';

export default function App() {
  const { user, initializing } = useAuth();

  if (initializing) return <div className="boot muted">Loading…</div>;
  return user ? <Dashboard /> : <AuthPage />;
}
