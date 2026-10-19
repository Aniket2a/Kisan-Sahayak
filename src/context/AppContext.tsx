import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  User,
  Resource,
  Category,
  Feedback,
  CommunityPost,
  Comment,
  ToastMessage,
  UserRole
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_RESOURCES,
  INITIAL_CATEGORIES,
  INITIAL_BOOKMARKS,
  INITIAL_FEEDBACK,
  INITIAL_COMMUNITY_POSTS,
  INITIAL_COMMENTS,
  INITIAL_LIKES
} from '../data/seedData';
import { Language, translate, translateCategory } from '../translations';
import { getLocalizedResource } from '../translations/resourceContent';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tc: (category: string) => string;
  getLocResource: (resource: Resource) => Resource;
  currentUser: User | null;
  users: User[];
  resources: Resource[];
  categories: Category[];
  feedback: Feedback[];
  communityPosts: CommunityPost[];
  comments: Comment[];
  likes: Array<{ postId: number; userId: number }>;
  currentRoute: string;
  routeParams: Record<string, string>;
  navigate: (path: string, params?: Record<string, string>) => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'danger' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;
  
  // Modals
  selectedResource: Resource | null;
  isDetailModalOpen: boolean;
  openResourceDetails: (resource: Resource) => void;
  closeResourceDetails: () => void;
  adminModalResource: Resource | null;
  isAdminModalOpen: boolean;
  openAdminModal: (resource?: Resource | null) => void;
  closeAdminModal: () => void;

  // Bookmarks
  isBookmarked: (resourceId: number) => boolean;
  toggleBookmark: (resourceId: number) => void;
  bookmarkedIds: number[];
  
  // Ratings
  ratingsMap: Record<number, { avg: number; count: number }>;
  addFeedback: (resourceId: number, rating: number, comment: string) => void;
  deleteFeedback: (feedbackId: number) => void;

  // Auth & Profile
  login: (usernameOrEmail: string, password?: string) => { success: boolean; message: string };
  register: (userData: { full_name: string; username: string; email: string; password?: string; state: string; preferred_category: string }) => { success: boolean; message: string };
  logout: () => void;
  updateProfile: (updates: { full_name: string; email: string; state: string; preferred_category: string; new_password?: string }) => { success: boolean; message: string };

  // Resource CRUD (Admin)
  addResource: (data: Omit<Resource, 'id' | 'views_count'>) => void;
  editResource: (id: number, data: Partial<Resource>) => void;
  deleteResource: (id: number) => void;

  // Community
  createPost: (title: string, category: string, content: string) => void;
  deletePost: (postId: number) => void;
  toggleLike: (postId: number) => void;
  isPostLiked: (postId: number) => boolean;
  addComment: (postId: number, commentText: string) => void;

  // User Management (Admin)
  toggleUserRole: (userId: number) => void;
  deleteUser: (userId: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Multilingual Language state persistence
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLang = localStorage.getItem('kisan_language');
    if (savedLang === 'hi' || savedLang === 'mr' || savedLang === 'en') {
      return savedLang as Language;
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('kisan_language', lang);
  };

  const t = (key: string) => translate(key, language);
  const tc = (category: string) => translateCategory(category, language);

  // LocalStorage state persistence
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('kisan_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('kisan_current_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    // Default to Demo Farmer One for immediate rich interactive experience
    return INITIAL_USERS[0];
  });

  const [resources, setResources] = useState<Resource[]>(() => {
    const saved = localStorage.getItem('kisan_resources');
    return saved ? JSON.parse(saved) : INITIAL_RESOURCES;
  });

  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);

  const [bookmarks, setBookmarks] = useState<Array<{ userId: number; resourceId: number; createdAt: string }>>(() => {
    const saved = localStorage.getItem('kisan_bookmarks');
    return saved ? JSON.parse(saved) : INITIAL_BOOKMARKS;
  });

  const [feedback, setFeedback] = useState<Feedback[]>(() => {
    const saved = localStorage.getItem('kisan_feedback');
    return saved ? JSON.parse(saved) : INITIAL_FEEDBACK;
  });

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => {
    const saved = localStorage.getItem('kisan_posts');
    return saved ? JSON.parse(saved) : INITIAL_COMMUNITY_POSTS;
  });

  const [comments, setComments] = useState<Comment[]>(() => {
    const saved = localStorage.getItem('kisan_comments');
    return saved ? JSON.parse(saved) : INITIAL_COMMENTS;
  });

  const [likes, setLikes] = useState<Array<{ postId: number; userId: number }>>(() => {
    const saved = localStorage.getItem('kisan_likes');
    return saved ? JSON.parse(saved) : INITIAL_LIKES;
  });

  // Routing
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '') || '/';
    return hash.split('?')[0] || '/';
  });

  const [routeParams, setRouteParams] = useState<Record<string, string>>(() => {
    const hash = window.location.hash.replace('#', '');
    const queryIdx = hash.indexOf('?');
    if (queryIdx === -1) return {};
    const searchParams = new URLSearchParams(hash.substring(queryIdx + 1));
    const params: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      params[key] = val;
    });
    return params;
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [adminModalResource, setAdminModalResource] = useState<Resource | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem('kisan_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('kisan_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('kisan_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('kisan_resources', JSON.stringify(resources));
  }, [resources]);

  useEffect(() => {
    localStorage.setItem('kisan_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem('kisan_feedback', JSON.stringify(feedback));
  }, [feedback]);

  useEffect(() => {
    localStorage.setItem('kisan_posts', JSON.stringify(communityPosts));
  }, [communityPosts]);

  useEffect(() => {
    localStorage.setItem('kisan_comments', JSON.stringify(comments));
  }, [comments]);

  useEffect(() => {
    localStorage.setItem('kisan_likes', JSON.stringify(likes));
  }, [likes]);

  // Handle window hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || '/';
      const [path, queryString] = hash.split('?');
      setCurrentRoute(path || '/');
      const params: Record<string, string> = {};
      if (queryString) {
        const sp = new URLSearchParams(queryString);
        sp.forEach((v, k) => {
          params[k] = v;
        });
      }
      setRouteParams(params);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string, params?: Record<string, string>) => {
    let hash = path;
    if (params && Object.keys(params).length > 0) {
      const sp = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) sp.set(k, v);
      });
      const qs = sp.toString();
      if (qs) hash += `?${qs}`;
    }
    window.location.hash = hash;
    setCurrentRoute(path);
    setRouteParams(params || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Modal helpers
  const openResourceDetails = (resource: Resource) => {
    const targetId = resource.id;
    let updatedViews = (resource.views_count || 0) + 1;

    setResources(prev =>
      prev.map(r => {
        if (r.id === targetId) {
          updatedViews = (r.views_count || 0) + 1;
          return { ...r, views_count: updatedViews };
        }
        return r;
      })
    );

    setSelectedResource({ ...resource, views_count: updatedViews });
    setIsDetailModalOpen(true);
  };

  const closeResourceDetails = () => {
    setIsDetailModalOpen(false);
    setSelectedResource(null);
  };

  const openAdminModal = (resource?: Resource | null) => {
    setAdminModalResource(resource || null);
    setIsAdminModalOpen(true);
  };

  const closeAdminModal = () => {
    setIsAdminModalOpen(false);
    setAdminModalResource(null);
  };

  // Bookmarks
  const bookmarkedIds = useMemo(() => {
    if (!currentUser) return [];
    return bookmarks.filter(b => b.userId === currentUser.id).map(b => b.resourceId);
  }, [bookmarks, currentUser]);

  const isBookmarked = (resourceId: number) => {
    if (!currentUser) return false;
    return bookmarks.some(b => b.userId === currentUser.id && b.resourceId === resourceId);
  };

  const toggleBookmark = (resourceId: number) => {
    if (!currentUser) {
      showToast('Please log in to save resources.', 'warning');
      navigate('/login');
      return;
    }

    const existing = bookmarks.find(b => b.userId === currentUser.id && b.resourceId === resourceId);
    if (existing) {
      setBookmarks(prev => prev.filter(b => !(b.userId === currentUser.id && b.resourceId === resourceId)));
      showToast('Removed from saved items.', 'info');
    } else {
      setBookmarks(prev => [
        ...prev,
        { userId: currentUser.id, resourceId, createdAt: new Date().toISOString() }
      ]);
      showToast('Saved to your Farmer Dashboard!', 'success');
    }
  };

  // Ratings calculation
  const ratingsMap = useMemo(() => {
    const map: Record<number, { sum: number; count: number }> = {};
    feedback.forEach(f => {
      if (!map[f.resource_id]) {
        map[f.resource_id] = { sum: 0, count: 0 };
      }
      map[f.resource_id].sum += f.rating;
      map[f.resource_id].count += 1;
    });

    const result: Record<number, { avg: number; count: number }> = {};
    Object.keys(map).forEach(key => {
      const id = Number(key);
      const { sum, count } = map[id];
      result[id] = { avg: Number((sum / count).toFixed(1)), count };
    });
    return result;
  }, [feedback]);

  const addFeedback = (resourceId: number, rating: number, comment: string) => {
    if (!currentUser) {
      showToast('Please log in to submit a review.', 'warning');
      navigate('/login');
      return;
    }

    const res = resources.find(r => r.id === resourceId);
    const existing = feedback.find(f => f.user_id === currentUser.id && f.resource_id === resourceId);

    if (existing) {
      setFeedback(prev =>
        prev.map(f =>
          f.id === existing.id
            ? { ...f, rating, comment, created_at: new Date().toISOString() }
            : f
        )
      );
      showToast('Your review was updated!', 'success');
    } else {
      const newFeedback: Feedback = {
        id: Date.now(),
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        username: currentUser.username,
        resource_id: resourceId,
        resource_title: res?.title || 'Resource',
        rating,
        comment,
        created_at: new Date().toISOString()
      };
      setFeedback(prev => [newFeedback, ...prev]);
      showToast('Thank you for rating and reviewing this resource!', 'success');
    }
  };

  const deleteFeedback = (feedbackId: number) => {
    setFeedback(prev => prev.filter(f => f.id !== feedbackId));
    showToast('Feedback entry removed.', 'info');
  };

  // Auth
  const login = (usernameOrEmail: string, password?: string) => {
    const normalized = usernameOrEmail.trim().toLowerCase();
    const found = users.find(
      u => u.username.toLowerCase() === normalized || u.email.toLowerCase() === normalized
    );

    if (!found) {
      return { success: false, message: t('auth_invalid_creds') };
    }

    if (password && found.password && found.password !== password) {
      return { success: false, message: t('auth_invalid_creds') };
    }

    setCurrentUser(found);
    showToast(`${t('auth_welcome_back')}, ${found.full_name}!`, 'success');
    return { success: true, message: t('auth_login_success') };
  };

  const register = (userData: {
    full_name: string;
    username: string;
    email: string;
    password?: string;
    state: string;
    preferred_category: string;
  }) => {
    const uname = userData.username.trim().toLowerCase();
    const uemail = userData.email.trim().toLowerCase();

    if (users.some(u => u.username.toLowerCase() === uname || u.email.toLowerCase() === uemail)) {
      return { success: false, message: t('auth_user_exists') };
    }

    const newUser: User = {
      id: Date.now(),
      full_name: userData.full_name.trim(),
      username: uname,
      email: uemail,
      password: userData.password || 'password123',
      state: userData.state || 'General',
      preferred_category: userData.preferred_category || 'General',
      role: 'user',
      created_at: new Date().toISOString()
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    showToast(`${t('auth_welcome_reg')}`, 'success');
    return { success: true, message: t('auth_reg_success') };
  };

  const logout = () => {
    setCurrentUser(null);
    showToast(t('auth_logout_msg'), 'info');
    navigate('/');
  };

  const updateProfile = (updates: {
    full_name: string;
    email: string;
    state: string;
    preferred_category: string;
    new_password?: string;
  }) => {
    if (!currentUser) return { success: false, message: 'Not logged in' };

    const emailNorm = updates.email.trim().toLowerCase();
    const conflict = users.find(u => u.email.toLowerCase() === emailNorm && u.id !== currentUser.id);
    if (conflict) {
      return { success: false, message: t('auth_email_in_use') };
    }

    const updatedUser: User = {
      ...currentUser,
      full_name: updates.full_name.trim(),
      email: emailNorm,
      state: updates.state,
      preferred_category: updates.preferred_category,
      password: updates.new_password ? updates.new_password : currentUser.password
    };

    setUsers(prev => prev.map(u => (u.id === currentUser.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    showToast(t('auth_profile_updated'), 'success');
    return { success: true, message: t('auth_profile_updated') };
  };

  // Resource CRUD
  const addResource = (data: Omit<Resource, 'id' | 'views_count'>) => {
    const existing = resources.find(r => r.title.toLowerCase() === data.title.toLowerCase());
    if (existing) {
      showToast(`A resource with title "${data.title}" already exists.`, 'warning');
      return;
    }

    const newRes: Resource = {
      ...data,
      id: Date.now(),
      views_count: 0,
      created_at: new Date().toISOString()
    };

    setResources(prev => [newRes, ...prev]);
    showToast(`Resource "${newRes.title}" created successfully.`, 'success');
  };

  const editResource = (id: number, data: Partial<Resource>) => {
    setResources(prev =>
      prev.map(r => (r.id === id ? { ...r, ...data } : r))
    );
    showToast(`Resource #${id} updated successfully.`, 'success');
  };

  const deleteResource = (id: number) => {
    setResources(prev => prev.filter(r => r.id !== id));
    setBookmarks(prev => prev.filter(b => b.resourceId !== id));
    setFeedback(prev => prev.filter(f => f.resource_id !== id));
    showToast(`Resource #${id} deleted permanently.`, 'info');
  };

  // Community
  const createPost = (title: string, category: string, content: string) => {
    if (!currentUser) {
      showToast('Please log in to post a question.', 'warning');
      navigate('/login');
      return;
    }

    const newPost: CommunityPost = {
      id: Date.now(),
      user_id: currentUser.id,
      author_name: currentUser.full_name,
      author_state: currentUser.state,
      title: title.trim(),
      category: category.trim(),
      content: content.trim(),
      created_at: new Date().toISOString(),
      like_count: 0,
      comment_count: 0
    };

    setCommunityPosts(prev => [newPost, ...prev]);
    showToast('Your question has been posted to the farmer community!', 'success');
  };

  const deletePost = (postId: number) => {
    setCommunityPosts(prev => prev.filter(p => p.id !== postId));
    setComments(prev => prev.filter(c => c.post_id !== postId));
    setLikes(prev => prev.filter(l => l.postId !== postId));
    showToast('Post deleted successfully.', 'info');
  };

  const isPostLiked = (postId: number) => {
    if (!currentUser) return false;
    return likes.some(l => l.postId === postId && l.userId === currentUser.id);
  };

  const toggleLike = (postId: number) => {
    if (!currentUser) {
      showToast('Please log in to like discussions.', 'warning');
      navigate('/login');
      return;
    }

    const alreadyLiked = isPostLiked(postId);
    if (alreadyLiked) {
      setLikes(prev => prev.filter(l => !(l.postId === postId && l.userId === currentUser.id)));
      setCommunityPosts(prev =>
        prev.map(p => (p.id === postId ? { ...p, like_count: Math.max(0, p.like_count - 1) } : p))
      );
    } else {
      setLikes(prev => [...prev, { postId, userId: currentUser.id }]);
      setCommunityPosts(prev =>
        prev.map(p => (p.id === postId ? { ...p, like_count: p.like_count + 1 } : p))
      );
    }
  };

  const addComment = (postId: number, commentText: string) => {
    if (!currentUser) {
      showToast('Please log in to comment.', 'warning');
      navigate('/login');
      return;
    }

    const newComment: Comment = {
      id: Date.now(),
      post_id: postId,
      user_id: currentUser.id,
      comment_author: currentUser.full_name,
      comment_state: currentUser.state,
      comment: commentText.trim(),
      created_at: new Date().toISOString()
    };

    setComments(prev => [...prev, newComment]);
    setCommunityPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p))
    );
    showToast('Your comment was added!', 'success');
  };

  // User Management
  const toggleUserRole = (userId: number) => {
    if (currentUser && currentUser.id === userId) {
      showToast('Cannot change your own role.', 'warning');
      return;
    }

    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const newRole: UserRole = u.role === 'admin' ? 'user' : 'admin';
          showToast(`User role changed to ${newRole}.`, 'success');
          return { ...u, role: newRole };
        }
        return u;
      })
    );
  };

  const deleteUser = (userId: number) => {
    if (currentUser && currentUser.id === userId) {
      showToast('Cannot delete your own admin account.', 'danger');
      return;
    }

    setUsers(prev => prev.filter(u => u.id !== userId));
    setBookmarks(prev => prev.filter(b => b.userId !== userId));
    setFeedback(prev => prev.filter(f => f.user_id !== userId));
    setCommunityPosts(prev => prev.filter(p => p.user_id !== userId));
    setComments(prev => prev.filter(c => c.user_id !== userId));
    showToast('User and all associated data deleted.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        tc,
        getLocResource: (r: Resource) => getLocalizedResource(r, language),
        currentUser,
        users,
        resources,
        categories,
        feedback,
        communityPosts,
        comments,
        likes,
        currentRoute,
        routeParams,
        navigate,
        toasts,
        showToast,
        removeToast,
        selectedResource,
        isDetailModalOpen,
        openResourceDetails,
        closeResourceDetails,
        adminModalResource,
        isAdminModalOpen,
        openAdminModal,
        closeAdminModal,
        isBookmarked,
        toggleBookmark,
        bookmarkedIds,
        ratingsMap,
        addFeedback,
        deleteFeedback,
        login,
        register,
        logout,
        updateProfile,
        addResource,
        editResource,
        deleteResource,
        createPost,
        deletePost,
        toggleLike,
        isPostLiked,
        addComment,
        toggleUserRole,
        deleteUser
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
