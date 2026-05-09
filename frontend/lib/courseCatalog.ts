export interface CourseUnit {
  title: string
  description: string
  search: string // YouTube search query for embed
}

export interface CatalogCourse {
  id: string
  title: string
  description: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  category: string
  duration: string
  icon: string
  gradient: string
  skills: string[]
  units: CourseUnit[]
}

export const COURSE_CATALOG: CatalogCourse[] = [
  {
    id: 'python-fundamentals',
    title: 'Python Fundamentals',
    description: 'Master Python from scratch — variables, loops, functions, OOP, and real-world projects.',
    level: 'Beginner',
    category: 'Programming',
    duration: '20 hours',
    icon: '🐍',
    gradient: 'from-yellow-400 to-orange-500',
    skills: ['Variables', 'Functions', 'OOP', 'File I/O', 'Modules'],
    units: [
      { title: 'Introduction to Python & Setup', description: 'Install Python, run your first script, understand the REPL.', search: 'python for beginners complete introduction setup 2024' },
      { title: 'Variables, Data Types & Input', description: 'Strings, integers, floats, booleans, and user input.', search: 'python variables data types input tutorial beginners' },
      { title: 'Conditionals — if, elif, else', description: 'Decision-making in code with comparison and logical operators.', search: 'python if elif else conditionals tutorial' },
      { title: 'Loops — for and while', description: 'Repeat code with for loops, while loops, break and continue.', search: 'python for while loops tutorial beginners' },
      { title: 'Functions & Scope', description: 'Define reusable functions, understand parameters and return values.', search: 'python functions scope parameters return tutorial' },
      { title: 'Lists, Tuples & Sets', description: 'Store collections of data and manipulate them efficiently.', search: 'python lists tuples sets tutorial beginners' },
      { title: 'Dictionaries', description: 'Key-value storage — the most important Python data structure.', search: 'python dictionaries tutorial beginners' },
      { title: 'String Methods & Formatting', description: 'Slice, format, and transform strings like a pro.', search: 'python string methods formatting f-strings tutorial' },
      { title: 'File Handling', description: 'Read and write files, handle CSV and JSON data.', search: 'python file handling read write csv json tutorial' },
      { title: 'Object-Oriented Programming', description: 'Classes, objects, inheritance, and encapsulation.', search: 'python object oriented programming OOP classes tutorial' },
    ],
  },
  {
    id: 'javascript-essentials',
    title: 'JavaScript Essentials',
    description: 'Go from zero to writing interactive web apps with modern JavaScript (ES6+).',
    level: 'Beginner',
    category: 'Web Development',
    duration: '22 hours',
    icon: '⚡',
    gradient: 'from-yellow-300 to-yellow-500',
    skills: ['DOM', 'ES6+', 'Async/Await', 'Fetch API', 'JSON'],
    units: [
      { title: 'JavaScript Basics & Setup', description: 'Run JS in the browser console and in Node.js.', search: 'javascript tutorial for beginners introduction 2024' },
      { title: 'Variables — var, let, const', description: 'Understand scoping, hoisting, and best practices.', search: 'javascript variables var let const scope tutorial' },
      { title: 'Functions & Arrow Functions', description: 'Traditional functions, arrow syntax, callbacks.', search: 'javascript functions arrow functions tutorial' },
      { title: 'Arrays & Array Methods', description: 'map, filter, reduce, forEach — functional JS.', search: 'javascript array methods map filter reduce tutorial' },
      { title: 'Objects & Destructuring', description: 'Object literals, property shorthand, destructuring.', search: 'javascript objects destructuring tutorial' },
      { title: 'DOM Manipulation', description: 'Select and modify HTML elements with JS.', search: 'javascript DOM manipulation tutorial beginners' },
      { title: 'Events & Event Listeners', description: 'Respond to clicks, inputs, keyboard, and more.', search: 'javascript events event listeners tutorial' },
      { title: 'Promises & Async/Await', description: 'Asynchronous JavaScript — fetch data without blocking.', search: 'javascript promises async await tutorial' },
      { title: 'Fetch API & REST APIs', description: 'Call APIs, handle JSON responses, display data.', search: 'javascript fetch API REST tutorial beginners' },
      { title: 'ES6+ Modern Features', description: 'Spread, rest, modules, optional chaining and more.', search: 'javascript ES6 modern features spread rest modules tutorial' },
    ],
  },
  {
    id: 'react-development',
    title: 'React Development',
    description: 'Build modern UIs with React — hooks, state, components, and real projects.',
    level: 'Intermediate',
    category: 'Web Development',
    duration: '25 hours',
    icon: '⚛️',
    gradient: 'from-cyan-400 to-blue-500',
    skills: ['JSX', 'Hooks', 'State', 'Props', 'React Router'],
    units: [
      { title: 'React Introduction & Setup', description: 'Create React App / Vite, JSX basics, first component.', search: 'react tutorial for beginners 2024 introduction' },
      { title: 'Components & Props', description: 'Functional components, passing and typing props.', search: 'react components props tutorial' },
      { title: 'State with useState', description: 'Local state management, controlled inputs.', search: 'react useState hook tutorial state management' },
      { title: 'useEffect & Side Effects', description: 'Data fetching, subscriptions, and cleanup.', search: 'react useEffect hook tutorial side effects' },
      { title: 'Lists, Keys & Conditional Rendering', description: 'Render arrays, guard clauses, ternary rendering.', search: 'react lists keys conditional rendering tutorial' },
      { title: 'Forms & Controlled Components', description: 'Input handling, form submission, validation.', search: 'react forms controlled components tutorial' },
      { title: 'React Router', description: 'Client-side routing, dynamic routes, navigation.', search: 'react router tutorial 2024' },
      { title: 'Context API & Global State', description: 'Share state across components without prop drilling.', search: 'react context API global state tutorial' },
      { title: 'Custom Hooks', description: 'Extract logic into reusable hooks.', search: 'react custom hooks tutorial' },
      { title: 'React with APIs', description: 'Fetch real data, show loading/error states.', search: 'react fetch API data tutorial project' },
    ],
  },
  {
    id: 'data-science-python',
    title: 'Data Science with Python',
    description: 'Analyze real-world data using Pandas, NumPy, Matplotlib and machine learning basics.',
    level: 'Intermediate',
    category: 'Data Science',
    duration: '28 hours',
    icon: '📊',
    gradient: 'from-purple-500 to-indigo-600',
    skills: ['Pandas', 'NumPy', 'Matplotlib', 'Scikit-learn', 'Jupyter'],
    units: [
      { title: 'Data Science Introduction & Jupyter', description: 'Set up Jupyter, understand the data science workflow.', search: 'data science introduction jupyter notebook tutorial 2024' },
      { title: 'NumPy Arrays & Operations', description: 'Fast numerical computation with NumPy.', search: 'numpy tutorial python arrays operations beginners' },
      { title: 'Pandas — DataFrames', description: 'Load, inspect, and manipulate tabular data.', search: 'pandas tutorial python dataframes beginners' },
      { title: 'Data Cleaning & Missing Values', description: 'Handle nulls, duplicates, and inconsistent data.', search: 'pandas data cleaning missing values tutorial' },
      { title: 'Exploratory Data Analysis', description: 'Describe, groupby, pivot, and correlate.', search: 'exploratory data analysis pandas python tutorial' },
      { title: 'Data Visualisation with Matplotlib', description: 'Line, bar, scatter, histogram plots.', search: 'matplotlib python data visualization tutorial' },
      { title: 'Seaborn for Statistical Plots', description: 'Beautiful statistical charts in one line.', search: 'seaborn python statistical plots tutorial' },
      { title: 'Intro to Machine Learning', description: 'Supervised vs unsupervised, train/test split.', search: 'machine learning introduction scikit-learn python tutorial' },
      { title: 'Linear & Logistic Regression', description: 'Train your first predictive models.', search: 'linear logistic regression scikit-learn python tutorial' },
      { title: 'Model Evaluation & Metrics', description: 'Accuracy, precision, recall, confusion matrix.', search: 'machine learning model evaluation metrics python tutorial' },
    ],
  },
  {
    id: 'web-development-fullstack',
    title: 'Full-Stack Web Development',
    description: 'HTML, CSS, JavaScript frontend plus Node.js/Express backend — build complete web apps.',
    level: 'Beginner',
    category: 'Web Development',
    duration: '30 hours',
    icon: '🌐',
    gradient: 'from-emerald-400 to-teal-600',
    skills: ['HTML', 'CSS', 'JavaScript', 'Node.js', 'REST APIs'],
    units: [
      { title: 'HTML Foundations', description: 'Structure web pages with semantic HTML5.', search: 'HTML tutorial for beginners complete 2024' },
      { title: 'CSS Styling & Layout', description: 'Style pages with CSS — flexbox, grid, responsive design.', search: 'CSS tutorial for beginners flexbox grid 2024' },
      { title: 'JavaScript for the Web', description: 'Add interactivity — DOM, events, fetch.', search: 'javascript for web development DOM events tutorial' },
      { title: 'Git & GitHub', description: 'Version control, branches, pull requests.', search: 'git github tutorial beginners 2024' },
      { title: 'Node.js Introduction', description: 'Server-side JavaScript, npm, modules.', search: 'nodejs tutorial for beginners 2024' },
      { title: 'Express.js REST API', description: 'Build REST APIs — routes, middleware, JSON.', search: 'express js REST API tutorial 2024' },
      { title: 'Databases — SQL Basics', description: 'PostgreSQL, SELECT, JOIN, INSERT.', search: 'SQL tutorial for beginners postgresql 2024' },
      { title: 'Authentication & JWT', description: 'Secure APIs with JWT and bcrypt.', search: 'nodejs JWT authentication tutorial 2024' },
      { title: 'Frontend-Backend Integration', description: 'Connect React to your Node API.', search: 'react nodejs full stack tutorial CRUD app' },
      { title: 'Deployment', description: 'Deploy to Vercel (frontend) and Render (backend).', search: 'deploy react nodejs app vercel render tutorial' },
    ],
  },
  {
    id: 'sql-databases',
    title: 'SQL & Databases',
    description: 'Design and query relational databases — from SELECT to joins, indexes, and transactions.',
    level: 'Beginner',
    category: 'Database',
    duration: '15 hours',
    icon: '🗄️',
    gradient: 'from-blue-500 to-indigo-500',
    skills: ['SELECT', 'JOIN', 'Indexes', 'Transactions', 'PostgreSQL'],
    units: [
      { title: 'Database Introduction', description: 'What databases are and why we need them.', search: 'database introduction tutorial SQL beginners 2024' },
      { title: 'SELECT & WHERE', description: 'Query data with filters and conditions.', search: 'SQL SELECT WHERE tutorial beginners' },
      { title: 'INSERT, UPDATE, DELETE', description: 'Modify data in tables.', search: 'SQL INSERT UPDATE DELETE tutorial' },
      { title: 'Aggregations — GROUP BY', description: 'COUNT, SUM, AVG, MIN, MAX with grouping.', search: 'SQL GROUP BY aggregate functions tutorial' },
      { title: 'JOINs', description: 'INNER, LEFT, RIGHT, FULL JOIN — combine tables.', search: 'SQL JOIN tutorial INNER LEFT RIGHT' },
      { title: 'Subqueries', description: 'Nested SELECT statements.', search: 'SQL subqueries tutorial' },
      { title: 'Schema Design & Normalization', description: 'Design good database schemas, avoid redundancy.', search: 'SQL database design normalization tutorial' },
      { title: 'Indexes & Performance', description: 'Speed up queries with indexes.', search: 'SQL indexes performance optimization tutorial' },
      { title: 'Transactions & ACID', description: 'Atomic, consistent, isolated, durable operations.', search: 'SQL transactions ACID properties tutorial' },
      { title: 'PostgreSQL in Practice', description: 'JSON columns, window functions, full-text search.', search: 'postgresql advanced features tutorial 2024' },
    ],
  },
  {
    id: 'git-devops',
    title: 'Git, Linux & DevOps Basics',
    description: 'Version control, command line, Docker, CI/CD — the tools every developer needs.',
    level: 'Beginner',
    category: 'DevOps',
    duration: '18 hours',
    icon: '🐙',
    gradient: 'from-slate-600 to-slate-900',
    skills: ['Git', 'Linux CLI', 'Docker', 'CI/CD', 'SSH'],
    units: [
      { title: 'Git Basics', description: 'init, add, commit, push, pull, clone.', search: 'git tutorial for beginners 2024 complete' },
      { title: 'Branching & Merging', description: 'Feature branches, merge, rebase, conflicts.', search: 'git branching merging tutorial' },
      { title: 'GitHub Collaboration', description: 'Pull requests, code review, forks.', search: 'github collaboration pull requests tutorial' },
      { title: 'Linux Command Line', description: 'Navigate, manipulate files, permissions.', search: 'linux command line tutorial beginners 2024' },
      { title: 'Shell Scripting Basics', description: 'Automate tasks with bash scripts.', search: 'bash shell scripting tutorial beginners' },
      { title: 'SSH & Remote Servers', description: 'Connect to servers, transfer files.', search: 'SSH tutorial for beginners remote servers' },
      { title: 'Docker Introduction', description: 'Containers, images, Dockerfile basics.', search: 'docker tutorial for beginners 2024' },
      { title: 'Docker Compose', description: 'Multi-container apps with compose.', search: 'docker compose tutorial 2024' },
      { title: 'CI/CD with GitHub Actions', description: 'Automate tests and deployments.', search: 'github actions CI/CD tutorial 2024' },
      { title: 'Cloud Basics — AWS/GCP', description: 'EC2, S3, cloud storage and compute.', search: 'AWS cloud basics tutorial beginners 2024' },
    ],
  },
  {
    id: 'machine-learning',
    title: 'Machine Learning A-Z',
    description: 'Supervised, unsupervised learning, neural networks, and deploying ML models.',
    level: 'Advanced',
    category: 'AI & ML',
    duration: '35 hours',
    icon: '🤖',
    gradient: 'from-pink-500 to-rose-600',
    skills: ['Scikit-learn', 'TensorFlow', 'Neural Networks', 'NLP', 'Model Deployment'],
    units: [
      { title: 'ML Introduction & Types', description: 'Supervised, unsupervised, reinforcement learning.', search: 'machine learning introduction types tutorial 2024' },
      { title: 'Feature Engineering', description: 'Select, transform, and scale features.', search: 'feature engineering machine learning tutorial' },
      { title: 'Decision Trees & Random Forest', description: 'Tree-based models, bagging, boosting.', search: 'decision tree random forest machine learning tutorial' },
      { title: 'Support Vector Machines', description: 'Classification with SVM.', search: 'support vector machine SVM tutorial python' },
      { title: 'Clustering — K-Means', description: 'Unsupervised grouping of data.', search: 'k-means clustering unsupervised learning tutorial' },
      { title: 'Neural Networks Intro', description: 'Perceptrons, layers, backpropagation.', search: 'neural networks introduction tutorial 2024' },
      { title: 'TensorFlow & Keras', description: 'Build deep learning models with TF.', search: 'tensorflow keras deep learning tutorial 2024' },
      { title: 'Convolutional Neural Networks', description: 'Image classification with CNNs.', search: 'convolutional neural network CNN tutorial' },
      { title: 'NLP — Text Classification', description: 'Sentiment analysis, tokenisation, embeddings.', search: 'NLP natural language processing python tutorial' },
      { title: 'Deploying ML Models', description: 'FastAPI + Docker to serve your model.', search: 'deploy machine learning model fastapi docker tutorial' },
    ],
  },
]

export function getCourse(id: string): CatalogCourse | undefined {
  return COURSE_CATALOG.find((c) => c.id === id)
}

export function getCompletionPct(completedUnits: number[], totalUnits: number): number {
  if (!totalUnits) return 0
  return Math.round((completedUnits.length / totalUnits) * 100)
}
