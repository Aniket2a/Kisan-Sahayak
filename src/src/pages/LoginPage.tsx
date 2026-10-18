import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const LoginPage: React.FC = () => {
  const { login, navigate, showToast, t } = useApp();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim()) {
      showToast(t('auth_enter_uname'), 'warning');
      return;
    }

    const res = login(usernameOrEmail, password);
    if (res.success) {
      navigate('/dashboard');
    } else {
      showToast(res.message, 'danger');
    }
  };

  const fillCredentials = (u: string, p: string) => {
    setUsernameOrEmail(u);
    setPassword(p);
  };

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto', background: '#fff', padding: 'clamp(1.5rem, 4vw, 2.5rem)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)', boxSizing: 'border-box' }}>
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
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
          >
            <i className="fa-solid fa-arrow-right-to-bracket"></i> {t('login_submit')}
          </button>
        </form>

        {/* Quick Demo Credentials Fill */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.6rem', textAlign: 'center' }}>
            {t('login_demo_heading')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => fillCredentials('demo_farmer_1', 'farmer123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            >
              <span><i className="fa-solid fa-user"></i> Ramesh Kumar (Farmer)</span>
              <span className="section-badge" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>{t('login_autofill')}</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('admin_kisan', 'admin123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            >
              <span><i className="fa-solid fa-shield-halved"></i> Dr. M. S. Swaminathan (Admin)</span>
              <span className="section-badge" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>{t('login_autofill')}</span>
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
    </div>
  );
};
