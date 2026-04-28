/**
 * Atlas — API Client
 * Fetch wrapper with JWT auth header injection
 */

const BASE_URL = '/api/v1';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('skillweave_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('skillweave_token');
    localStorage.removeItem('skillweave_user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || 'Request failed');
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    return fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Login failed' }));
        throw new Error(err.detail);
      }
      return res.json();
    });
  },

  // Students
  getStudents: () => request('/students/'),
  getStudent: () => request(`/students/me`),
  getDashboard: (id) => id ? request(`/students/${id}/dashboard`) : request(`/students/me/dashboard`),

  // Graph
  getConcepts: () => request('/graph/concepts'),
  getPrerequisiteChain: (conceptId) => request(`/graph/prerequisites/${conceptId}`),
  getRootCause: (studentId, conceptId) => studentId ? request(`/graph/root-cause/${studentId}/${conceptId}`) : request(`/graph/root-cause/me/${conceptId}`),

  // Attempts
  createAttempt: (data) => request('/attempts/', { method: 'POST', body: JSON.stringify(data) }),
  getAttempts: () => request(`/attempts/me`),

  // Analytics
  getOverview: () => request('/analytics/overview'),
  getGapAggregation: () => request('/analytics/gaps'),
  getSeverityDistribution: () => request('/analytics/severity-distribution'),
  getStudentPerformance: () => request('/analytics/student-performance'),

  // AI Module
  triggerRemediation: (gapId, conceptName, difficulty, severity) => request('/ai/remediation-plan', {
    method: 'POST',
    body: JSON.stringify({ gap_id: gapId, concept_name: conceptName, difficulty, severity })
  }),
  sendChatMessage: (message, history) => request('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history })
  }),
};
