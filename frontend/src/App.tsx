import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import SignPage from './components/SignPage';
import Login from './components/Login';
import Register from './components/Register';
import PublicSignPage from './components/PublicSignPage';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

function App() {
  const [view, setView] = useState<'login' | 'register' | 'dashboard' | 'sign' | 'public-sign' | 'forgot-password' | 'reset-password'>('login');
  const [currentDocId, setCurrentDocId] = useState<number>(1);
  const [currentDocPath, setCurrentDocPath] = useState<string>('');
  const [publicToken, setPublicToken] = useState<string>('');
  const [publicDocId, setPublicDocId] = useState<string>('');

  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    // Public signing link
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

    // Password reset link
    if (path === '/reset-password') {
      setView('reset-password');
      return;
    }

    // Forgot password page
    if (path === '/forgot-password') {
      setView('forgot-password');
      return;
    }

    const token = localStorage.getItem('token');
    if (token) setView('dashboard');
  }, []);

  const handleLogin = () => {
    window.history.pushState({}, '', '/');
    setView('dashboard');
  };
  const handleRegister = () => setView('login');
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.history.pushState({}, '', '/');
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
        <Login
          onLogin={handleLogin}
          onSwitchToRegister={() => setView('register')}
          onForgotPassword={() => {
            window.history.pushState({}, '', '/forgot-password');
            setView('forgot-password');
          }}
        />
      )}
      {view === 'register' && (
        <Register onRegister={handleRegister} onSwitchToLogin={() => setView('login')} />
      )}
      {view === 'forgot-password' && (
        <ForgotPassword onBack={() => {
          window.history.pushState({}, '', '/');
          setView('login');
        }} />
      )}
      {view === 'reset-password' && (
        <ResetPassword onSuccess={() => {
          window.history.pushState({}, '', '/');
          setView('login');
        }} />
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