import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ResourceType } from '../types';

export const AdminResourceModal: React.FC = () => {
  const { adminModalResource, isAdminModalOpen, closeAdminModal, addResource, editResource, categories, t, tc } = useApp();

  const [title, setTitle] = useState('');
  const [resourceType, setResourceType] = useState<ResourceType>('scheme');
  const [categoryName, setCategoryName] = useState('Cereals & Grains');
  const [description, setDescription] = useState('');
  const [provider, setProvider] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [seasonClimate, setSeasonClimate] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [benefits, setBenefits] = useState('');

  useEffect(() => {
    if (adminModalResource) {
      setTitle(adminModalResource.title || '');
      setResourceType(adminModalResource.resource_type || 'scheme');
      setCategoryName(adminModalResource.category_name || 'Cereals & Grains');
      setDescription(adminModalResource.description || '');
      setProvider(adminModalResource.provider || '');
      setImageUrl(adminModalResource.image_url || '');
      setExternalUrl(adminModalResource.external_url || '');
      setSeasonClimate(adminModalResource.season_climate || '');
      setEligibility(adminModalResource.eligibility || '');
      setBenefits(adminModalResource.benefits || '');
    } else {
      setTitle('');
      setResourceType('scheme');
      setCategoryName('Income Support');
      setDescription('');
      setProvider('Ministry of Agriculture & Farmers Welfare');
      setImageUrl('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80');
      setExternalUrl('https://agricoop.nic.in/');
      setSeasonClimate('');
      setEligibility('');
      setBenefits('');
    }
  }, [adminModalResource]);

  const backdropMouseDownRef = useRef(false);

  // Lock background scroll and handle Escape key while admin modal is open
  useEffect(() => {
    if (isAdminModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeAdminModal();
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isAdminModalOpen, closeAdminModal]);

  if (!isAdminModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    if (adminModalResource) {
      editResource(adminModalResource.id, {
        title: title.trim(),
        resource_type: resourceType,
        category_name: categoryName,
        description: description.trim(),
        provider: provider.trim(),
        image_url: imageUrl.trim(),
        external_url: externalUrl.trim(),
        season_climate: seasonClimate.trim(),
        eligibility: eligibility.trim(),
        benefits: benefits.trim()
      });
    } else {
      addResource({
        title: title.trim(),
        resource_type: resourceType,
        category_name: categoryName,
        category_id: 1,
        description: description.trim(),
        provider: provider.trim(),
        image_url: imageUrl.trim() || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
        external_url: externalUrl.trim(),
        season_climate: seasonClimate.trim(),
        eligibility: eligibility.trim(),
        benefits: benefits.trim()
      });
    }
    closeAdminModal();
  };

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      backdropMouseDownRef.current = true;
    } else {
      backdropMouseDownRef.current = false;
    }
  };

  const handleBackdropTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      backdropMouseDownRef.current = true;
    } else {
      backdropMouseDownRef.current = false;
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && backdropMouseDownRef.current) {
      closeAdminModal();
    }
    backdropMouseDownRef.current = false;
  };

  return (
    <div
      className="modal-backdrop show"
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(6, 78, 59, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'pageFadeIn 0.2s ease-out'
      }}
      onMouseDown={handleBackdropMouseDown}
      onTouchStart={handleBackdropTouchStart}
      onClick={handleBackdropClick}
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: '#fff',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '1.75rem'
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--forest-dark)', margin: 0 }}>
              {adminModalResource ? `${t('admin_modal_edit_title')} #${adminModalResource.id}` : t('admin_modal_add_title')}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              {t('admin_modal_desc')}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              closeAdminModal();
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
            title={t('btn_close')}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                {t('admin_field_title')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. PM-KISAN, Wheat (Sharbati), Rotavator"
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                {t('admin_field_type')}
              </label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value as ResourceType)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.9rem' }}
              >
                <option value="scheme">{t('mod_schemes_title')}</option>
                <option value="crop">{t('mod_crops_title')}</option>
                <option value="tool">{t('mod_tools_title')}</option>
                <option value="loan">{t('mod_loans_title')}</option>
                <option value="guide">{t('mod_resources_title')}</option>
                <option value="marketplace">{t('mod_market_title')}</option>
                <option value="community">{t('mod_community_title')}</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                {t('admin_field_cat')}
              </label>
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.9rem' }}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{tc(c.name)}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                {t('admin_field_provider')}
              </label>
              <input
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g. ICAR, Ministry of Agriculture, RBI"
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                {t('admin_field_img')}
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                {t('admin_field_url')}
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://pmkisan.gov.in"
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              {t('admin_field_desc')}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Comprehensive summary of crop agronomy, tool specifications, or scheme guidelines..."
              style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              {t('admin_field_specs')}
            </label>
            <input
              type="text"
              value={seasonClimate}
              onChange={(e) => setSeasonClimate(e.target.value)}
              placeholder="e.g. Kharif/Rabi, Optimal temperature 20-30°C, Well-drained loamy soil"
              style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                {t('admin_field_eligibility')}
              </label>
              <textarea
                rows={2}
                value={eligibility}
                onChange={(e) => setEligibility(e.target.value)}
                placeholder="e.g. Small & marginal farmers having cultivable landholding up to 2 hectares..."
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                {t('admin_field_benefits')}
              </label>
              <textarea
                rows={2}
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                placeholder="e.g. Financial benefit of ₹6,000 per year transferred in three equal installments..."
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
            <button
              type="button"
              onClick={closeAdminModal}
              className="btn btn-secondary"
            >
              {t('btn_cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              <i className="fa-solid fa-check"></i> {t('admin_btn_save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
