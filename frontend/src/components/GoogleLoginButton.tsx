import { GoogleLogin } from '@react-oauth/google';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function GoogleLoginButton() {
  const handleLoginSuccess = (credentialResponse: any) => {
    console.log('Login successful:', credentialResponse);
    const token = credentialResponse.credential;
    
    fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(res => res.json())
      .then(data => {
        localStorage.setItem('authToken', data.authToken);
        window.location.href = '/upload';
      })
      .catch(err => console.error('Login error:', err));
  };

  const handleLoginError = () => {
    console.log('Login Failed');
  };

  return (
    <div className="flex justify-center">
      <GoogleLogin onSuccess={handleLoginSuccess} onError={handleLoginError} />
    </div>
  );
}