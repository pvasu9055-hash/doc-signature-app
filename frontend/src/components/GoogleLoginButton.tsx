 import { GoogleLogin } from '@react-oauth/google';

export default function GoogleLoginButton() {
  const handleLoginSuccess = (credentialResponse: any) => {
    const token = credentialResponse.credential;
    
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(res => res.json())
      .then(data => {
        console.log('Backend response:', data);
        localStorage.setItem('token', data.authToken);
        window.location.href = '/';
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