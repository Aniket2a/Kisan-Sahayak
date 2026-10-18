import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { INDIAN_STATES } from '../data/seedData';

export const ProfilePage: React.FC = () => {
  const { currentUser, updateProfile, bookmarkedIds, communityPosts, feedback, logout, navigate, t, tc } = useApp();

  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [state, setState] = useState(currentUser?.state || 'Punjab');
  const [preferredCategory, setPreferredCategory] = useState(currentUser?.preferred_category || 'General');
  const [newPassword, setNewPassword] = useState('');

  if (!currentUser) {
    return (
      <div className="container" style={{ paddingTop: '5rem', paddingBottom: '5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', background: '#fff', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
          <i className="fa-solid fa-user-lock" style={{ fontSize: '3rem', color: 'var(--primary-green)', marginBottom: '1.25rem' }}></i>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--forest-dark)', marginBottom: '0.75rem' }}>
            {t('profile_title')}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
            {t('dash_access_desc')}
          </p>
          <button onClick={() => navigate('/login')} className="btn btn-primary">
            <i className="fa-solid fa-arrow-right-to-bracket"></i> {t('nav_login')}
          </button>
        </div>
      </div>
    );
  }

  const userPostsCount = communityPosts.filter(p => p.user_id === currentUser.id).length;
  const userFeedbackCount = feedback.filter(f => f.user_id === currentUser.id).length;

  const categories = [
    'General',
    'Seeds & Crops',
    'Farming Tools',
    'Government Schemes',
    'Loans & Subsidies',
    'Organic Farming',
    'Agri Marketplace'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      full_name: fullName,
      email,
      state,
      preferred_category: preferredCategory,
      new_password: newPassword ? newPassword : undefined
    });
    setNewPassword('');
  };

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      {/* PAGE HEADER */}
      <div className="section-header" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
        <span className="section-badge">
          <i className="fa-solid fa-user-gear"></i> {t('profile_badge')}
        </span>
        <h1 className="section-title">{t('profile_title')}</h1>
        <p className="section-subtitle" style={{ margin: 0 }}>
          {t('profile_sub')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Left: Profile Edit Form */}
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.25rem' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'var(--mint-subtle)',
                color: 'var(--primary-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                fontWeight: 700
              }}
            >
              <i className="fa-solid fa-user"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--forest-dark)', margin: 0 }}>
                {currentUser.full_name}
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                @{currentUser.username} • {t('profile_role')}: <strong>{currentUser.role === 'admin' ? t('role_admin') : t('role_farmer')}</strong>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                {t('profile_full_name')}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
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
                {t('profile_email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  {t('profile_state_ut')}
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.9rem',
                    backgroundColor: '#fff'
                  }}
                >
                  {INDIAN_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  {t('profile_focus_cat')}
                </label>
                <select
                  value={preferredCategory}
                  onChange={(e) => setPreferredCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.9rem',
                    backgroundColor: '#fff'
                  }}
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{tc(c)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                {t('profile_change_pwd')}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('profile_pwd_placeholder')}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
              <button
                type="button"
                onClick={logout}
                className="btn btn-outline-danger btn-sm"
              >
                <i className="fa-solid fa-arrow-right-from-bracket"></i> {t('profile_sign_out')}
              </button>

              <button type="submit" className="btn btn-primary">
                <i className="fa-solid fa-floppy-disk"></i> {t('profile_save_btn')}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Activity Stats & Quick Access */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Stats Card */}
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--forest-dark)', marginBottom: '1.25rem' }}>
              {t('profile_activity_title')}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
              <div style={{ background: 'var(--mint-bg)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-green)' }}>
                  {bookmarkedIds.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('profile_saved_items')}</div>
              </div>

              <div style={{ background: '#f3e8ff', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#9333ea' }}>
                  {userPostsCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('profile_forum_posts')}</div>
              </div>

              <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--amber-warm)' }}>
                  {userFeedbackCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('profile_reviews_given')}</div>
              </div>
            </div>
          </div>

          {/* Quick Access Links */}
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--forest-dark)', marginBottom: '1rem' }}>
              {t('profile_quick_access')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button
                onClick={() => navigate('/bookmarks')}
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', width: '100%' }}
              >
                <span><i className="fa-solid fa-bookmark" style={{ color: 'var(--amber-warm)', marginRight: '0.5rem' }}></i> {t('profile_my_saved')}</span>
                <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.8rem' }}></i>
              </button>
              <button
                onClick={() => navigate('/weather')}
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', width: '100%' }}
              >
                <span><i className="fa-solid fa-cloud-sun" style={{ color: '#0284c7', marginRight: '0.5rem' }}></i> {t('profile_live_weather')}</span>
                <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.8rem' }}></i>
              </button>
              <button
                onClick={() => navigate('/community')}
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', width: '100%' }}
              >
                <span><i className="fa-solid fa-comments" style={{ color: '#9333ea', marginRight: '0.5rem' }}></i> {t('community_title')}</span>
                <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.8rem' }}></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
