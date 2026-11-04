export type Language = 'en' | 'hi' | 'mr';

export type ResourceType = 'crop' | 'tool' | 'scheme' | 'loan' | 'guide' | 'marketplace' | 'community';

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  full_name: string;
  username: string;
  email: string;
  state: string;
  preferred_category: string;
  role: UserRole;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

export interface Resource {
  id: number;
  title: string;
  description: string;
  category_id: number;
  category_name: string;
  resource_type: ResourceType;
  external_url: string;
  image_url: string;
  season_climate: string;
  eligibility: string;
  benefits: string;
  provider: string;
  views_count: number;
  created_at?: string;
}

export interface Bookmark {
  id?: string;
  userId: string | number;
  resourceId: number;
  createdAt?: string;
}

export interface Feedback {
  id: number;
  user_id?: string | number;
  user_name: string;
  username?: string;
  resource_id: number;
  resource_title?: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at?: string;
  is_author?: boolean;
}

export interface ResourceRating {
  resource_id: number;
  avg_rating: number;
  review_count: number;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id?: string | number;
  comment_author: string;
  comment_state?: string;
  comment: string;
  created_at: string;
  is_author?: boolean;
}

export interface CommunityPost {
  id: number;
  user_id?: string | number;
  author_name: string;
  author_state: string;
  title: string;
  category: string;
  content: string;
  created_at: string;
  like_count: number;
  comment_count: number;
  is_author?: boolean;
  is_liked?: boolean;
}

export interface MandiPrice {
  crop: string;
  variety?: string;
  mandi: string;
  state?: string;
  district?: string;
  grade?: string;
  arrival_date?: string;
  min_price?: number;
  max_price?: number;
  price: number;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  change?: string;
}

export interface CityInfo {
  name: string;
  lat: number;
  lon: number;
  region: string;
}

export interface WeatherForecastDay {
  day: string;
  max_temp: number;
  min_temp: number;
  rain_prob: number;
  condition: string;
  icon: string;
}

export interface AgriTip {
  type: 'warning' | 'info' | 'success' | 'danger';
  icon: string;
  title: string;
  text: string;
}

export interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  humidity: number;
  wind: number;
  rain_prob: number;
  forecast: WeatherForecastDay[];
  tips: AgriTip[];
  is_live: boolean;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'danger' | 'warning' | 'info';
}
