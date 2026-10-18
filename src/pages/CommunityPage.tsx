import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ResourceCard } from '../components/ResourceCard';

export const CommunityPage: React.FC = () => {
  const {
    resources,
    communityPosts,
    comments,
    currentUser,
    createPost,
    deletePost,
    toggleLike,
    isPostLiked,
    addComment,
    navigate,
    t,
    tc
  } = useApp();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Pest Control');
  const [content, setContent] = useState('');
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({ 1: true });
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});

  const helplines = resources.filter(r => r.resource_type === 'community');

  const categories = [
    'Pest Control',
    'Seeds & Crops',
    'Irrigation & Subsidies',
    'Machinery & Tools',
    'Organic Farming',
    'General Discussion'
  ];

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    createPost(title, category, content);
    setTitle('');
    setContent('');
  };

  const handleCommentSubmit = (postId: number, e: React.FormEvent) => {
    e.preventDefault();
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    addComment(postId, text);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    setExpandedComments(prev => ({ ...prev, [postId]: true }));
  };

  const toggleCommentsView = (postId: number) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      {/* PAGE HEADER */}
      <div className="section-header" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
        <span className="section-badge" style={{ backgroundColor: '#ffe4e6', color: '#e11d48', borderColor: '#fecdd3' }}>
          <i className="fa-solid fa-people-group"></i> {t('community_badge')}
        </span>
        <h1 className="section-title">{t('community_title')}</h1>
        <p className="section-subtitle" style={{ margin: 0 }}>
          {t('community_sub')}
        </p>
      </div>

      {/* SECTION 1: INSTITUTIONAL HELPLINES & EXTENSION CENTERS */}
      <div style={{ marginBottom: '3.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--forest-dark)', marginBottom: '1.25rem' }}>
          {t('community_helplines_heading')}
        </h2>
        <div className="resource-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {helplines.map(item => (
            <ResourceCard key={item.id} resource={item} />
          ))}
        </div>
      </div>

      {/* SECTION 2: COMMUNITY FORUM */}
      <div className="community-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Left Column: Post Feed */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--forest-dark)', margin: 0 }}>
              {t('community_discussions_heading')} ({communityPosts.length})
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {communityPosts.map(post => {
              const postComments = comments.filter(c => c.post_id === post.id);
              const liked = isPostLiked(post.id);
              const isOwnerOrAdmin = currentUser && (currentUser.id === post.user_id || currentUser.role === 'admin');

              return (
                <div
                  key={post.id}
                  className="post-card"
                  style={{
                    background: '#fff',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-light)',
                    padding: '1.5rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {/* Post Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'var(--mint-subtle)',
                          color: 'var(--primary-green)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '1.1rem'
                        }}
                      >
                        <i className="fa-solid fa-user"></i>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--forest-dark)', fontSize: '0.95rem' }}>
                          {post.author_name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span className="section-badge" style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}>
                            {post.author_state}
                          </span>
                          <span>•</span>
                          <span>{new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: 'var(--primary-green)',
                          background: 'var(--mint-bg)',
                          padding: '0.25rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          border: '1px solid var(--border-green)'
                        }}
                      >
                        {tc(post.category)}
                      </span>
                      {isOwnerOrAdmin && (
                        <button
                          type="button"
                          onClick={() => deletePost(post.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '0.2rem 0.4rem',
                            fontSize: '0.85rem'
                          }}
                          title={t('btn_remove')}
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Post Title & Content */}
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--forest-dark)', marginBottom: '0.5rem' }}>
                    {post.title}
                  </h3>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    {post.content}
                  </p>

                  {/* Post Actions: Like & Comments toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem' }}>
                    <button
                      type="button"
                      onClick={() => toggleLike(post.id)}
                      className={`btn btn-sm ${liked ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ borderRadius: 'var(--radius-full)' }}
                    >
                      <i className={`fa-solid fa-heart ${liked ? '' : 'fa-regular'}`}></i>
                      <span>{post.like_count} {t('community_likes')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleCommentsView(post.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ borderRadius: 'var(--radius-full)' }}
                    >
                      <i className="fa-solid fa-comment-dots"></i>
                      <span>{postComments.length} {t('community_comments')}</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  {expandedComments[post.id] && (
                    <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                        {postComments.map(c => (
                          <div
                            key={c.id}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid var(--border-light)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.75rem 1rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--forest-dark)' }}>
                                {c.comment_author} {c.comment_state ? `(${c.comment_state})` : ''}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', margin: 0 }}>
                              {c.comment}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Add comment input */}
                      {currentUser ? (
                        <form onSubmit={(e) => handleCommentSubmit(post.id, e)} style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="text"
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                            placeholder={t('community_reply_placeholder')}
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
                            <i className="fa-solid fa-reply"></i> {t('btn_reply')}
                          </button>
                        </form>
                      ) : (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                          {t('community_login_to_reply')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: "Ask a Question" Sticky Form */}
        <div style={{ position: 'sticky', top: '90px' }}>
          <div
            style={{
              background: '#fff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div className="logo-badge" style={{ width: '30px', height: '30px', fontSize: '0.9rem' }}>
                <i className="fa-solid fa-feather-pointed"></i>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--forest-dark)', margin: 0 }}>
                {t('community_ask_title')}
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              {t('community_ask_sub')}
            </p>

            {currentUser ? (
              <form onSubmit={handlePostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    {t('community_cat_label')}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      fontSize: '0.88rem'
                    }}
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{tc(c)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    {t('community_q_title')}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('community_q_title_placeholder')}
                    required
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    {t('community_q_desc')}
                  </label>
                  <textarea
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t('community_q_desc_placeholder')}
                    required
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  <i className="fa-solid fa-paper-plane"></i> {t('community_btn_publish')}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--mint-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-green)' }}>
                <i className="fa-solid fa-lock" style={{ fontSize: '1.75rem', color: 'var(--primary-green)', marginBottom: '0.75rem' }}></i>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--forest-dark)', marginBottom: '0.35rem' }}>
                  {t('community_login_to_post')}
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  {t('community_login_sub')}
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <i className="fa-solid fa-arrow-right-to-bracket"></i> {t('nav_login')} / {t('nav_register')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
