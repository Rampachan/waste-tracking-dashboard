import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.setItem(
        'session_expired_reason',
        'Your security session has expired due to inactivity. Please log in again to continue.'
      );
      window.dispatchEvent(new CustomEvent('auth-expired'));
      window.location.hash = '#/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  }
};

export const ulbService = {
  getAll: async (region, category, search) => {
    const res = await api.get('/ulbs', { params: { region, category, search } });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/ulbs/${id}`);
    return res.data;
  },
  updateStaticData: async (id, data) => {
    const res = await api.put(`/ulbs/${id}`, data);
    return res.data;
  }
};

export const logService = {
  getDaily: async (targetDate, region) => {
    const res = await api.get('/logs/daily', { params: { target_date: targetDate, region } });
    return res.data;
  },
  getHistory: async (ulbId, limit = 30) => {
    const res = await api.get(`/logs/history/${ulbId}`, { params: { limit } });
    return res.data;
  },
  submitLog: async (logData) => {
    const res = await api.post('/logs', logData);
    return res.data;
  }
};

export const dashboardService = {
  getSummary: async (targetDate, region) => {
    const res = await api.get('/dashboard/summary', { params: { target_date: targetDate, region } });
    return res.data;
  },
  getCompliance: async (targetDate) => {
    const res = await api.get('/dashboard/compliance', { params: { target_date: targetDate } });
    return res.data;
  }
};

export const exportService = {
  downloadDailyExcel: async (targetDate) => {
    const response = await api.get('/export/daily', {
      params: { target_date: targetDate },
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `TN_Daily_Waste_Report_${targetDate || 'today'}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  downloadMonthlyExcel: async (year, month) => {
    const response = await api.get('/export/monthly', {
      params: { year, month },
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `TN_Monthly_Waste_Report_${year}_${month}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};

export const uwmService = {
  getBaselines: async (region, search) => {
    const res = await api.get('/uwm/baselines', { params: { region, search } });
    return res.data;
  },
  getBaselineById: async (ulbId) => {
    const res = await api.get(`/uwm/baselines/${ulbId}`);
    return res.data;
  },
  updateBaseline: async (ulbId, data) => {
    const res = await api.put(`/uwm/baselines/${ulbId}`, data);
    return res.data;
  },
  submitLog: async (logData) => {
    const res = await api.post('/uwm/logs', logData);
    return res.data;
  },
  getDailyLogs: async (targetDate, region) => {
    const res = await api.get('/uwm/logs/daily', { params: { target_date: targetDate, region } });
    return res.data;
  },
  getHistory: async (ulbId, limit = 30) => {
    const res = await api.get(`/uwm/logs/history/${ulbId}`, { params: { limit } });
    return res.data;
  },
  getSummary: async (targetDate, region) => {
    const res = await api.get('/uwm/dashboard/summary', { params: { target_date: targetDate, region } });
    return res.data;
  },
  downloadDailyExcel: async (targetDate) => {
    const response = await api.get('/uwm/export/daily', {
      params: { target_date: targetDate },
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `TN_Daily_UWM_Report_${targetDate || 'today'}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};

export const facilityService = {
  getFacilities: async (ulbId) => {
    const res = await api.get('/swm/facilities', { params: { ulb_id: ulbId } });
    return res.data;
  },
  createFacility: async (facilityData) => {
    const res = await api.post('/swm/facilities', facilityData);
    return res.data;
  },
  updateFacility: async (id, facilityData) => {
    const res = await api.put(`/swm/facilities/${id}`, facilityData);
    return res.data;
  },
  deleteFacility: async (id) => {
    const res = await api.delete(`/swm/facilities/${id}`);
    return res.data;
  }
};

export default api;
