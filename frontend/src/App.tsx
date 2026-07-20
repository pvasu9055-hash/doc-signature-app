import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import SignPage from './components/SignPage';
import Login from './components/Login';
import Register from './components/Register';
import PublicSignPage from './components/PublicSignPage';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Enable2FA from './components/Enable2FA';
import VerifyTwoFactorSetup from './components/VerifyTwoFactorSetup';
import VerifyTwoFactorLogin from './components/VerifyTwoFactorLogin';
import OtpLogin from './components/OtpLogin';
import SignMultiPage from './components/SignMultiPage';

function App() {
  const [view, setView] = useState<'login' | 'register' | 'dashboard' | 'sign' | 'public-sign' | 'forgot-password' | 'reset-password' | 'enable-2fa' | 'verify-2fa-setup' | 'verify-2fa-login' | 'otp-login' | 'sign-multi'>('login');
  const [currentDocId, setCurrentDocId] = useState<number>(1);
  const [currentDocPath, setCurrentDocPath] = useState<string>('');
  const [publicToken, setPublicToken] = useState<string>('');
  const [publicDocId, setPublicDocId] = useState<string>('');
  const [multiSignToken, setMultiSignToken] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [twoFactorSetup, setTwoFactorSetup] = useState<{ userId: number; secret: string } | null>(null);
  const [twoFactorLoginUserId, setTwoFactorLoginUserId] = useState<number | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    if (path.startsWith('/sign-multi/')) {
      const token = path.replace('/sign-multi/', '');
      if (token) {
        setMultiSignToken(token);
        setView('sign-multi');
        return;
      }
    }

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

    if (path === '/reset-password') {
      setView('reset-password');
      return;
    }

    if (path === '/forgot-password') {
      setView('forgot-password');
      return;
    }

    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      setView('dashboard');
    }
  }, []);

  const handleLogin = (loginData?: any) => {
    if (loginData?.needsTwoFactor) {
      setTwoFactorLoginUserId(loginData.userId);
      setView('verify-2fa-login');
      return;
    }
    if (loginData?.user) {
      setUser(loginData.user);
    }
    window.history.pushState({}, '', '/');
    setView('dashboard');
  };

  const handleRegister = () => setView('login');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
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
      {view === 'sign-multi' && (
        <SignMultiPage token={multiSignToken} />
      )}
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
          onOtpLogin={() => setView('otp-login')}
        />
      )}
      {view === 'otp-login' && (
        <OtpLogin
          onSuccess={(token, userData) => {
            setUser(userData);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            window.history.pushState({}, '', '/');
            setView('dashboard');
          }}
          onBack={() => setView('login')}
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
      {view === 'enable-2fa' && user && (
        <Enable2FA
          userId={user.id}
          onSetupComplete={(secret: string) => {
            setTwoFactorSetup({ userId: user.id, secret });
            setView('verify-2fa-setup');
          }}
          onBack={() => setView('dashboard')}
        />
      )}
      {view === 'verify-2fa-setup' && user && (
        <VerifyTwoFactorSetup
          userId={user.id}
          secret={twoFactorSetup?.secret || ''}
          onSuccess={() => {
            setTwoFactorSetup(null);
            setView('dashboard');
          }}
          onBack={() => setView('enable-2fa')}
        />
      )}
      {view === 'verify-2fa-login' && twoFactorLoginUserId && (
        <VerifyTwoFactorLogin
          userId={twoFactorLoginUserId}
          onSuccess={(token, userData) => {
            setUser(userData);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            window.history.pushState({}, '', '/');
            setView('dashboard');
          }}
          onBack={() => {
            setTwoFactorLoginUserId(null);
            setView('login');
          }}
        />
      )}
      {view === 'dashboard' && user && (
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