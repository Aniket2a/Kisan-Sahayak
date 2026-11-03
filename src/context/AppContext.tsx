import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  User,
  Resource,
  ResourceType,
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
  isBookmarked: (resourceId: number) => boolean;
  toggleBookmark: (resourceId: number) => void;
  bookmarkedIds: number[];
  
  // Ratings
  ratingsMap: Record<number, { avg: number; count: number }>;
  addFeedback: (resourceId: number, rating: number, comment: string) => void;
  deleteFeedback: (feedbackId: number) => void;

  // Auth & Profile
  login: (usernameOrEmail: string, password?: string) => Promise<{ success: boolean; message: string; role?: string }>;
  register: (userData: { full_name: string; username: string; email: string; password?: string; state: string; preferred_category: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: { full_name: string; email: string; state: string; preferred_category: string; new_password?: string }) => Promise<{ success: boolean; message: string }>;

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
  toggleUserRole: (userId: string | number) => void;
  deleteUser: (userId: string | number) => void;
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

  const [bookmarks, setBookmarks] = useState<Array<{ userId: string | number; resourceId: number; createdAt: string }>>(() => {
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
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

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

  const toggleBookmark = (resourceId: number) => {
    if (!currentUser) {
      showToast('Please log in to save resources.', 'warning');
      navigate('/login');
      return;
    }

    const existing = bookmarks.find(
      b => String(b.userId) === String(currentUser.id) && b.resourceId === resourceId
    );
    if (existing) {
      setBookmarks(prev =>
        prev.filter(b => !(String(b.userId) === String(currentUser.id) && b.resourceId === resourceId))
      );
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
    const existing = feedback.find(
      f => String(f.user_id) === String(currentUser.id) && f.resource_id === resourceId
    );

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
  const addResource = async (data: Omit<Resource, 'id' | 'views_count'>) => {
    const existing = resources.find(r => r.title.toLowerCase() === data.title.toLowerCase());
    if (existing) {
      showToast(`A resource with title "${data.title}" already exists.`, 'warning');
      return;
    }

    let createdId = Date.now();

    // If Supabase is configured, attempt insert
    if (isSupabaseConfigured()) {
      try {
        const { data: inserted, error } = await supabase
          .from('resources')
          .insert({
            title: data.title.trim(),
            description: data.description.trim(),
            category_id: data.category_id,
            resource_type: data.resource_type,
            external_url: data.external_url || null,
            image_url: data.image_url || null,
            season_climate: data.season_climate || null,
            eligibility: data.eligibility || null,
            benefits: data.benefits || null,
            provider: data.provider || null,
            views_count: 0
          })
          .select('id')
          .maybeSingle();

        if (!error && inserted) {
          createdId = Number(inserted.id);
        } else if (error) {
          console.warn('Could not insert resource in Supabase (will persist locally):', error.message);
        }
      } catch (err) {
        console.warn('Supabase resource insert error:', err);
      }
    }

    const newRes: Resource = {
      ...data,
      id: createdId,
      views_count: 0,
      created_at: new Date().toISOString()
    };

    setResources(prev => [newRes, ...prev]);
    showToast(`Resource "${newRes.title}" created successfully.`, 'success');
  };

  const editResource = async (id: number, data: Partial<Resource>) => {
    if (isSupabaseConfigured()) {
      try {
        const updatePayload: any = {};
        if (data.title !== undefined) updatePayload.title = data.title.trim();
        if (data.description !== undefined) updatePayload.description = data.description.trim();
        if (data.category_id !== undefined) updatePayload.category_id = data.category_id;
        if (data.resource_type !== undefined) updatePayload.resource_type = data.resource_type;
        if (data.external_url !== undefined) updatePayload.external_url = data.external_url;
        if (data.image_url !== undefined) updatePayload.image_url = data.image_url;
        if (data.season_climate !== undefined) updatePayload.season_climate = data.season_climate;
        if (data.eligibility !== undefined) updatePayload.eligibility = data.eligibility;
        if (data.benefits !== undefined) updatePayload.benefits = data.benefits;
        if (data.provider !== undefined) updatePayload.provider = data.provider;

        const { error } = await supabase
          .from('resources')
          .update(updatePayload)
          .eq('id', id);

        if (error) {
          console.warn('Could not update resource in Supabase (will persist locally):', error.message);
        }
      } catch (err) {
        console.warn('Supabase resource update error:', err);
      }
    }

    setResources(prev =>
      prev.map(r => (r.id === id ? { ...r, ...data } : r))
    );
    showToast(`Resource #${id} updated successfully.`, 'success');
  };

  const deleteResource = async (id: number) => {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('resources')
          .delete()
          .eq('id', id);

        if (error) {
          console.warn('Could not delete resource in Supabase (will persist locally):', error.message);
        }
      } catch (err) {
        console.warn('Supabase resource delete error:', err);
      }
    }

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

  // User Management (Role escalation prevented)
  const toggleUserRole = (_userId: string | number) => {
    showToast('Role escalation is disabled. Only the private server-configured Admin account possesses administrator privileges.', 'warning');
  };

  const deleteUser = (userId: string | number) => {
    if (currentUser && String(currentUser.id) === String(userId)) {
      showToast('Cannot delete your own admin account.', 'danger');
      return;
    }

    setUsers(prev => prev.filter(u => String(u.id) !== String(userId)));
    setBookmarks(prev => prev.filter(b => String(b.userId) !== String(userId)));
    setFeedback(prev => prev.filter(f => String(f.user_id) !== String(userId)));
    setCommunityPosts(prev => prev.filter(p => String(p.user_id) !== String(userId)));
    setComments(prev => prev.filter(c => String(c.user_id) !== String(userId)));
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
