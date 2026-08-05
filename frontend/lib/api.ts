import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { MOCK_ONLY } from './mockConfig';
import {
  getDemoStatsWithSelections,
  DEMO_CAREERS,
  DEMO_ROADMAP_STEPS,
  DEMO_ROADMAP_STEPS_FULL,
  getDemoExceptions,
  DEMO_RESUMES,
  getDemoResumeAnalysis,
  getDemoReadinessReport,
  DEMO_SCENARIOS,
  DEMO_WORKFLOWS,
} from './demoData';
import { getMockChatResponse } from './chatMockResponses';
import { getLessonsWithDefaults, addLesson, getLessonById } from './lessonsStorage';

const DEFAULT_CAREER = 'SOC Analyst';

function currentCareer(): string {
  if (typeof window === 'undefined') return DEFAULT_CAREER;
  return localStorage.getItem('trainpi_career_path') || DEFAULT_CAREER;
}

function mockToken(email: string): string {
  return `mock.${btoa(email).replace(/=+$/, '')}.${Date.now()}`;
}

// In dev (browser), use same-origin so Next.js rewrites /api/* to backend and avoid CORS
const API_URL =
  typeof window !== 'undefined' && process.env.NODE_ENV === 'development'
    ? ''
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (MOCK_ONLY) return config;
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Any 401 = session invalid → clear auth and redirect to login (so no area is accessible without login)
// Any 402 = credits exhausted → fire a global event so the CreditsExpiredModal can intercept
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      useAuthStore.getState().clearAuth();
      const path = window.location.pathname + window.location.search;
      const isLoginPage = path === '/login' || path.startsWith('/login?');
      window.location.href = !isLoginPage && path !== '/' ? `/login?next=${encodeURIComponent(path)}` : '/login';
    }
    if (error?.response?.status === 402 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('credits-expired'));
    }
    return Promise.reject(error);
  }
);

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function mockUser(email: string, fullName?: string) {
  const name = fullName || email.replace(/@.*/, '').replace(/[._]/g, ' ') || 'User';
  return {
    id: 1,
    email,
    full_name: name,
    bio: 'Experienced professional building skills in software development. Passionate about clean code and continuous learning.',
    headline: 'Aspiring Software Engineer',
    profile_image: null,
    location: 'San Francisco, CA',
    website: null,
    linkedin_url: null,
    github_url: null,
  };
}

// In-memory mock exceptions; seed with demo data for client demo (resets on refresh)
let mockExceptions: { id: number; type: string; status: string; duration_seconds?: number; remarks?: string; createdAt?: string; created_at?: string; clearedAt?: string }[] = [];
let mockExceptionId = 10;

function getSeedExceptions() {
  if (mockExceptions.length > 0) return mockExceptions;
  const demo = getDemoExceptions();
  mockExceptions = demo.map((e) => ({
    id: e.id,
    type: e.type,
    status: e.status,
    remarks: e.remarks,
    duration_seconds: e.duration_seconds ?? undefined,
    createdAt: e.createdAt,
    created_at: e.created_at,
    clearedAt: e.clearedAt,
  }));
  return mockExceptions;
}

// Auth API — fully mocked for the demo. Any email/password works.
export const authAPI = {
  register: async (email: string, password: string, fullName?: string, agreeToTerms?: boolean) => {
    if (MOCK_ONLY) {
      await delay(300);
      return { id: 1, email, full_name: fullName ?? null, agree_to_terms: agreeToTerms ?? true };
    }
    const res = await api.post('/api/auth/register', { email, password, full_name: fullName, agree_to_terms: agreeToTerms });
    return res.data;
  },

  login: async (email: string, password: string) => {
    if (MOCK_ONLY) {
      await delay(350);
      const user = mockUser(email);
      return {
        access_token: mockToken(email),
        token_type: 'bearer',
        user,
      };
    }
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    const { data } = await api.post('/api/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const userRes = await api.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    return {
      access_token: data.access_token,
      token_type: data.token_type,
      user: userRes.data,
    };
  },

  getMe: async () => {
    if (MOCK_ONLY) {
      const user = useAuthStore.getState().user;
      return user || mockUser('guest@trainpi.dev', 'Guest');
    }
    const { data } = await api.get('/api/auth/me');
    return data;
  },

  updateProfile: async (data: any) => {
    if (MOCK_ONLY) {
      await delay(200);
      const user = useAuthStore.getState().user;
      const updated = user ? { ...user, ...data } : mockUser('guest@trainpi.dev');
      useAuthStore.getState().setAuth(updated, useAuthStore.getState().token || 'mock');
      return updated;
    }
    const { data: response } = await api.put('/api/auth/me', data);
    return response;
  },

  uploadAvatar: async (_file: File) => {
    if (MOCK_ONLY) {
      await delay(200);
      return { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=profile' };
    }
    const formData = new FormData();
    formData.append('file', _file);
    const { data } = await api.post('/api/auth/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  forgotPassword: async (_email: string) => {
    if (MOCK_ONLY) {
      await delay(300);
      return { message: 'If an account exists, you will receive an email.' };
    }
    const { data } = await api.post('/api/auth/forgot-password', { email: _email });
    return data;
  },

  resetPassword: async (_token: string, _newPassword: string) => {
    if (MOCK_ONLY) {
      await delay(300);
      return { message: 'Password reset successfully.' };
    }
    const { data } = await api.post('/api/auth/reset-password', {
      token: _token,
      new_password: _newPassword,
    });
    return data;
  },
};

// Career API
export const careerAPI = {
  discover: async (_interests: string[], _skills: string[], _resumeText?: string) => {
    if (MOCK_ONLY) {
      await delay(300);
      return {
        careers: [...DEMO_CAREERS],
        analysis: 'Career matches generated based on your profile (mock).',
      };
    }
    const { data } = await api.post('/api/career/discover', {
      interests: _interests,
      skills: _skills,
      resume_text: _resumeText,
    });
    return { careers: data, analysis: 'Career matches generated based on your profile.' };
  },

  selectCareer: async (careerPath: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('trainpi_career_path', careerPath);
    }
    if (MOCK_ONLY) {
      await delay(200);
      return { career_path: careerPath };
    }
    const { data } = await api.post('/api/career/select', { career_path: careerPath });
    return data;
  },

  getProfile: async () => {
    if (MOCK_ONLY) {
      await delay(200);
      const path =
        typeof window !== 'undefined' ? localStorage.getItem('trainpi_career_path') : null;
      return {
        career_path: path,
        interests: [],
        skills: [],
        match_score: null,
      };
    }
    const { data } = await api.get('/api/career/profile');
    return data;
  },
};

// Roadmap API
export const roadmapAPI = {
  create: async (careerPath: string) => {
    if (MOCK_ONLY) {
      await delay(300);
      return {
        id: 1,
        career_path: careerPath,
        steps: DEMO_ROADMAP_STEPS_FULL,
        current_step: 3,
        completion_percentage: 85,
      };
    }
    const { data } = await api.post('/api/roadmap/create', { career_path: careerPath });
    return data;
  },

  getMyRoadmap: async (roadmapId?: number) => {
    if (MOCK_ONLY) {
      await delay(200);
      return {
        id: roadmapId || 1,
        career_path: currentCareer(),
        steps: DEMO_ROADMAP_STEPS_FULL,
        current_step: 3,
        completion_percentage: 64,
      };
    }
    const url = roadmapId ? `/api/roadmap/get/${roadmapId}` : '/api/roadmap/my-roadmap';
    const { data } = await api.get(url);
    return data;
  },

  getAllRoadmaps: async () => {
    if (MOCK_ONLY) {
      await delay(200);
      const career = typeof window !== 'undefined' ? localStorage.getItem('trainpi_career_path') : null;
      if (!career) return [];
      return [{
        id: 1,
        career_path: career,
        steps: DEMO_ROADMAP_STEPS_FULL,
        current_step: 3,
        completion_percentage: 64,
        created_at: new Date().toISOString(),
      }];
    }
    const { data } = await api.get('/api/roadmap/all');
    return data;
  },

  updateProgress: async (roadmapId: number, stepNumber: number) => {
    if (MOCK_ONLY) {
      await delay(200);
      return { id: roadmapId, current_step: stepNumber, completion_percentage: stepNumber * 25 };
    }
    const { data } = await api.post(
      `/api/roadmap/update-progress/${roadmapId}?step_number=${stepNumber}`
    );
    return data;
  },
};

// Resume API
export const resumeAPI = {
  create: async (resumeData: any) => {
    if (MOCK_ONLY) {
      await delay(300);
      return { id: 1, ...resumeData };
    }
    const { data } = await api.post('/api/resume/create', resumeData);
    return data;
  },

  uploadResume: async (file: File) => {
    if (MOCK_ONLY) {
      await delay(900);
      return {
        success: true,
        analysis: getDemoResumeAnalysis(currentCareer()),
        filename: file.name,
      };
    }
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/api/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  getMyResumes: async () => {
    if (MOCK_ONLY) {
      await delay(200);
      return DEMO_RESUMES;
    }
    const { data } = await api.get('/api/resume/my-resumes');
    return data;
  },

  getResume: async (resumeId: number) => {
    if (MOCK_ONLY) {
      await delay(200);
      return { id: resumeId, content: '', filename: 'mock.pdf' };
    }
    const { data } = await api.get(`/api/resume/${resumeId}`);
    return data;
  },

  enhance: async (resumeId: number, jobDescription: string) => {
    if (MOCK_ONLY) {
      await delay(500);
      return { id: resumeId, enhanced_content: `Enhanced for: ${jobDescription.slice(0, 50)}...` };
    }
    const { data } = await api.post(`/api/resume/enhance/${resumeId}`, null, {
      params: { job_description: jobDescription },
    });
    return data;
  },
};

// Lessons API
export const lessonsAPI = {
  create: async (title: string, content?: string, sourceDocument?: string) => {
    if (MOCK_ONLY) {
      const lesson = addLesson({
        title,
        description: content,
        modules: [],
        quiz_questions: [],
      });
      return lesson as any;
    }
    const { data } = await api.post('/api/lessons/create', {
      title,
      content,
      source_document: sourceDocument,
    });
    return data;
  },

  getMyLessons: async () => {
    if (MOCK_ONLY) {
      await delay(200);
      return getLessonsWithDefaults();
    }
    const { data } = await api.get('/api/lessons/my-lessons');
    return data;
  },

  getLesson: async (lessonId: number) => {
    if (MOCK_ONLY) {
      await delay(150);
      const stored = getLessonById(lessonId);
      return stored ?? null;
    }
    const { data } = await api.get(`/api/lessons/${lessonId}`);
    return data;
  },

  /** Create lesson from AI-generated payload (title, modules, quiz_questions). */
  createFromAI: async (payload: { title: string; modules: any[]; quiz_questions: any[] }) => {
    if (MOCK_ONLY) {
      await delay(300);
      return addLesson(payload) as any;
    }
    const { data } = await api.post('/api/lessons/create-from-ai', payload);
    return data;
  },

  updateQuiz: async (lessonId: number, quiz_questions: any[]) => {
    if (MOCK_ONLY) {
      await delay(200);
      return { id: lessonId, quiz_questions };
    }
    const { data } = await api.patch(`/api/lessons/${lessonId}`, { quiz_questions });
    return data;
  },

  uploadDocument: async (file: File) => {
    if (MOCK_ONLY) {
      await delay(400);
      const lesson = addLesson({
        title: file.name.replace(/\.[^/.]+$/, ''),
        modules: [],
        quiz_questions: [],
      });
      return lesson as any;
    }
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
    if (MOCK_ONLY) {
      await delay(250);
      const career =
        typeof window !== 'undefined' ? localStorage.getItem('trainpi_career_path') : null;
      const goalRaw = typeof window !== 'undefined' ? localStorage.getItem('trainpi_weekly_goal') : null;
      const goal = goalRaw ? Number(goalRaw) : 3;
      return getDemoStatsWithSelections(career, goal);
    }
    const { data } = await api.get('/api/dashboard/stats');
    return data;
  },

  updateProgress: async (_progressData: any) => {
    if (MOCK_ONLY) {
      await delay(150);
      return {};
    }
    const { data } = await api.post('/api/dashboard/progress', _progressData);
    return data;
  },
};

// Credits API
export const creditsAPI = {
  getBalance: async (): Promise<{ credits: number }> => {
    if (MOCK_ONLY) {
      await delay(200);
      return { credits: 0 };
    }
    const { data } = await api.get('/api/credits/balance');
    return data;
  },

  /** Set or clear your own Gemini API key (from aistudio.google.com). When set, AI uses your key and no credits deducted. */
  setGeminiKey: async (apiKey: string | null): Promise<void> => {
    if (MOCK_ONLY) {
      await delay(200);
      return;
    }
    await api.put('/api/credits/my-gemini-key', { api_key: apiKey || null });
  },

  /** Create a Stripe Checkout session and return the URL. Redirect the user to this URL to pay. */
  createCheckoutSession: async (packageId: string): Promise<{ url: string }> => {
    if (MOCK_ONLY) {
      await delay(400);
      return { url: '/dashboard/credits?success=1' };
    }
    const { data } = await api.post('/api/credits/create-checkout-session', { package_id: packageId });
    return data;
  },

  getHistory: async (): Promise<{ id: number; amount: number; kind: string; description: string | null; created_at: string }[]> => {
    if (MOCK_ONLY) {
      await delay(200);
      return [
        { id: 1, amount: -50, kind: 'usage', description: 'AI Career Mentor chat', created_at: new Date().toISOString() },
        { id: 2, amount: 500, kind: 'purchase', description: '500 Credits', created_at: new Date().toISOString() },
      ];
    }
    const { data } = await api.get('/api/credits/history');
    return data;
  },
};

// AI features (Gemini behind each; uses user's key or deducts credits)
export const aiFeaturesAPI = {
  generateLesson: async (topic: string): Promise<{ title: string; modules: any[]; quiz_questions: any[] }> => {
    if (MOCK_ONLY) {
      await delay(1500);
      return {
        title: `AI: ${topic}`,
        modules: [{ module_number: 1, title: 'Overview', content: 'Sample content.', key_takeaways: ['Key point'], duration_minutes: 5 }],
        quiz_questions: [{ question: 'Sample?', type: 'mcq', options: ['A', 'B'], correct_answer: 'A', rationale: 'Sample.' }],
      };
    }
    const { data } = await api.post('/api/ai/generate-lesson', { topic });
    return data;
  },
  generateGamified: async (topic: string): Promise<{ title: string; description: string; type: string; difficulty: string; xpReward: number }> => {
    if (MOCK_ONLY) {
      await delay(1200);
      return { title: topic, description: 'AI-generated challenge.', type: 'Quiz', difficulty: 'Medium', xpReward: 200 };
    }
    const { data } = await api.post('/api/ai/generate-gamified', { topic });
    return data;
  },
  generateQuiz: async (params: { topic?: string; lesson_title?: string; context?: string }): Promise<{ quiz_questions: any[] }> => {
    if (MOCK_ONLY) {
      await delay(1000);
      return {
        quiz_questions: [
          { question: 'Sample question?', type: 'mcq', options: ['A', 'B', 'C'], correct_answer: 'A', rationale: 'Sample.' },
          { question: 'True or false?', type: 'true_false', options: null, correct_answer: 'True', rationale: 'Sample.' },
        ],
      };
    }
    const { data } = await api.post('/api/ai/generate-quiz', params);
    return data;
  },
  jobReadinessFeedback: async (stats: { career_path?: string; roadmap_completion?: number; resume_score?: number; lessons_completed?: number }) => {
    if (MOCK_ONLY) {
      await delay(900);
      const role = stats.career_path || 'SOC Analyst';
      const pct = stats.roadmap_completion ?? 0;
      const lessons = stats.lessons_completed ?? 0;
      return {
        feedback:
`**Current Strengths**
You already demonstrate operationally-relevant thinking — phishing user-behavior awareness from prior IT/help-desk work, and Windows familiarity that translates directly into event-log review.

**Operational Readiness Level: Developing**
You are past pure beginner — you understand the *why* of cyber operations — but you have not yet executed the workflows end-to-end. ${pct}% roadmap completion and ${lessons} lessons closed put you on track, not at the finish line.

**Critical Gaps**
1. No hands-on SIEM triage experience — you cannot yet pivot from an alert to a written ticket.
2. No MFA / IAM alert triage practice — the #1 attack vector against modern orgs is still unfamiliar terrain.

**One Concrete Next Step**
Run the **MFA Fatigue at 2 AM** scenario in /scenarios. It walks the exact triage flow a Tier-1 ${role} executes on shift, and forces you to make the containment decision under simulated time pressure.

**Realistic Timeline**
With consistent weekly effort (5 hrs/wk, 3 scenarios + 1 workflow read), you are 6–8 weeks from interview-ready for a junior ${role} role.`,
      };
    }
    const { data } = await api.post('/api/ai/job-readiness-feedback', {
      career_path: stats.career_path ?? null,
      roadmap_completion: stats.roadmap_completion ?? 0,
      resume_score: stats.resume_score ?? null,
      lessons_completed: stats.lessons_completed ?? 0,
    });
    return data;
  },
  practiceHint: async (problemTitle: string): Promise<{ hint: string }> => {
    if (MOCK_ONLY) {
      await delay(500);
      return { hint: 'Consider breaking the problem into smaller steps and checking edge cases.' };
    }
    const { data } = await api.post('/api/ai/practice-hint', { problem_title: problemTitle });
    return data;
  },
  learningStyle: async (): Promise<{ analysis: string }> => {
    if (MOCK_ONLY) {
      await delay(600);
      return { analysis: 'You learn best through visual aids and interactive practice. Try diagrams and hands-on exercises.' };
    }
    const { data } = await api.post('/api/ai/learning-style');
    return data;
  },
  tutorRecommendation: async (goal: string): Promise<{ recommendation: string }> => {
    if (MOCK_ONLY) {
      await delay(600);
      return { recommendation: 'Look for a tutor with industry experience in your target role. Prepare specific questions before each session.' };
    }
    const { data } = await api.post('/api/ai/tutor-recommendation', { goal });
    return data;
  },
  saveCourse: async (payload: { goal: string; steps: any[]; estimated_timeline: string; key_skills: string[]; next_action: string }): Promise<{ message: string; roadmap_id: number }> => {
    const { data } = await api.post('/api/ai/save-course', payload);
    return data;
  },
  careerGoalsGuidance: async (goal: string): Promise<{ roadmap_id?: number; steps: Array<{ step_number: number; title: string; description: string; estimated_time: string; resources: any[] }>; estimated_timeline: string; key_skills: string[]; next_action: string }> => {
    if (MOCK_ONLY) {
      await delay(1000);
      return {
        steps: [
          { step_number: 1, title: 'Learn Basics', description: 'Start with fundamentals', estimated_time: '2-3 weeks', resources: [{ name: 'Resource 1', url: '#' }] },
          { step_number: 2, title: 'Practice', description: 'Build projects', estimated_time: '1-2 months', resources: [{ name: 'Resource 2', url: '#' }] },
        ],
        estimated_timeline: '3-6 months',
        key_skills: ['Skill 1', 'Skill 2'],
        next_action: 'Start with the first step today',
      };
    }
    const { data } = await api.post('/api/ai/career-goals-guidance', { goal });
    return data;
  },
};

// Chat API (returns credits_used, credits_remaining; throws on 402 INSUFFICIENT_CREDITS or quota message in response)
export const chatAPI = {
  sendMessage: async (message: string, _image?: string): Promise<{ response: string; credits_used?: number; credits_remaining?: number }> => {
    if (MOCK_ONLY) {
      await delay(500);
      return { response: getMockChatResponse(message), credits_used: 0, credits_remaining: 0 };
    }
    try {
      const { data } = await api.post('/api/chat/message', { message, image: _image });
      return data;
    } catch (err: any) {
      if (err.response?.status === 402 && err.response?.data?.detail === 'INSUFFICIENT_CREDITS') {
        const e = new Error('INSUFFICIENT_CREDITS') as Error & { code?: string };
        e.code = 'INSUFFICIENT_CREDITS';
        throw e;
      }
      throw err;
    }
  },
};

// Exceptions API
export const exceptionsAPI = {
  getExceptions: async () => {
    if (MOCK_ONLY) {
      await delay(200);
      const list = getSeedExceptions();
      return list.map((e) => ({
        id: e.id,
        type: e.type,
        status: e.status,
        remarks: e.remarks,
        createdAt: e.createdAt ?? e.created_at ?? new Date().toISOString(),
        clearedAt: e.clearedAt,
        duration: e.duration_seconds ?? undefined,
      }));
    }
    const { data } = await api.get('/api/exceptions/exceptions');
    return data;
  },

  createException: async (
    type: string,
    status: string,
    durationSeconds: number,
    remarks?: string
  ) => {
    if (MOCK_ONLY) {
      await delay(200);
      const item = {
        id: mockExceptionId++,
        type,
        status,
        duration_seconds: durationSeconds,
        remarks,
      };
      mockExceptions.push(item);
      return item;
    }
    const { data } = await api.post('/api/exceptions/exceptions', {
      type,
      status,
      duration_seconds: durationSeconds,
      remarks,
    });
    return data;
  },

  clearException: async (exceptionId: number) => {
    if (MOCK_ONLY) {
      await delay(150);
      const now = new Date().toISOString();
      mockExceptions = mockExceptions.map((e) =>
        e.id === exceptionId ? { ...e, status: 'cleared', clearedAt: now } : e
      );
      return {};
    }
    const { data } = await api.post(`/api/exceptions/exceptions/${exceptionId}/clear`);
    return data;
  },
};

// Catalog API — pre-built YouTube courses
export const catalogAPI = {
  getEnrollments: async (): Promise<{ course_id: string; completed_units: number[]; completed: boolean }[]> => {
    if (MOCK_ONLY) return [];
    const { data } = await api.get('/api/catalog/enrollments');
    return data;
  },
  enroll: async (courseId: string) => {
    if (MOCK_ONLY) return { course_id: courseId, completed_units: [], completed: false };
    const { data } = await api.post(`/api/catalog/enroll/${courseId}`);
    return data;
  },
  completeUnit: async (courseId: string, unitIndex: number) => {
    if (MOCK_ONLY) return {};
    const { data } = await api.post(`/api/catalog/complete-unit/${courseId}/${unitIndex}`);
    return data;
  },
};

// Save any provider API key
export const saveAnyApiKey = async (key: string): Promise<{ provider: string; saved: boolean }> => {
  const { data } = await api.put('/api/credits/my-api-key', { api_key: key });
  return data;
};

export const videoAPI = {
  search: async (q: string): Promise<{ video_id: string; title: string; channel: string; thumbnail: string }> => {
    if (MOCK_ONLY) {
      await delay(200);
      return {
        video_id: 'dQw4w9WgXcQ',
        title: `Video result for "${q}"`,
        channel: 'TrainPi Learning',
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      };
    }
    const { data } = await api.get('/api/video/search', { params: { q } });
    return data;
  },
};

// ──────────────────────────────────────────────────────────────────────────
// Operational Readiness Score API (mock-only, headline feature)
// ──────────────────────────────────────────────────────────────────────────
export const readinessAPI = {
  getReport: async () => {
    await delay(300);
    return getDemoReadinessReport(currentCareer());
  },
  refresh: async () => {
    await delay(1200);
    return getDemoReadinessReport(currentCareer());
  },
};

// ──────────────────────────────────────────────────────────────────────────
// Scenarios API (mock-only)
// ──────────────────────────────────────────────────────────────────────────
export const scenariosAPI = {
  list: async () => {
    await delay(200);
    return DEMO_SCENARIOS;
  },
  get: async (id: string) => {
    await delay(150);
    return DEMO_SCENARIOS.find((s) => s.id === id) || null;
  },
  submitResult: async (_id: string, _correctSteps: number, _totalSteps: number) => {
    await delay(250);
    return { saved: true };
  },
};

// ──────────────────────────────────────────────────────────────────────────
// Workflow Library API (mock-only)
// ──────────────────────────────────────────────────────────────────────────
export const workflowsAPI = {
  list: async () => {
    await delay(200);
    return DEMO_WORKFLOWS;
  },
  get: async (id: string) => {
    await delay(150);
    return DEMO_WORKFLOWS.find((w) => w.id === id) || null;
  },
};

// ──────────────────────────────────────────────────────────────────────────
// Workforce Readiness API (Exhibit A) — real backend when MOCK_ONLY is false.
// Mock branch delegates to lib/workforceMock.ts so the demo build keeps working.
// ──────────────────────────────────────────────────────────────────────────
export const workforceAPI = {
  getProfile: async () => {
    const { data } = await api.get('/api/workforce/profile');
    return data;
  },

  updateProfile: async (body: {
    current_job_title?: string | null;
    years_experience?: string | null;
    primary_skills: string[];
    additional_notes?: string | null;
  }) => {
    const { data } = await api.put('/api/workforce/profile', body);
    return data;
  },

  uploadResume: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/api/workforce/profile/upload-resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  uploadContextDocument: async (file: File, category: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    const { data } = await api.post('/api/workforce/context/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  listContextDocuments: async () => {
    const { data } = await api.get('/api/workforce/context');
    return data;
  },

  deleteContextDocument: async (docId: number) => {
    const { data } = await api.delete(`/api/workforce/context/${docId}`);
    return data;
  },

  runAnalysis: async () => {
    const { data } = await api.post('/api/workforce/analyze');
    return data;
  },

  getAnalysis: async () => {
    const { data } = await api.get('/api/workforce/analysis');
    return data;
  },

  generateRoadmap: async () => {
    const { data } = await api.post('/api/workforce/roadmap');
    return data;
  },

  getRoadmap: async () => {
    const { data } = await api.get('/api/workforce/roadmap');
    return data;
  },

  downloadAnalysisReport: async (): Promise<Blob> => {
    const { data } = await api.get('/api/workforce/analysis/report.pdf', { responseType: 'blob' });
    return data;
  },

  downloadRoadmapReport: async (): Promise<Blob> => {
    const { data } = await api.get('/api/workforce/roadmap/report.pdf', { responseType: 'blob' });
    return data;
  },
};

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export { downloadBlob };

// ──────────────────────────────────────────────────────────────────────────
// Jobs API (beyond Exhibit A) — real Adzuna-backed job search matched to
// the user's profile skills. No mock branch: without ADZUNA keys configured
// the backend returns a clear 503, which the UI surfaces directly.
// ──────────────────────────────────────────────────────────────────────────
export type JobPosting = {
  id: string
  title: string
  company: string | null
  location: string | null
  description: string
  salary_min: number | null
  salary_max: number | null
  url: string
  created: string
  matched_skills: string[]
  match_count: number
  total_skills: number
}

export const jobsAPI = {
  search: async (params?: { query?: string; location?: string }): Promise<{ query: string; results: JobPosting[]; cached: boolean }> => {
    const { data } = await api.get('/api/jobs/search', { params });
    return data;
  },
};

// ──────────────────────────────────────────────────────────────────────────
// Admin & Organization API (Exhibit A) — no mock branch; org_admin is a real
// role check, not something meaningful to fake in a demo.
// ──────────────────────────────────────────────────────────────────────────
export const adminAPI = {
  listMyOrganizations: async () => {
    const { data } = await api.get('/api/admin/organizations');
    return data;
  },

  createOrganization: async (name: string, description?: string) => {
    const { data } = await api.post('/api/admin/organizations', { name, description });
    return data;
  },

  listMembers: async (orgId: number) => {
    const { data } = await api.get(`/api/admin/organizations/${orgId}/members`);
    return data;
  },

  inviteMember: async (orgId: number, email: string, role: 'participant' | 'org_admin' = 'participant') => {
    const { data } = await api.post(`/api/admin/organizations/${orgId}/members`, { email, role });
    return data;
  },

  removeMember: async (orgId: number, userId: number) => {
    const { data } = await api.delete(`/api/admin/organizations/${orgId}/members/${userId}`);
    return data;
  },

  getReadinessSummary: async (orgId: number) => {
    const { data } = await api.get(`/api/admin/organizations/${orgId}/readiness-summary`);
    return data;
  },

  downloadReadinessSummaryReport: async (orgId: number): Promise<Blob> => {
    const { data } = await api.get(`/api/admin/organizations/${orgId}/readiness-summary/report.pdf`, { responseType: 'blob' });
    return data;
  },

  getAIInteractions: async (orgId: number) => {
    const { data } = await api.get(`/api/admin/organizations/${orgId}/ai-interactions`);
    return data;
  },
};

