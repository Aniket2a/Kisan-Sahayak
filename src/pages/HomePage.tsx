import React from 'react';
import { useApp } from '../context/AppContext';
import { ResourceCard } from '../components/ResourceCard';

export const HomePage: React.FC = () => {
  const { resources, categories, currentUser, navigate, t } = useApp();

  const stats = {
    resources: resources.length,
    schemes: resources.filter(r => r.resource_type === 'scheme').length,
    crops: resources.filter(r => r.resource_type === 'crop').length,
    tools: resources.filter(r => r.resource_type === 'tool').length,
    guides: resources.filter(r => r.resource_type === 'guide').length,
    categories: categories.length
  };

  const featuredSchemes = resources
    .filter(r => r.resource_type === 'scheme')
    .sort((a, b) => b.views_count - a.views_count)
    .slice(0, 3);

  const featuredCrops = resources
    .filter(r => r.resource_type === 'crop')
    .sort((a, b) => b.views_count - a.views_count)
    .slice(0, 4);

  const featuredGuides = resources
    .filter(r => r.resource_type === 'guide')
    .sort((a, b) => b.views_count - a.views_count)
    .slice(0, 3);

  return (
    <div>
      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-content">
              <div className="hero-tag">
                <i className="fa-solid fa-seedling"></i>
                <span>{t('hero_tag')}</span>
              </div>
              <h1 className="hero-title">
                {t('hero_title_1')}<span>{t('hero_title_highlight')}</span>
              </h1>
              <p className="hero-subtitle">
                {t('hero_subtitle')}
              </p>
              <div className="hero-actions">
                <button
                  type="button"
                  onClick={() => navigate('/schemes')}
                  className="btn btn-accent btn-lg"
                >
                  <i className="fa-solid fa-compass"></i> {t('hero_btn_explore')}
                </button>
                {currentUser ? (
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="btn btn-secondary btn-lg"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                  >
                    <i className="fa-solid fa-gauge-high"></i> {t('hero_btn_dashboard')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="btn btn-secondary btn-lg"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                  >
                    <i className="fa-solid fa-user-plus"></i> {t('hero_btn_join')}
                  </button>
                )}
              </div>
            </div>

            {/* Hero Visual Card */}
            <div className="hero-visual">
              <div className="hero-card-showcase">
                <div className="hero-card-header">
                  <div className="hero-card-icon">
                    <i className="fa-solid fa-sun-plant-wilt"></i>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>{t('hero_card_title')}</h3>
                    <p style={{ fontSize: '0.82rem', color: '#d1fae5', margin: 0 }}>{t('hero_card_sub')}</p>
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#86efac', marginBottom: '0.4rem' }}>
                    <span><i className="fa-solid fa-shield-halved"></i> PM-KISAN & PMFBY</span>
                    <span style={{ color: '#fef08a', fontWeight: 700 }}>{t('hero_card_live')}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.4, margin: 0 }}>
                    {t('hero_card_p')}
                  </p>
                </div>

                <div className="hero-stats-mini-grid">
                  <div className="hero-stat-pill">
                    <span className="num">₹6,000/yr</span>
                    <span className="label">{t('hero_stat_pmkisan')}</span>
                  </div>
                  <div className="hero-stat-pill">
                    <span className="num">4% Int.</span>
                    <span className="label">{t('hero_stat_kcc')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMIC STATISTICS STRIP */}
      <section className="stats-strip">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-icon-wrap">
                <i className="fa-solid fa-book-open-reader"></i>
              </div>
              <div>
                <div className="stat-number">{stats.resources}+</div>
                <div className="stat-label">{t('stats_resources')}</div>
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-icon-wrap" style={{ color: '#0284c7', backgroundColor: '#e0f2fe' }}>
                <i className="fa-solid fa-building-columns"></i>
              </div>
              <div>
                <div className="stat-number">{stats.schemes}+</div>
                <div className="stat-label">{t('stats_schemes')}</div>
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-icon-wrap" style={{ color: '#d97706', backgroundColor: '#fef3c7' }}>
                <i className="fa-solid fa-wheat-awn"></i>
              </div>
              <div>
                <div className="stat-number">{stats.crops}+</div>
                <div className="stat-label">{t('stats_crops')}</div>
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-icon-wrap" style={{ color: '#059669', backgroundColor: '#d1fae5' }}>
                <i className="fa-solid fa-layer-group"></i>
              </div>
              <div>
                <div className="stat-number">{stats.categories}+</div>
                <div className="stat-label">{t('stats_categories')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EVERYTHING A FARMER NEEDS (8 MAIN MODULES) */}
      <section style={{ padding: '5rem 0', backgroundColor: 'var(--bg-page)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-badge">{t('dir_badge')}</span>
            <h2 className="section-title">{t('dir_title')}</h2>
            <p className="section-subtitle">
              {t('dir_sub')}
            </p>
          </div>

          <div className="features-grid">
            {/* 1. Seeds & Crops */}
            <div className="feature-card">
              <div className="feature-icon green">
                <i className="fa-solid fa-seedling"></i>
              </div>
              <h3 className="feature-title">{t('mod_crops_title')}</h3>
              <p className="feature-desc">
                {t('mod_crops_desc')}
              </p>
              <button onClick={() => navigate('/crops')} className="btn btn-secondary">
                <span>{t('mod_crops_btn')}</span> <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>

            {/* 2. Farming Tools */}
            <div className="feature-card">
              <div className="feature-icon blue">
                <i className="fa-solid fa-tractor"></i>
              </div>
              <h3 className="feature-title">{t('mod_tools_title')}</h3>
              <p className="feature-desc">
                {t('mod_tools_desc')}
              </p>
              <button onClick={() => navigate('/tools')} className="btn btn-secondary">
                <span>{t('mod_tools_btn')}</span> <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>

            {/* 3. Government Schemes */}
            <div className="feature-card">
              <div className="feature-icon amber">
                <i className="fa-solid fa-building-columns"></i>
              </div>
              <h3 className="feature-title">{t('mod_schemes_title')}</h3>
              <p className="feature-desc">
                {t('mod_schemes_desc')}
              </p>
              <button onClick={() => navigate('/schemes')} className="btn btn-secondary">
                <span>{t('mod_schemes_btn')}</span> <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>

            {/* 4. Loans & Subsidies */}
            <div className="feature-card">
              <div className="feature-icon emerald">
                <i className="fa-solid fa-hand-holding-dollar"></i>
              </div>
              <h3 className="feature-title">{t('mod_loans_title')}</h3>
              <p className="feature-desc">
                {t('mod_loans_desc')}
              </p>
              <button onClick={() => navigate('/loans')} className="btn btn-secondary">
                <span>{t('mod_loans_btn')}</span> <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>

            {/* 5. Farming Resources */}
            <div className="feature-card">
              <div className="feature-icon orange">
                <i className="fa-solid fa-book-open"></i>
              </div>
              <h3 className="feature-title">{t('mod_resources_title')}</h3>
              <p className="feature-desc">
                {t('mod_resources_desc')}
              </p>
              <button onClick={() => navigate('/resources')} className="btn btn-secondary">
                <span>{t('mod_resources_btn')}</span> <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>

            {/* 6. Weather & Farm Tips */}
            <div className="feature-card">
              <div className="feature-icon sky">
                <i className="fa-solid fa-cloud-sun-rain"></i>
              </div>
              <h3 className="feature-title">{t('mod_weather_title')}</h3>
              <p className="feature-desc">
                {t('mod_weather_desc')}
              </p>
              <button onClick={() => navigate('/weather')} className="btn btn-secondary">
                <span>{t('mod_weather_btn')}</span> <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>

            {/* 7. Agri Marketplace */}
            <div className="feature-card">
              <div className="feature-icon purple">
                <i className="fa-solid fa-store"></i>
              </div>
              <h3 className="feature-title">{t('mod_market_title')}</h3>
              <p className="feature-desc">
                {t('mod_market_desc')}
              </p>
              <button onClick={() => navigate('/marketplace')} className="btn btn-secondary">
                <span>{t('mod_market_btn')}</span> <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>

            {/* 8. Farmer Community */}
            <div className="feature-card">
              <div className="feature-icon rose">
                <i className="fa-solid fa-people-group"></i>
              </div>
              <h3 className="feature-title">{t('mod_community_title')}</h3>
              <p className="feature-desc">
                {t('mod_community_desc')}
              </p>
              <button onClick={() => navigate('/community')} className="btn btn-secondary">
                <span>{t('mod_community_btn')}</span> <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED GOVERNMENT SCHEMES */}
      <section style={{ padding: '4.5rem 0', backgroundColor: '#fff' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="section-badge" style={{ backgroundColor: 'var(--amber-light)', color: 'var(--amber-warm)', borderColor: '#fde68a' }}>
                <i className="fa-solid fa-shield-halved"></i> {t('feat_schemes_badge')}
              </span>
              <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>{t('feat_schemes_title')}</h2>
              <p className="section-subtitle" style={{ margin: 0 }}>
                {t('feat_schemes_sub')}
              </p>
            </div>
            <button onClick={() => navigate('/schemes')} className="btn btn-secondary">
              <span>{t('feat_schemes_all')} ({stats.schemes})</span> <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>

          <div className="resource-grid">
            {featuredSchemes.map(s => (
              <ResourceCard key={s.id} resource={s} />
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED SEEDS & CROPS */}
      <section style={{ padding: '4.5rem 0', backgroundColor: 'var(--mint-bg)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="section-badge">
                <i className="fa-solid fa-seedling"></i> {t('feat_crops_badge')}
              </span>
              <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>{t('feat_crops_title')}</h2>
              <p className="section-subtitle" style={{ margin: 0 }}>
                {t('feat_crops_sub')}
              </p>
            </div>
            <button onClick={() => navigate('/crops')} className="btn btn-secondary">
              <span>{t('feat_crops_all')} ({stats.crops})</span> <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>

          <div className="resource-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {featuredCrops.map(c => (
              <ResourceCard key={c.id} resource={c} />
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED FARMING GUIDES */}
      <section style={{ padding: '4.5rem 0', backgroundColor: '#fff' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="section-badge" style={{ backgroundColor: '#e0f2fe', color: '#0284c7', borderColor: '#bae6fd' }}>
                <i className="fa-solid fa-book-open"></i> {t('feat_guides_badge')}
              </span>
              <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>{t('feat_guides_title')}</h2>
              <p className="section-subtitle" style={{ margin: 0 }}>
                {t('feat_guides_sub')}
              </p>
            </div>
            <button onClick={() => navigate('/resources')} className="btn btn-secondary">
              <span>{t('feat_guides_all')} ({stats.guides})</span> <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>

          <div className="resource-grid">
            {featuredGuides.map(g => (
              <ResourceCard key={g.id} resource={g} />
            ))}
          </div>
        </div>
      </section>

      {/* JOIN CTA SECTION */}
      <section style={{ padding: '4.5rem 0', background: 'linear-gradient(135deg, var(--forest-deep) 0%, var(--forest-dark) 100%)', color: '#fff', textAlign: 'center' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <span className="hero-tag" style={{ background: 'rgba(255,255,255,0.1)', color: '#86efac', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '1.25rem', display: 'inline-flex' }}>
              <i className="fa-solid fa-handshake"></i> {t('cta_tag')}
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>
              {t('cta_title')}
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#d1fae5', lineHeight: 1.6, marginBottom: '2rem' }}>
              {t('cta_sub')}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {currentUser ? (
                <button onClick={() => navigate('/dashboard')} className="btn btn-accent btn-lg">
                  <i className="fa-solid fa-gauge-high"></i> {t('cta_dashboard')}
                </button>
              ) : (
                <>
                  <button onClick={() => navigate('/register')} className="btn btn-accent btn-lg">
                    <i className="fa-solid fa-user-plus"></i> {t('cta_register')}
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="btn btn-secondary btn-lg"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                  >
                    <i className="fa-solid fa-arrow-right-to-bracket"></i> {t('cta_login')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
