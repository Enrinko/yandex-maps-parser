export type OrganizationStatus = 'pending' | 'parsing' | 'done' | 'failed';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Organization {
  id: number;
  url: string;
  name: string | null;
  rating: number | null;
  ratings_count: number | null;
  reviews_count: number | null;
  status: OrganizationStatus;
  error: string | null;
  parsed_at: string | null;
}

export interface Review {
  id: number;
  author: string | null;
  rating: number | null;
  text: string | null;
  reviewed_at: string | null;
}

export interface StatusResponse {
  status: OrganizationStatus | null;
  error?: string | null;
  counts?: {
    rating: number | null;
    ratings_count: number | null;
    reviews_count: number | null;
  };
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedReviews {
  data: Review[];
  meta: PaginationMeta;
}
