'use client';
import { useEffect } from 'react';

export default function AuthCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken  = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const userId       = params.get('userId');
    const error        = params.get('error');

    if (error) {
      const messages: Record<string, string> = {
        google_denied:   'Google sign-in was cancelled.',
        google_no_email: 'Could not get your email from Google.',
        google_failed:   'Google sign-in failed. Please try again.',
      };
      window.location.href = '/login?msg=' + encodeURIComponent(messages[error] || 'Sign-in failed.');
      return;
    }

    if (accessToken && refreshToken && userId) {
      // Store tokens exactly the same way the login page does
      localStorage.setItem('sahyog_token', accessToken);
      localStorage.setItem('sahyog_refresh', refreshToken);
      localStorage.setItem('sahyog_user_id', userId);
      // Clean URL and go to workspace
      window.location.href = '/workspace';
    } else {
      window.location.href = '/login?msg=Sign-in+failed.+Please+try+again.';
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F1F5F9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 16,
      fontFamily: '-apple-system, sans-serif'}}>
      <div style={{
        width: 40, height: 40, border: '3px solid rgba(79,110,247,0.3)',
        borderTop: '3px solid #4F6EF7', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#64748B', fontSize: 14 }}>Signing you in...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
