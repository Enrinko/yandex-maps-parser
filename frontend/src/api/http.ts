import axios from 'axios';

/**
 * Axios instance configured for Sanctum SPA cookie authentication.
 * `withCredentials` sends the session + XSRF cookies; axios automatically
 * mirrors the XSRF-TOKEN cookie into the X-XSRF-TOKEN header.
 */
const http = axios.create({
  baseURL: '/',
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

/** Fetch the CSRF cookie before any state-changing request. */
export async function ensureCsrfCookie(): Promise<void> {
  await http.get('/sanctum/csrf-cookie');
}

export default http;
