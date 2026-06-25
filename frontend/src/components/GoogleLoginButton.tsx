import { GoogleLogin } from '@react-oauth/google';

export default function GoogleLoginButton() {
  const handleLoginSuccess = (credentialResponse: any) => {
    console.log('Login successful:', credentialResponse);
    const token = credentialResponse.credential;
    
    // Send token to your backend
    fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(res => res.json())
      .then(data => {
        localStorage.setItem('authToken', data.authToken);
        window.location.href = '/upload'; // Redirect after login
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