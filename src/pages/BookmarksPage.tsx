import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ResourceCard } from '../components/ResourceCard';

export const BookmarksPage: React.FC = () => {
  const { currentUser, resources, bookmarkedIds, navigate, t, tc } = useApp();
  const [activeType, setActiveType] = useState<string>('All');

  if (!currentUser) {
    return (
      <div className="container" style={{ paddingTop: '5rem', paddingBottom: '5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', background: '#fff', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
          <i className="fa-solid fa-bookmark" style={{ fontSize: '3rem', color: 'var(--amber-warm)', marginBottom: '1.25rem' }}></i>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--forest-dark)', marginBottom: '0.75rem' }}>
            {t('bookmarks_title')}
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

  const types = [
    { key: 'All', label: t('bookmarks_all_items') },
    { key: 'scheme', label: t('mod_schemes_title') },
    { key: 'crop', label: t('mod_crops_title') },
    { key: 'tool', label: t('mod_tools_title') },
    { key: 'loan', label: t('mod_loans_title') },
    { key: 'guide', label: t('mod_resources_title') },
    { key: 'marketplace', label: t('mod_market_title') }
  ];

  const savedResources = useMemo(() => {
    return resources
      .filter(r => bookmarkedIds.includes(r.id))
      .filter(r => {
        if (activeType === 'All') return true;
        return r.resource_type === activeType;
      });
  }, [resources, bookmarkedIds, activeType]);

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      {/* PAGE HEADER */}
      <div className="section-header" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
        <span className="section-badge" style={{ backgroundColor: 'var(--amber-light)', color: 'var(--amber-warm)', borderColor: '#fde68a' }}>
          <i className="fa-solid fa-bookmark"></i> {t('bookmarks_badge')}
        </span>
        <h1 className="section-title">{t('bookmarks_title')} ({bookmarkedIds.length})</h1>
        <p className="section-subtitle" style={{ margin: 0 }}>
          {t('bookmarks_sub')}
        </p>
      </div>

      {/* FILTER PILLS */}
      <div className="filter-search-strip" style={{ marginBottom: '2rem' }}>
        <div className="filter-pills-row">
          {types.map(item => (
            <button
              key={item.key}
              type="button"
              className={`filter-pill ${activeType === item.key ? 'active' : ''}`}
              onClick={() => setActiveType(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* SAVED ITEMS GRID */}
      {savedResources.length > 0 ? (
        <div className="resource-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
          {savedResources.map(res => (
            <ResourceCard key={res.id} resource={res} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
          <i className="fa-regular fa-bookmark" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '1rem' }}></i>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--forest-dark)', marginBottom: '0.5rem' }}>
            {t('bookmarks_empty_title')}
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            {t('bookmarks_empty_sub')}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button onClick={() => navigate('/schemes')} className="btn btn-primary">
              <i className="fa-solid fa-building-columns"></i> {t('bookmarks_browse_schemes')}
            </button>
            <button onClick={() => navigate('/crops')} className="btn btn-secondary">
              <i className="fa-solid fa-seedling"></i> {t('bookmarks_browse_crops')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
