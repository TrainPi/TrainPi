/**
 * Shared storage for lessons (mock / frontend-only).
 * Lessons created on Learn page or AI Learning show on Dashboard and Learn.
 * When storage is empty, default demo lessons are shown for client demo.
 */

const KEY = 'trainpi_lessons'

export interface StoredLesson {
  id: number
  title: string
  modules?: { title: string; content: string; duration_minutes?: number; key_takeaways?: string[] }[]
  quiz_questions?: unknown[]
  created_at?: string
  description?: string
  time?: string
}

/** Default demo lessons shown when user has no lessons yet (client demo). */
export const DEFAULT_DEMO_LESSONS: StoredLesson[] = [
  {
    id: 1001,
    title: 'React Fundamentals',
    description: 'Core concepts for building modern UIs.',
    time: '12 min',
    created_at: '2025-01-10T10:00:00.000Z',
    modules: [
      {
        title: 'What is React?',
        content: 'React is a JavaScript library for building user interfaces. It lets you compose complex UIs from small, isolated pieces of code called components. Components can be class-based or function-based; today we focus on function components with Hooks.',
        duration_minutes: 4,
        key_takeaways: ['React is component-based', 'Use JSX to describe the UI', 'Components receive data via props'],
      },
      {
        title: 'Components and JSX',
        content: 'JSX looks like HTML but runs in JavaScript. You can embed expressions in curly braces, and React elements are just objects. Always start component names with a capital letter so React treats them as components rather than DOM tags.',
        duration_minutes: 4,
        key_takeaways: ['JSX is syntactic sugar for React.createElement', 'One parent element per component', 'Use className instead of class'],
      },
      {
        title: 'State and Events',
        content: 'Use the useState Hook to add local state to function components. State updates are asynchronous and batched. Event handlers receive synthetic events that work across browsers.',
        duration_minutes: 4,
        key_takeaways: ['useState returns [value, setter]', 'Updates are asynchronous', 'Event handlers use camelCase'],
      },
    ],
    quiz_questions: [{ question: 'What does React use to build UIs?', options: ['Templates', 'Components', 'Directives'], correct: 1 }],
  },
  {
    id: 1002,
    title: 'Python Basics',
    description: 'Get started with Python programming.',
    time: '15 min',
    created_at: '2025-01-08T14:00:00.000Z',
    modules: [
      {
        title: 'Variables and Types',
        content: 'Python is dynamically typed: you don\'t declare types. Use = to assign. Common types include int, float, str, bool, list, and dict. Use type() to inspect.',
        duration_minutes: 5,
        key_takeaways: ['No type declarations needed', 'Indentation defines blocks', 'Everything is an object'],
      },
      {
        title: 'Control Flow',
        content: 'Use if/elif/else for conditionals. Loops: for and while. range() is common in for loops. break and continue work as in other languages.',
        duration_minutes: 5,
        key_takeaways: ['Colons start blocks', 'Indent with 4 spaces', 'for item in iterable:'],
      },
      {
        title: 'Functions',
        content: 'Define with def. Return values with return. Default and keyword arguments are supported. *args and **kwargs allow variable arguments.',
        duration_minutes: 5,
        key_takeaways: ['def name(params):', 'return is optional', 'Docstrings describe the function'],
      },
    ],
    quiz_questions: [],
  },
  {
    id: 1003,
    title: 'System Design Overview',
    description: 'High-level design for scalable systems.',
    time: '10 min',
    created_at: '2025-01-05T09:00:00.000Z',
    modules: [
      {
        title: 'Requirements and Scope',
        content: 'Clarify functional and non-functional requirements. Define scale: users, QPS, data size. Identify bottlenecks and prioritize trade-offs.',
        duration_minutes: 3,
        key_takeaways: ['Clarify requirements first', 'Estimate scale early', 'Trade-offs are inevitable'],
      },
      {
        title: 'High-Level Design',
        content: 'Draw a high-level diagram: clients, load balancers, app servers, databases, caches. Discuss data flow and key components. Iterate on feedback.',
        duration_minutes: 4,
        key_takeaways: ['Start with a simple diagram', 'Identify core components', 'Consider scaling and redundancy'],
      },
      {
        title: 'Deep Dive and Trade-offs',
        content: 'Drill into critical components: storage schema, caching strategy, consistency vs availability. Discuss bottlenecks and alternatives.',
        duration_minutes: 3,
        key_takeaways: ['CAP theorem', 'Caching and CDNs', 'Database scaling patterns'],
      },
    ],
    quiz_questions: [],
  },
]

export function getLessons(): StoredLesson[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

/**
 * Returns user's lessons if any; otherwise default demo lessons for client demo.
 */
export function getLessonsWithDefaults(): StoredLesson[] {
  const stored = getLessons()
  if (stored.length > 0) return stored
  return DEFAULT_DEMO_LESSONS
}

export function addLesson(lesson: Omit<StoredLesson, 'id' | 'created_at'> & { id?: number }): StoredLesson {
  const list = getLessons()
  const newLesson: StoredLesson = {
    id: lesson.id ?? Date.now(),
    title: lesson.title,
    modules: lesson.modules ?? [],
    quiz_questions: lesson.quiz_questions ?? [],
    created_at: new Date().toISOString(),
    description: lesson.description,
    time: lesson.time,
  }
  list.unshift(newLesson)
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY, JSON.stringify(list))
  }
  return newLesson
}

export function getLessonById(id: number): StoredLesson | undefined {
  const stored = getLessons().find((l) => l.id === id)
  if (stored) return stored
  return DEFAULT_DEMO_LESSONS.find((l) => l.id === id)
}
