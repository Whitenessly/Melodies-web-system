const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const cleanedUrl = rawApiUrl.replace(/\/+$/, '');
export const BASE_URL = cleanedUrl.endsWith('/api') ? cleanedUrl : `${cleanedUrl}/api`;

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token && token !== 'null') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    ...options,
    headers
  };
  
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }
  
  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  
  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      data = { message: 'Failed to process server response.' };
    }
  } else {
    data = { message: 'Unable to connect to service or endpoint not found.' };
  }
  
  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      localStorage.setItem('token', 'null');
      window.dispatchEvent(new Event('auth_unauthorized'));
    }
    throw new Error(data.message || 'Failed to update password.');
  }
  
  return data;
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options = {}) => request(endpoint, { method: 'POST', body, ...options }),
  put: (endpoint, body, options = {}) => request(endpoint, { method: 'PUT', body, ...options }),
  delete: (endpoint, options = {}) => request(endpoint, { method: 'DELETE', ...options }),
};
