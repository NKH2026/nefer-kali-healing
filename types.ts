export interface Product {
  id: string;
  created_at?: string;
  title: string;
  type: string;
  description: string | null;
  price: string | null;
  image_url: string | null;
  rating: number;
  reviews_count: number;
}

export interface BlogPost {
  id: string;
  created_at?: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  category: string;
  published: boolean;
  author: string;
}

export interface Review {
  id: string;
  created_at: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
}

// Legacy / UI specific
export interface ProductCard {
  id: string;
  title: string;
  type: string;
  description: string;
  price: string;
  image: string;
  rating: number;
  reviews: number;
}

export interface DestinyPath {
  id: string;
  label: string;
  subLabel: string;
  icon: string;
  color: string;
  accent: string;
}

export interface Testimonial {
  id: number;
  name: string;
  location: string;
  rating: number;
  text: string;
  productName: string;
  date: string;
  image?: string;
  verified: boolean;
}
