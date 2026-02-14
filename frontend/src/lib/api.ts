import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;

// API Functions

// Auth
export const auth = {
    register: (data: any) => apiClient.post('/api/auth/register', data),
    login: (data: any) => apiClient.post('/api/auth/login', data),
    getMe: () => apiClient.get('/api/auth/me'),
};

// Onboarding
export const onboarding = {
    createWorkspace: (data: any) => apiClient.post('/api/onboarding/workspace', data),
    getWorkspace: () => apiClient.get('/api/onboarding/workspace'),
    getWorkspacePublic: (workspaceId: string) => apiClient.get(`/api/onboarding/workspace/${workspaceId}/public`),
    createIntegration: (data: any) => apiClient.post('/api/onboarding/integrations', data),
    listIntegrations: () => apiClient.get('/api/onboarding/integrations'),
    createContactForm: (data: any) => apiClient.post('/api/onboarding/contact-form', data),
    createServiceType: (data: any) => apiClient.post('/api/onboarding/service-types', data),
    createAvailabilitySlot: (data: any) => apiClient.post('/api/onboarding/availability-slots', data),
    createPostBookingForm: (data: any) => apiClient.post('/api/onboarding/post-booking-forms', data),
    createInventoryItem: (data: any) => apiClient.post('/api/onboarding/inventory', data),
    addStaff: (data: any) => apiClient.post('/api/onboarding/staff', data),
    activateWorkspace: () => apiClient.post('/api/onboarding/activate'),
    getStatus: () => apiClient.get('/api/onboarding/status'),
    voiceTranscribe: (formData: FormData) => apiClient.post('/api/onboarding/voice/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Dashboard
export const dashboard = {
    getOverview: (targetDate?: string) => apiClient.get('/api/dashboard/overview', { params: { target_date: targetDate } }),
    getAnalysis: (targetDate?: string) => apiClient.post('/api/dashboard/analysis', null, { params: { target_date: targetDate } }),
    getAlerts: (unreadOnly = false) => apiClient.get(`/api/dashboard/alerts?unread_only=${unreadOnly}`),
    markAlertRead: (alertId: string) => apiClient.patch(`/api/dashboard/alerts/${alertId}/read`),
};

// Bookings
export const bookings = {
    list: (params?: any) => apiClient.get('/api/bookings/', { params }),
    get: (id: string) => apiClient.get(`/api/bookings/${id}`),
    updateStatus: (id: string, status: string) => apiClient.patch(`/api/bookings/${id}/status`, null, { params: { new_status: status } }),
    getAvailableSlots: (serviceTypeId: string, date: string, workspaceId: string) =>
        apiClient.get('/api/bookings/service-types/available-slots', {
            params: { service_type_id: serviceTypeId, date, workspace_id: workspaceId }
        }),
    createPublicBooking: (data: any) =>
        apiClient.post('/api/bookings/public', data),
};

// Inbox
export const inbox = {
    getConversations: (status = 'active') => apiClient.get(`/api/inbox/conversations?status_filter=${status}`),
    getMessages: (conversationId: string) => apiClient.get(`/api/inbox/conversations/${conversationId}/messages`),
    sendMessage: (conversationId: string, data: { content: string, channel: string }) =>
        apiClient.post(`/api/inbox/conversations/${conversationId}/messages`, null, {
            params: { content: data.content, channel: data.channel }
        }),
    getUnreadCount: () => apiClient.get('/api/inbox/unread-count'),
    archiveConversation: (conversationId: string) => apiClient.patch(`/api/inbox/conversations/${conversationId}/archive`),
    submitContactForm: (data: any) => apiClient.post('/api/inbox/public/contact', data),
};
