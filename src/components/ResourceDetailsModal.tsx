import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

export const ResourceDetailsModal: React.FC = () => {
  const {
    selectedResource,
    isDetailModalOpen,
    closeResourceDetails,
    isBookmarked,
    toggleBookmark,
    ratingsMap,
    feedback,
    addFeedback,
    currentUser,
    t,
    tc,
    getLocResource
  } = useApp();

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const backdropMouseDownRef = useRef(false);

  // Reset rating and comment when a new resource is opened
  useEffect(() => {
    if (selectedResource) {
      setRating(5);
      setComment('');
    }
  }, [selectedResource?.id]);

  // Lock background scroll and handle Escape key while modal is open
  useEffect(() => {
    if (isDetailModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeResourceDetails();
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isDetailModalOpen, closeResourceDetails]);

  if (!isDetailModalOpen || !selectedResource) return null;

  const loc = getLocResource(selectedResource);
  const bookmarked = isBookmarked(loc.id);
  const ratingInfo = ratingsMap[loc.id] || { avg: 5.0, count: 1 };
  const resourceFeedback = feedback.filter(f => f.resource_id === loc.id);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addFeedback(selectedResource.id, rating, comment);
    setComment('');
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
    // Only close if mousedown/touchstart initiated directly on the backdrop itself
    // AND the click ended directly on the backdrop itself
    if (e.target === e.currentTarget && backdropMouseDownRef.current) {
      closeResourceDetails();
    }
    backdropMouseDownRef.current = false;
  };

  return (
    <div
      className="modal-backdrop show"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-res-title"
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
          maxWidth: '750px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative'
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image & Close Button */}
        <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
          <img
            src={loc.image_url || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80'}
            alt={loc.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              const fallback = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80';
              if (e.currentTarget.src !== fallback) {
                e.currentTarget.src = fallback;
              } else {
                e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='600' height='400' fill='%23e2f1e8'/><circle cx='300' cy='180' r='55' fill='%232e7d32'/><text x='300' y='275' font-family='sans-serif' font-size='22' font-weight='bold' fill='%231b5e20' text-anchor='middle'>Kisan Sahayak</text></svg>";
              }
            }}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              closeResourceDetails();
            }}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1.1rem',
              transition: 'background-color 0.2s ease'
            }}
            title={t('btn_close')}
            aria-label={t('btn_close')}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>

          <span
            className="section-badge"
            style={{
              position: 'absolute',
              bottom: '1rem',
              left: '1.25rem',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'capitalize'
            }}
          >
            {tc(loc.category_name)} • {tc(loc.resource_type)}
          </span>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <h2 id="modal-res-title" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--forest-dark)', marginBottom: '0.3rem' }}>
                {loc.title}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span>
                  <i className="fa-solid fa-building" style={{ color: 'var(--amber-warm)', marginRight: '0.3rem' }}></i>
                  {loc.provider}
                </span>
                <span>•</span>
                <span>
                  <i className="fa-solid fa-eye" style={{ marginRight: '0.3rem' }}></i>
                  {loc.views_count} {t('views_label')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className={`btn btn-secondary ${bookmarked ? 'saved' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBookmark(loc.id);
                }}
                style={{ color: bookmarked ? 'var(--amber-warm)' : undefined }}
              >
                <i className={`${bookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark`}></i>
                <span>{bookmarked ? t('btn_saved') : t('btn_save')}</span>
              </button>

              {loc.external_url && (
                <a
                  href={loc.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                  <span>{t('modal_official_portal')}</span>
                </a>
              )}
            </div>
          </div>

          {/* Full description */}
          <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            {loc.description}
          </p>

          {/* Specifications Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {loc.season_climate && (
              <div style={{ background: 'var(--mint-bg)', border: '1px solid var(--border-green)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--forest-dark)', fontSize: '0.85rem', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <i className="fa-solid fa-cloud-sun"></i> {t('modal_specs')}
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                  {loc.season_climate}
                </div>
              </div>
            )}

            {loc.eligibility && (
              <div style={{ background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--forest-dark)', fontSize: '0.85rem', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <i className="fa-solid fa-clipboard-check"></i> {t('modal_eligibility')}
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                  {loc.eligibility}
                </div>
              </div>
            )}
          </div>

          {loc.benefits && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.75rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--earth-brown)', fontSize: '0.88rem', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fa-solid fa-gift"></i> {t('modal_benefits')}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#92400e', lineHeight: 1.5 }}>
                {loc.benefits}
              </div>
            </div>
          )}

          {/* Farmer Feedback & Star Reviews */}
          <div style={{ borderTop: '2px solid var(--border-light)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--forest-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-star-half-stroke" style={{ color: '#f59e0b' }}></i>
                {t('modal_reviews_heading')}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--forest-dark)' }}>{ratingInfo.avg}</span>
                <span style={{ color: '#f59e0b' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <i
                      key={star}
                      className={`fa-solid fa-star ${star <= Math.round(ratingInfo.avg) ? '' : 'fa-regular'}`}
                      style={{ fontSize: '0.85rem' }}
                    ></i>
                  ))}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>({resourceFeedback.length})</span>
              </div>
            </div>

            {/* List of reviews */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', maxHeight: '200px', overflowY: 'auto' }}>
              {resourceFeedback.length > 0 ? (
                resourceFeedback.map(fb => (
                  <div
                    key={fb.id}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem 1rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--forest-dark)' }}>
                        <i className="fa-solid fa-user-circle" style={{ marginRight: '0.3rem' }}></i>
                        {fb.user_name}
                      </span>
                      <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>
                        {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0 }}>
                      {fb.comment}
                    </p>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {t('modal_no_reviews')}
                </p>
              )}
            </div>

            {/* Add Review Form */}
            {currentUser ? (
              <form onSubmit={handleSubmitReview} style={{ background: 'var(--mint-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-green)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--forest-dark)', marginBottom: '0.6rem' }}>
                  {t('modal_rate_heading')}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('modal_your_rating')}</span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {[1, 2, 3, 4, 5].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setRating(num)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: num <= rating ? '#f59e0b' : '#cbd5e1',
                          fontSize: '1.25rem',
                          padding: '0 0.1rem'
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    ({rating} {t('modal_out_of_5')})
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('modal_review_input_placeholder')}
                    required
                    style={{
                      flex: 1,
                      padding: '0.55rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      fontSize: '0.88rem'
                    }}
                  />
                  <button type="submit" className="btn btn-primary btn-sm">
                    <i className="fa-solid fa-paper-plane"></i> {t('btn_submit')}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  {t('modal_login_to_review')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
