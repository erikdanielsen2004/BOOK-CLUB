import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const VerifyEmail = () => {
  const { token } = useParams(); 
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    const verify = async () => {
      try {
        
        const response = await fetch(`https://mernbookclub.xyz/api/verify-email/${token}`);
        
        if (response.ok) {
          setStatus('success');
         
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setStatus('error');
        }
      } catch (err) {
        setStatus('error');
      }
    };
    verify();
  }, [token, navigate]);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      {status === 'verifying' && <h2>Verifying your email...</h2>}
      {status === 'success' && (
        <h2 style={{ color: 'green' }}>
          Email Verified! Redirecting to login...
        </h2>
      )}
      {status === 'error' && (
        <h2 style={{ color: 'red' }}>
          Invalid or expired link. Please try signing up again.
        </h2>
      )}
    </div>
  );
};

export default VerifyEmail;
