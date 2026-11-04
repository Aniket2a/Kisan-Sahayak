import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const LoginPage: React.FC = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { login, requestPasswordReset, navigate, showToast, t } = useApp();

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      showToast('Please enter your registered email address.', 'warning');
      return;
    }
    setResetLoading(true);
    try {
      const res = await requestPasswordReset(resetEmail);
      if (res.success) {
        setShowForgotModal(false);
        setResetEmail('');
      } else {
        showToast(res.message, 'danger');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim()) {
      showToast(t('auth_enter_uname'), 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await login(usernameOrEmail, password);
      if (res.success) {
        if (res.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        showToast(res.message, 'danger');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '6rem' }}>
      <div style={{ maxWidth: '440px', margin: '0 auto', background: '#fff', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div className="logo-badge" style={{ width: '48px', height: '48px', fontSize: '1.4rem', margin: '0 auto 0.75rem' }}>
            <i className="fa-solid fa-wheat-awn"></i>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--forest-dark)', marginBottom: '0.25rem' }}>
            {t('login_title')}
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
            {t('login_sub')}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              {t('login_uname_email')}
            </label>
            <input
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="demo_farmer_1 / demo.farmer1@example.com"
              required
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>
                {t('login_pwd')}
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--primary-green)',
                  cursor: 'pointer'
                }}
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', opacity: loading ? 0.8 : 1 }}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i> {t('login_submit')}...
              </>
            ) : (
              <>
                <i className="fa-solid fa-arrow-right-to-bracket"></i> {t('login_submit')}
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', padding: '0.85rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.82rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--forest-dark)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <i className="fa-solid fa-key" style={{ color: 'var(--primary-green)' }}></i> Demo Quick Login
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
              onClick={() => {
                setUsernameOrEmail('demo_farmer_1');
                setPassword('farmer123');
              }}
            >
              <i className="fa-solid fa-user"></i> Demo Farmer
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
              onClick={() => {
                setUsernameOrEmail('admin');
                setPassword('admin123');
              }}
            >
              <i className="fa-solid fa-shield-halved"></i> Admin Portal
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {t('login_no_account')}{' '}
          <a href="#/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }} style={{ fontWeight: 700 }}>
            {t('login_register_link')}
          </a>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setShowForgotModal(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '420px',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                  fontSize: '1.25rem'
                }}
              >
                <i className="fa-solid fa-unlock-keyhole"></i>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--forest-dark)', margin: 0 }}>
                Reset Your Password
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Enter your registered farmer email. We will send a secure password reset link.
              </p>
            </div>

            <form onSubmit={handleForgotSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Registered Email Address
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="farmer@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowForgotModal(false)}
                  disabled={resetLoading}
                  style={{ fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={resetLoading}
                  style={{ fontSize: '0.85rem' }}
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
