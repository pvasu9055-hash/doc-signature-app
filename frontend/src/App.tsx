import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import SignPage from './components/SignPage';
import Login from './components/Login';
import Register from './components/Register';

function App() {
  const [view, setView] = useState<'login' | 'register' | 'dashboard' | 'sign'>('login');
  const [currentDocId, setCurrentDocId] = useState<number>(1);
  const [currentDocPath, setCurrentDocPath] = useState<string>('');

  useEffect(() => {
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