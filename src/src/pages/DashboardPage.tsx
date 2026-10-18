import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ResourceCard } from '../components/ResourceCard';

export const DashboardPage: React.FC = () => {
  const { currentUser, resources, bookmarkedIds, communityPosts, comments, navigate, t, tc } = useApp();

  if (!currentUser) {
    return (
      <div className="container" style={{ paddingTop: '5rem', paddingBottom: '5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', background: '#fff', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)' }}>
          <i className="fa-solid fa-lock" style={{ fontSize: '3rem', color: 'var(--amber-warm)', marginBottom: '1.25rem' }}></i>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--forest-dark)', marginBottom: '0.75rem' }}>
            {t('dash_access_title')}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', lineHeight: 1.5 }}>
            {t('dash_access_desc')}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button onClick={() => navigate('/login')} className="btn btn-secondary">
              <i className="fa-solid fa-arrow-right-to-bracket"></i> {t('nav_login')}
            </button>
            <button onClick={() => navigate('/register')} className="btn btn-primary">
              <i className="fa-solid fa-user-plus"></i> {t('nav_register')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const counts = {
    saved: bookmarkedIds.length,
    schemes: resources.filter(r => r.resource_type === 'scheme').length,
    crops: resources.filter(r => r.resource_type === 'crop').length,
    guides: resources.filter(r => r.resource_type === 'guide').length,
    discussions: communityPosts.length
  };

  const recommended = useMemo(() => {
    const userCat = currentUser.preferred_category || 'General';
    if (userCat && userCat !== 'General') {
      const match = resources.filter(
        r => r.category_name.toLowerCase().includes(userCat.toLowerCase()) || r.resource_type.toLowerCase().includes(userCat.toLowerCase())
      );
      if (match.length >= 3) {
        return match.sort((a, b) => b.views_count - a.views_count).slice(0, 6);
      }
    }
    return [...resources].sort((a, b) => b.views_count - a.views_count).slice(0, 6);
  }, [currentUser, resources]);

  const savedResources = useMemo(() => {
    return resources.filter(r => bookmarkedIds.includes(r.id)).slice(0, 4);
  }, [resources, bookmarkedIds]);

  const recentPosts = communityPosts.slice(0, 3);

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4.5rem' }}>
      {/* WELCOME BANNER */}
      <div className="dashboard-welcome-banner">
        <div className="dashboard-welcome-content">
          <span className="hero-tag" style={{ background: 'rgba(255,255,255,0.14)', color: '#86efac', border: '1px solid rgba(255,255,255,0.25)', marginBottom: '0.6rem' }}>
            <i className="fa-solid fa-wheat-awn"></i> {t('dash_active_cultivator')}
          </span>
          <h1 className="dashboard-welcome-title">
            {t('dash_welcome_namaste')}, {currentUser.full_name}!
          </h1>
          <p className="dashboard-welcome-sub">
            {t('dash_state')}: <strong>{currentUser.state}</strong> • {t('dash_focus')}: <strong>{tc(currentUser.preferred_category)}</strong>
          </p>
        </div>

        <div className="dashboard-welcome-actions">
          <button
            type="button"
            onClick={() => navigate('/weather')}
            className="btn btn-secondary btn-sm"
            style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', borderColor: 'rgba(255,255,255,0.35)' }}
          >
            <i className="fa-solid fa-cloud-sun-rain"></i> {t('dash_check_weather')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="btn btn-secondary btn-sm"
            style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', borderColor: 'rgba(255,255,255,0.35)' }}
          >
            <i className="fa-solid fa-user-gear"></i> {t('dash_edit_profile')}
          </button>
        </div>
      </div>

      {/* DASHBOARD METRICS CARDS */}
      <div className="dash-stats-grid">
        <div
          className="dash-stat-card"
          onClick={() => navigate('/bookmarks')}
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon-wrap" style={{ color: 'var(--amber-warm)', backgroundColor: 'var(--amber-light)' }}>
            <i className="fa-solid fa-bookmark"></i>
          </div>
          <div className="stat-info">
            <div className="stat-number">{counts.saved}</div>
            <div className="stat-label">{t('dash_saved_resources')}</div>
          </div>
        </div>

        <div
          className="dash-stat-card"
          onClick={() => navigate('/schemes')}
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon-wrap" style={{ color: '#0284c7', backgroundColor: '#e0f2fe' }}>
            <i className="fa-solid fa-building-columns"></i>
          </div>
          <div className="stat-info">
            <div className="stat-number">{counts.schemes}</div>
            <div className="stat-label">{t('dash_govt_schemes')}</div>
          </div>
        </div>

        <div
          className="dash-stat-card"
          onClick={() => navigate('/crops')}
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon-wrap" style={{ color: '#059669', backgroundColor: '#d1fae5' }}>
            <i className="fa-solid fa-seedling"></i>
          </div>
          <div className="stat-info">
            <div className="stat-number">{counts.crops}</div>
            <div className="stat-label">{t('dash_crop_guides')}</div>
          </div>
        </div>

        <div
          className="dash-stat-card"
          onClick={() => navigate('/community')}
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon-wrap" style={{ color: '#9333ea', backgroundColor: '#f3e8ff' }}>
            <i className="fa-solid fa-comments"></i>
          </div>
          <div className="stat-info">
            <div className="stat-number">{counts.discussions}</div>
            <div className="stat-label">{t('dash_community_posts')}</div>
          </div>
        </div>
      </div>

      {/* RECOMMENDED FOR YOU (BASED ON PREFERRED CATEGORY) */}
      <div style={{ marginBottom: '3.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="section-badge" style={{ backgroundColor: 'var(--mint-subtle)', color: 'var(--primary-green)' }}>
              <i className="fa-solid fa-wand-magic-sparkles"></i> {t('dash_rec_badge')}
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--forest-dark)', margin: 0 }}>
              {t('dash_rec_title')} {tc(currentUser.preferred_category)}
            </h2>
          </div>
          <button onClick={() => navigate('/schemes')} className="btn btn-secondary btn-sm">
            <span>{t('dash_explore_all')}</span> <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>

        <div className="resource-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {recommended.map(res => (
            <ResourceCard key={res.id} resource={res} />
          ))}
        </div>
      </div>

      {/* TWO COLUMN SECTION: SAVED ITEMS & COMMUNITY ACTIVITY */}
      <div className="dash-bottom-grid">
        {/* Saved Items Box */}
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', padding: 'clamp(1.25rem, 2vw, 1.75rem)', boxShadow: 'var(--shadow-sm)', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--forest-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-bookmark" style={{ color: 'var(--amber-warm)' }}></i>
              <span>{t('dash_saved_box')} ({bookmarkedIds.length})</span>
            </h3>
            <button onClick={() => navigate('/bookmarks')} className="btn btn-secondary btn-sm">
              {t('dash_view_all')}
            </button>
          </div>

          {savedResources.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {savedResources.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    background: '#f8fafc',
                    minWidth: 0
                  }}
                >
                  <img
                    src={item.image_url}
                    alt={item.title}
                    style={{ width: '50px', height: '50px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--forest-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {tc(item.category_name)} • {item.provider}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/bookmarks')}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', flexShrink: 0 }}
                  >
                    {t('btn_open')}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <i className="fa-regular fa-bookmark" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#cbd5e1' }}></i>
              <p style={{ fontSize: '0.88rem', margin: 0 }}>{t('dash_saved_empty')}</p>
            </div>
          )}
        </div>

        {/* Recent Community Activity */}
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', padding: 'clamp(1.25rem, 2vw, 1.75rem)', boxShadow: 'var(--shadow-sm)', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--forest-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-comments" style={{ color: 'var(--primary-green)' }}></i>
              <span>{t('dash_discussions_box')}</span>
            </h3>
            <button onClick={() => navigate('/community')} className="btn btn-secondary btn-sm">
              {t('dash_join_forum')}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentPosts.map(post => {
              const postCommentCount = comments.filter(c => c.post_id === post.id).length;
              return (
                <div
                  key={post.id}
                  onClick={() => navigate('/community')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-green)' }}>
                      {tc(post.category)}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <i className="fa-solid fa-comment"></i> {postCommentCount}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--forest-dark)', marginBottom: '0.25rem' }}>
                    {post.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {post.author_name} ({post.author_state})
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
