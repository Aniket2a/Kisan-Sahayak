import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const LoginPage: React.FC = () => {
  const { login, navigate, showToast, t } = useApp();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              {t('login_pwd')}
            </label>
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


        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {t('login_no_account')}{' '}
          <a href="#/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }} style={{ fontWeight: 700 }}>
            {t('login_register_link')}
          </a>
        </div>
      </div>
    </div>
  );
};
