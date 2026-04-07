import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email/${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully. Redirecting to login...');
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Invalid or expired link. Please try signing up again.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Invalid or expired link. Please try signing up again.');
      }
    };

    if (token) {
      verify();
    } else {
      setStatus('error');
      setMessage('Missing verification token.');
    }
  }, [token, navigate]);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      {status === 'verifying' && <h2>{message}</h2>}
      {status === 'success' && <h2 style={{ color: 'green' }}>{message}</h2>}
      {status === 'error' && <h2 style={{ color: 'red' }}>{message}</h2>}
    </div>
  );
};

export default VerifyEmail;
