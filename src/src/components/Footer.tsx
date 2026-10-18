import React from 'react';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const { navigate, t } = useApp();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-col">
            <div className="footer-brand">
              <div className="logo-badge" style={{ width: '38px', height: '38px', fontSize: '1.1rem' }}>
                <i className="fa-solid fa-wheat-awn"></i>
              </div>
              <span className="brand-title" style={{ color: '#fff', fontSize: '1.25rem' }}>
                {t('brand_title')}
              </span>
            </div>
            <p className="footer-text">
              {t('footer_text')}
            </p>
            <div className="footer-social-links">
              <span className="social-pill" title="National Agriculture Portal">
                <i className="fa-solid fa-earth-asia"></i> {t('footer_pan_india')}
              </span>
              <span className="social-pill" title="DBT Enabled">
                <i className="fa-solid fa-shield-check"></i> {t('footer_dbt_verified')}
              </span>
              <span className="social-pill" title="Multi-lingual">
                <i className="fa-solid fa-language"></i> {t('footer_multilingual')}
              </span>
            </div>
          </div>

          {/* Quick Access */}
          <div className="footer-col">
            <h4 className="footer-heading">{t('footer_portals_col')}</h4>
            <ul className="footer-links">
              <li>
                <a href="#/crops" onClick={(e) => { e.preventDefault(); navigate('/crops'); }}>
                  <i className="fa-solid fa-chevron-right"></i> {t('crops_title')}
                </a>
              </li>
              <li>
                <a href="#/tools" onClick={(e) => { e.preventDefault(); navigate('/tools'); }}>
                  <i className="fa-solid fa-chevron-right"></i> {t('tools_title')}
                </a>
              </li>
              <li>
                <a href="#/schemes" onClick={(e) => { e.preventDefault(); navigate('/schemes'); }}>
                  <i className="fa-solid fa-chevron-right"></i> {t('schemes_title')}
                </a>
              </li>
              <li>
                <a href="#/loans" onClick={(e) => { e.preventDefault(); navigate('/loans'); }}>
                  <i className="fa-solid fa-chevron-right"></i> {t('loans_title')}
                </a>
              </li>
              <li>
                <a href="#/resources" onClick={(e) => { e.preventDefault(); navigate('/resources'); }}>
                  <i className="fa-solid fa-chevron-right"></i> {t('guides_title')}
                </a>
              </li>
              <li>
                <a href="#/weather" onClick={(e) => { e.preventDefault(); navigate('/weather'); }}>
                  <i className="fa-solid fa-chevron-right"></i> {t('weather_title')}
                </a>
              </li>
            </ul>
          </div>

          {/* Markets & Help */}
          <div className="footer-col">
            <h4 className="footer-heading">{t('footer_mandi_col')}</h4>
            <ul className="footer-links">
              <li>
                <a href="#/marketplace" onClick={(e) => { e.preventDefault(); navigate('/marketplace'); }}>
                  <i className="fa-solid fa-chevron-right"></i> {t('footer_enam')}
                </a>
              </li>
              <li>
                <a href="#/marketplace" onClick={(e) => { e.preventDefault(); navigate('/marketplace'); }}>
                  <i className="fa-solid fa-chevron-right"></i> {t('footer_agmarknet')}
                </a>
              </li>
              <li>
                <a href="#/marketplace" onClick={(e) => { e.preventDefault(); navigate('/marketplace'); }}>
                  <i className="fa-solid fa-chevron-right"></i> {t('footer_iffco')}
                </a>
              </li>
              <li>
                <a href="#/community" onClick={(e) => { e.preventDefault(); navigate('/community'); }}>
                  <i className="fa-solid fa-chevron-right"></i> {t('community_title')}
                </a>
              </li>
              <li>
                <a href="#/community" onClick={(e) => { e.preventDefault(); navigate('/community'); }}>
                  <i className="fa-solid fa-chevron-right"></i> {t('footer_kvk')}
                </a>
              </li>
            </ul>
          </div>

          {/* Official Helplines */}
          <div className="footer-col">
            <h4 className="footer-heading">{t('footer_helplines_col')}</h4>
            <div className="helpline-card">
              <div className="helpline-title">
                <i className="fa-solid fa-phone-volume"></i> {t('footer_kcc_helpline')}
              </div>
              <div className="helpline-number">1800-180-1551</div>
              <div className="helpline-sub">{t('footer_toll_free')}</div>
            </div>

            <div className="helpline-card" style={{ marginTop: '0.75rem' }}>
              <div className="helpline-title">
                <i className="fa-solid fa-shield-halved"></i> {t('footer_pmfby_helpline')}
              </div>
              <div className="helpline-number" style={{ fontSize: '1.05rem' }}>14447</div>
              <div className="helpline-sub">{t('footer_claim_support')}</div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} {t('brand_title')}. {t('footer_rights')}</p>
          <div className="footer-bottom-links">
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem' }}>
              {t('footer_motto')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
