import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SAMPLE_MANDI_PRICES, INDIAN_STATES } from '../data/seedData';
import { ResourceCard } from '../components/ResourceCard';

export const MarketplacePage: React.FC = () => {
  const { resources, t, tc, getLocResource } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [mandiSearch, setMandiSearch] = useState<string>('');

  const categories = [
    'All',
    'Government Marketplaces',
    'Agricultural Market Prices',
    'Buy Seeds & Fertilizers',
    'Buy Equipment & Seeds',
    'Sell Crops',
    'Buy Seeds',
    'Buy Farming Equipment',
    'Fertilizers'
  ];

  const marketResources = useMemo(() => {
    return resources
      .filter(r => r.resource_type === 'marketplace')
      .map(r => getLocResource(r))
      .filter(r => {
        if (activeCategory === 'All') return true;
        const cat = activeCategory.toLowerCase();
        return (
          r.category_name.toLowerCase().includes(cat) ||
          r.title.toLowerCase().includes(cat) ||
          (cat.includes('seeds') && r.category_name.toLowerCase().includes('seeds')) ||
          (cat.includes('fertilizer') && (r.category_name.toLowerCase().includes('fertilizer') || r.description.toLowerCase().includes('fertilizer') || r.description.toLowerCase().includes('उर्वरक') || r.description.toLowerCase().includes('खते'))) ||
          (cat.includes('equipment') && (r.category_name.toLowerCase().includes('equipment') || r.description.toLowerCase().includes('equipment') || r.description.toLowerCase().includes('उपकरण') || r.description.toLowerCase().includes('अवजारे'))) ||
          (cat.includes('marketplace') && (r.category_name.toLowerCase().includes('mandi') || r.category_name.toLowerCase().includes('market')))
        );
      })
      .filter(r => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.provider.toLowerCase().includes(q)
        );
      });
  }, [resources, activeCategory, searchQuery, getLocResource]);

  const filteredMandiPrices = useMemo(() => {
    return SAMPLE_MANDI_PRICES
      .filter(m => {
        if (selectedState === 'All') return true;
        return m.state?.toLowerCase() === selectedState.toLowerCase();
      })
      .filter(m => {
        if (!mandiSearch.trim()) return true;
        const q = mandiSearch.toLowerCase().trim();
        return (
          m.crop.toLowerCase().includes(q) ||
          m.mandi.toLowerCase().includes(q) ||
          (m.state && m.state.toLowerCase().includes(q))
        );
      });
  }, [selectedState, mandiSearch]);

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      {/* PAGE HEADER */}
      <div className="section-header" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
        <span className="section-badge" style={{ backgroundColor: '#f3e8ff', color: '#9333ea', borderColor: '#e9d5ff' }}>
          <i className="fa-solid fa-store"></i> {t('market_badge')}
        </span>
        <h1 className="section-title">{t('market_title')}</h1>
        <p className="section-subtitle" style={{ margin: 0 }}>
          {t('market_sub')}
        </p>
      </div>

      {/* SECTION 1: VERIFIED AGRI COMMERCE PLATFORMS */}
      <div style={{ marginBottom: '3.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--forest-dark)', margin: 0 }}>
            {t('market_portals_heading')}
          </h2>
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
        </div>

        <div className="resource-grid">
          {marketResources.map(portal => (
            <ResourceCard key={portal.id} resource={portal} />
          ))}
        </div>
      </div>

      {/* SECTION 2: LIVE APMC MANDI WHOLESALE SPOT RATES */}
      <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', padding: 'clamp(1.25rem, 2.5vw, 2rem)', boxShadow: 'var(--shadow-sm)', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.75rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="section-badge" style={{ backgroundColor: 'var(--mint-subtle)', color: 'var(--primary-green)', fontSize: '0.75rem' }}>
                <i className="fa-solid fa-satellite-dish"></i> {t('market_tracker_badge')}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('market_tracker_sub')}</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--forest-dark)', margin: 0 }}>
              {t('market_tracker_title')}
            </h2>
          </div>

          {/* Filter Controls */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                fontSize: '0.88rem',
                backgroundColor: '#fff',
                cursor: 'pointer'
              }}
            >
              <option value="All">{t('market_filter_state')}</option>
              {INDIAN_STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <div style={{ position: 'relative', width: '220px' }}>
              <input
                type="text"
                value={mandiSearch}
                onChange={(e) => setMandiSearch(e.target.value)}
                placeholder={t('market_filter_placeholder')}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem 0.55rem 2rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.88rem'
                }}
              />
              <i
                className="fa-solid fa-magnifying-glass"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }}
              ></i>
            </div>
          </div>
        </div>

        {/* Mandi Table */}
        <div className="admin-table-wrap" style={{ overflowX: 'auto' }}>
          <table className="mandi-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--mint-bg)', borderBottom: '2px solid var(--border-green)' }}>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--forest-dark)', fontWeight: 700 }}>{t('market_col_commodity')}</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--forest-dark)', fontWeight: 700 }}>{t('market_col_mandi')}</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--forest-dark)', fontWeight: 700 }}>{t('market_col_state')}</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--forest-dark)', fontWeight: 700 }}>{t('market_col_rate')}</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--forest-dark)', fontWeight: 700 }}>{t('market_col_trend')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredMandiPrices.length > 0 ? (
                filteredMandiPrices.map((row, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--forest-dark)' }}>
                      <i className="fa-solid fa-wheat-awn" style={{ color: 'var(--amber-warm)', marginRight: '0.5rem' }}></i>
                      {row.crop}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                      {row.mandi}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <span className="section-badge" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}>
                        {row.state}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--forest-dark)', fontSize: '1.05rem' }}>
                      ₹{row.price.toLocaleString('en-IN')}{' '}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>{t('market_per_quintal')}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          backgroundColor:
                            row.trend === 'up' ? '#dcfce7' : row.trend === 'down' ? '#fee2e2' : '#f1f5f9',
                          color:
                            row.trend === 'up' ? '#15803d' : row.trend === 'down' ? '#b91c1c' : '#475569'
                        }}
                      >
                        <i
                          className={`fa-solid ${
                            row.trend === 'up'
                              ? 'fa-arrow-trend-up'
                              : row.trend === 'down'
                              ? 'fa-arrow-trend-down'
                              : 'fa-minus'
                          }`}
                        ></i>
                        {row.change}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {t('market_empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
