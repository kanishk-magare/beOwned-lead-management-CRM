import { api } from './client.js';

export const locationsApi = {
  search: (q, signal) =>
    api.get('/locations/search', { params: { q }, signal }).then((r) => r.data),
};
