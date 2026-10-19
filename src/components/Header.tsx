import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LanguageSelector } from './LanguageSelector';

export const Header: React.FC = () => {
  const { currentUser, bookmarkedIds, currentRoute, navigate, logout, t } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const accountRef = useRef<HTMLDivElement>(null);
  const accountBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };

    if (accountOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [accountOpen]);

  // Close menus on route navigation
  useEffect(() => {
    setAccountOpen(false);
    setMobileOpen(false);
  }, [currentRoute]);

  const handleNavClick = (path: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setMobileOpen(false);
    setAccountOpen(false);
    navigate(path);
  };

  const handleAccountBtnKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      if (!accountOpen) {
        e.preventDefault();
        setAccountOpen(true);
        setTimeout(() => {
          menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
        }, 50);
      }
    } else if (e.key === 'Escape') {
      setAccountOpen(false);
    }
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setAccountOpen(false);
      accountBtnRef.current?.focus();
      return;
    }

    const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    if (!items || items.length === 0) return;
    const itemsArray = Array.from(items);
    const currentIndex = itemsArray.indexOf(document.activeElement as HTMLElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex < itemsArray.length - 1 ? currentIndex + 1 : 0;
      itemsArray[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : itemsArray.length - 1;
      itemsArray[prevIndex]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      itemsArray[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      itemsArray[itemsArray.length - 1]?.focus();
    } else if (e.key === 'Tab') {
      setAccountOpen(false);
    }
  };

  const firstName = currentUser?.full_name ? currentUser.full_name.split(' ')[0] : 'Farmer';

  return (
    <>
      <header className="site-header">
        <div className="container">
          <nav className="navbar" aria-label="Main Navigation">
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
                  <i className="fa-solid fa-house"></i>
                  <span>{t('nav_home')}</span>
                </a>
              </li>
              {currentUser && (
                <li>
                  <a
                    href="#/dashboard"
                    className={`nav-link ${currentRoute === '/dashboard' ? 'active' : ''}`}
                    onClick={(e) => handleNavClick('/dashboard', e)}
                  >
                    <i className="fa-solid fa-gauge-high"></i>
                    <span>{t('nav_dashboard')}</span>
                  </a>
                </li>
              )}
              <li>
                <a
                  href="#/crops"
                  className={`nav-link ${currentRoute === '/crops' ? 'active' : ''}`}
                  onClick={(e) => handleNavClick('/crops', e)}
                >
                  <i className="fa-solid fa-seedling"></i>
                  <span>{t('nav_crops')}</span>
                </a>
              </li>
              <li>
                <a
                  href="#/tools"
                  className={`nav-link ${currentRoute === '/tools' ? 'active' : ''}`}
                  onClick={(e) => handleNavClick('/tools', e)}
                >
                  <i className="fa-solid fa-tractor"></i>
                  <span>{t('nav_tools')}</span>
                </a>
              </li>
              <li>
                <a
                  href="#/schemes"
                  className={`nav-link ${currentRoute === '/schemes' ? 'active' : ''}`}
                  onClick={(e) => handleNavClick('/schemes', e)}
                >
                  <i className="fa-solid fa-building-columns"></i>
                  <span>{t('nav_schemes')}</span>
                </a>
              </li>
              <li>
                <a
                  href="#/loans"
                  className={`nav-link ${currentRoute === '/loans' ? 'active' : ''}`}
                  onClick={(e) => handleNavClick('/loans', e)}
                >
                  <i className="fa-solid fa-hand-holding-dollar"></i>
                  <span>{t('nav_loans')}</span>
                </a>
              </li>
              <li>
                <a
                  href="#/resources"
                  className={`nav-link ${currentRoute === '/resources' ? 'active' : ''}`}
                  onClick={(e) => handleNavClick('/resources', e)}
                >
                  <i className="fa-solid fa-book-open"></i>
                  <span>{t('nav_guides')}</span>
                </a>
              </li>
              <li>
                <a
                  href="#/weather"
                  className={`nav-link ${currentRoute === '/weather' ? 'active' : ''}`}
                  onClick={(e) => handleNavClick('/weather', e)}
                >
                  <i className="fa-solid fa-cloud-sun-rain"></i>
                  <span>{t('nav_weather')}</span>
                </a>
              </li>
              <li>
                <a
                  href="#/marketplace"
                  className={`nav-link ${currentRoute === '/marketplace' ? 'active' : ''}`}
                  onClick={(e) => handleNavClick('/marketplace', e)}
                >
                  <i className="fa-solid fa-store"></i>
                  <span>{t('nav_market')}</span>
                </a>
              </li>
              <li>
                <a
                  href="#/community"
                  className={`nav-link ${currentRoute === '/community' ? 'active' : ''}`}
                  onClick={(e) => handleNavClick('/community', e)}
                >
                  <i className="fa-solid fa-people-group"></i>
                  <span>{t('nav_community')}</span>
                </a>
              </li>
            </ul>

            {/* Action / Auth Controls */}
            <div className="nav-actions">
              {/* Multilingual Selector */}
              <LanguageSelector />

              {currentUser ? (
                <>
                  {/* Compact Saved Resources Button */}
                  <button
                    type="button"
                    onClick={() => handleNavClick('/bookmarks')}
                    className={`btn btn-secondary btn-sm nav-saved-btn ${currentRoute === '/bookmarks' ? 'active' : ''}`}
                    title={`${t('bookmarks_title')} (${bookmarkedIds.length})`}
                    aria-label={`${t('bookmarks_title')} (${bookmarkedIds.length})`}
                  >
                    <i className="fa-solid fa-bookmark" style={{ color: 'var(--amber-warm)' }}></i>
                    <span className="nav-saved-count">{bookmarkedIds.length}</span>
                  </button>

                  {/* Compact Account Button with Dropdown */}
                  <div className="account-dropdown-wrapper" ref={accountRef}>
                    <button
                      ref={accountBtnRef}
                      type="button"
                      id="accountMenuBtn"
                      className={`account-btn ${accountOpen ? 'active' : ''}`}
                      onClick={() => setAccountOpen(prev => !prev)}
                      onKeyDown={handleAccountBtnKeyDown}
                      aria-expanded={accountOpen}
                      aria-haspopup="true"
                      aria-controls="accountDropdownMenu"
                      title={`${t('nav_profile')}: ${currentUser.full_name}`}
                      aria-label={`${t('nav_profile')}: ${currentUser.full_name}`}
                    >
                      <div className="user-avatar-mini">
                        <i className="fa-solid fa-user"></i>
                      </div>
                      <span className="account-user-name">{firstName}</span>
                      <i className={`fa-solid fa-chevron-down account-chevron ${accountOpen ? 'open' : ''}`}></i>
                    </button>

                    {accountOpen && (
                      <div
                        id="accountDropdownMenu"
                        ref={menuRef}
                        className="account-dropdown-menu"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="accountMenuBtn"
                        onKeyDown={handleMenuKeyDown}
                      >
                        <div className="account-dropdown-header">
                          <div className="account-header-avatar">
                            <i className="fa-solid fa-user"></i>
                          </div>
                          <div className="account-header-info">
                            <span className="account-header-name">{currentUser.full_name}</span>
                            <span className="account-header-sub">
                              {currentUser.role === 'admin' ? (
                                <span className="admin-tag-mini">
                                  <i className="fa-solid fa-shield-halved"></i> {t('nav_admin')}
                                </span>
                              ) : (
                                <span className="farmer-badge-mini">
                                  <i className="fa-solid fa-wheat-awn"></i> {currentUser.state || t('profile_badge')}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="dropdown-divider" role="separator"></div>

                        <button
                          type="button"
                          role="menuitem"
                          tabIndex={0}
                          className={`account-dropdown-item ${currentRoute === '/profile' ? 'active' : ''}`}
                          onClick={() => {
                            setAccountOpen(false);
                            handleNavClick('/profile');
                          }}
                        >
                          <i className="fa-solid fa-user-gear"></i>
                          <span>{t('nav_profile')}</span>
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          tabIndex={0}
                          className={`account-dropdown-item ${currentRoute === '/dashboard' ? 'active' : ''}`}
                          onClick={() => {
                            setAccountOpen(false);
                            handleNavClick('/dashboard');
                          }}
                        >
                          <i className="fa-solid fa-gauge-high"></i>
                          <span>{t('nav_dashboard')}</span>
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          tabIndex={0}
                          className={`account-dropdown-item ${currentRoute === '/bookmarks' ? 'active' : ''}`}
                          onClick={() => {
                            setAccountOpen(false);
                            handleNavClick('/bookmarks');
                          }}
                        >
                          <i className="fa-solid fa-bookmark" style={{ color: 'var(--amber-warm)' }}></i>
                          <span style={{ flex: 1, textAlign: 'left' }}>{t('bookmarks_title')}</span>
                          <span className="nav-saved-count">{bookmarkedIds.length}</span>
                        </button>

                        {currentUser.role === 'admin' && (
                          <button
                            type="button"
                            role="menuitem"
                            tabIndex={0}
                            className={`account-dropdown-item ${currentRoute === '/admin' ? 'active' : ''}`}
                            onClick={() => {
                              setAccountOpen(false);
                              handleNavClick('/admin');
                            }}
                          >
                            <i className="fa-solid fa-shield-halved" style={{ color: '#b91c1c' }}></i>
                            <span>{t('admin_title')}</span>
                          </button>
                        )}

                        <div className="dropdown-divider" role="separator"></div>

                        <button
                          type="button"
                          role="menuitem"
                          tabIndex={0}
                          className="account-dropdown-item logout-item"
                          onClick={() => {
                            setAccountOpen(false);
                            logout();
                          }}
                        >
                          <i className="fa-solid fa-arrow-right-from-bracket"></i>
                          <span>{t('nav_logout')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleNavClick('/login')}
                    className="btn btn-secondary btn-sm nav-auth-btn"
                    title={t('nav_login')}
                    aria-label={t('nav_login')}
                  >
                    <i className="fa-solid fa-arrow-right-to-bracket"></i>
                    <span className="nav-auth-text">{t('nav_login')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick('/register')}
                    className="btn btn-primary btn-sm nav-auth-btn"
                    title={t('nav_register')}
                    aria-label={t('nav_register')}
                  >
                    <i className="fa-solid fa-user-plus"></i>
                    <span className="nav-auth-text">{t('nav_register')}</span>
                  </button>
                </>
              )}

              {/* Hamburger Button for Mobile */}
              <button
                className={`hamburger-btn ${mobileOpen ? 'active' : ''}`}
                id="hamburgerBtn"
                aria-label="Toggle mobile menu"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                <i className={`fa-solid ${mobileOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* MOBILE NAVIGATION DRAWER */}
      <div className={`mobile-nav-drawer ${mobileOpen ? 'open' : ''}`} id="mobileNavDrawer" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
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
