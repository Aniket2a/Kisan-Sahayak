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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleBtnKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      if (!isOpen) {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => {
          menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
        }, 50);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      buttonRef.current?.focus();
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
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

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
    <div ref={containerRef} className="lang-selector-wrapper" style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        type="button"
        id="languageSelectorBtn"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleBtnKeyDown}
        className={`btn btn-secondary btn-sm lang-selector-btn ${isOpen ? 'active' : ''}`}
        aria-label="Select Language"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls="languageDropdownMenu"
        title={`${t('lang_select')}: ${currentOption.nativeName}`}
      >
        <i className="fa-solid fa-globe" style={{ color: 'var(--primary-green)' }}></i>
        <span className="lang-name-label">
          {currentOption.nativeName}
        </span>
        <i
          className="fa-solid fa-chevron-down lang-chevron"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none'
          }}
        ></i>
      </button>

      {isOpen && (
        <div
          id="languageDropdownMenu"
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="languageSelectorBtn"
          onKeyDown={handleMenuKeyDown}
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
            zIndex: 1100,
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
                tabIndex={0}
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
