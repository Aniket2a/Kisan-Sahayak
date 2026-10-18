import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ResourceCard } from '../components/ResourceCard';

export const CropsPage: React.FC = () => {
  const { resources, t, tc, getLocResource } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'Cereals', 'Pulses', 'Vegetables', 'Cash Crops', 'Oilseeds'];

  const filteredCrops = useMemo(() => {
    return resources
      .filter(r => r.resource_type === 'crop')
      .map(r => getLocResource(r))
      .filter(r => {
        if (activeCategory === 'All') return true;
        return (
          r.category_name.toLowerCase().includes(activeCategory.toLowerCase()) ||
          r.season_climate.toLowerCase().includes(activeCategory.toLowerCase())
        );
      })
      .filter(r => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.season_climate.toLowerCase().includes(q) ||
          r.provider.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.views_count - a.views_count);
  }, [resources, activeCategory, searchQuery, getLocResource]);

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      {/* PAGE HEADER */}
      <div className="section-header" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
        <span className="section-badge">
          <i className="fa-solid fa-seedling"></i> {t('crops_badge')}
        </span>
        <h1 className="section-title">{t('crops_title')}</h1>
        <p className="section-subtitle" style={{ margin: 0 }}>
          {t('crops_sub')}
        </p>
      </div>

      {/* FILTER & SEARCH STRIP */}
      <div className="filter-search-strip" style={{ marginBottom: '2rem' }}>
        <div className="filter-pills-row">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              className={`filter-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {tc(cat)}
            </button>
          ))}
        </div>

        <div className="search-box-wrap" style={{ position: 'relative', width: '100%', maxWidth: '100%' }}>
          <i
            className="fa-solid fa-magnifying-glass"
            style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          ></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('crops_search_placeholder')}
            style={{
              width: '100%',
              padding: '0.65rem 1rem 0.65rem 2.5rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-light)',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-circle-xmark"></i>
            </button>
          )}
        </div>
      </div>

      {/* CROPS GRID */}
      {filteredCrops.length > 0 ? (
        <div className="resource-grid">
          {filteredCrops.map(crop => (
            <ResourceCard key={crop.id} resource={crop} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
          <i className="fa-solid fa-seedling" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '1rem' }}></i>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--forest-dark)', marginBottom: '0.5rem' }}>
            {t('no_results_matching')} "{searchQuery}"
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            {t('adjust_filters_hint')}
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setActiveCategory('All');
              setSearchQuery('');
            }}
          >
            {t('btn_reset')}
          </button>
        </div>
      )}
    </div>
  );
};
