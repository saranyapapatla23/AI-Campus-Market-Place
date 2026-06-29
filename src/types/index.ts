export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  college_name: string;
  department?: string;
  semester?: number;
  hostel?: string;
  phone?: string;
  bio?: string;
  is_admin: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  parent_id?: string;
  created_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  title: string;
  description?: string;
  ai_summary?: string;
  category_id?: string;
  condition: 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';
  price: number;
  original_price?: number;
  negotiable: boolean;
  age_months: number;
  location: string;
  images: string[];
  features: string[];
  tags: string[];
  status: 'available' | 'sold' | 'reserved' | 'draft';
  views: number;
  created_at: string;
  updated_at: string;
  seller?: User;
  category?: Category;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  final_price: number;
  created_at: string;
  updated_at: string;
  buyer?: User;
  seller?: User;
  product?: Product;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  product_id?: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: User;
  receiver?: User;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  product_id?: string;
  last_message?: string;
  last_message_at: string;
  created_at: string;
  otherUser?: User;
  product?: Product;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  product_id?: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  product?: Product;
  reporter?: User;
}

export interface Rating {
  id: string;
  rater_id: string;
  rated_user_id: string;
  order_id?: string;
  rating: number;
  review?: string;
  created_at: string;
  rater?: User;
  rated_user?: User;
}

export interface SearchHistory {
  id: string;
  user_id: string;
  query: string;
  filters?: Record<string, unknown>;
  created_at: string;
}
