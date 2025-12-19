export type CourseStatus = 'not_started' | 'in_progress' | 'completed'

export interface PlanCourse {
  id: string
  title: string
  provider: string
  duration: string
  level: 'Introductory' | 'Intermediate' | 'Advanced'
  status: CourseStatus
  focus: string[]
  description: string
}

export interface PlanPhase {
  id: string
  title: string
  summary: string
  duration: string
  tasks: string[]
  milestone: string
  focus: string[]
}

export interface LearningPlan {
  careerPath: string
  headline: string
  overview: string
  phases: PlanPhase[]
  courses: PlanCourse[]
  focusSkills: string[]
  interests: string[]
  createdAt: string
  nextStep: string
}

const PLAN_LIBRARY: Record<string, {
  overview: string
  headline: string
  phases: PlanPhase[]
  courses: Omit<PlanCourse, 'status'>[]
  focusSkills: string[]
}> = {
  'Full Stack Developer': {
    overview: 'Blend front-end craft with back-end architecture to ship production-ready web applications end-to-end.',
    headline: 'Ship complete web products from idea to deployment.',
    focusSkills: ['JavaScript', 'React', 'Node.js', 'APIs', 'Databases', 'DevOps basics'],
    phases: [
      {
        id: 'fsd-foundations',
        title: 'Modern Web Foundations',
        summary: 'Refresh JavaScript fundamentals and UI building blocks while sharpening problem-solving routines.',
        duration: 'Weeks 1-4',
        tasks: [
          'Revisit JavaScript essentials and latest language features each morning.',
          'Complete one algorithms or data-structures kata every weekday.',
          'Ship a responsive landing page in pure HTML/CSS to refresh layout muscle memory.'
        ],
        milestone: 'Publish a polished personal portfolio site.',
        focus: ['JavaScript', 'UI fundamentals']
      },
      {
        id: 'fsd-application',
        title: 'Application Layer Mastery',
        summary: 'Build confident React patterns and connect to production-grade APIs.',
        duration: 'Weeks 5-9',
        tasks: [
          'Implement a dashboard with routing, state management, and data fetching.',
          'Document an API layer with error handling and loading states.',
          'Practice code reviews by annotating two pull requests per week.'
        ],
        milestone: 'Launch a data-rich React application backed by a live API.',
        focus: ['React', 'APIs']
      },
      {
        id: 'fsd-backend',
        title: 'Service and Deployment Readiness',
        summary: 'Design back-end services, manage persistence, and automate delivery pipelines.',
        duration: 'Weeks 10-14',
        tasks: [
          'Model database entities and relationships for the portfolio project.',
          'Containerize the application and configure CI/CD checks.',
          'Conduct load testing and capture performance baselines.'
        ],
        milestone: 'Deploy a full-stack project with monitoring in place.',
        focus: ['Node.js', 'DevOps basics']
      }
    ],
    courses: [
      {
        id: 'course-fsd-1',
        title: 'JavaScript: The Complete Guide',
        provider: 'Udemy',
        duration: '6 weeks',
        level: 'Introductory',
        focus: ['JavaScript', 'Problem Solving'],
        description: 'Deep dive into ES6+, asynchronous patterns, and real-world exercises.'
      },
      {
        id: 'course-fsd-2',
        title: 'React Professional Certificate',
        provider: 'Meta / Coursera',
        duration: '8 weeks',
        level: 'Intermediate',
        focus: ['React', 'UI Architecture'],
        description: 'Component design, accessibility, hooks, and performance tooling.'
      },
      {
        id: 'course-fsd-3',
        title: 'Node.js, Express, MongoDB Bootcamp',
        provider: 'Udemy',
        duration: '6 weeks',
        level: 'Intermediate',
        focus: ['Node.js', 'APIs', 'Databases'],
        description: 'Build REST services with authentication, testing, and deployment.'
      },
      {
        id: 'course-fsd-4',
        title: 'DevOps Foundations',
        provider: 'LinkedIn Learning',
        duration: '3 weeks',
        level: 'Introductory',
        focus: ['DevOps basics', 'CI/CD'],
        description: 'Versioning, pipelines, and release governance for modern teams.'
      }
    ]
  },
  'Data Scientist': {
    overview: 'Transform complex data into insight by blending statistics, programming, and storytelling.',
    headline: 'Synthesise data into decisions that move strategy forward.',
    focusSkills: ['Python', 'Statistics', 'Machine Learning', 'SQL', 'Storytelling'],
    phases: [
      {
        id: 'ds-foundations',
        title: 'Analytical Bedrock',
        summary: 'Refresh core math, probability, and Python tooling.',
        duration: 'Weeks 1-4',
        tasks: [
          'Practice descriptive statistics on new datasets daily.',
          'Automate data cleaning notebooks and version them with Git.',
          'Build a metrics glossary for a domain you care about.'
        ],
        milestone: 'Publish a notebook covering EDA with polished visuals.',
        focus: ['Statistics', 'Python']
      },
      {
        id: 'ds-ml',
        title: 'Model Craft',
        summary: 'Train, evaluate, and tune models across classification and regression problems.',
        duration: 'Weeks 5-9',
        tasks: [
          'Implement train/validation/test workflows with scikit-learn.',
          'Run model comparisons and capture experiment notes.',
          'Ship a blog post explaining model decisions to non-technical readers.'
        ],
        milestone: 'Release a predictive model and document its impact.',
        focus: ['Machine Learning', 'Experimentation']
      },
      {
        id: 'ds-production',
        title: 'Operational Analytics',
        summary: 'Deploy insights, automate monitoring, and communicate outcomes with clarity.',
        duration: 'Weeks 10-14',
        tasks: [
          'Deploy a simple inference API or dashboard.',
          'Design alerting for data drift or pipeline issues.',
          'Conduct a stakeholder readout with actionable recommendations.'
        ],
        milestone: 'Deliver an end-to-end data product with monitoring.',
        focus: ['MLOps', 'Storytelling']
      }
    ],
    courses: [
      {
        id: 'course-ds-1',
        title: 'Applied Data Science with Python',
        provider: 'University of Michigan / Coursera',
        duration: '8 weeks',
        level: 'Introductory',
        focus: ['Python', 'Pandas'],
        description: 'EDA, visualisation, and introductory machine learning workflows.'
      },
      {
        id: 'course-ds-2',
        title: 'Mathematics for Machine Learning',
        provider: 'Imperial College / Coursera',
        duration: '6 weeks',
        level: 'Intermediate',
        focus: ['Linear Algebra', 'Statistics'],
        description: 'Refresh the linear algebra and calculus powering ML models.'
      },
      {
        id: 'course-ds-3',
        title: 'Machine Learning Specialization',
        provider: 'DeepLearning.AI',
        duration: '7 weeks',
        level: 'Intermediate',
        focus: ['Machine Learning', 'Model Deployment'],
        description: 'Supervised, unsupervised, and deployment-ready ML techniques.'
      },
      {
        id: 'course-ds-4',
        title: 'Storytelling with Data',
        provider: 'Storytelling with Data',
        duration: '3 weeks',
        level: 'Introductory',
        focus: ['Storytelling', 'Data Visualisation'],
        description: 'Craft persuasive narratives anchored in evidence.'
      }
    ]
  },
  'UI/UX Designer': {
    overview: 'Design delightful digital experiences grounded in research, prototyping, and delivery craft.',
    headline: 'Turn ideas into intuitive experiences people love to use.',
    focusSkills: ['User Research', 'Interaction Design', 'Figma', 'Design Systems', 'Accessibility'],
    phases: [
      {
        id: 'ux-research',
        title: 'Research and Discovery',
        summary: 'Understand users through qualitative and quantitative exploration.',
        duration: 'Weeks 1-4',
        tasks: [
          'Plan and run three user interviews focused on pains and motivations.',
          'Synthesise findings into personas and journey maps.',
          'Audit an existing product for usability and accessibility gaps.'
        ],
        milestone: 'Publish a discovery report with clear opportunity areas.',
        focus: ['User Research', 'Accessibility']
      },
      {
        id: 'ux-ideation',
        title: 'Ideation and Prototyping',
        summary: 'Translate insights into wireframes, flows, and interactive prototypes.',
        duration: 'Weeks 5-8',
        tasks: [
          'Sketch divergent concepts and converge on a direction with stakeholders.',
          'Build mid-fidelity prototypes in Figma and run usability tests.',
          'Create component variants that scale across viewports.'
        ],
        milestone: 'Share a tested prototype validated by target users.',
        focus: ['Interaction Design', 'Prototyping']
      },
      {
        id: 'ux-delivery',
        title: 'Delivery and Collaboration',
        summary: 'Partner with engineering to deliver and iterate on the experience.',
        duration: 'Weeks 9-12',
        tasks: [
          'Document a design system starter kit with tokens and usage notes.',
          'Annotate handoff files and host a walkthrough with engineers.',
          'Define metrics to monitor post-launch performance.'
        ],
        milestone: 'Launch a feature with measurable UX improvements.',
        focus: ['Design Systems', 'Collaboration']
      }
    ],
    courses: [
      {
        id: 'course-ux-1',
        title: 'Google UX Design Professional Certificate',
        provider: 'Google / Coursera',
        duration: '8 weeks',
        level: 'Introductory',
        focus: ['User Research', 'UX Foundations'],
        description: 'User-centred design and end-to-end UX process essentials.'
      },
      {
        id: 'course-ux-2',
        title: 'Interaction Design Specialization',
        provider: 'University of California San Diego',
        duration: '7 weeks',
        level: 'Intermediate',
        focus: ['Interaction Design', 'Prototyping'],
        description: 'Wireframing, prototyping, and evaluating interactive systems.'
      },
      {
        id: 'course-ux-3',
        title: 'Design Systems with Figma',
        provider: 'Design Better',
        duration: '4 weeks',
        level: 'Intermediate',
        focus: ['Design Systems', 'Figma'],
        description: 'Scale your UI library with reusable components and tokens.'
      },
      {
        id: 'course-ux-4',
        title: 'Accessible Design Fundamentals',
        provider: 'Deque University',
        duration: '3 weeks',
        level: 'Introductory',
        focus: ['Accessibility'],
        description: 'Implement WCAG principles and inclusive design patterns.'
      }
    ]
  }
}

export const buildLearningPlan = (
  careerPath: string,
  interests: string[],
  skills: string[]
): LearningPlan => {
  const normalizedCareer = careerPath.trim() || 'Full Stack Developer'
  const template = PLAN_LIBRARY[normalizedCareer] ?? PLAN_LIBRARY['Full Stack Developer']

  const interestSet = new Set(interests.map((item) => item.trim()).filter(Boolean))
  const skillSet = new Set(skills.map((item) => item.trim()).filter(Boolean))

  const decorateCourseStatus = (focus: string[]): CourseStatus => {
    if (focus.length === 0) {
      return 'not_started'
    }
    const overlap = focus.filter((item) => {
      return Array.from(skillSet).some((skill) => skill.toLowerCase() === item.toLowerCase())
    }).length
    if (overlap === focus.length && focus.length > 0) {
      return 'completed'
    }
    if (overlap > 0) {
      return 'in_progress'
    }
    return 'not_started'
  }

  const courses: PlanCourse[] = template.courses.map((course) => ({
    ...course,
    status: decorateCourseStatus(course.focus)
  }))

  const headlineSuffix = interestSet.size
    ? `with a focus on ${Array.from(interestSet).slice(0, 2).join(' & ')}`
    : ''

  return {
    careerPath: normalizedCareer,
    headline: `${template.headline} ${headlineSuffix}`.trim(),
    overview: `${template.overview} You will lean on your strengths in ${Array.from(skillSet).join(', ') || 'core skills'} while exploring ${Array.from(interestSet).join(', ') || 'new specialisations'}.`,
    phases: template.phases,
    courses,
    focusSkills: template.focusSkills,
    interests: Array.from(interestSet),
    createdAt: new Date().toISOString(),
    nextStep: template.phases[0]?.tasks[0] ?? 'Review your plan overview.'
  }
}
