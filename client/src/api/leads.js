import { api, BASE_URL } from './client.js';

export const leadsApi = {
  list           : (params, signal) => api.get('/leads', { params, signal }),
  get            : (id, signal) => api.get(`/leads/${id}`, { signal }).then((r) => r.data),
  create         : (data) => api.post('/leads', data).then((r) => r.data),
  update         : (id, data) => api.patch(`/leads/${id}`, data).then((r) => r.data),
  updateStatus   : (id, status) => api.patch(`/leads/${id}/status`, { status }).then((r) => r.data),
  remove         : (id) => api.delete(`/leads/${id}`),

  addNote        : (id, content) => api.post(`/leads/${id}/notes`, { content }).then((r) => r.data),
  removeNote     : (id, noteId) => api.delete(`/leads/${id}/notes/${noteId}`),

  // Bulk CSV Import & Export
  uploadCsv        : (formData) => api.post('/leads/upload-csv', formData).then((r) => r.data),
  getImportStatus  : (jobId) => api.get(`/leads/import-status/${jobId}`).then((r) => r.data),
  getSampleCsvUrl  : () => `${BASE_URL}/leads/sample-csv`,
  getInvalidCsvUrl : (jobId) => `${BASE_URL}/leads/import-status/${jobId}/invalid-csv`,
  exportCsvUrl     : (params = {}) => {
    // Convert all filter/sort params to URL query string
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    }
    const qs = searchParams.toString();
    return `${BASE_URL}/leads/export-csv${qs ? `?${qs}` : ''}`;
  },
};

export const dashboardApi = {
  stats: (signal) => api.get('/dashboard/stats', { signal }).then((r) => r.data),
};
