const BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'auth_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

function errorMessage(data) {
  if (data?.errors) {
    const first = Object.values(data.errors)[0];
    if (first?.length) return first[0];
  }
  return data?.message || 'Something went wrong. Please try again.';
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error('Cannot reach the server. Is the backend running?');
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    if (res.status === 401) {
      setToken(null);
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    const error = new Error(errorMessage(data));
    error.status = res.status;
    error.errors = data?.errors ?? null;
    throw error;
  }

  return data;
}

export const authApi = {
  register: (payload) => request('/register', { method: 'POST', body: payload }),
  login: (payload) => request('/login', { method: 'POST', body: payload }),
  logout: () => request('/logout', { method: 'POST' }),
  me: (options) => request('/me', options),
};

export const expensesApi = {
  list: ({ month, category, search, signal } = {}) => {
    const params = new URLSearchParams();
    if (month) params.set('month', month);
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    const qs = params.toString();
    return request(`/expenses${qs ? `?${qs}` : ''}`, { signal });
  },
  create: (payload) => request('/expenses', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/expenses/${id}`, { method: 'PUT', body: payload }),
  remove: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),
};

export const summaryApi = (month, { signal } = {}) =>
  request(`/summary?month=${encodeURIComponent(month)}`, { signal });

export const budgetApi = (monthlyBudget) =>
  request('/budget', { method: 'PUT', body: { monthly_budget: monthlyBudget } });
