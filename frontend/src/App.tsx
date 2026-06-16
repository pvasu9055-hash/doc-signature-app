import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import SignPage from './components/SignPage';
import Login from './components/Login';
import Register from './components/Register';
import PublicSignPage from './components/PublicSignPage';

function App() {
  const [view, setView] = useState<'login' | 'register' | 'dashboard' | 'sign' | 'public-sign'>('login');
  const [currentDocId, setCurrentDocId] = useState<number>(1);
  const [currentDocPath, setCurrentDocPath] = useState<string>('');
  const [publicToken, setPublicToken] = useState<string>('');
  const [publicDocId, setPublicDocId] = useState<string>('');

  useEffect(() => {
    // Check if this is a public signing link
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    if (path.startsWith('/sign/')) {
      const token = path.replace('/sign/', '');
      const docId = params.get('docId') || '';
      if (token && docId) {
        setPublicToken(token);
        setPublicDocId(docId);
        setView('public-sign');
        return;
      }
    }

    const token = localStorage.getItem('token');
    if (token) setView('dashboard');
  }, []);

  const handleLogin = () => setView('dashboard');
  const handleRegister = () => setView('login');
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setView('login');
  };
  const handleOpenEditor = (docId: number, filepath: string) => {
    setCurrentDocId(docId);
    setCurrentDocPath(filepath);
    setView('sign');
  };

  return (
    <>
      {view === 'public-sign' && (
        <PublicSignPage token={publicToken} docId={publicDocId} />
      )}
      {view === 'login' && (
        <Login onLogin={handleLogin} onSwitchToRegister={() => setView('register')} />
      )}
      {view === 'register' && (
        <Register onRegister={handleRegister} onSwitchToLogin={() => setView('login')} />
      )}
      {view === 'dashboard' && (
        <Dashboard onOpenEditor={handleOpenEditor} onLogout={handleLogout} />
      )}
      {view === 'sign' && (
        <SignPage
          documentId={currentDocId}
          filepath={currentDocPath}
          onBack={() => setView('dashboard')}
        />
      )}
    </>
  );
}

export default App;