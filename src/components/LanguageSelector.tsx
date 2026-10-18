import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Language, SUPPORTED_LANGUAGES } from '../translations';

interface LanguageSelectorProps {
  isMobile?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ isMobile = false }) => {
  const { language, setLanguage, t, showToast } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleSelectLanguage = (langCode: Language) => {
    if (langCode === language) {
      setIsOpen(false);
      return;
    }
    setLanguage(langCode);
    setIsOpen(false);

    // Provide friendly confirmation
    let msg = 'Language switched to English';
    if (langCode === 'hi') msg = 'भाषा बदलकर हिन्दी कर दी गई है';
    if (langCode === 'mr') msg = 'भाषा बदलून मराठी करण्यात आली आहे';
    showToast(msg, 'success');
  };

  const currentOption = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  if (isMobile) {
    return (
      <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
          <i className="fa-solid fa-globe" style={{ color: 'var(--primary-green)' }}></i>
          <span>{t('lang_select')} / Language / भाषा</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {SUPPORTED_LANGUAGES.map(lang => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelectLanguage(lang.code)}
              className={`btn btn-sm ${language === lang.code ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                padding: '0.5rem 0.25rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                justifyContent: 'center',
                textAlign: 'center'
              }}
            >
              <span>{lang.nativeName}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary btn-sm"
        aria-label="Select Language"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title={`${t('lang_select')}: ${currentOption.nativeName}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.4rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          borderColor: isOpen ? 'var(--primary-green)' : undefined,
          background: isOpen ? 'var(--mint-bg)' : undefined
        }}
      >
        <i className="fa-solid fa-globe" style={{ color: 'var(--primary-green)' }}></i>
        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--forest-dark)' }}>
          {currentOption.nativeName}
        </span>
        <i
          className="fa-solid fa-chevron-down"
          style={{
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'none'
          }}
        ></i>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
            border: '1px solid var(--border-light)',
            padding: '0.4rem',
            minWidth: '155px',
            zIndex: 1000,
            animation: 'pageFadeIn 0.15s ease-out'
          }}
        >
          {SUPPORTED_LANGUAGES.map(lang => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                role="menuitem"
                onClick={() => handleSelectLanguage(lang.code)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.75rem',
                  border: 'none',
                  background: isSelected ? 'var(--mint-bg)' : 'transparent',
                  color: isSelected ? 'var(--primary-green)' : 'var(--text-main)',
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: '0.88rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                </div>
                {isSelected && (
                  <i className="fa-solid fa-check" style={{ fontSize: '0.8rem', color: 'var(--primary-green)' }}></i>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
