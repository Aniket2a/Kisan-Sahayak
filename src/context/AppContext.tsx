import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  User,
  Resource,
  ResourceType,
  Category,
  Bookmark,
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
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tc: (category: string) => string;
  getLocResource: (resource: Resource) => Resource;
  currentUser: User | null;
  users: User[];
  isAuthLoading: boolean;
  resources: Resource[];
  isResourcesLoading: boolean;
  resourcesError: string | null;
  refreshResources: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  categories: Category[];
  feedback: Feedback[];
  communityPosts: CommunityPost[];
  comments: Comment[];
  likes: Array<{ postId: number; userId: string | number }>;
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
  isBookmarksLoading: boolean;
  bookmarksError: string | null;
  refreshBookmarks: () => Promise<void>;
  isBookmarked: (resourceId: number) => boolean;
  toggleBookmark: (resourceId: number) => Promise<void> | void;
  bookmarkedIds: number[];
  
  // Ratings & Feedback
  isFeedbackLoading: boolean;
  feedbackError: string | null;
  refreshFeedback: () => Promise<void>;
  ratingsMap: Record<number, { avg: number; count: number }>;
  addFeedback: (resourceId: number, rating: number, comment: string) => Promise<void> | void;
  editFeedback: (feedbackId: number, rating: number, comment: string) => Promise<void> | void;
  deleteFeedback: (feedbackId: number) => Promise<void> | void;

  // Auth & Profile
  login: (usernameOrEmail: string, password?: string) => Promise<{ success: boolean; message: string; role?: string }>;
  register: (userData: { full_name: string; username: string; email: string; password?: string; state: string; preferred_category: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: { full_name: string; email: string; state: string; preferred_category: string; new_password?: string }) => Promise<{ success: boolean; message: string }>;

  // Resource CRUD (Admin)
  addResource: (data: Omit<Resource, 'id' | 'views_count'>) => Promise<void>;
  editResource: (id: number, data: Partial<Resource>) => Promise<void>;
  deleteResource: (id: number) => Promise<void>;

  // Community
  createPost: (title: string, category: string, content: string) => void;
  deletePost: (postId: number) => void;
  toggleLike: (postId: number) => void;
  isPostLiked: (postId: number) => boolean;
  addComment: (postId: number, commentText: string) => void;

  // User Management (Admin)
  toggleUserRole: (userId: string | number) => Promise<void>;
  deleteUser: (userId: string | number) => Promise<void>;
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

  // Authentication loading indicator
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Users list for admin view and stats
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);

  // Current authenticated user (Restored from session or localStorage cache)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('kisan_current_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.role === 'admin') {
          const token = sessionStorage.getItem('kisan_admin_token');
          if (!token) return null;
        }
        return parsed && parsed.id ? { ...parsed, id: String(parsed.id) } : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [resources, setResources] = useState<Resource[]>(() => {
    const saved = localStorage.getItem('kisan_resources');
    return saved ? JSON.parse(saved) : INITIAL_RESOURCES;
  });

  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [isResourcesLoading, setIsResourcesLoading] = useState<boolean>(true);
  const [resourcesError, setResourcesError] = useState<string | null>(null);

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const saved = localStorage.getItem('kisan_bookmarks');
    return saved ? JSON.parse(saved) : INITIAL_BOOKMARKS;
  });
  const [isBookmarksLoading, setIsBookmarksLoading] = useState<boolean>(false);
  const [bookmarksError, setBookmarksError] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<Feedback[]>(() => {
    const saved = localStorage.getItem('kisan_feedback');
    return saved ? JSON.parse(saved) : INITIAL_FEEDBACK;
  });
  const [isFeedbackLoading, setIsFeedbackLoading] = useState<boolean>(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [ratingsFromDb, setRatingsFromDb] = useState<Record<number, { avg: number; count: number }>>({});

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => {
    const saved = localStorage.getItem('kisan_posts');
    return saved ? JSON.parse(saved) : INITIAL_COMMUNITY_POSTS;
  });

  const [comments, setComments] = useState<Comment[]>(() => {
    const saved = localStorage.getItem('kisan_comments');
    return saved ? JSON.parse(saved) : INITIAL_COMMENTS;
  });

  const [likes, setLikes] = useState<Array<{ postId: number; userId: string | number }>>(() => {
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

  // Sync html lang attribute
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Helper to map Supabase auth user + public.profiles row to Kisan Sahayak User
  const mapSupabaseUserToUser = async (authUser: any): Promise<User> => {
    let profileData: any = null;
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, state, preferred_category, role, created_at')
          .eq('id', authUser.id)
          .maybeSingle();
        if (!error && data) {
          profileData = data;
        }
      } catch (err) {
        // Table may not exist if Stage 2 migration is pending on live DB
      }
    }

    const meta = authUser.user_metadata || {};
    const rawUsername = profileData?.username || meta.username || authUser.email?.split('@')[0] || 'farmer';
    const fullName = profileData?.full_name || meta.full_name || 'Kisan Farmer';
    const state = profileData?.state || meta.state || 'General';
    const preferredCategory = profileData?.preferred_category || meta.preferred_category || 'General';

    return {
      id: String(authUser.id),
      full_name: fullName,
      username: rawUsername,
      email: authUser.email || '',
      state: state,
      preferred_category: preferredCategory,
      role: 'user', // Enforce non-admin for farmer auth
      created_at: profileData?.created_at || authUser.created_at || new Date().toISOString()
    };
  };

  const adminRequest = async (url: string, options: RequestInit = {}) => {
    const token = sessionStorage.getItem('kisan_admin_token');
    if (!token) throw new Error('Your admin session has expired. Please sign in again.');
    const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}), Authorization: 'Bearer ' + token } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || payload.message || ('Admin request failed (' + response.status + ').'));
    return payload;
  };
  const fetchAdminUsers = async () => {
    const payload = await adminRequest('/api/admin/users');
    setUsers(Array.isArray(payload.users) ? payload.users : []);
  };
  // Restore session on startup (Admin session or Supabase farmer session)
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      // 1. Check if admin session token exists
      const adminToken = sessionStorage.getItem('kisan_admin_token');
      if (adminToken) {
        try {
          const res = await fetch('/api/auth/verify-session', {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          const data = await res.json();
          if (isMounted && data && data.valid && data.role === 'admin') {
            setCurrentUser({
              id: 'admin_root',
              full_name: 'Administrator',
              username: data.username || 'admin',
              email: 'admin@kisansahayak.in',
              role: 'admin',
              state: 'Central Administration',
              preferred_category: 'Government Schemes',
              created_at: new Date().toISOString()
            });
            try { await fetchAdminUsers(); } catch (error: any) { showToast(error.message || 'Could not load users.', 'danger'); }
            setIsAuthLoading(false);
            return;
          } else {
            sessionStorage.removeItem('kisan_admin_token');
          }
        } catch {
          sessionStorage.removeItem('kisan_admin_token');
        }
      }

      // 2. Check Supabase session for farmer account
      if (isSupabaseConfigured()) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (!error && session?.user && isMounted) {
            const farmer = await mapSupabaseUserToUser(session.user);
            if (isMounted) {
              setCurrentUser(farmer);
            }
          }
        } catch (err) {
          console.warn('Error fetching Supabase session:', err);
        }
      }

      if (isMounted) {
        setIsAuthLoading(false);
      }
    }

    initSession();

    // 3. Listen to Supabase auth state changes
    let authSubscription: any = null;
    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;
        if (event === 'SIGNED_IN' && session?.user) {
          const farmer = await mapSupabaseUserToUser(session.user);
          if (isMounted) setCurrentUser(farmer);
        } else if (event === 'SIGNED_OUT') {
          if (isMounted) {
            // Only clear if current user wasn't admin
            setCurrentUser(prev => (prev?.role === 'admin' ? prev : null));
          }
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          const farmer = await mapSupabaseUserToUser(session.user);
          if (isMounted) setCurrentUser(farmer);
        }
      });
      authSubscription = subscription;
    }

    return () => {
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  // Fetch Categories from public.categories
  const fetchCategories = async (): Promise<Category[]> => {
    if (!isSupabaseConfigured()) {
      return INITIAL_CATEGORIES;
    }
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, description, icon')
        .order('id', { ascending: true });

      if (error) {
        console.warn('Could not fetch categories from Supabase (Stage 2 migration may be pending):', error.message);
        return INITIAL_CATEGORIES;
      }

      if (data && data.length > 0) {
        const mapped: Category[] = data.map(c => ({
          id: Number(c.id),
          name: c.name,
          slug: c.slug,
          description: c.description || '',
          icon: c.icon || 'fa-leaf'
        }));
        setCategories(mapped);
        return mapped;
      }
      return INITIAL_CATEGORIES;
    } catch (err: any) {
      console.warn('Error fetching categories from Supabase:', err);
      return INITIAL_CATEGORIES;
    }
  };

  // Fetch Resources from public.resources
  const fetchResources = async (activeCategories?: Category[]): Promise<void> => {
    setIsResourcesLoading(true);
    setResourcesError(null);

    if (!isSupabaseConfigured()) {
      const saved = localStorage.getItem('kisan_resources');
      setResources(saved ? JSON.parse(saved) : INITIAL_RESOURCES);
      setIsResourcesLoading(false);
      return;
    }

    try {
      const catsToUse = activeCategories && activeCategories.length > 0 ? activeCategories : categories;
      const catMap: Record<number, string> = {};
      catsToUse.forEach(c => {
        catMap[c.id] = c.name;
      });

      const { data, error } = await supabase
        .from('resources')
        .select(`
          id,
          category_id,
          title,
          description,
          resource_type,
          external_url,
          image_url,
          season_climate,
          eligibility,
          benefits,
          provider,
          views_count,
          created_at,
          categories (
            id,
            name
          )
        `)
        .order('id', { ascending: true });

      if (error) {
        console.warn('Could not fetch resources from Supabase (Stage 2 migration may be pending):', error.message);
        setResourcesError(error.message);
        // Fallback to local storage or seed resources
        const saved = localStorage.getItem('kisan_resources');
        setResources(saved ? JSON.parse(saved) : INITIAL_RESOURCES);
      } else if (data && data.length > 0) {
        const mapped: Resource[] = data.map(r => {
          const joinedCat = (r as any).categories?.name;
          const resolvedCatName = joinedCat || catMap[Number(r.category_id)] || 'General';

          return {
            id: Number(r.id),
            title: r.title,
            description: r.description,
            category_id: Number(r.category_id),
            category_name: resolvedCatName,
            resource_type: r.resource_type as ResourceType,
            external_url: r.external_url || '',
            image_url: r.image_url || '',
            season_climate: r.season_climate || '',
            eligibility: r.eligibility || '',
            benefits: r.benefits || '',
            provider: r.provider || '',
            views_count: typeof r.views_count === 'number' ? r.views_count : 0,
            created_at: r.created_at
          };
        });

        setResources(mapped);
        localStorage.setItem('kisan_resources', JSON.stringify(mapped));
      } else {
        // Table exists but is empty (e.g. before seed.sql is run) -> fallback to initial seed resources
        const saved = localStorage.getItem('kisan_resources');
        setResources(saved ? JSON.parse(saved) : INITIAL_RESOURCES);
      }
    } catch (err: any) {
      console.warn('Error fetching resources:', err);
      setResourcesError(err?.message || 'Failed to load resources');
      const saved = localStorage.getItem('kisan_resources');
      setResources(saved ? JSON.parse(saved) : INITIAL_RESOURCES);
    } finally {
      setIsResourcesLoading(false);
    }
  };

  // Load categories and resources on mount
  useEffect(() => {
    let active = true;

    async function loadData() {
      const loadedCats = await fetchCategories();
      if (active) {
        await fetchResources(loadedCats);
        await fetchFeedback();
        await fetchRatings();
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  // Helper to validate UUID string
  const isValidUuid = (id: string | number): boolean => {
    return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  };

  // Fetch Bookmarks for authenticated farmer from public.bookmarks
  const fetchBookmarks = async (targetUser?: User | null): Promise<void> => {
    const user = targetUser !== undefined ? targetUser : currentUser;
    if (!user) {
      setIsBookmarksLoading(false);
      return;
    }

    // Only query Supabase for farmers with valid Supabase Auth UUID
    if (!isSupabaseConfigured() || !isValidUuid(user.id)) {
      setIsBookmarksLoading(false);
      return;
    }

    setIsBookmarksLoading(true);
    setBookmarksError(null);

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('id, user_id, resource_id, created_at')
        .eq('user_id', user.id);

      if (error) {
        console.warn('Could not fetch bookmarks from Supabase (Stage 2 migration may be pending):', error.message);
        setBookmarksError(error.message);
      } else if (data) {
        const remoteBookmarks: Bookmark[] = data.map(b => ({
          id: b.id,
          userId: b.user_id,
          resourceId: Number(b.resource_id),
          createdAt: b.created_at
        }));

        setBookmarks(prev => {
          // Other users' bookmarks (offline fallback / multi-account)
          const otherUserBookmarks = prev.filter(b => String(b.userId) !== String(user.id));

          // Local-only bookmarks for this user
          const localOnlyBookmarks = prev.filter(b =>
            String(b.userId) === String(user.id) &&
            !remoteBookmarks.some(rb => rb.resourceId === b.resourceId)
          );

          // Upload local-only bookmarks to Supabase in the background
          if (localOnlyBookmarks.length > 0) {
            const recordsToInsert = localOnlyBookmarks.map(b => ({
              user_id: user.id,
              resource_id: b.resourceId
            }));
            (async () => {
              try {
                const { error: insertErr } = await supabase
                  .from('bookmarks')
                  .insert(recordsToInsert);

                if (insertErr && insertErr.code !== '23505') {
                  console.warn('Could not sync local-only bookmarks to Supabase:', insertErr.message);
                }
              } catch (err: any) {
                console.warn('Background bookmark sync error:', err);
              }
            })();
          }

          const combined = [...remoteBookmarks, ...localOnlyBookmarks];
          return [...otherUserBookmarks, ...combined];
        });
      }
    } catch (err: any) {
      console.warn('Error fetching bookmarks:', err);
      setBookmarksError(err?.message || 'Failed to load bookmarks');
    } finally {
      setIsBookmarksLoading(false);
    }
  };

  // Fetch public feedback from public.v_resource_feedback
  const fetchFeedback = async (): Promise<void> => {
    if (!isSupabaseConfigured()) {
      setIsFeedbackLoading(false);
      return;
    }

    setIsFeedbackLoading(true);
    setFeedbackError(null);

    try {
      const { data, error } = await supabase
        .from('v_resource_feedback')
        .select('id, resource_id, user_name, rating, comment, created_at, updated_at, is_author')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch from v_resource_feedback (Stage 2 migration may be pending):', error.message);
        // Fallback: try raw feedback table
        const { data: rawData, error: rawError } = await supabase
          .from('feedback')
          .select('id, user_id, author_name, resource_id, rating, comment, created_at, updated_at')
          .order('created_at', { ascending: false });

        if (!rawError && rawData && rawData.length > 0) {
          const mapped: Feedback[] = rawData.map(f => ({
            id: Number(f.id),
            user_id: f.user_id,
            user_name: f.author_name || 'Kisan Farmer',
            resource_id: Number(f.resource_id),
            rating: Number(f.rating),
            comment: f.comment,
            created_at: f.created_at,
            updated_at: f.updated_at,
            is_author: currentUser ? String(f.user_id) === String(currentUser.id) : false
          }));
          setFeedback(mapped);
          localStorage.setItem('kisan_feedback', JSON.stringify(mapped));
        } else {
          setFeedbackError(error.message);
        }
      } else if (data && data.length > 0) {
        const mapped: Feedback[] = data.map(f => ({
          id: Number(f.id),
          resource_id: Number(f.resource_id),
          user_name: f.user_name || 'Kisan Farmer',
          rating: Number(f.rating),
          comment: f.comment,
          created_at: f.created_at,
          updated_at: f.updated_at,
          is_author: Boolean(f.is_author)
        }));
        setFeedback(mapped);
        localStorage.setItem('kisan_feedback', JSON.stringify(mapped));
      }
    } catch (err: any) {
      console.warn('Error fetching feedback:', err);
      setFeedbackError(err?.message || 'Failed to load feedback');
    } finally {
      setIsFeedbackLoading(false);
    }
  };

  // Fetch rating averages and review counts through public.v_resource_ratings
  const fetchRatings = async (): Promise<void> => {
    if (!isSupabaseConfigured()) return;

    try {
      const { data, error } = await supabase
        .from('v_resource_ratings')
        .select('resource_id, avg_rating, review_count');

      if (!error && data && data.length > 0) {
        const map: Record<number, { avg: number; count: number }> = {};
        data.forEach(r => {
          map[Number(r.resource_id)] = {
            avg: Number(r.avg_rating),
            count: Number(r.review_count)
          };
        });
        setRatingsFromDb(map);
      }
    } catch (err) {
      console.warn('Could not fetch from v_resource_ratings:', err);
    }
  };

  // Synchronize bookmarks and feedback whenever logged-in user changes
  useEffect(() => {
    if (currentUser && isValidUuid(currentUser.id)) {
      fetchBookmarks(currentUser);
    }
    fetchFeedback();
    fetchRatings();
  }, [currentUser?.id]);

  // Save sanitized current user to localStorage (never store passwords!)
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
    return bookmarks
      .filter(b => String(b.userId) === String(currentUser.id))
      .map(b => b.resourceId);
  }, [bookmarks, currentUser]);

  const isBookmarked = (resourceId: number) => {
    if (!currentUser) return false;
    return bookmarks.some(
      b => String(b.userId) === String(currentUser.id) && b.resourceId === resourceId
    );
  };

  const toggleBookmark = async (resourceId: number) => {
    if (!currentUser) {
      showToast('Please log in to save resources.', 'warning');
      navigate('/login');
      return;
    }

    const isAlreadyBookmarked = bookmarks.some(
      b => String(b.userId) === String(currentUser.id) && b.resourceId === resourceId
    );

    if (isAlreadyBookmarked) {
      // Optimistic remove
      setBookmarks(prev =>
        prev.filter(b => !(String(b.userId) === String(currentUser.id) && b.resourceId === resourceId))
      );
      showToast('Removed from saved items.', 'info');

      if (isSupabaseConfigured() && isValidUuid(currentUser.id)) {
        try {
          const { error } = await supabase
            .from('bookmarks')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('resource_id', resourceId);

          if (error) {
            console.warn('Could not remove bookmark from Supabase:', error.message);
          }
        } catch (err) {
          console.warn('Supabase bookmark delete error:', err);
        }
      }
    } else {
      const newBookmark: Bookmark = {
        userId: currentUser.id,
        resourceId,
        createdAt: new Date().toISOString()
      };

      // Optimistic add
      setBookmarks(prev => [...prev, newBookmark]);
      showToast('Saved to your Farmer Dashboard!', 'success');

      if (isSupabaseConfigured() && isValidUuid(currentUser.id)) {
        try {
          const { error } = await supabase
            .from('bookmarks')
            .insert({
              user_id: currentUser.id,
              resource_id: resourceId
            });

          if (error && error.code !== '23505') {
            console.warn('Could not save bookmark to Supabase:', error.message);
          }
        } catch (err) {
          console.warn('Supabase bookmark insert error:', err);
        }
      }
    }
  };

  // Ratings calculation - combines DB aggregated view with fallback calculation from feedback array
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

    // Overlay DB aggregated ratings from v_resource_ratings if available
    Object.entries(ratingsFromDb).forEach(([resIdStr, dbRating]) => {
      const resId = Number(resIdStr);
      result[resId] = dbRating;
    });

    return result;
  }, [feedback, ratingsFromDb]);

  const editFeedback = async (feedbackId: number, rating: number, comment: string): Promise<void> => {
    if (!currentUser) {
      showToast('Please log in to edit your review.', 'warning');
      navigate('/login');
      return;
    }

    const cleanComment = comment.trim();
    if (cleanComment.length < 2) {
      showToast('Review comment must be at least 2 characters.', 'warning');
      return;
    }

    const cleanRating = Math.max(1, Math.min(5, Math.round(rating)));

    // Optimistic UI update
    setFeedback(prev =>
      prev.map(f =>
        f.id === feedbackId
          ? {
              ...f,
              rating: cleanRating,
              comment: cleanComment,
              updated_at: new Date().toISOString()
            }
          : f
      )
    );
    showToast(t('review_updated'), 'success');

    // Supabase mutation
    if (isSupabaseConfigured() && isValidUuid(currentUser.id)) {
      try {
        const { error } = await supabase
          .from('feedback')
          .update({
            rating: cleanRating,
            comment: cleanComment
          })
          .eq('id', feedbackId)
          .eq('user_id', currentUser.id);

        if (error) {
          console.warn('Could not update feedback in Supabase:', error.message);
        } else {
          fetchRatings();
          fetchFeedback();
        }
      } catch (err) {
        console.warn('Supabase feedback update error:', err);
      }
    }
  };

  const addFeedback = async (resourceId: number, rating: number, comment: string): Promise<void> => {
    if (!currentUser) {
      showToast('Please log in to submit a review.', 'warning');
      navigate('/login');
      return;
    }

    const cleanComment = comment.trim();
    if (cleanComment.length < 2) {
      showToast('Review comment must be at least 2 characters.', 'warning');
      return;
    }

    const cleanRating = Math.max(1, Math.min(5, Math.round(rating)));

    // Check if user already reviewed this resource
    const existing = feedback.find(
      f => (f.is_author || (currentUser && String(f.user_id) === String(currentUser.id))) && f.resource_id === resourceId
    );

    if (existing) {
      await editFeedback(existing.id, cleanRating, cleanComment);
      return;
    }

    const res = resources.find(r => r.id === resourceId);
    const tempId = Date.now();
    const newFeedback: Feedback = {
      id: tempId,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      username: currentUser.username,
      resource_id: resourceId,
      resource_title: res?.title || 'Resource',
      rating: cleanRating,
      comment: cleanComment,
      created_at: new Date().toISOString(),
      is_author: true
    };

    // Optimistic UI update
    setFeedback(prev => [newFeedback, ...prev]);
    showToast(t('review_submitted'), 'success');

    // Supabase mutation
    if (isSupabaseConfigured() && isValidUuid(currentUser.id)) {
      try {
        const { data, error } = await supabase
          .from('feedback')
          .insert({
            user_id: currentUser.id,
            resource_id: resourceId,
            author_name: currentUser.full_name,
            rating: cleanRating,
            comment: cleanComment
          })
          .select('id, user_id, author_name, rating, comment, created_at, updated_at')
          .single();

        if (error) {
          if (error.code === '23505') {
            // Duplicate review: user already has a record in Supabase
            showToast(t('review_already_submitted'), 'info');
            await supabase
              .from('feedback')
              .update({
                rating: cleanRating,
                comment: cleanComment
              })
              .eq('user_id', currentUser.id)
              .eq('resource_id', resourceId);
          } else {
            console.warn('Could not save feedback to Supabase:', error.message);
          }
        } else if (data) {
          setFeedback(prev =>
            prev.map(f =>
              f.id === tempId
                ? {
                    ...f,
                    id: Number(data.id),
                    created_at: data.created_at,
                    updated_at: data.updated_at
                  }
                : f
            )
          );
        }

        // Re-sync with views
        fetchRatings();
        fetchFeedback();
      } catch (err) {
        console.warn('Supabase feedback insert error:', err);
      }
    }
  };

  const deleteFeedback = async (feedbackId: number): Promise<void> => {
    // Optimistic removal
    setFeedback(prev => prev.filter(f => f.id !== feedbackId));
    showToast(t('review_deleted'), 'info');

    // Supabase mutation
    if (isSupabaseConfigured() && currentUser && isValidUuid(currentUser.id)) {
      try {
        const { error } = await supabase
          .from('feedback')
          .delete()
          .eq('id', feedbackId)
          .eq('user_id', currentUser.id);

        if (error) {
          console.warn('Could not delete feedback from Supabase:', error.message);
        } else {
          fetchRatings();
          fetchFeedback();
        }
      } catch (err) {
        console.warn('Supabase feedback delete error:', err);
      }
    }
  };

  // Auth: Login flow
  const login = async (
    usernameOrEmail: string,
    password?: string
  ): Promise<{ success: boolean; message: string; role?: string }> => {
    const trimmedInput = usernameOrEmail.trim();
    const normalized = trimmedInput.toLowerCase();

    // 1. First attempt secure backend admin authentication
    try {
      const resp = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedInput, password: password || '' })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.token && data.user) {
          sessionStorage.setItem('kisan_admin_token', data.token);
          const adminUser: User = {
            id: 'admin_root',
            full_name: data.user.full_name || 'Administrator',
            username: data.user.username || 'admin',
            email: 'admin@kisansahayak.in',
            state: data.user.state || 'Central Administration',
            preferred_category: data.user.preferred_category || 'Government Schemes',
            role: 'admin',
            created_at: new Date().toISOString()
          };
          setCurrentUser(adminUser);
          showToast(`${t('auth_welcome_back')}, ${adminUser.full_name}!`, 'success');
          return { success: true, message: t('auth_login_success'), role: 'admin' };
        }
      } else if (resp.status === 401) {
        const errData = await resp.json().catch(() => ({}));
        if (errData.isAdminAttempt) {
          return { success: false, message: t('auth_invalid_creds') };
        }
      }
    } catch {
      // Backend request error - proceed to farmer auth
    }

    // 2. Farmer authentication via Supabase Auth
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Supabase is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
      };
    }

    if (!password) {
      return {
        success: false,
        message: 'Password is required to log in.'
      };
    }

    // Resolve email address: Supabase Auth requires an email
    let emailToUse = normalized;
    const demoMap: Record<string, string> = {
      'demo_farmer_1': 'demo.farmer1@example.com',
      'demo_farmer_2': 'demo.farmer2@example.com',
      'demo_farmer_3': 'demo.farmer3@example.com'
    };

    if (demoMap[normalized]) {
      emailToUse = demoMap[normalized];
    } else if (!normalized.includes('@')) {
      // User entered a username without @. Provide helpful instruction.
      return {
        success: false,
        message: 'Please enter your registered email address (e.g. farmer@example.com) to log in.'
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password
      });

      if (error) {
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          return {
            success: false,
            message: 'Invalid credentials. Please verify your email and password, or register a new farmer account.'
          };
        }
        if (error.message.toLowerCase().includes('email not confirmed')) {
          return {
            success: false,
            message: 'Please confirm your email address before logging in, or check your inbox for the verification link.'
          };
        }
        return { success: false, message: error.message };
      }

      if (!data.user) {
        return { success: false, message: t('auth_invalid_creds') };
      }

      // Farmers are strictly non-admin
      sessionStorage.removeItem('kisan_admin_token');
      const farmerUser = await mapSupabaseUserToUser(data.user);
      setCurrentUser(farmerUser);
      showToast(`${t('auth_welcome_back')}, ${farmerUser.full_name}!`, 'success');
      return { success: true, message: t('auth_login_success'), role: 'user' };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Authentication error. Please check your network connection.'
      };
    }
  };

  // Auth: Registration flow
  const register = async (userData: {
    full_name: string;
    username: string;
    email: string;
    password?: string;
    state: string;
    preferred_category: string;
  }): Promise<{ success: boolean; message: string }> => {
    const rawUname = userData.username.trim().toLowerCase();
    const cleanUsername = rawUname.replace(/[^a-z0-9_]/g, '_');
    const uemail = userData.email.trim().toLowerCase();

    // Client-side validations matching schema
    if (!userData.full_name || userData.full_name.trim().length < 2) {
      return { success: false, message: 'Full name must be at least 2 characters long.' };
    }
    if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 30) {
      return { success: false, message: 'Username must be 3 to 30 alphanumeric characters.' };
    }
    if (!uemail.includes('@') || !uemail.includes('.')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    if (!userData.password || userData.password.length < 6) {
      return { success: false, message: t('auth_password_short') };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Supabase is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: uemail,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name.trim(),
            username: cleanUsername,
            state: userData.state || 'General',
            preferred_category: userData.preferred_category || 'General',
            role: 'user' // Strictly farmer role, never admin
          }
        }
      });

      if (error) {
        if (error.message.toLowerCase().includes('already registered')) {
          return { success: false, message: t('auth_user_exists') };
        }
        return { success: false, message: error.message };
      }

      if (!data.user) {
        return { success: false, message: 'Registration failed. Please try again.' };
      }

      // Defensive creation in public.profiles (if Stage 2 trigger is not active)
      try {
        await supabase.from('profiles').insert({
          id: data.user.id,
          username: cleanUsername,
          full_name: userData.full_name.trim(),
          state: userData.state || 'General',
          preferred_category: userData.preferred_category || 'General',
          role: 'user'
        });
      } catch {
        // Handled by DB trigger or already exists
      }

      // If Supabase automatically creates an active session (email confirmation off)
      if (data.session) {
        const farmerUser = await mapSupabaseUserToUser(data.user);
        setCurrentUser(farmerUser);
        showToast(`${t('auth_welcome_reg')}`, 'success');
        return { success: true, message: t('auth_reg_success') };
      } else {
        // Email confirmation is enabled
        showToast('Registration successful! Please check your email to verify your account, or log in.', 'info');
        return {
          success: true,
          message: 'Registration successful! If verification is required, please check your inbox.'
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Registration error. Please check your network connection.'
      };
    }
  };

  // Auth: Logout flow
  const logout = async (): Promise<void> => {
    sessionStorage.removeItem('kisan_admin_token');
    if (currentUser?.role === 'admin') {
      fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore network error on sign out
      }
    }

    setCurrentUser(null);
    showToast(t('auth_logout_msg'), 'info');
    navigate('/');
  };

  // Auth: Profile update flow
  const updateProfile = async (updates: {
    full_name: string;
    email: string;
    state: string;
    preferred_category: string;
    new_password?: string;
  }): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'Not logged in' };

    // If admin account, manage session locally
    if (currentUser.role === 'admin') {
      const updatedAdmin: User = {
        ...currentUser,
        full_name: updates.full_name.trim(),
        state: updates.state,
        preferred_category: updates.preferred_category
      };
      setCurrentUser(updatedAdmin);
      showToast(t('auth_profile_updated'), 'success');
      return { success: true, message: t('auth_profile_updated') };
    }

    // Farmer account update with Supabase
    if (isSupabaseConfigured()) {
      try {
        // 1. Update public.profiles table (strictly allowed columns: full_name, state, preferred_category)
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: updates.full_name.trim(),
            state: updates.state,
            preferred_category: updates.preferred_category
          })
          .eq('id', currentUser.id);

        if (profileError) {
          console.warn('Profile update warning:', profileError.message);
        }

        // 2. If password provided, update credentials in Supabase Auth
        if (updates.new_password) {
          if (updates.new_password.length < 6) {
            return { success: false, message: t('auth_password_short') };
          }
          const { error: pwdError } = await supabase.auth.updateUser({
            password: updates.new_password
          });
          if (pwdError) {
            return { success: false, message: `Password update failed: ${pwdError.message}` };
          }
        }

        // 3. Update auth metadata
        await supabase.auth.updateUser({
          data: {
            full_name: updates.full_name.trim(),
            state: updates.state,
            preferred_category: updates.preferred_category
          }
        });
      } catch (err: any) {
        console.warn('Supabase profile sync note:', err);
      }
    }

    const updatedUser: User = {
      ...currentUser,
      full_name: updates.full_name.trim(),
      email: updates.email.trim().toLowerCase(),
      state: updates.state,
      preferred_category: updates.preferred_category
    };

    setCurrentUser(updatedUser);
    showToast(t('auth_profile_updated'), 'success');
    return { success: true, message: t('auth_profile_updated') };
  };

  // Resource CRUD
  const addResource = async (data: Omit<Resource, 'id' | 'views_count'>): Promise<void> => {
    if (!currentUser || currentUser.role !== 'admin') { showToast('Administrator access is required to manage resources.', 'danger'); return; }
    if (resources.some(r => r.title.toLowerCase() === data.title.toLowerCase())) { showToast('A resource with this title already exists.', 'warning'); return; }
    try {
      await adminRequest('/api/admin/resources', { method: 'POST', body: JSON.stringify({ title: data.title, description: data.description, category_id: data.category_id, resource_type: data.resource_type, external_url: data.external_url, image_url: data.image_url, season_climate: data.season_climate, eligibility: data.eligibility, benefits: data.benefits, provider: data.provider }) });
      await fetchResources(); showToast('Resource created successfully.', 'success');
    } catch (error: any) { showToast(error.message || 'Resource creation failed.', 'danger'); }
  };

  const editResource = async (id: number, data: Partial<Resource>): Promise<void> => {
    if (!currentUser || currentUser.role !== 'admin') { showToast('Administrator access is required to manage resources.', 'danger'); return; }
    const payload: Record<string, any> = {};
    ['title','description','category_id','resource_type','external_url','image_url','season_climate','eligibility','benefits','provider'].forEach(key => { if ((data as any)[key] !== undefined) payload[key] = (data as any)[key]; });
    try { await adminRequest('/api/admin/resources/' + id, { method: 'PATCH', body: JSON.stringify(payload) }); await fetchResources(); showToast('Resource updated successfully.', 'success'); }
    catch (error: any) { showToast(error.message || 'Resource update failed.', 'danger'); }
  };

  const deleteResource = async (id: number): Promise<void> => {
    if (!currentUser || currentUser.role !== 'admin') { showToast('Administrator access is required to manage resources.', 'danger'); return; }
    try { await adminRequest('/api/admin/resources/' + id, { method: 'DELETE' }); await fetchResources(); showToast('Resource deleted successfully.', 'success'); }
    catch (error: any) { showToast(error.message || 'Resource deletion failed.', 'danger'); }
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
    return likes.some(l => l.postId === postId && String(l.userId) === String(currentUser.id));
  };

  const toggleLike = (postId: number) => {
    if (!currentUser) {
      showToast('Please log in to like discussions.', 'warning');
      navigate('/login');
      return;
    }

    const alreadyLiked = isPostLiked(postId);
    if (alreadyLiked) {
      setLikes(prev => prev.filter(l => !(l.postId === postId && String(l.userId) === String(currentUser.id))));
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

  // User management uses protected server-side admin endpoints.
  const toggleUserRole = async (userId: string | number): Promise<void> => {
    const target = users.find(user => String(user.id) === String(userId));
    if (!target || !currentUser || currentUser.role !== 'admin') { showToast('Administrator access is required.', 'danger'); return; }
    if (String(userId) === String(currentUser.id)) { showToast('You cannot change your own administrator role.', 'warning'); return; }
    const role: UserRole = target.role === 'admin' ? 'user' : 'admin';
    try { await adminRequest('/api/admin/users/' + encodeURIComponent(String(userId)) + '/role', { method: 'PATCH', body: JSON.stringify({ role }) }); await fetchAdminUsers(); showToast('User role updated.', 'success'); }
    catch (error: any) { showToast(error.message || 'Could not update user role.', 'danger'); }
  };

  const deleteUser = async (userId: string | number): Promise<void> => {
    if (!currentUser || currentUser.role !== 'admin') { showToast('Administrator access is required.', 'danger'); return; }
    if (String(userId) === String(currentUser.id)) { showToast('You cannot delete your own admin account.', 'danger'); return; }
    if (!users.some(user => String(user.id) === String(userId))) return;
    try { await adminRequest('/api/admin/users/' + encodeURIComponent(String(userId)), { method: 'DELETE' }); await fetchAdminUsers(); showToast('User account deleted successfully.', 'success'); }
    catch (error: any) { showToast(error.message || 'User deletion failed.', 'danger'); }
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
        isAuthLoading,
        resources,
        isResourcesLoading,
        resourcesError,
        refreshResources: () => fetchResources(),
        refreshCategories: async () => {
          await fetchCategories();
        },
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
        isBookmarksLoading,
        bookmarksError,
        refreshBookmarks: async () => {
          await fetchBookmarks();
        },
        isBookmarked,
        toggleBookmark,
        bookmarkedIds,
        isFeedbackLoading,
        feedbackError,
        refreshFeedback: async () => {
          await Promise.all([fetchFeedback(), fetchRatings()]);
        },
        ratingsMap,
        addFeedback,
        editFeedback,
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
