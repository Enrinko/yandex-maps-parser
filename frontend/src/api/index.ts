import http, { ensureCsrfCookie } from './http';
import type {
  Organization,
  PaginatedReviews,
  StatusResponse,
  User,
} from './types';

export const authApi = {
  async login(email: string, password: string): Promise<User> {
    await ensureCsrfCookie();
    const { data } = await http.post<{ user: User }>('/api/login', { email, password });
    return data.user;
  },
  async logout(): Promise<void> {
    await http.post('/api/logout');
  },
  async me(): Promise<User> {
    const { data } = await http.get<{ user: User }>('/api/user');
    return data.user;
  },
};

export const organizationApi = {
  async get(): Promise<Organization | null> {
    const { data } = await http.get<{ organization: Organization | null }>('/api/organization');
    return data.organization;
  },
  async save(url: string): Promise<Organization> {
    await ensureCsrfCookie();
    const { data } = await http.post<{ organization: Organization }>('/api/organization', { url });
    return data.organization;
  },
  async refresh(): Promise<Organization> {
    await ensureCsrfCookie();
    const { data } = await http.post<{ organization: Organization }>('/api/organization/refresh');
    return data.organization;
  },
  async status(): Promise<StatusResponse> {
    const { data } = await http.get<StatusResponse>('/api/organization/status');
    return data;
  },
  async reviews(page: number, perPage = 50): Promise<PaginatedReviews> {
    const { data } = await http.get<PaginatedReviews>('/api/organization/reviews', {
      params: { page, per_page: perPage },
    });
    return data;
  },
};
