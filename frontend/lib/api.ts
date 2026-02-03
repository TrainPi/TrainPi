
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
  register: async (email: string, password: string, fullName?: string) => {
    // 1. Register
    await api.post('/api/auth/register', { email, password, full_name: fullName });

    // 2. Login to get token (FastAPI expects application/x-www-form-urlencoded)
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    const loginRes = await api.post('/api/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const token = loginRes.data.access_token;

    // 3. Get User details
    const userRes = await api.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });

    return {
      user: userRes.data,
      token: token
    };
  },

  login: async (email: string, password: string) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    const { data } = await api.post('/api/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    // Get user details after login
    const userRes = await api.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${data.access_token}` }
    });

    return {
      access_token: data.access_token,
      token_type: data.token_type,
      user: userRes.data
    };
  },

  getMe: async () => {
    const { data } = await api.get('/api/auth/me');
    return data;
  },

  updateProfile: async (data: any) => {
    const { data: response } = await api.put('/api/auth/me', data);
    return response;
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/api/auth/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  forgotPassword: async (email: string) => {
    const { data } = await api.post('/api/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const { data } = await api.post('/api/auth/reset-password', { token, new_password: newPassword });
    return data;
  },
};

// Career API
export const careerAPI = {
  discover: async (interests: string[], skills: string[], resumeText?: string) => {
    const { data } = await api.post('/api/career/discover', { interests, skills, resume_text: resumeText });
    // Backend returns list of matches directly
    return {
      careers: data,
      analysis: "Career matches generated based on your profile."
    };
  },

  selectCareer: async (careerPath: string) => {
    const { data } = await api.post('/api/career/select', { career_path: careerPath });
    if (typeof window !== 'undefined') {
      localStorage.setItem('trainpi_career_path', careerPath);
    }
    return data;
  },

  getProfile: async () => {
    const { data } = await api.get('/api/career/profile');
    return data;
  },
};

// Roadmap API
export const roadmapAPI = {
  create: async (careerPath: string) => {
    const { data } = await api.post('/api/roadmap/create', { career_path: careerPath });
    return data; // Returns RoadmapResponse
  },

  getMyRoadmap: async () => {
    const { data } = await api.get('/api/roadmap/my-roadmap');
    return data;
  },

  updateProgress: async (roadmapId: number, stepNumber: number) => {
    const { data } = await api.post(`/api/roadmap/update-progress/${roadmapId}?step_number=${stepNumber}`);
    return data;
  },
};

// Resume API
export const resumeAPI = {
  create: async (resumeData: any) => {
    const { data } = await api.post('/api/resume/create', resumeData);
    return data;
  },

  uploadResume: async (file: File) => {
    // Note: Backend endpoint for upload needs to be implemented or matched
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/api/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  getMyResumes: async () => {
    const { data } = await api.get('/api/resume/my-resumes');
    return data;
  },

  getResume: async (resumeId: number) => {
    const { data } = await api.get(`/api/resume/${resumeId}`);
    return data;
  },

  enhance: async (resumeId: number, jobDescription: string) => {
    const { data } = await api.post(`/api/resume/enhance/${resumeId}`, null, {
      params: { job_description: jobDescription }
    });
    return data;
  },
};

// Lessons API
export const lessonsAPI = {
  create: async (title: string, content?: string, sourceDocument?: string) => {
    const { data } = await api.post('/api/lessons/create', { title, content, source_document: sourceDocument });
    return data;
  },

  getMyLessons: async () => {
    const { data } = await api.get('/api/lessons/my-lessons');
    return data;
  },

  getLesson: async (lessonId: number) => {
    const { data } = await api.get(`/api/lessons/${lessonId}`);
    return data;
  },

  uploadDocument: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/api/lessons/upload-document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    const { data } = await api.get('/api/dashboard/stats');
    return data;
  },

  updateProgress: async (progressData: any) => {
    const { data } = await api.post('/api/dashboard/progress', progressData);
    return data;
  },
};

// Chat API
export const chatAPI = {
  sendMessage: async (message: string, image?: string) => {
    const { data } = await api.post('/api/chat/message', { message, image });
    return data;
  },
};

// Exceptions API
export const exceptionsAPI = {
  getExceptions: async () => {
    const { data } = await api.get('/api/exceptions/exceptions');
    return data;
  },

  createException: async (type: string, status: string, durationSeconds: number, remarks?: string) => {
    const { data } = await api.post('/api/exceptions/exceptions', {
      type,
      status,
      duration_seconds: durationSeconds,
      remarks
    });
    return data;
  },

  clearException: async (exceptionId: number) => {
    const { data } = await api.post(`/api/exceptions/exceptions/${exceptionId}/clear`);
    return data;
  },
};
