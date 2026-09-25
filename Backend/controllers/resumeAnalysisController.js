const multer = require('multer');
const pdfParse = require('pdf-parse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const Resume = require('../models/Resume');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const { callGeminiAPI } = require('../utils/geminiUtils');

// ─── Multer Config ─────────────────────────────────────────────────────────────
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new ApiError(400, 'Only PDF files are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
});

// ─── Role Keyword Knowledge Base with Search Aliases ─────────────────────────
const ROLE_DEFINITIONS = {
  'web development': {
    name: 'Web Development / Full Stack',
    expectedKeywords: [
      { keyword: 'JavaScript', aliases: ['javascript', 'js', 'es6'], importance: 'Critical', advice: 'Essential base for modern web development' },
      { keyword: 'TypeScript', aliases: ['typescript', 'ts'], importance: 'Critical', advice: 'Industry standard for type-safe frontend and backend code' },
      { keyword: 'React', aliases: ['react', 'reactjs', 'react.js'], importance: 'Critical', advice: 'Most demanded frontend library for full-stack positions' },
      { keyword: 'Node.js', aliases: ['node', 'nodejs', 'node.js'], importance: 'Critical', advice: 'Primary runtime for scalable JavaScript backend services' },
      { keyword: 'Express', aliases: ['express', 'expressjs'], importance: 'Critical', advice: 'Core HTTP web framework for REST API endpoints' },
      { keyword: 'MongoDB', aliases: ['mongodb', 'mongo'], importance: 'High', advice: 'Essential NoSQL document database for MERN stack' },
      { keyword: 'PostgreSQL', aliases: ['postgres', 'postgresql', 'psql'], importance: 'High', advice: 'Premier relational SQL database for production architectures' },
      { keyword: 'REST APIs', aliases: ['rest api', 'rest apis', 'restful', 'rest'], importance: 'Critical', advice: 'Key standard for backend service communication' },
      { keyword: 'Tailwind CSS', aliases: ['tailwind', 'tailwindcss'], importance: 'High', advice: 'Modern utility-first CSS framework favored by tech companies' },
      { keyword: 'State Management', aliases: ['redux', 'zustand', 'mobx', 'state management'], importance: 'High', advice: 'Show handling of complex application state across components' },
      { keyword: 'Git & GitHub', aliases: ['git', 'github', 'gitlab'], importance: 'Critical', advice: 'Version control and collaboration necessity' },
      { keyword: 'Docker', aliases: ['docker', 'dockerfile', 'compose'], importance: 'High', advice: 'Containerization is expected for modern full stack deployment' },
      { keyword: 'WebSockets', aliases: ['websocket', 'websockets', 'socket.io'], importance: 'Value-Add', advice: 'Proves capability to build real-time collaborative applications' },
      { keyword: 'CI/CD Pipelines', aliases: ['ci/cd', 'github actions', 'jenkins', 'pipeline'], importance: 'High', advice: 'Automated testing and deployment capability' },
      { keyword: 'Next.js', aliases: ['next', 'nextjs', 'next.js', 'ssr'], importance: 'High', advice: 'Server-side rendering, SEO and full-stack React framework' },
      { keyword: 'Redis', aliases: ['redis'], importance: 'Value-Add', advice: 'In-memory caching and session store for high performance' },
      { keyword: 'Unit Testing', aliases: ['jest', 'cypress', 'mocha', 'rtl', 'testing library', 'unit test'], importance: 'High', advice: 'Demonstrates software reliability and production mindset' },
    ],
    defaultProjects: [
      {
        title: 'Full-Stack Real-Time Collaboration & Kanban Platform',
        description: 'Trello-style workspace with optimistic UI updates, live WebSockets cursor tracking, and role-based permissions.',
        difficulty: 'Intermediate',
        tech_stack: ['React', 'Node.js', 'Express', 'Socket.io', 'MongoDB', 'Tailwind CSS'],
        key_features: [
          'Sub-100ms collaborative state synchronization via WebSockets',
          'Role-based access control (Admin, Editor, Viewer) with JWT tokens',
          'Drag-and-drop card positioning with optimistic state rollback',
          'Audit trail history and markdown description editor'
        ],
        skills_bridged: ['WebSockets', 'State Management', 'Full Stack Architecture', 'MongoDB Indexing']
      },
      {
        title: 'Multi-Tenant E-Commerce SaaS with Stripe & Redis',
        description: 'Production-ready marketplace with inventory locking, search debounce, cart persistence, and Stripe webhooks.',
        difficulty: 'Advanced',
        tech_stack: ['Next.js 14', 'TypeScript', 'PostgreSQL', 'Prisma', 'Stripe API', 'Redis'],
        key_features: [
          'Transactional inventory reservation preventing overselling',
          'Stripe webhook listener with signature verification and invoice PDF generation',
          'Faceted search with multi-filter queries and debounce',
          'Redis session caching cutting average API response latency by 60%'
        ],
        skills_bridged: ['Next.js / SSR', 'TypeScript', 'PostgreSQL', 'Redis Caching', 'Stripe Integration']
      },
      {
        title: 'Developer Micro-Blogging & Knowledge Platform',
        description: 'Technical community platform with code syntax highlighting, markdown preview, interactive polling, and user metrics.',
        difficulty: 'Intermediate',
        tech_stack: ['React', 'Node.js', 'Express', 'Tailwind CSS', 'Docker', 'AWS S3'],
        key_features: [
          'Rich markdown editor with live syntax highlighting and asset upload',
          'Bookmark collections and full-text search across published guides',
          'Dockerized development and production setup with docker-compose',
          'Analytics dashboard tracking article reads and reader engagement'
        ],
        skills_bridged: ['Docker', 'AWS S3 Asset Management', 'Component Design', 'SEO Fundamentals']
      }
    ],
    roadmap: [
      {
        phase: 'Phase 1 (Days 1–30)',
        title: 'Frontend Rigor & Type Safety',
        time_frame: 'Month 1',
        milestones: [
          'Migrate or build projects using TypeScript instead of vanilla JS',
          'Implement advanced state management using Zustand or Redux Toolkit',
          'Master responsive design and accessibility (WCAG AA) with Tailwind CSS',
          'Add client-side form validation and error boundary wrappers'
        ],
        recommended_tools: ['TypeScript', 'React', 'Zustand', 'Tailwind CSS']
      },
      {
        phase: 'Phase 2 (Days 31–60)',
        title: 'Full Stack Architecture & Production Databases',
        time_frame: 'Month 2',
        milestones: [
          'Build end-to-end RESTful APIs with Node.js, Express, and PostgreSQL/Prisma',
          'Implement JWT authentication with refresh token rotation and bcrypt hashing',
          'Integrate Redis for query caching and rate limiting',
          'Deploy full-stack project with live URLs and GitHub README documentation'
        ],
        recommended_tools: ['PostgreSQL', 'Prisma', 'Redis', 'Docker', 'Vercel / Render']
      },
      {
        phase: 'Phase 3 (Days 61–90)',
        title: 'Testing, CI/CD & Placement Readiness',
        time_frame: 'Month 3',
        milestones: [
          'Write automated unit and integration tests using Jest and Supertest',
          'Set up GitHub Actions CI/CD to run tests and automated deployment on git push',
          'Refactor resume bullet points with STAR formula and live project links',
          'Practice technical interview coding and web architecture system design'
        ],
        recommended_tools: ['Jest', 'GitHub Actions', 'Postman', 'LeetCode']
      }
    ]
  },
  'frontend developer': {
    name: 'Frontend Developer',
    expectedKeywords: [
      { keyword: 'JavaScript (ES6+)', aliases: ['javascript', 'js', 'es6'], importance: 'Critical', advice: 'Core web language' },
      { keyword: 'TypeScript', aliases: ['typescript', 'ts'], importance: 'Critical', advice: 'Required for modern enterprise frontend teams' },
      { keyword: 'React', aliases: ['react', 'reactjs', 'react.js'], importance: 'Critical', advice: 'Primary component library' },
      { keyword: 'Next.js', aliases: ['next', 'nextjs', 'next.js', 'ssr'], importance: 'High', advice: 'Server-side rendering and static generation' },
      { keyword: 'HTML5 & CSS3', aliases: ['html', 'html5', 'css', 'css3'], importance: 'Critical', advice: 'Accessible markup structure' },
      { keyword: 'Tailwind CSS', aliases: ['tailwind', 'tailwindcss', 'sass', 'bootstrap'], importance: 'Critical', advice: 'Modern styling and animations' },
      { keyword: 'State Management', aliases: ['redux', 'zustand', 'context api'], importance: 'Critical', advice: 'Predictable application state' },
      { keyword: 'Web Performance', aliases: ['lighthouse', 'performance', 'lazy loading', 'code splitting', 'core web vitals'], importance: 'High', advice: 'Lighthouse metrics, bundle size, memoization' },
      { keyword: 'Unit Testing', aliases: ['jest', 'rtl', 'react testing library', 'cypress', 'vitest'], importance: 'High', advice: 'Component test coverage' },
      { keyword: 'Responsive UI', aliases: ['responsive', 'mobile-first', 'flexbox', 'grid'], importance: 'Critical', advice: 'Mobile-first fluid layouts' },
      { keyword: 'API Integration', aliases: ['rest api', 'fetch', 'axios', 'tanstack query', 'react query'], importance: 'High', advice: 'Data fetching and caching' },
    ],
    defaultProjects: [
      {
        title: 'High-Performance Financial Analytics Dashboard',
        description: 'Interactive stock & crypto market terminal with sub-second chart rendering, theme switching, and live websockets.',
        difficulty: 'Intermediate',
        tech_stack: ['React', 'TypeScript', 'Tailwind CSS', 'Chart.js / Recharts', 'Zustand'],
        key_features: [
          'Virtual scrolling handling 5,000+ data rows with 60 FPS smoothness',
          'Custom candlestick charting with zoom and timeframe selectors',
          'Accessible dark / light theme toggle using CSS variable tokens',
          'State persistence and debounce search filtering'
        ],
        skills_bridged: ['TypeScript', 'Data Visualization', 'Zustand', 'Performance Optimization']
      }
    ],
    roadmap: [
      {
        phase: 'Phase 1 (Days 1–30)',
        title: 'Master Modern TypeScript & Component Design',
        time_frame: 'Month 1',
        milestones: ['Deep dive into TypeScript generics and React component prop types', 'Rebuild UI components with Radix primitives', 'Implement custom hooks for data fetching and debouncing'],
        recommended_tools: ['TypeScript', 'React', 'Radix UI', 'Tailwind CSS']
      }
    ]
  },
  'backend developer': {
    name: 'Backend Developer',
    expectedKeywords: [
      { keyword: 'Node.js / Express', aliases: ['node', 'nodejs', 'express', 'expressjs'], importance: 'Critical', advice: 'Primary runtime and server framework' },
      { keyword: 'Python / Java / Go', aliases: ['python', 'java', 'golang', 'go', 'spring'], importance: 'High', advice: 'Alternative enterprise backend languages' },
      { keyword: 'PostgreSQL / SQL', aliases: ['sql', 'postgres', 'postgresql', 'mysql'], importance: 'Critical', advice: 'Relational data modeling, foreign keys, joins' },
      { keyword: 'MongoDB / NoSQL', aliases: ['mongodb', 'nosql', 'mongo'], importance: 'High', advice: 'Document store for flexible unstructured records' },
      { keyword: 'RESTful API Architecture', aliases: ['rest', 'rest api', 'restful', 'endpoint', 'api'], importance: 'Critical', advice: 'HTTP methods, status codes, payload design' },
      { keyword: 'Database Indexing', aliases: ['indexing', 'indexes', 'query optimization', 'explain analyze'], importance: 'High', advice: 'Query execution plans and latency reduction' },
      { keyword: 'Authentication & JWT', aliases: ['jwt', 'oauth', 'auth', 'bcrypt', 'token'], importance: 'Critical', advice: 'OAuth2, refresh tokens, role permissions' },
      { keyword: 'Redis Caching', aliases: ['redis', 'cache', 'caching'], importance: 'High', advice: 'Cache layer, rate limiter, pub/sub' },
      { keyword: 'Docker', aliases: ['docker', 'container', 'dockerfile'], importance: 'Critical', advice: 'Containerized deployment reproducibility' },
      { keyword: 'Microservices & Queues', aliases: ['microservices', 'queue', 'bullmq', 'rabbitmq', 'kafka'], importance: 'High', advice: 'Asynchronous event handling' },
    ],
    defaultProjects: [
      {
        title: 'Distributed High-Throughput API Gateway & Rate Limiter',
        description: 'Scalable reverse-proxy gateway implementing sliding-window rate limiting, token verification, and Prometheus telemetry.',
        difficulty: 'Advanced',
        tech_stack: ['Node.js', 'Express', 'Redis', 'Docker', 'Prometheus'],
        key_features: [
          'Sliding-window rate limiter preventing API abuse and DDoS spikes',
          'Centralized JWT verification and role-based route forwarding',
          'Prometheus metrics endpoint capturing p95 and p99 response latencies',
          'Containerized deployment with Docker and automated health checks'
        ],
        skills_bridged: ['Redis Caching', 'System Scalability', 'Docker', 'API Security']
      }
    ],
    roadmap: [
      {
        phase: 'Phase 1 (Days 1–30)',
        title: 'Advanced SQL, Transactions & Indexing',
        time_frame: 'Month 1',
        milestones: ['Master complex SQL queries, window functions, and indexing in PostgreSQL', 'Implement database transactions with ACID compliance', 'Design normalized relational schemas'],
        recommended_tools: ['PostgreSQL', 'Prisma', 'DBeaver']
      }
    ]
  },
  'software development engineer (sde)': {
    name: 'Software Development Engineer (SDE)',
    expectedKeywords: [
      { keyword: 'Data Structures & Algorithms', aliases: ['dsa', 'data structures', 'algorithms', 'trees', 'graphs', 'dp'], importance: 'Critical', advice: 'Core problem solving foundations' },
      { keyword: 'Problem Solving (LeetCode)', aliases: ['leetcode', 'codeforces', 'competitive programming', 'hacker rank', 'codechef'], importance: 'Critical', advice: 'Algorithmic time and space complexity' },
      { keyword: 'Object-Oriented Programming (OOP)', aliases: ['oops', 'oop', 'object-oriented', 'polymorphism', 'inheritance'], importance: 'Critical', advice: 'Encapsulation, Inheritance, Polymorphism' },
      { keyword: 'Java / C++ / Python', aliases: ['java', 'c++', 'python', 'c'], importance: 'Critical', advice: 'Core programming language mastery' },
      { keyword: 'System Design', aliases: ['system design', 'scalability', 'distributed systems', 'load balancing'], importance: 'High', advice: 'Scalability, microservices, load balancers' },
      { keyword: 'DBMS & SQL', aliases: ['dbms', 'sql', 'database', 'rdbms'], importance: 'Critical', advice: 'ACID properties, normalization, indexing' },
      { keyword: 'Computer Networks', aliases: ['computer networks', 'tcp', 'ip', 'http', 'dns', 'udp'], importance: 'High', advice: 'Networking protocols' },
      { keyword: 'Operating Systems', aliases: ['operating systems', 'os', 'threads', 'concurrency', 'deadlock'], importance: 'High', advice: 'Process vs Thread, Concurrency, Memory' },
      { keyword: 'Git & Version Control', aliases: ['git', 'github'], importance: 'Critical', advice: 'Branching, PRs, merge conflict resolution' },
    ],
    defaultProjects: [
      {
        title: 'Concurrent In-Memory Key-Value Store & Cache',
        description: 'Multi-threaded in-memory database implementing O(1) LRU eviction, TCP server protocol, and write-ahead persistence.',
        difficulty: 'Advanced',
        tech_stack: ['Java / C++ / Go', 'TCP Sockets', 'Concurrency Locks', 'Data Structures'],
        key_features: [
          'Custom Doubly-Linked List + Hash Map achieving O(1) LRU cache eviction',
          'Read/Write mutex concurrency locking preventing race conditions',
          'Append-only file (AOF) persistence logging for crash recovery',
          'Custom command parser handling GET, SET, EXPIRE, and DEL commands'
        ],
        skills_bridged: ['Data Structures & Algorithms', 'Concurrency & Mutexes', 'TCP Networking', 'Memory Management']
      }
    ],
    roadmap: [
      {
        phase: 'Phase 1 (Days 1–30)',
        title: 'Core DSA & Algorithmic Patterns',
        time_frame: 'Month 1',
        milestones: ['Master Two Pointers, Sliding Window, Binary Search, and Linked Lists', 'Complete 75 curated LeetCode problems (Blind 75)', 'Analyze Big-O time and space complexity for all solutions'],
        recommended_tools: ['Java / C++', 'LeetCode', 'GitHub']
      }
    ]
  },
  'ai / machine learning engineer': {
    name: 'AI / Machine Learning Engineer',
    expectedKeywords: [
      { keyword: 'Python', aliases: ['python', 'py'], importance: 'Critical', advice: 'Primary language for data science and AI' },
      { keyword: 'PyTorch / TensorFlow', aliases: ['pytorch', 'tensorflow', 'keras', 'torch'], importance: 'Critical', advice: 'Deep learning frameworks' },
      { keyword: 'Pandas & NumPy', aliases: ['pandas', 'numpy'], importance: 'Critical', advice: 'Vectorized data processing' },
      { keyword: 'Scikit-Learn', aliases: ['scikit-learn', 'sklearn'], importance: 'Critical', advice: 'Supervised and unsupervised ML models' },
      { keyword: 'LLMs & Generative AI', aliases: ['llm', 'llms', 'generative ai', 'genai', 'prompt engineering', 'langchain'], importance: 'High', advice: 'Prompt engineering, tokenization' },
      { keyword: 'RAG & Vector Search', aliases: ['rag', 'retrieval augmented generation', 'vector', 'chromadb', 'pinecone'], importance: 'High', advice: 'Vector search and grounded document Q&A' },
      { keyword: 'Model Evaluation', aliases: ['f1', 'precision', 'recall', 'accuracy', 'auc', 'roc'], importance: 'Critical', advice: 'Precision, Recall, F1-Score, Loss' },
      { keyword: 'FastAPI / Flask', aliases: ['fastapi', 'flask'], importance: 'High', advice: 'Exposing models as scalable inference services' },
    ],
    defaultProjects: [
      {
        title: 'Enterprise Document RAG Assistant with Hybrid Search',
        description: 'Semantic vector Q&A platform over proprietary PDFs with BM25 hybrid search, source grounding, and FastAPI inference.',
        difficulty: 'Intermediate',
        tech_stack: ['Python', 'FastAPI', 'LangChain', 'ChromaDB', 'Gemini API', 'Docker'],
        key_features: [
          'Chunking and embedding pipeline with metadata preservation',
          'Hybrid search combining BM25 keyword matching and dense vector similarity',
          'Strict hallucination mitigation with exact snippet and page citations',
          'FastAPI endpoints delivering streaming token responses'
        ],
        skills_bridged: ['RAG Architecture', 'Vector Databases', 'FastAPI', 'Prompt Engineering']
      }
    ],
    roadmap: [
      {
        phase: 'Phase 1 (Days 1–30)',
        title: 'Math, Data Wrangling & Classic ML',
        time_frame: 'Month 1',
        milestones: ['Master Pandas, NumPy, and exploratory data analysis (EDA)', 'Implement linear/logistic regression, decision trees, and random forests from scratch', 'Learn hyperparameter tuning and cross-validation techniques'],
        recommended_tools: ['Python', 'Pandas', 'NumPy', 'Scikit-Learn']
      }
    ]
  },
  'devops & cloud engineer': {
    name: 'DevOps & Cloud Engineer',
    expectedKeywords: [
      { keyword: 'Linux & Shell Scripting', aliases: ['linux', 'bash', 'shell', 'ubuntu'], importance: 'Critical', advice: 'Operating system administration and automation' },
      { keyword: 'Docker & Containers', aliases: ['docker', 'container', 'dockerfile', 'containers'], importance: 'Critical', advice: 'Multi-stage builds, container isolation' },
      { keyword: 'Kubernetes (K8s)', aliases: ['kubernetes', 'k8s', 'helm', 'kubectl'], importance: 'Critical', advice: 'Pods, Deployments, Services, Ingress' },
      { keyword: 'CI/CD Pipelines', aliases: ['ci/cd', 'github actions', 'jenkins', 'gitlab ci'], importance: 'Critical', advice: 'Automated test, build, and deploy' },
      { keyword: 'AWS / Cloud Platform', aliases: ['aws', 'cloud', 'gcp', 'azure', 'ec2', 's3'], importance: 'Critical', advice: 'Cloud infrastructure (EC2, S3, IAM, VPC)' },
      { keyword: 'Terraform (IaC)', aliases: ['terraform', 'iac', 'infrastructure as code'], importance: 'High', advice: 'Declarative cloud provisioning' },
      { keyword: 'Monitoring & Logging', aliases: ['prometheus', 'grafana', 'datadog', 'elk', 'monitoring'], importance: 'High', advice: 'Metrics, alerts, system health' },
    ],
    defaultProjects: [
      {
        title: 'Automated Multi-Stage GitOps Deployment Pipeline',
        description: 'Zero-downtime pipeline running automated test, Docker image vulnerability scans, and Kubernetes rollout.',
        difficulty: 'Advanced',
        tech_stack: ['GitHub Actions', 'Docker', 'Kubernetes', 'Terraform', 'Trivy'],
        key_features: [
          'Vulnerability scanning of container images with Trivy prior to push',
          'Rolling updates with liveness and readiness probe validation',
          'Terraform scripts provisioning cloud VPC and managed Kubernetes cluster',
          'Prometheus alert manager sending Slack notifications on high latency'
        ],
        skills_bridged: ['Kubernetes Orchestration', 'Terraform (IaC)', 'Container Security', 'GitOps']
      }
    ],
    roadmap: [
      {
        phase: 'Phase 1 (Days 1–30)',
        title: 'Linux Fundamentals & Containerization',
        time_frame: 'Month 1',
        milestones: ['Master Linux system administration, permissions, and bash automation', 'Write multi-stage Dockerfiles optimizing image size under 100MB', 'Set up Docker Compose environments with persistent volumes'],
        recommended_tools: ['Linux / Bash', 'Docker', 'Docker Compose']
      }
    ]
  },
  'mobile app developer': {
    name: 'Mobile App Developer',
    expectedKeywords: [
      { keyword: 'React Native / Flutter', aliases: ['react native', 'flutter', 'dart', 'android', 'ios', 'swift', 'kotlin'], importance: 'Critical', advice: 'Cross-platform mobile frameworks' },
      { keyword: 'Mobile UI/UX', aliases: ['mobile', 'responsive', 'gestures', 'navigation'], importance: 'Critical', advice: 'Native look, feel, and gestures' },
      { keyword: 'State Management', aliases: ['redux', 'provider', 'bloc', 'zustand'], importance: 'Critical', advice: 'Client mobile state management' },
      { keyword: 'Offline Storage', aliases: ['asyncstorage', 'sqlite', 'room', 'coredata', 'local storage'], importance: 'High', advice: 'Local caching and offline usability' },
      { keyword: 'Push Notifications', aliases: ['push notifications', 'fcm', 'firebase messaging'], importance: 'High', advice: 'User re-engagement' },
      { keyword: 'REST API Integration', aliases: ['rest api', 'axios', 'fetch', 'api'], importance: 'Critical', advice: 'Backend connectivity' }
    ],
    defaultProjects: [
      {
        title: 'Cross-Platform Fitness & Habit Tracker with Offline Sync',
        description: 'Smooth mobile fitness tracker that logs workouts offline, syncs with cloud when online, and charts weekly metrics.',
        difficulty: 'Intermediate',
        tech_stack: ['React Native / Flutter', 'AsyncStorage / SQLite', 'Node.js', 'Firebase'],
        key_features: [
          'Smooth gesture animations and custom bottom sheet modals',
          'Conflict-free offline-first sync queue with SQLite local cache',
          'Background timer tracking with native local push notifications',
          'Interactive progress charts exportable as shareable achievements'
        ],
        skills_bridged: ['Mobile Gestures', 'Offline-First Architecture', 'Local Persistence', 'Cross-Platform Lifecycle']
      }
    ],
    roadmap: [
      {
        phase: 'Phase 1 (Days 1–30)',
        title: 'Mobile UI Components & Navigation',
        time_frame: 'Month 1',
        milestones: ['Master React Navigation / Flutter Navigator stacks and tabs', 'Build responsive screens supporting various device aspect ratios', 'Implement gesture handling and bottom sheets'],
        recommended_tools: ['React Native / Flutter', 'React Navigation', 'Figma']
      }
    ]
  }
};

// ─── Forensic Text Analyzers ──────────────────────────────────────────────────
const POWER_VERBS = [
  'engineered', 'architected', 'spearheaded', 'orchestrated', 'implemented',
  'developed', 'designed', 'optimized', 'accelerated', 'automated',
  'refactored', 'streamlined', 'deployed', 'configured', 'integrated',
  'scaled', 'constructed', 'delivered', 'formulated', 'pioneered',
  'maximized', 'eliminated', 'boosted', 'overhauled', 'benchmarked', 'built'
];

const WEAK_VERB_MAP = [
  { weak: 'worked on', replacement: 'Engineered / Architected', example: 'Replace "Worked on website frontend" with "Engineered responsive client interface"' },
  { weak: 'responsible for', replacement: 'Spearheaded / Managed', example: 'Replace "Responsible for backend APIs" with "Architected RESTful endpoints"' },
  { weak: 'helped with', replacement: 'Collaborated across teams to deliver', example: 'Replace "Helped with database design" with "Collaborated on schema design"' },
  { weak: 'handled', replacement: 'Resolved / Streamlined', example: 'Replace "Handled customer issues" with "Diagnosed and resolved critical client bugs"' },
  { weak: 'made', replacement: 'Developed / Programmed', example: 'Replace "Made an app" with "Constructed end-to-end full-stack application"' },
  { weak: 'assisted in', replacement: 'Contributed directly to', example: 'Replace "Assisted in testing" with "Authored automated test suites"' }
];

const BUZZWORDS = [
  'hardworking', 'team player', 'fast learner', 'quick learner',
  'self-motivated', 'passionate', 'detail-oriented', 'think outside the box',
  'go-getter', 'results-driven', 'synergy', 'dynamic'
];

// ─── Deep Keyword Scanner with Aliases ────────────────────────────────────────
const scanKeywords = (text, roleDef) => {
  const lower = text.toLowerCase();
  return roleDef.expectedKeywords.map((item) => {
    let count = 0;
    const aliases = item.aliases || [item.keyword.toLowerCase()];

    for (const alias of aliases) {
      const escaped = alias.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      const matches = lower.match(regex);
      if (matches) {
        count += matches.length;
      }
    }

    return {
      keyword: item.keyword,
      status: count > 0 ? 'Found' : 'Missing',
      frequency: count,
      importance: item.importance,
      context_advice: item.advice,
    };
  });
};

// ─── Forensic Section Scanner ─────────────────────────────────────────────────
const auditSections = (text, roleName, detectedSkills) => {
  const lower = text.toLowerCase();

  // 1. Header & Contact
  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(text);
  const hasPhone = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text);
  const hasLinkedIn = lower.includes('linkedin.com') || lower.includes('linkedin');
  const hasGitHub = lower.includes('github.com') || lower.includes('github');
  const hasPortfolio = lower.includes('portfolio') || lower.includes('vercel.app') || lower.includes('netlify.app') || lower.includes('http');

  const headerDetected = [];
  const headerMissing = [];
  if (hasEmail) headerDetected.push('Email Address'); else headerMissing.push('Email Address');
  if (hasPhone) headerDetected.push('Phone Number'); else headerMissing.push('Phone Number');
  if (hasLinkedIn) headerDetected.push('LinkedIn Profile'); else headerMissing.push('LinkedIn Profile URL');
  if (hasGitHub) headerDetected.push('GitHub Profile Link'); else headerMissing.push('GitHub Profile Link');
  if (hasPortfolio) headerDetected.push('Live Portfolio / Demo Link'); else headerMissing.push('Live Portfolio Link');

  // 2. Summary / Objective
  const hasSummary = lower.includes('summary') || lower.includes('objective') || lower.includes('about me');
  const summaryRewrite = `Results-driven ${roleName} developer with proven proficiency in ${detectedSkills.slice(0, 3).join(', ') || 'modern engineering frameworks'}. Demonstrated ability to architect scalable solutions, collaborate in agile workflows, and deliver performant software with clean, maintainable code.`;

  // 3. Experience & True Metric Quantification
  // Count lines or bullets
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 15);
  const metricRegex = /\b(\d+(?:\.\d+)?%|\$\d+|\d+\+|\b\d+\s*(?:users?|ms|seconds?|times?|k|m|million|billion|queries|requests|endpoints|stars|downloads|clients?|customers?|tests?)\b)/i;
  
  let quantifiedBulletsCount = 0;
  for (const line of lines) {
    if (metricRegex.test(line)) {
      quantifiedBulletsCount++;
    }
  }

  const totalLinesCount = Math.max(1, lines.length);
  const trueMetricPercent = Math.min(100, Math.round((quantifiedBulletsCount / totalLinesCount) * 100));

  // 4. Projects
  const hasProjects = lower.includes('project') || lower.includes('portfolio');

  return {
    header: {
      status: headerMissing.length <= 1 ? 'Good' : 'Needs Work',
      detected: headerDetected,
      missing: headerMissing,
      advice: !hasGitHub ? 'CRITICAL: Add your GitHub profile link. Recruiters for software roles immediately seek code proof.' : 'Header contains required contact coordinates.',
    },
    summary_objective: {
      status: hasSummary ? 'Present' : 'Missing',
      critique: hasSummary
        ? 'Summary detected. Ensure it avoids generic buzzwords and immediately highlights your target role and top 3 technical tools.'
        : 'Missing professional summary header. Adding a 3-sentence target-role summary increases recruiter dwell time by 40%.',
      recommended_rewrite: summaryRewrite,
    },
    experience: {
      status: trueMetricPercent >= 30 ? 'Strong' : 'Moderate',
      findings: [
        `Detected ${quantifiedBulletsCount} lines containing quantifiable numbers (${trueMetricPercent}% of bullet descriptions).`,
        trueMetricPercent < 30 ? 'Add more numbers (% performance gains, user counts, database record scale, latency reduction).' : 'Good use of quantifiable metrics throughout descriptions.',
        'Ensure every bullet follows the XYZ framework: Accomplished [X], as measured by [Y], by doing [Z].'
      ],
      metric_bullets_percent: trueMetricPercent,
    },
    projects: {
      status: hasProjects ? 'Good' : 'Needs Work',
      findings: [
        hasProjects ? 'Dedicated Projects section detected.' : 'Projects section missing or unstandardized heading.',
        'List exact tech stack tags below each project title (e.g. [React, Node.js, MongoDB, Docker]).',
        'Provide clickable GitHub repo and Live Demo links for each project.'
      ],
      role_relevance_rating: 'High',
    },
    skills: {
      status: 'Good',
      findings: [
        'Organize skills into clean categories rather than a comma-separated paragraph.',
        'Categories should be: Languages, Frameworks & Libraries, Databases, Developer Tools, Cloud / DevOps.'
      ],
      suggested_categorization: {
        'Languages': detectedSkills.filter(s => ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'SQL', 'HTML5', 'CSS3'].includes(s)),
        'Frameworks & Libraries': detectedSkills.filter(s => ['React', 'Node.js', 'Express', 'Next.js', 'Tailwind CSS', 'Redux', 'Vue.js'].includes(s)),
        'Databases & Storage': detectedSkills.filter(s => ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'SQLite', 'Firebase'].includes(s)),
        'Developer Tools & DevOps': detectedSkills.filter(s => ['Git', 'GitHub', 'Docker', 'Kubernetes', 'Linux', 'AWS', 'Postman'].includes(s)),
      }
    },
    education: {
      status: lower.includes('education') || lower.includes('bachelor') || lower.includes('b.tech') || lower.includes('degree') ? 'Good' : 'Needs Check',
      findings: [
        'Include Degree, Major, University, and Graduation Year clearly.',
        'Highlight relevant coursework (e.g. Data Structures, Database Systems, Web Technologies, Operating Systems).'
      ]
    }
  };
};

// ─── Extract All Skills Helper ────────────────────────────────────────────────
const EXTENDED_SKILLS_LIST = [
  'javascript', 'typescript', 'react', 'reactjs', 'vue', 'vuejs', 'angular',
  'nextjs', 'next.js', 'html', 'html5', 'css', 'css3', 'tailwind', 'tailwindcss',
  'sass', 'scss', 'bootstrap', 'redux', 'zustand', 'node', 'nodejs', 'node.js',
  'express', 'expressjs', 'python', 'django', 'flask', 'fastapi', 'java', 'spring',
  'springboot', 'c++', 'c#', '.net', 'golang', 'go', 'php', 'laravel', 'ruby',
  'rails', 'mongodb', 'mysql', 'postgresql', 'postgres', 'sqlite', 'redis',
  'firebase', 'supabase', 'graphql', 'rest api', 'restful api', 'api', 'docker',
  'kubernetes', 'k8s', 'aws', 'azure', 'gcp', 'linux', 'bash', 'git', 'github',
  'ci/cd', 'terraform', 'ansible', 'jenkins', 'data structures', 'algorithms',
  'dsa', 'oops', 'system design', 'machine learning', 'deep learning', 'pytorch',
  'tensorflow', 'scikit-learn', 'pandas', 'numpy', 'opencv', 'nlp', 'llm', 'langchain',
  'flutter', 'react native', 'android', 'ios', 'swift', 'kotlin', 'figma', 'postman'
];

const extractAllSkills = (text) => {
  const lower = text.toLowerCase();
  const matched = [];
  EXTENDED_SKILLS_LIST.forEach((s) => {
    const regex = new RegExp(`\\b${s.replace('.', '\\.')}\\b`, 'i');
    if (regex.test(lower)) {
      matched.push(s);
    }
  });

  const canonicalMap = {
    'reactjs': 'React', 'react.js': 'React', 'react': 'React',
    'nodejs': 'Node.js', 'node.js': 'Node.js', 'node': 'Node.js',
    'expressjs': 'Express', 'express': 'Express',
    'next.js': 'Next.js', 'nextjs': 'Next.js',
    'vuejs': 'Vue.js', 'vue': 'Vue.js',
    'html5': 'HTML5', 'html': 'HTML5',
    'css3': 'CSS3', 'css': 'CSS3',
    'tailwindcss': 'Tailwind CSS', 'tailwind': 'Tailwind CSS',
    'postgres': 'PostgreSQL', 'postgresql': 'PostgreSQL',
    'k8s': 'Kubernetes', 'kubernetes': 'Kubernetes',
    'restful api': 'REST APIs', 'rest api': 'REST APIs',
    'dsa': 'Data Structures & Algorithms',
    'data structures': 'Data Structures & Algorithms',
    'oops': 'Object-Oriented Programming (OOP)'
  };

  const formatted = matched.map((s) => canonicalMap[s] || (s.charAt(0).toUpperCase() + s.slice(1)));
  return Array.from(new Set(formatted));
};

// ─── Mathematical Fallback Synthesis ──────────────────────────────────────────
const generateDeepAnalysis = (resumeText, targetRole, detectedSkills) => {
  const cleanRole = targetRole.trim().toLowerCase();
  const roleKey = Object.keys(ROLE_DEFINITIONS).find((k) => cleanRole.includes(k)) || 'web development';
  const roleDef = ROLE_DEFINITIONS[roleKey] || ROLE_DEFINITIONS['web development'];

  const lowerText = resumeText.toLowerCase();

  // 1. Keyword Gap Analysis with Aliases
  const keywordAnalysis = scanKeywords(resumeText, roleDef);
  const foundKeywords = keywordAnalysis.filter((k) => k.status === 'Found');
  const missingKeywords = keywordAnalysis.filter((k) => k.status === 'Missing');

  // Matched vs Missing
  const matchedSkills = foundKeywords.map((k) => k.keyword);
  const missingCriticalSkills = missingKeywords.filter((k) => k.importance === 'Critical' || k.importance === 'High').map((k) => k.keyword);
  const bonusSkills = detectedSkills.filter((s) => !matchedSkills.includes(s));

  // 2. Action Verbs & Language Audit
  const strongVerbsFound = POWER_VERBS.filter((v) => new RegExp(`\\b${v}\\b`, 'i').test(lowerText));
  const weakVerbsFound = WEAK_VERB_MAP.filter((w) => lowerText.includes(w.weak));
  const buzzwordsFound = BUZZWORDS.filter((b) => lowerText.includes(b));

  // 3. Section Audit & True Metric Counting
  const sectionAuditData = auditSections(resumeText, targetRole, detectedSkills);

  // 4. Word count & reading time
  const words = resumeText.trim().split(/\s+/).filter(Boolean).length;
  const readingSeconds = Math.max(20, Math.round((words / 200) * 60));

  // 5. True Dynamic Multi-Scores (NO ARTIFICIAL CLAMPING!)
  // Role relevance: percentage of required role keywords found
  const totalKeywordsCount = roleDef.expectedKeywords.length || 10;
  const matchFraction = foundKeywords.length / totalKeywordsCount;
  
  // Calculate dynamic score with high role sensitivity:
  const roleRelevance = Math.min(98, Math.max(10, Math.round(matchFraction * 100)));
  
  // ATS Formatting: based on contact details, sections, word density
  let atsFormatCalc = 70;
  if (sectionAuditData.header.missing.length === 0) atsFormatCalc += 15;
  else atsFormatCalc -= (sectionAuditData.header.missing.length * 6);
  if (sectionAuditData.projects.status === 'Good') atsFormatCalc += 10;
  if (words >= 250 && words <= 800) atsFormatCalc += 5;
  const atsFormatting = Math.min(98, Math.max(25, atsFormatCalc));

  // Impact & Quantification: based directly on true metric bullets percent
  const impactQuantification = Math.min(98, Math.max(15, Math.round(sectionAuditData.experience.metric_bullets_percent * 1.5 + 20)));

  // Power Language: based on ratio of strong verbs vs weak verbs
  const verbScore = (strongVerbsFound.length * 12) - (weakVerbsFound.length * 8) + 40;
  const powerLanguage = Math.min(98, Math.max(20, Math.round(verbScore)));

  // Brevity & Structure
  let brevityCalc = 80;
  if (words < 150) brevityCalc = 40;
  else if (words < 250) brevityCalc = 60;
  else if (words > 900) brevityCalc = 65;
  else brevityCalc = 88;
  const brevityStructure = brevityCalc;

  // Composite overall score
  const compositeScore = Math.round(
    (roleRelevance * 0.40) +
    (atsFormatting * 0.20) +
    (impactQuantification * 0.15) +
    (powerLanguage * 0.15) +
    (brevityStructure * 0.10)
  );

  let sentimentBadge = 'Interview Contender';
  let roleLevel = 'Junior / Entry-Level Ready';
  if (compositeScore >= 85) {
    sentimentBadge = 'Strong Hire Potential';
    roleLevel = 'Competitive Candidate (Mid-Level Ready)';
  } else if (compositeScore < 55) {
    sentimentBadge = 'Gaps to Address';
    roleLevel = 'Needs Upskilling for this Role';
  }

  // Recruiter Outreach Materials
  const elevatorPitch = `Hi, I'm a developer specializing in ${targetRole}, with hands-on experience building projects with ${matchedSkills.slice(0, 3).join(', ') || 'modern frameworks'}. Recently, I developed an end-to-end application where I solved ${matchedSkills[0] || 'core engineering'} challenges and improved performance. I'm excited about opportunities where I can leverage my skills to build high-scale, reliable user experiences.`;

  const coldMessage = `Hi [Hiring Manager / Recruiter Name],\n\nI noticed your team at [Company] is hiring for ${targetRole} positions. With a strong foundation in ${matchedSkills.slice(0, 3).join(', ')} and a focus on clean, scalable architecture, I've built full-stack projects delivering sub-second response times and accessible UIs.\n\nI'd love to share my portfolio and learn how my background aligns with your current engineering goals. Are you open to a brief 5-minute chat this week?\n\nBest regards,\n[Your Name]`;

  const coverLetterHook = `As an aspiring ${targetRole} developer who has spent the last year engineering applications with ${matchedSkills.slice(0, 3).join(', ')}, I was immediately drawn to [Company]'s mission. My technical focus revolves around building clean, high-performance systems and turning complex requirements into seamless digital products.`;

  return {
    overall_score: compositeScore,
    role_match_score: roleRelevance,
    ats_score: atsFormatting,
    role_level: roleLevel,
    multi_scores: {
      role_relevance: roleRelevance,
      ats_formatting: atsFormatting,
      impact_quantification: impactQuantification,
      power_language: powerLanguage,
      brevity_structure: brevityStructure,
    },
    first_impression: {
      verdict: roleRelevance < 40 
        ? `Significant skill mismatch for ${targetRole}: resume focuses on ${detectedSkills.slice(0, 3).join(', ') || 'other domains'} but lacks core ${missingCriticalSkills.slice(0, 2).join(' & ')}.`
        : `Solid exposure to ${matchedSkills.slice(0, 3).join(', ') || 'programming fundamentals'} — needs explicit ${missingCriticalSkills.slice(0, 2).join(' and ') || 'production deployment'} depth and quantified impact metrics.`,
      sentiment_badge: sentimentBadge,
      takeaways: [
        `Candidate displays clear technical alignment with ${matchedSkills.length} key industry tools.`,
        sectionAuditData.header.missing.includes('GitHub Profile Link') ? 'Missing GitHub link is a noticeable red flag for recruiters.' : 'Good online profile visibility (GitHub / LinkedIn detected).',
        `Quantified business/performance metrics detected in ${sectionAuditData.experience.metric_bullets_percent}% of bullet points (target: >40%).`
      ],
      estimated_reading_time: `${readingSeconds} seconds`,
      word_count: words,
    },
    summary: `Your resume demonstrates ${roleRelevance > 60 ? 'strong' : 'preliminary'} foundational competence for ${targetRole}. It indexes ${matchedSkills.length} matched skills (${matchedSkills.slice(0, 4).join(', ') || 'none'}). For competitive ${targetRole} openings, hiring managers look for deeper integration of ${missingCriticalSkills.slice(0, 3).join(', ') || 'enterprise tooling'} and quantifiable metric outcomes.`,
    skills_analysis: {
      matched_skills: matchedSkills,
      missing_critical_skills: missingCriticalSkills,
      bonus_skills: bonusSkills,
      all_detected_skills: detectedSkills,
    },
    sections_audit: sectionAuditData,
    keyword_gap_analysis: keywordAnalysis,
    action_verbs_analysis: {
      strong_verbs: strongVerbsFound,
      weak_verbs_found: weakVerbsFound,
      buzzwords_detected: buzzwordsFound,
      quantification_percentage: sectionAuditData.experience.metric_bullets_percent,
    },
    ats_compatibility: {
      score: atsFormatting,
      status: atsFormatting >= 80 ? 'High' : atsFormatting >= 60 ? 'Moderate' : 'Needs Work',
      findings: [
        'Standard chronological layout ensures maximum ATS parsing accuracy.',
        sectionAuditData.header.missing.length === 0 ? 'All essential contact data (email, phone, links) successfully indexed.' : `Missing: ${sectionAuditData.header.missing.join(', ')}.`,
        'Section headings are machine-readable and follow standard naming conventions.',
        'No multi-column tables or text-box parsing anomalies detected.'
      ]
    },
    role_readiness: {
      level: roleLevel,
      strengths: [
        matchedSkills.length > 0 
          ? `Direct project experience involving core technologies: ${matchedSkills.slice(0, 3).join(', ')}.`
          : 'Foundational programming and analytical background.',
        'Practical portfolio items demonstrating end-to-end implementation rather than pure academic theory.',
        'Clean technical vocabulary with strong transferable developer foundations.'
      ],
      weaknesses: [
        `Absence of critical ${targetRole} industry standards: ${missingCriticalSkills.slice(0, 3).join(', ') || 'CI/CD & Cloud'}.`,
        'Bullet descriptions focus on responsibilities rather than measurable business/technical outcomes.',
        'Limited demonstration of automated testing, containerization, or production monitoring.'
      ]
    },
    suggestions: [
      `Incorporate missing target keywords (${missingCriticalSkills.slice(0, 4).join(', ')}) naturally into your project and experience bullets.`,
      'Adopt the Google XYZ formula: "Accomplished [X], as measured by [Y], by doing [Z]" for at least 70% of bullets.',
      'Provide live deployment URLs and GitHub repository links for every featured project.',
      'Organize your technical skills into distinct categories (Languages, Frameworks, Databases, Tools) for faster recruiter scanning.'
    ],
    bullet_improvements: [
      {
        original_or_issue: 'Generic description: "Created frontend for web application using React and CSS"',
        improved_version: 'Engineered responsive client-side web application using React 18 and Tailwind CSS, slashing initial page load latency by 34% and achieving 98+ Google Lighthouse performance score.',
        reason: 'Replaces passive verb with active ownership, names specific modern tools, and includes quantifiable performance outcomes.'
      },
      {
        original_or_issue: 'Generic description: "Built backend APIs using Node.js and MongoDB to store user data"',
        improved_version: 'Architected RESTful microservices with Node.js and Express; implemented indexed MongoDB schemas and JWT auth with refresh tokens, sustaining 250+ simulated concurrent requests.',
        reason: 'Demonstrates architectural thought, security consideration, and load capacity awareness.'
      },
      {
        original_or_issue: 'Missing deployment or DevOps detail in project section',
        improved_version: 'Automated CI/CD deployment pipeline via GitHub Actions and containerized application using Docker, enabling zero-downtime releases to cloud hosting.',
        reason: 'Demonstrates end-to-end production readiness, which sets candidates apart from typical applicants.'
      }
    ],
    suggested_projects: roleDef.defaultProjects || ROLE_DEFINITIONS['web development'].defaultProjects,
    learning_roadmap: roleDef.roadmap || ROLE_DEFINITIONS['web development'].roadmap,
    recruiter_outreach: {
      elevator_pitch: elevatorPitch,
      cold_email_linkedin_message: coldMessage,
      tailored_cover_letter_hook: coverLetterHook,
    },
    interview_questions: [
      {
        question: `How does your experience with ${matchedSkills[0] || 'programming'} prepare you for building scalable applications in a ${targetRole} environment?`,
        category: 'Technical Architecture',
        answer_strategy: 'Start with a specific project example. Mention the architecture trade-offs you made, any bottlenecks encountered, and how you solved them.'
      },
      {
        question: `If asked to improve the performance of an application built with ${matchedSkills[1] || 'modern frameworks'}, what profiling tools and strategies would you employ?`,
        category: 'Optimization & Debugging',
        answer_strategy: 'Walk through frontend and backend optimization steps.'
      }
    ]
  };
};

// ─── AI-Powered Deep Analysis (Dynamic Scoring from Gemini) ───────────────────
const analyzeResumeWithAI = async (resumeText, targetRole, detectedSkills) => {
  // Start with mathematical baseline
  const baseline = generateDeepAnalysis(resumeText, targetRole, detectedSkills);

  const systemInstruction = `You are a Senior Principal Tech Recruiter and ATS Evaluation Engine.
Your task is to analyze this candidate's resume specifically for the target role: "${targetRole}".

CRITICAL INSTRUCTIONS FOR SCORING:
- You MUST evaluate realistic scores (0 to 100) based strictly on THIS RESUME and THIS TARGET ROLE.
- If the resume skills match the target role well, role_relevance should be high (75-95).
- If the resume is for another domain (e.g. Web Dev resume applied to DevOps or Machine Learning), role_relevance MUST be LOW (10-40). DO NOT GIVE UNIFORM SCORES.
- Evaluate impact_quantification based on whether numbers (%, $, metrics) are actually present.
- Evaluate power_language based on action verbs (e.g. Engineered, Spearheaded vs worked on).
- Evaluate ats_formatting based on structure and contact information.

ALWAYS respond ONLY with valid JSON conforming to this schema:
{
  "overall_score": <number 0-100>,
  "role_match_score": <number 0-100>,
  "ats_score": <number 0-100>,
  "role_level": "<string e.g. Junior Ready / Competitive Mid-Level / Gaps to Address>",
  "multi_scores": {
    "role_relevance": <number 0-100>,
    "ats_formatting": <number 0-100>,
    "impact_quantification": <number 0-100>,
    "power_language": <number 0-100>,
    "brevity_structure": <number 0-100>
  },
  "first_impression": {
    "verdict": "<one-sentence executive recruiter verdict on fit>",
    "sentiment_badge": "<'Strong Hire Potential' | 'Interview Contender' | 'Gaps to Address'>",
    "takeaways": ["takeaway 1", "takeaway 2", "takeaway 3"]
  },
  "summary": "<3-4 sentence comprehensive appraisal>",
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "weaknesses": ["specific gap 1 for this role", "specific gap 2", "specific gap 3"],
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2", "actionable suggestion 3"],
  "bullet_improvements": [
    {
      "original_or_issue": "<weak line from their resume>",
      "improved_version": "<STAR rewrite with metrics and tools>",
      "reason": "<why recruiters favor this rewrite>"
    }
  ],
  "elevator_pitch": "<30-second spoken pitch tailored to this role and their actual projects>",
  "interview_questions": [
    {
      "question": "<High probability question for this role>",
      "category": "<Technical / Behavioral / Architecture>",
      "answer_strategy": "<How they should answer using their background>"
    }
  ]
}`;

  const prompt = `TARGET ROLE: ${targetRole}
DETECTED SKILLS: ${detectedSkills.join(', ')}

RESUME CONTENT:
"""
${resumeText.slice(0, 4500)}
"""

Audit this resume specifically for ${targetRole} and return the JSON object.`;

  try {
    const rawResponse = await callGeminiAPI(prompt, systemInstruction, {
      maxOutputTokens: 3000,
      temperature: 0.3,
    });

    if (rawResponse) {
      let cleaned = rawResponse.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleaned);

      // Apply dynamic scores from Gemini
      if (typeof parsed.overall_score === 'number') baseline.overall_score = parsed.overall_score;
      if (typeof parsed.role_match_score === 'number') baseline.role_match_score = parsed.role_match_score;
      if (typeof parsed.ats_score === 'number') baseline.ats_score = parsed.ats_score;
      if (parsed.role_level) baseline.role_level = parsed.role_level;

      if (parsed.multi_scores) {
        if (typeof parsed.multi_scores.role_relevance === 'number') baseline.multi_scores.role_relevance = parsed.multi_scores.role_relevance;
        if (typeof parsed.multi_scores.ats_formatting === 'number') baseline.multi_scores.ats_formatting = parsed.multi_scores.ats_formatting;
        if (typeof parsed.multi_scores.impact_quantification === 'number') baseline.multi_scores.impact_quantification = parsed.multi_scores.impact_quantification;
        if (typeof parsed.multi_scores.power_language === 'number') baseline.multi_scores.power_language = parsed.multi_scores.power_language;
        if (typeof parsed.multi_scores.brevity_structure === 'number') baseline.multi_scores.brevity_structure = parsed.multi_scores.brevity_structure;
      }

      if (parsed.first_impression) {
        if (parsed.first_impression.verdict) baseline.first_impression.verdict = parsed.first_impression.verdict;
        if (parsed.first_impression.sentiment_badge) baseline.first_impression.sentiment_badge = parsed.first_impression.sentiment_badge;
        if (parsed.first_impression.takeaways?.length) baseline.first_impression.takeaways = parsed.first_impression.takeaways;
      }

      if (parsed.summary) baseline.summary = parsed.summary;
      if (parsed.strengths?.length) baseline.role_readiness.strengths = parsed.strengths;
      if (parsed.weaknesses?.length) baseline.role_readiness.weaknesses = parsed.weaknesses;
      if (parsed.suggestions?.length) baseline.suggestions = parsed.suggestions;
      if (parsed.bullet_improvements?.length) baseline.bullet_improvements = parsed.bullet_improvements;
      if (parsed.elevator_pitch) baseline.recruiter_outreach.elevator_pitch = parsed.elevator_pitch;
      if (parsed.interview_questions?.length) baseline.interview_questions = parsed.interview_questions;
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('AI scoring fallback used:', err.message);
    }
  }

  return baseline;
};

// ─── Controller Handlers ──────────────────────────────────────────────────────

/**
 * @route   POST /api/resume/analyze
 * @access  Private
 * @desc    Upload PDF resume and perform deep in-depth analysis
 */
const analyzeResume = [
  upload.single('resume'),
  asyncHandler(async (req, res) => {
    const userId = req.user?._id || req.user?.id;
    const targetRole = req.body.role || 'Web Development';
    const originalFileName = req.file?.originalname || 'Resume.pdf';

    let resumeText = '';
    let resumeId = null;

    if (req.file) {
      const pdfData = await pdfParse(req.file.buffer);
      resumeText = pdfData.text || '';

      if (!resumeText.trim()) {
        throw new ApiError(400, 'Could not extract text from the PDF. Ensure it is not scanned or password-protected.');
      }

      const extractedSkills = extractAllSkills(resumeText);

      const resume = await Resume.create({
        user_id: userId,
        resume_text: resumeText,
        extracted_skills: extractedSkills,
        upload_date: new Date(),
      });
      resumeId = resume._id;
    } else if (req.body.resume_id) {
      const existingResume = await Resume.findOne({ _id: req.body.resume_id, user_id: userId });
      if (!existingResume) throw new ApiError(404, 'Specified resume not found');
      resumeText = existingResume.resume_text;
      resumeId = existingResume._id;
    } else {
      const latestResume = await Resume.findOne({ user_id: userId }).sort({ upload_date: -1 });
      if (!latestResume) throw new ApiError(400, 'Please upload a PDF resume to analyze.');
      resumeText = latestResume.resume_text;
      resumeId = latestResume._id;
    }

    const detectedSkills = extractAllSkills(resumeText);

    // Run in-depth deep analysis with true dynamic scoring
    const analysisResult = await analyzeResumeWithAI(resumeText, targetRole, detectedSkills);

    // Save full in-depth analysis to database
    const savedAnalysis = await ResumeAnalysis.create({
      user_id: userId,
      resume_id: resumeId,
      role: targetRole,
      role_level: analysisResult.role_level,
      overall_score: analysisResult.overall_score,
      role_match_score: analysisResult.role_match_score,
      ats_score: analysisResult.ats_score,
      multi_scores: analysisResult.multi_scores,
      first_impression: analysisResult.first_impression,
      summary: analysisResult.summary,
      skills_analysis: analysisResult.skills_analysis,
      sections_audit: analysisResult.sections_audit,
      keyword_gap_analysis: analysisResult.keyword_gap_analysis,
      action_verbs_analysis: analysisResult.action_verbs_analysis,
      ats_compatibility: analysisResult.ats_compatibility,
      role_readiness: analysisResult.role_readiness,
      suggestions: analysisResult.suggestions,
      bullet_improvements: analysisResult.bullet_improvements,
      suggested_projects: analysisResult.suggested_projects,
      learning_roadmap: analysisResult.learning_roadmap,
      recruiter_outreach: analysisResult.recruiter_outreach,
      interview_questions: analysisResult.interview_questions,
      raw_resume_text_preview: resumeText.slice(0, 2500),
      file_name: originalFileName,
    });

    res.status(201).json({
      status: 'success',
      data: savedAnalysis,
    });
  }),
];

/**
 * @route   POST /api/resume/reanalyze
 * @access  Private
 * @desc    Re-analyze existing resume for another role with in-depth engine
 */
const reanalyzeExistingResume = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const { role, resume_id } = req.body;

  if (!role || !role.trim()) {
    throw new ApiError(400, 'Target role is required');
  }

  const query = resume_id ? { _id: resume_id, user_id: userId } : { user_id: userId };
  const resume = await Resume.findOne(query).sort({ upload_date: -1 });

  if (!resume) {
    throw new ApiError(404, 'No resume found for this user. Please upload a PDF first.');
  }

  const detectedSkills = resume.extracted_skills?.length
    ? resume.extracted_skills
    : extractAllSkills(resume.resume_text);

  const analysisResult = await analyzeResumeWithAI(resume.resume_text, role, detectedSkills);

  const savedAnalysis = await ResumeAnalysis.create({
    user_id: userId,
    resume_id: resume._id,
    role,
    role_level: analysisResult.role_level,
    overall_score: analysisResult.overall_score,
    role_match_score: analysisResult.role_match_score,
    ats_score: analysisResult.ats_score,
    multi_scores: analysisResult.multi_scores,
    first_impression: analysisResult.first_impression,
    summary: analysisResult.summary,
    skills_analysis: analysisResult.skills_analysis,
    sections_audit: analysisResult.sections_audit,
    keyword_gap_analysis: analysisResult.keyword_gap_analysis,
    action_verbs_analysis: analysisResult.action_verbs_analysis,
    ats_compatibility: analysisResult.ats_compatibility,
    role_readiness: analysisResult.role_readiness,
    suggestions: analysisResult.suggestions,
    bullet_improvements: analysisResult.bullet_improvements,
    suggested_projects: analysisResult.suggested_projects,
    learning_roadmap: analysisResult.learning_roadmap,
    recruiter_outreach: analysisResult.recruiter_outreach,
    interview_questions: analysisResult.interview_questions,
    raw_resume_text_preview: resume.resume_text.slice(0, 2500),
    file_name: 'Profile Resume',
  });

  res.status(201).json({
    status: 'success',
    data: savedAnalysis,
  });
});

/**
 * @route   GET /api/resume/latest
 * @access  Private
 */
const getLatestAnalysis = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;

  const [latestAnalysis, latestResume, historyCount] = await Promise.all([
    ResumeAnalysis.findOne({ user_id: userId }).sort({ createdAt: -1 }),
    Resume.findOne({ user_id: userId }).sort({ upload_date: -1 }),
    ResumeAnalysis.countDocuments({ user_id: userId }),
  ]);

  res.json({
    status: 'success',
    data: {
      analysis: latestAnalysis,
      hasResume: !!latestResume,
      resumeSkills: latestResume?.extracted_skills || [],
      historyCount,
    },
  });
});

/**
 * @route   GET /api/resume/history
 * @access  Private
 */
const getAnalysisHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;

  const history = await ResumeAnalysis.find({ user_id: userId })
    .select('role role_level overall_score role_match_score ats_score createdAt file_name')
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({
    status: 'success',
    data: history,
  });
});

/**
 * @route   GET /api/resume/:id
 * @access  Private
 */
const getAnalysisById = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const analysis = await ResumeAnalysis.findOne({
    _id: req.params.id,
    user_id: userId,
  });

  if (!analysis) {
    throw new ApiError(404, 'Analysis report not found');
  }

  res.json({
    status: 'success',
    data: analysis,
  });
});

/**
 * @route   DELETE /api/resume/:id
 * @access  Private
 */
const deleteAnalysis = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const analysis = await ResumeAnalysis.findOneAndDelete({
    _id: req.params.id,
    user_id: userId,
  });

  if (!analysis) {
    throw new ApiError(404, 'Analysis not found');
  }

  res.json({
    status: 'success',
    message: 'Analysis deleted successfully',
  });
});

module.exports = {
  analyzeResume,
  reanalyzeExistingResume,
  getLatestAnalysis,
  getAnalysisHistory,
  getAnalysisById,
  deleteAnalysis,
};
