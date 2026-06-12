import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import PDFEditor from './components/PDFEditor';
import Login from './components/Login';
import Register from './components/Register';

function App() {
  const [view, setView] = useState<'login' | 'register' | 'dashboard' | 'editor'>('login');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setView('dashboard');
    }
  }, []);

  const handleLogin = () => setView('dashboard');
  const handleRegister = () => setView('login');
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setView('login');
  };

  return (
    <>
      {view === 'login' && (
        <Login
          onLogin={handleLogin}
          onSwitchToRegister={() => setView('register')}
        />
      )}
      {view === 'register' && (
        <Register
          onRegister={handleRegister}
          onSwitchToLogin={() => setView('login')}
        />
      )}
      {view === 'dashboard' && (
        <Dashboard
          onOpenEditor={() => setView('editor')}
          onLogout={handleLogout}
        />
      )}
      {view === 'editor' && (
        <div>
          <button
            onClick={() => setView('dashboard')}
            className="fixed top-4 left-4 z-50 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition"
          >
            ← Back
          </button>
          <PDFEditor
            documentId={1}
            onSave={() => setView('dashboard')}
          />
        </div>
      )}
    </>
  );
}

export default App;