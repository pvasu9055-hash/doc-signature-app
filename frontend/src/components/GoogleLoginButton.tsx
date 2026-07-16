import { GoogleLogin } from '@react-oauth/google';
import { BACKEND_URL } from '../api';

export default function GoogleLoginButton() {
  const handleLoginSuccess = (credentialResponse: any) => {
    const token = credentialResponse.credential;
    
    fetch(`${BACKEND_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(res => res.json())
      .then(data => {
        console.log('Backend response:', data);
        if (data.token && data.user) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          window.location.href = '/';
        } else {
          console.error('Login failed:', data.message);
          alert('Google login failed: ' + (data.message || 'Unknown error'));
        }
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