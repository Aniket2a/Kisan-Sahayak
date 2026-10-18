import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const AdminPage: React.FC = () => {
  const {
    currentUser,
    resources,
    users,
    categories,
    feedback,
    communityPosts,
    comments,
    likes,
    bookmarkedIds,
    ratingsMap,
    deleteResource,
    openAdminModal,
    toggleUserRole,
    deleteUser,
    deletePost,
    deleteFeedback,
    navigate,
    t,
    tc,
    getLocResource
  } = useApp();

  const [activeTab, setActiveTab] = useState<'resources' | 'users' | 'community' | 'feedback'>('resources');
  const [resourceFilter, setResourceFilter] = useState('');

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="container" style={{ paddingTop: '5rem', paddingBottom: '5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', background: '#fff', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)' }}>
          <i className="fa-solid fa-shield-halved" style={{ fontSize: '3rem', color: '#b91c1c', marginBottom: '1.25rem' }}></i>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--forest-dark)', marginBottom: '0.75rem' }}>
            {t('admin_access_required_title')}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
            {t('admin_access_required_desc')}
          </p>
          <button onClick={() => navigate('/login')} className="btn btn-primary">
            <i className="fa-solid fa-arrow-right-to-bracket"></i> {t('admin_login_btn')}
          </button>
        </div>
      </div>
    );
  }

  const avgRating =
    feedback.length > 0
      ? (feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length).toFixed(1)
      : '5.0';

  const stats = {
    total_users: users.length,
    total_resources: resources.length,
    total_categories: categories.length,
    total_bookmarks: bookmarkedIds.length,
    total_posts: communityPosts.length,
    total_feedback: feedback.length,
    avg_rating: avgRating
  };

  const filteredResources = resources.filter(r => {
    if (!resourceFilter.trim()) return true;
    const q = resourceFilter.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.category_name.toLowerCase().includes(q) ||
      r.resource_type.toLowerCase().includes(q) ||
      r.provider.toLowerCase().includes(q)
    );
  });

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      {/* PAGE HEADER */}
      <div className="section-header" style={{ textAlign: 'left', marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="section-badge" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', borderColor: '#fca5a5' }}>
            <i className="fa-solid fa-shield-halved"></i> {t('admin_portal_badge')}
          </span>
          <h1 className="section-title" style={{ marginBottom: '0.25rem' }}>{t('admin_title')}</h1>
          <p className="section-subtitle" style={{ margin: 0 }}>
            {t('admin_sub')}
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => openAdminModal(null)}>
          <i className="fa-solid fa-plus"></i> {t('admin_add_btn')}
        </button>
      </div>

      {/* ADMIN METRICS KPI CARDS */}
      <div className="admin-metrics-grid" style={{ marginBottom: '2rem' }}>
        <div className="admin-metric-card">
          <div className="admin-metric-val">{stats.total_users}</div>
          <div className="admin-metric-label"><i className="fa-solid fa-users"></i> {t('admin_total_users')}</div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-val" style={{ color: '#0284c7' }}>{stats.total_resources}</div>
          <div className="admin-metric-label"><i className="fa-solid fa-layer-group"></i> {t('admin_total_resources')}</div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-val" style={{ color: '#059669' }}>{stats.total_categories}</div>
          <div className="admin-metric-label"><i className="fa-solid fa-tags"></i> {t('admin_categories')}</div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-val" style={{ color: '#d97706' }}>{stats.total_bookmarks}</div>
          <div className="admin-metric-label"><i className="fa-solid fa-bookmark"></i> {t('admin_total_bookmarks')}</div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-val" style={{ color: '#9333ea' }}>{stats.total_posts}</div>
          <div className="admin-metric-label"><i className="fa-solid fa-comments"></i> {t('admin_community_posts')}</div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-val" style={{ color: '#ea580c' }}>★ {stats.avg_rating}</div>
          <div className="admin-metric-label"><i className="fa-solid fa-star"></i> {t('admin_avg_rating')} ({stats.total_feedback})</div>
        </div>
      </div>

      {/* TABBED NAVIGATION STRIP */}
      <div className="filter-search-strip" style={{ marginBottom: '1.5rem' }}>
        <div className="filter-pills-row">
          <button
            type="button"
            className={`filter-pill ${activeTab === 'resources' ? 'active' : ''}`}
            onClick={() => setActiveTab('resources')}
          >
            <i className="fa-solid fa-database"></i> {t('admin_tab_resources')} ({resources.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="fa-solid fa-users-gear"></i> {t('admin_tab_users')} ({users.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${activeTab === 'community' ? 'active' : ''}`}
            onClick={() => setActiveTab('community')}
          >
            <i className="fa-solid fa-comments"></i> {t('admin_tab_community')} ({communityPosts.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${activeTab === 'feedback' ? 'active' : ''}`}
            onClick={() => setActiveTab('feedback')}
          >
            <i className="fa-solid fa-star-half-stroke"></i> {t('admin_tab_feedback')} ({feedback.length})
          </button>
        </div>
      </div>

      {/* TAB 1: MANAGE RESOURCES */}
      {activeTab === 'resources' && (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--forest-dark)', margin: 0 }}>
              {t('admin_tab_resources')}
            </h3>
            <input
              type="text"
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              placeholder={t('admin_filter_placeholder')}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                fontSize: '0.88rem',
                minWidth: '240px'
              }}
            />
          </div>

          <div className="admin-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="mandi-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--mint-bg)', borderBottom: '2px solid var(--border-green)' }}>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('admin_col_id')}</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('admin_col_title')} & {t('admin_col_provider')}</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('admin_col_type')}</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('admin_col_category')}</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('admin_col_rating')}</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('admin_col_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.map(r => {
                  const loc = getLocResource(r);
                  const ratingInfo = ratingsMap[r.id] || { avg: 5.0, count: 1 };
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 700 }}>#{r.id}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--forest-dark)', fontSize: '0.92rem' }}>{loc.title}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{loc.provider}</div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className="section-badge" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', textTransform: 'capitalize' }}>
                          {tc(loc.resource_type)}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{tc(loc.category_name)}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                        <span style={{ color: '#f59e0b', fontWeight: 700 }}>★ {ratingInfo.avg}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}> ({ratingInfo.count})</span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            onClick={() => openAdminModal(r)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                            title={t('admin_btn_edit')}
                          >
                            <i className="fa-solid fa-pen-to-square"></i> {t('admin_btn_edit')}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteResource(r.id)}
                            className="btn btn-outline-danger btn-sm"
                            style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                            title={t('admin_btn_delete')}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE USERS */}
      {activeTab === 'users' && (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--forest-dark)', marginBottom: '1.25rem' }}>
            {t('admin_tab_users')}
          </h3>

          <div className="admin-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="mandi-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--mint-bg)', borderBottom: '2px solid var(--border-green)' }}>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('admin_col_id')}</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('admin_col_name')}</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('admin_col_email')}</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('admin_col_state')}</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('profile_focus_cat')}</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('admin_col_role')}</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('admin_col_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>#{u.id}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--forest-dark)', fontSize: '0.9rem' }}>{u.full_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{u.email}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{u.state}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{tc(u.preferred_category)}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span
                        className="section-badge"
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.2rem 0.5rem',
                          backgroundColor: u.role === 'admin' ? '#fee2e2' : 'var(--mint-subtle)',
                          color: u.role === 'admin' ? '#b91c1c' : 'var(--primary-green)'
                        }}
                      >
                        {u.role === 'admin' ? t('role_admin') : t('role_farmer')}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {u.id !== currentUser.id && (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleUserRole(u.id)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                            >
                              {u.role === 'admin' ? t('admin_btn_make_user') : t('admin_btn_make_admin')}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteUser(u.id)}
                              className="btn btn-outline-danger btn-sm"
                              style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </>
                        )}
                        {u.id === currentUser.id && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            ({t('nav_admin')})
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: COMMUNITY POSTS */}
      {activeTab === 'community' && (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--forest-dark)', marginBottom: '1.25rem' }}>
            {t('admin_tab_community')}
          </h3>

          <div className="admin-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="mandi-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--mint-bg)', borderBottom: '2px solid var(--border-green)' }}>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('admin_col_id')}</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('admin_col_author')}</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('admin_col_post')}</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('admin_col_category')}</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('admin_col_likes')} & {t('admin_col_comments')}</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('admin_col_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {communityPosts.map(p => {
                  const pComments = comments.filter(c => c.post_id === p.id).length;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 700 }}>#{p.id}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                        <strong>{p.author_name}</strong> ({p.author_state})
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.88rem', fontWeight: 600, color: 'var(--forest-dark)' }}>
                        {p.title}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{tc(p.category)}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                        ♥ {p.like_count} • 💬 {pComments}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <button
                          type="button"
                          onClick={() => deletePost(p.id)}
                          className="btn btn-outline-danger btn-sm"
                          style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                        >
                          <i className="fa-solid fa-trash-can"></i> {t('admin_btn_delete')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: FEEDBACK & REVIEWS */}
      {activeTab === 'feedback' && (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--forest-dark)', marginBottom: '1.25rem' }}>
            {t('admin_tab_feedback')}
          </h3>

          <div className="admin-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="mandi-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--mint-bg)', borderBottom: '2px solid var(--border-green)' }}>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('admin_col_id')}</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('admin_col_name')}</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('admin_col_resource')}</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('admin_col_rating')}</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('admin_col_feedback')}</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t('admin_col_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {feedback.map(fb => (
                  <tr key={fb.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>#{fb.id}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{fb.user_name}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', fontWeight: 600 }}>{fb.resource_title || `#${fb.resource_id}`}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#f59e0b', fontWeight: 700 }}>
                      {'★'.repeat(fb.rating)} ({fb.rating}/5)
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-main)', maxWidth: '300px' }}>
                      {fb.comment}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => deleteFeedback(fb.id)}
                        className="btn btn-outline-danger btn-sm"
                        style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                      >
                        <i className="fa-solid fa-trash-can"></i> {t('admin_btn_delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
