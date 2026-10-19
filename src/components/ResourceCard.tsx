import React from 'react';
import { Resource } from '../types';
import { useApp } from '../context/AppContext';

interface ResourceCardProps {
  resource: Resource;
}

const CROP_FALLBACKS: Record<number, string> = {
  1: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=600&q=80', // Rice
  2: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80', // Wheat
  3: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80', // Maize
  4: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=600&q=80', // Cotton
  5: 'https://images.unsplash.com/photo-1589135233689-d56121405e32?auto=format&fit=crop&w=600&q=80', // Sugarcane
  6: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80', // Tomato
  7: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80', // Potato
  8: 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&w=600&q=80', // Mustard
  9: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80', // Soybean
  10: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80', // Chickpea
};

const TYPE_FALLBACKS: Record<string, string> = {
  crop: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80',
  tool: 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?auto=format&fit=crop&w=600&q=80',
  scheme: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
  loan: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80',
  guide: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80',
  marketplace: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=600&q=80',
  community: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=600&q=80'
};

const SVG_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='600' height='400' fill='%23e2f1e8'/><circle cx='300' cy='180' r='55' fill='%232e7d32'/><text x='300' y='275' font-family='sans-serif' font-size='22' font-weight='bold' fill='%231b5e20' text-anchor='middle'>Kisan Sahayak</text></svg>";

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const { isBookmarked, toggleBookmark, openResourceDetails, ratingsMap, t, tc, getLocResource } = useApp();
  const loc = getLocResource(resource);
  const bookmarked = isBookmarked(loc.id);
  const ratingInfo = ratingsMap[loc.id] || { avg: 5.0, count: 1 };
  const initialImg = loc.image_url || CROP_FALLBACKS[loc.id] || TYPE_FALLBACKS[loc.resource_type] || SVG_FALLBACK;

  return (
    <div className="resource-card">
      <div className="resource-img-wrap" style={{ position: 'relative', overflow: 'hidden', height: '180px', backgroundColor: '#e2e8f0' }}>
        <img
          src={initialImg}
          alt={loc.title}
          className="resource-card-img"
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
          loading="lazy"
          onError={(e) => {
            const specificFallback = CROP_FALLBACKS[loc.id];
            const typeFallback = TYPE_FALLBACKS[loc.resource_type];
            if (specificFallback && e.currentTarget.src !== specificFallback) {
              e.currentTarget.src = specificFallback;
            } else if (typeFallback && e.currentTarget.src !== typeFallback) {
              e.currentTarget.src = typeFallback;
            } else {
              e.currentTarget.src = SVG_FALLBACK;
            }
          }}
        />
        <span
          className="section-badge"
          style={{
            position: 'absolute',
            top: '0.75rem',
            left: '0.75rem',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            fontSize: '0.75rem',
            textTransform: 'capitalize'
          }}
        >
          {tc(loc.resource_type)}
        </span>
        <button
          type="button"
          className={`bookmark-btn-toggle ${bookmarked ? 'saved' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleBookmark(loc.id);
          }}
          title={bookmarked ? t('btn_remove') : t('btn_save')}
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            background: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            color: bookmarked ? 'var(--amber-warm)' : 'var(--text-muted)',
            fontSize: '1rem',
            transition: 'all 0.2s ease'
          }}
        >
          <i className={`${bookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark`}></i>
        </button>
      </div>

      <div className="resource-card-body" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-green)', backgroundColor: 'var(--mint-subtle)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
            {tc(loc.category_name)}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <i className="fa-solid fa-eye"></i> {loc.views_count} {t('views_label')}
          </span>
        </div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--forest-dark)', marginBottom: '0.4rem', lineHeight: 1.35 }}>
          {loc.title}
        </h3>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <i className="fa-solid fa-building" style={{ color: 'var(--amber-warm)' }}></i>
          <span>{loc.provider}</span>
        </p>

        {loc.season_climate && (
          <div style={{ background: '#f8fafc', borderLeft: '3px solid var(--primary-green)', padding: '0.4rem 0.6rem', borderRadius: '0 4px 4px 0', fontSize: '0.78rem', color: 'var(--text-main)', marginBottom: '0.6rem' }}>
            <i className="fa-solid fa-circle-info" style={{ color: 'var(--primary-green)', marginRight: '0.35rem' }}></i>
            {loc.season_climate}
          </div>
        )}

        <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '1rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {loc.description}
        </p>

        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ color: '#f59e0b', fontSize: '0.88rem' }}>
              <i className="fa-solid fa-star"></i>
            </span>
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{ratingInfo.avg}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({ratingInfo.count})</span>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                openResourceDetails(resource);
              }}
            >
              <span>{t('btn_details')}</span>
              <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.75rem' }}></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
