/**
 * API client - uses REACT_APP_API_URL when set (e.g. when proxy doesn't work).
 * In dev with proxy, leave unset so requests go to same origin and get proxied to backend.
 */
import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || '';
const api = baseURL ? axios.create({ baseURL }) : axios;

export default api;
