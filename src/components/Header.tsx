import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LanguageSelector } from './LanguageSelector';

export const Header: React.FC = () => {
  const { currentUser, bookmarkedIds, currentRoute, navigate, logout, t } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (path: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setMobileOpen(false);
    navigate(path);
  };

  const firstName = currentUser?.full_name ? currentUser.full_name.split(' ')[0] : 'Farmer';

  return (
    <>
      <header className="site-header">
        <div className="container">
          <nav className="navbar">
            {/* Logo and Name */}
            <a
              href="#/"
              className="brand-logo"
              title="Kisan Sahayak Homepage"
              onClick={(e) => handleNavClick('/', e)}
            >
              <div className="logo-badge">
                <i className="fa-solid fa-wheat-awn"></i>
              </div>
              <div className="brand-logo-text">
                <span className="brand-title">{t('brand_title')}</span>
                <span className="brand-tagline">{t('brand_tagline')}</span>
              </div>
            </a>

            {/* Desktop Navigation Menu */}
            <ul className="nav-menu">
              <li>
                <a
                  href="#/"
                  className={`nav-link ${currentRoute === '/' ? 'active' : ''}`}
                  onClick={(e) => handleNavClick('/', e)}
                >
                  <i className="fa-solid fa-house"></i> {t('nav_home')}
                </a>
              </li>
              {currentUser && (
                <li>
                  <a
                    href="#/dashboard"
                    className={`nav-link ${currentRoute === '/dashboard' ? 'active' : ''}`}
                    onClick={(e) => handleNavClick('/dashboard', e)}
                  >
                    <i className="fa-solid fa-gauge-high"></i> {t('nav_dashboard')}
                  </a>
                </li>
              )}
              <li>
                <a
                  href="#/crops"
                  className={`nav-link ${currentRoute === '/crops' ? 'active' : ''}`}
                  onClick={(e) => handleNavClick('/crops', e)}
                >
                  <i className="fa-solid fa-seedling"></i> {t('nav_crops')}
                </a>
              </li>
              <li>
                <a
                  href="#/tools"
                  className={`nav-link ${currentRoute === '/tools' ? 'active' : ''}`}
                  onClick={(e) => handleNavClick('/tools', e)}
                >
                  <i className="fa-solid fa-tractor"></i> {t('nav_tools')}
                </a>
              </li>
              <li>
                <a
                  href="#/schemes"
                  className={`nav-link ${currentRoute === '/schemes' ? 'active' : ''}`}
                  onClick={(e) => handleNavClick('/schemes', e)}
                >
                  <i className="fa-solid fa-building-columns"></i> {t('nav_schemes')}
                </a>
              </li>
              <li>
                <a
                  href="#/loans"
                  className={`nav-link ${currentRoute === '/loans' ? 'active' : ''}`}
                  onClick={(e) => handleNavClick('/loans', e)}
                >
                  <i className="fa-solid fa-hand-holding-dollar"></i> {t('nav_loans')}
                </a>
              </li>
              <li>
                <a
                  href="#/resources"
                  className={`nav-link ${currentRoute === '/resources' ? 'active' : ''}`}
                  onClick={(e) => handleNavClick('/resources', e)}
                >
                  <i className="fa-solid fa-book-open"></i> {t('nav_guides')}
                </a>
              </li>
              <li>
                <a
                  href="#/weather"
                  className={`nav-link ${currentRoute === '/weather' ? 'active' : ''}`}
                  onClick={(e) => handleNavClick('/weather', e)}
                >
                  <i className="fa-solid fa-cloud-sun-rain"></i> {t('nav_weather')}
                </a>
              </li>
              <li>
                <a
                  href="#/marketplace"
                  className={`nav-link ${currentRoute === '/marketplace' ? 'active' : ''}`}
                  onClick={(e) => handleNavClick('/marketplace', e)}
                >
                  <i className="fa-solid fa-store"></i> {t('nav_market')}
                </a>
              </li>
              <li>
                <a
                  href="#/community"
                  className={`nav-link ${currentRoute === '/community' ? 'active' : ''}`}
                  onClick={(e) => handleNavClick('/community', e)}
                >
                  <i className="fa-solid fa-people-group"></i> {t('nav_community')}
                </a>
              </li>
            </ul>

            {/* Action / Auth Controls */}
            <div className="nav-actions">
              {/* Multilingual Selector */}
              <LanguageSelector />

              {currentUser ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleNavClick('/bookmarks')}
                    className="btn btn-secondary btn-sm"
                    title={t('bookmarks_title')}
                  >
                    <i className="fa-solid fa-bookmark" style={{ color: 'var(--amber-warm)' }}></i>
                    <span>{t('nav_saved')} ({bookmarkedIds.length})</span>
                  </button>

                  {currentUser.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => handleNavClick('/admin')}
                      className={`btn btn-secondary btn-sm admin-tag ${currentRoute === '/admin' ? 'active' : ''}`}
                      title={t('admin_title')}
                    >
                      <i className="fa-solid fa-shield-halved"></i> {t('nav_admin')}
                    </button>
                  )}

                  <div className="user-badge" onClick={() => handleNavClick('/profile')} style={{ cursor: 'pointer' }}>
                    <div className="user-avatar-mini">
                      <i className="fa-solid fa-user"></i>
                    </div>
                    <span style={{ color: 'inherit', fontWeight: 700 }}>{firstName}</span>
                  </div>

                  <button
                    type="button"
                    onClick={logout}
                    className="btn btn-sm btn-outline-danger"
                    title={t('nav_logout')}
                    aria-label={t('nav_logout')}
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket"></i>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleNavClick('/login')}
                    className="btn btn-secondary btn-sm"
                  >
                    <i className="fa-solid fa-arrow-right-to-bracket"></i> {t('nav_login')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick('/register')}
                    className="btn btn-primary btn-sm"
                  >
                    <i className="fa-solid fa-user-plus"></i> {t('nav_register')}
                  </button>
                </>
              )}

              {/* Hamburger Button for Mobile */}
              <button
                className="hamburger-btn"
                id="hamburgerBtn"
                aria-label="Toggle mobile menu"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                <i className={`fa-solid ${mobileOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* MOBILE NAVIGATION DRAWER */}
      <div className={`mobile-nav-drawer ${mobileOpen ? 'open' : ''}`} id="mobileNavDrawer">
        <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700, color: 'var(--forest-dark)' }}>{t('nav_navigation')}</div>
          {currentUser && (
            <span className="user-badge" style={{ fontSize: '0.8rem' }}>
              <i className="fa-solid fa-user-check"></i> {currentUser.full_name}
            </span>
          )}
        </div>

        {/* Mobile Language Selector */}
        <LanguageSelector isMobile={true} />

        <ul className="mobile-menu-list">
          <li>
            <a
              href="#/"
              className={`mobile-nav-link ${currentRoute === '/' ? 'active' : ''}`}
              onClick={(e) => handleNavClick('/', e)}
            >
              <i className="fa-solid fa-house"></i> {t('nav_home')}
            </a>
          </li>
          {currentUser && (
            <>
              <li>
                <a
                  href="#/dashboard"
                  className={`mobile-nav-link ${currentRoute === '/dashboard' ? 'active' : ''}`}
                  onClick={(e) => handleNavClick('/dashboard', e)}
                >
                  <i className="fa-solid fa-gauge-high"></i> {t('hero_btn_dashboard')}
                </a>
              </li>
              <li>
                <a
                  href="#/bookmarks"
                  className={`mobile-nav-link ${currentRoute === '/bookmarks' ? 'active' : ''}`}
                  onClick={(e) => handleNavClick('/bookmarks', e)}
                >
                  <i className="fa-solid fa-bookmark"></i> {t('bookmarks_title')} ({bookmarkedIds.length})
                </a>
              </li>
              <li>
                <a
                  href="#/profile"
                  className={`mobile-nav-link ${currentRoute === '/profile' ? 'active' : ''}`}
                  onClick={(e) => handleNavClick('/profile', e)}
                >
                  <i className="fa-solid fa-user-gear"></i> {t('profile_title')}
                </a>
              </li>
              {currentUser.role === 'admin' && (
                <li>
                  <a
                    href="#/admin"
                    className="mobile-nav-link"
                    onClick={(e) => handleNavClick('/admin', e)}
                  >
                    <i className="fa-solid fa-shield-halved"></i> {t('admin_title')}
                  </a>
                </li>
              )}
            </>
          )}
          <li>
            <a
              href="#/crops"
              className={`mobile-nav-link ${currentRoute === '/crops' ? 'active' : ''}`}
              onClick={(e) => handleNavClick('/crops', e)}
            >
              <i className="fa-solid fa-seedling"></i> {t('crops_title')}
            </a>
          </li>
          <li>
            <a
              href="#/tools"
              className={`mobile-nav-link ${currentRoute === '/tools' ? 'active' : ''}`}
              onClick={(e) => handleNavClick('/tools', e)}
            >
              <i className="fa-solid fa-tractor"></i> {t('tools_title')}
            </a>
          </li>
          <li>
            <a
              href="#/schemes"
              className={`mobile-nav-link ${currentRoute === '/schemes' ? 'active' : ''}`}
              onClick={(e) => handleNavClick('/schemes', e)}
            >
              <i className="fa-solid fa-building-columns"></i> {t('schemes_title')}
            </a>
          </li>
          <li>
            <a
              href="#/loans"
              className={`mobile-nav-link ${currentRoute === '/loans' ? 'active' : ''}`}
              onClick={(e) => handleNavClick('/loans', e)}
            >
              <i className="fa-solid fa-hand-holding-dollar"></i> {t('loans_title')}
            </a>
          </li>
          <li>
            <a
              href="#/resources"
              className={`mobile-nav-link ${currentRoute === '/resources' ? 'active' : ''}`}
              onClick={(e) => handleNavClick('/resources', e)}
            >
              <i className="fa-solid fa-book-open"></i> {t('guides_title')}
            </a>
          </li>
          <li>
            <a
              href="#/weather"
              className={`mobile-nav-link ${currentRoute === '/weather' ? 'active' : ''}`}
              onClick={(e) => handleNavClick('/weather', e)}
            >
              <i className="fa-solid fa-cloud-sun-rain"></i> {t('weather_title')}
            </a>
          </li>
          <li>
            <a
              href="#/marketplace"
              className={`mobile-nav-link ${currentRoute === '/marketplace' ? 'active' : ''}`}
              onClick={(e) => handleNavClick('/marketplace', e)}
            >
              <i className="fa-solid fa-store"></i> {t('market_title')}
            </a>
          </li>
          <li>
            <a
              href="#/community"
              className={`mobile-nav-link ${currentRoute === '/community' ? 'active' : ''}`}
              onClick={(e) => handleNavClick('/community', e)}
            >
              <i className="fa-solid fa-people-group"></i> {t('community_title')}
            </a>
          </li>

          <li style={{ marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
            {currentUser ? (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="btn btn-outline-danger"
                style={{ width: '100%' }}
              >
                <i className="fa-solid fa-arrow-right-from-bracket"></i> {t('nav_logout')}
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleNavClick('/login')}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  <i className="fa-solid fa-arrow-right-to-bracket"></i> {t('nav_login')}
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('/register')}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  <i className="fa-solid fa-user-plus"></i> {t('nav_register')}
                </button>
              </div>
            )}
          </li>
        </ul>
      </div>
    </>
  );
};
