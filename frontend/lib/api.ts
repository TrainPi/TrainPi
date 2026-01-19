
// import axios from 'axios' // Removed for offline mode
import { useAuthStore } from '@/store/authStore'

// MOCK DATA GENERATORS
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MOCK_USER = {
  id: 1,
  email: "demo@trainpi.ai",
  full_name: "Demo User",
  bio: "Learning in offline mode",
  headline: "Aspiring Developer",
  profile_image: null,
  location: "Localhost",
  website: "https://trainpi.ai",
  linkedin_url: "",
  github_url: ""
};

const MOCK_CAREERS = [
  {
    id: 1,
    title: "Frontend Developer",
    description: "Build beautiful user interfaces using React, Vue, or Angular.",
    match_score: 95,
    growth_outlook: "High",
    salary_range: "$70k - $140k"
  },
  {
    id: 2,
    title: "Backend Engineer",
    description: "Design robust APIs and scalable database architectures.",
    match_score: 88,
    growth_outlook: "Stable",
    salary_range: "$80k - $150k"
  },
  {
    id: 3,
    title: "AI Engineer",
    description: "Develop machine learning models and integrate AI solutions.",
    match_score: 92,
    growth_outlook: "Very High",
    salary_range: "$100k - $200k"
  }
];

const MOCK_ROADMAP = {
  id: 1,
  career_path: "Frontend Developer",
  current_step: 1,
  completion_percentage: 15,
  steps: [
    {
      step_number: 1,
      title: "HTML & CSS Fundamentals",
      description: "Learn the building blocks of the web. Semantic HTML, CSS Box Model, Flexbox, and Grid.",
      skills: ["HTML5", "CSS3", "Responsive Design"],
      certifications: ["FreeCodeCamp Web Design"],
      estimated_time: "2 weeks",
      resources: [
        { name: "MDN Web Docs", url: "https://developer.mozilla.org" }
      ]
    },
    {
      step_number: 2,
      title: "JavaScript Basics",
      description: "Understand the language of the web. Variables, functions, loops, and DOM manipulation.",
      skills: ["ES6+", "DOM", "Async/Await"],
      certifications: ["JS Algorithms"],
      estimated_time: "3 weeks",
      resources: [
        { name: "JavaScript.info", url: "https://javascript.info" }
      ]
    },
    {
      step_number: 3,
      title: "React Ecosystem",
      description: "Master modern UI development with React. Components, hooks, and state management.",
      skills: ["React", "Redux/Zustand", "Next.js"],
      certifications: ["Meta Frontend Dev"],
      estimated_time: "4 weeks",
      resources: [
        { name: "React Docs", url: "https://react.dev" }
      ]
    }
  ]
};

// Auth API - MOCKED
export const authAPI = {
  register: async (email: string, password: string, fullName?: string) => {
    await delay(1000);
    // Simulate successful registration
    return {
      user: { ...MOCK_USER, email, full_name: fullName || "New User" },
      token: "mock-jwt-token-xyz-123"
    }
  },
  login: async (email: string, password: string) => {
    await delay(800);
    // Simulate successful login
    return {
      access_token: "mock-jwt-token-xyz-123",
      token_type: "bearer",
      user: MOCK_USER // In case your login endpoint returns user info too
    }
  },
  getMe: async () => {
    await delay(500);
    return MOCK_USER;
  },
  updateProfile: async (data: any) => {
    await delay(500);
    return { ...MOCK_USER, ...data };
  },
  uploadAvatar: async (file: File) => {
    await delay(1000);
    return { url: URL.createObjectURL(file) };
  },
}

// Career API - MOCKED
export const careerAPI = {
  discover: async (interests: string[], skills: string[], resumeText?: string) => {
    await delay(1500);
    return {
      careers: MOCK_CAREERS,
      analysis: "Based on your interest in technology and creativity, Frontend Development seems like a great fit."
    };
  },
  selectCareer: async (careerPath: string) => {
    await delay(500);
    if (typeof window !== 'undefined') {
      localStorage.setItem('trainpi_career_path', careerPath);
    }
    return { message: `Career ${careerPath} selected successfully.` };
  },
  getProfile: async () => {
    await delay(300);
    return {
      interests: ["Coding", "Design"],
      skills: ["HTML", "CSS"],
      career_path: "Frontend Developer"
    };
  },
}

// Roadmap API - MOCKED
export const roadmapAPI = {
  create: async (careerPath: string) => {
    await delay(2000);
    return {
      ...MOCK_ROADMAP,
      career_path: careerPath
    };
  },
  getMyRoadmap: async () => {
    await delay(500);
    return MOCK_ROADMAP;
  },
  updateProgress: async (roadmapId: number, stepNumber: number) => {
    await delay(300);
    return { message: "Progress updated", completion_percentage: (stepNumber / 3) * 100 };
  },
}

// Resume API - MOCKED
export const resumeAPI = {
  create: async (resumeData: any) => {
    await delay(1000);
    return { id: 101, ...resumeData, score: 85 };
  },
  getMyResumes: async () => {
    await delay(500);
    return [
      { id: 101, title: "Software Engineer Resume", score: 85, updated_at: new Date().toISOString() }
    ];
  },
  getResume: async (resumeId: number) => {
    await delay(500);
    return {
      id: resumeId,
      title: "Software Engineer Resume",
      content: {},
      score: 85,
      improvements: ["Add more quantifiable metrics", "Highlight leadership experience"]
    };
  },
  enhance: async (resumeId: number, jobDescription: string) => {
    await delay(2000);
    return {
      original_score: 85,
      enhanced_score: 95,
      enhanced_content: "Refined resume content aligned with the job description.",
      feedback: "Great match! We emphasized your React skills."
    };
  },
}

// Lessons API - MOCKED
export const lessonsAPI = {
  create: async (title: string, content?: string, sourceDocument?: string) => {
    await delay(1500);
    return {
      id: 201,
      title,
      modules: [
        { title: "Introduction", content: "This is a generated lesson module." },
        { title: "Deep Dive", content: "Detailed explanation of the topic." }
      ]
    };
  },
  getMyLessons: async () => {
    await delay(500);
    return [
      { id: 201, title: "React Fundamentals", created_at: new Date().toISOString() },
      { id: 202, title: "Advanced CSS", created_at: new Date().toISOString() }
    ];
  },
  getLesson: async (lessonId: number) => {
    await delay(500);
    return {
      id: lessonId,
      title: "Sample Lesson",
      modules: [
        { title: "Module 1", content: "Content for module 1...", duration_minutes: 5 },
        { title: "Module 2", content: "Content for module 2...", duration_minutes: 10 }
      ],
      quiz_questions: [
        { question: "What is React?", options: ["Library", "Framework", "Language"], correct_answer: "Library" }
      ]
    };
  },
  uploadDocument: async (file: File) => {
    await delay(1500);
    return {
      id: 301,
      title: file.name,
      content: "Parsed content from document..."
    };
  },
}

// Dashboard API - MOCKED
export const dashboardAPI = {
  getStats: async () => {
    await delay(500);
    // Read from localStorage to simulate persistence
    let careerPath = null;
    if (typeof window !== 'undefined') {
      careerPath = localStorage.getItem('trainpi_career_path');
    }

    const baseStats = {
      lessons_completed: 0,
      hours_learned: 0,
      current_streak: 0,
      total_xp: 0,
      career_path: careerPath, // Return stored path
      courses_completed: 0,
      lessons_in_progress: 0,
      skills_acquired: 0,
      skills_required: 0,
      roadmap_completion: 0,
      weekly_goals: [],
      suggested_next_steps: []
    };

    if (careerPath) {
      // Simulate data for an active user
      return {
        ...baseStats,
        lessons_completed: 12,
        hours_learned: 45,
        current_streak: 5,
        total_xp: 1500,
        courses_completed: 2,
        lessons_in_progress: 3,
        skills_acquired: 8,
        skills_required: 15,
        roadmap_completion: 35,
        weekly_goals: ["Complete React Module", "Practice SQL"],
        suggested_next_steps: ["Complete your first lesson", "Set a weekly goal"]
      };
    }

    return baseStats;
  },
  updateProgress: async (progressData: any) => {
    await delay(200);
    return { success: true };
  },
}

// Chat API - MOCKED
export const chatAPI = {
  sendMessage: async (message: string, image?: string) => {
    await delay(1000);
    return {
      response: "I am currently in Offline Mode. I can help you navigate the app, but my live AI features are disabled."
    };
  },
}

// Exceptions API - MOCKED
export const exceptionsAPI = {
  getExceptions: async () => {
    await delay(200);
    return [];
  },
  createException: async (type: string, status: string, durationSeconds: number, remarks?: string) => {
    await delay(200);
    return { id: 999, status: "logged" };
  },
  clearException: async (exceptionId: number) => {
    await delay(200);
    return { success: true };
  },
}
