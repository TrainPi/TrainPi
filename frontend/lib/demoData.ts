/**
 * Static demo data for the full application flow (client demo / mock mode).
 * Every operation displays relevant data when backend is disconnected.
 */

export const DEMO_CAREERS = [
  {
    id: 'Cybersecurity Analyst',
    description: 'Monitor, investigate, and respond to security threats inside an organization. Work in SOC environments handling phishing alerts, endpoint detections, MFA events, and incident documentation.',
    skills: ['Incident Response', 'Log Analysis', 'MFA/IAM Triage', 'SIEM Navigation', 'Threat Investigation'],
  },
  {
    id: 'SOC Analyst',
    description: 'Tier 1/2 security operations center analyst. Triage alert queues, investigate suspicious logins, execute response playbooks, and document tickets with escalation recommendations.',
    skills: ['Alert Triage', 'Ticket Escalation', 'Endpoint Detection', 'Phishing Investigation', 'Shift Handoff Documentation'],
  },
  {
    id: 'IT Support to Cyber Transition',
    description: 'Leverage existing IT support, Windows administration, and help desk experience to transition into a cybersecurity analyst or SOC analyst role.',
    skills: ['Help Desk Foundations', 'Windows Administration', 'Security Fundamentals', 'Network Basics', 'Access Management'],
  },
  {
    id: 'IAM Specialist',
    description: 'Manage user identity lifecycles, review access anomalies, administer MFA, and enforce least-privilege access policies across an enterprise environment.',
    skills: ['Active Directory', 'MFA Administration', 'Access Reviews', 'Privileged Access Management', 'Identity Governance'],
  },
  {
    id: 'AI Business Analyst',
    description: 'Bridge cybersecurity and AI — translate operational security needs into AI tool requirements, document workflows, and evaluate AI-driven security solutions.',
    skills: ['Requirements Gathering', 'Process Documentation', 'Security Workflow Mapping', 'AI Tool Evaluation', 'Stakeholder Communication'],
  },
] as const

export const DEMO_WEEKLY_GOALS = [2, 3, 5] as const

/** Base stats when no career selected (for first-time demo) */
export const DEMO_STATS = {
  career_path: null as string | null,
  roadmap_completion: 0,
  skills_acquired: 0,
  skills_required: 10,
  courses_enrolled: 0,
  courses_completed: 0,
  lessons_in_progress: 0,
  lessons_completed: 0,
  resume_score: null as number | null,
  last_resume_update: null as string | null,
  weekly_goals: [
    'Complete career discovery',
    'Set a weekly goal',
    'Start your first lesson',
  ],
  suggested_next_steps: [
    'Complete career discovery to find your path',
    'Set a weekly goal',
    'Start your first learning module',
  ],
  exceptions: [] as any[],
}

/**
 * Rich demo stats when career is selected — makes dashboard and job-readiness look active.
 */
export function getDemoStatsWithSelections(careerPath: string | null, weeklyGoal: number) {
  const hasCareer = !!careerPath
  return {
    ...DEMO_STATS,
    career_path: careerPath,
    roadmap_completion: hasCareer ? 85 : 0,
    skills_acquired: hasCareer ? 5 : 0,
    skills_required: 10,
    courses_enrolled: hasCareer ? 2 : 0,
    courses_completed: hasCareer ? 1 : 0,
    lessons_in_progress: hasCareer ? 2 : 0,
    lessons_completed: hasCareer ? 8 : 0,
    resume_score: hasCareer ? 78 : null,
    last_resume_update: hasCareer ? '2025-01-15' : null,
    weekly_goals: [
      `Complete ${weeklyGoal} lessons this week`,
      'Update career profile',
      'Finish next roadmap step',
    ],
    suggested_next_steps: hasCareer
      ? [
          `Continue with step 2 of your ${careerPath} roadmap`,
          'Practice a phishing investigation scenario',
          'Review MFA/IAM alert triage workflow',
        ]
      : DEMO_STATS.suggested_next_steps,
    exceptions: hasCareer ? getDemoExceptions() : [],
  }
}

/** Demo exceptions for Exceptions page and dashboard (client demo) */
export function getDemoExceptions() {
  const now = new Date()
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
  return [
    {
      id: 1,
      type: 'Training',
      status: 'exception',
      createdAt: twoDaysAgo.toISOString(),
      created_at: twoDaysAgo.toISOString(),
      remarks: 'Pending completion of safety module.',
      duration_seconds: null as number | null,
      clearedAt: undefined as string | undefined,
    },
    {
      id: 2,
      type: 'Compliance',
      status: 'exception',
      createdAt: oneDayAgo.toISOString(),
      created_at: oneDayAgo.toISOString(),
      remarks: 'Awaiting manager approval.',
      duration_seconds: null,
      clearedAt: undefined,
    },
  ]
}

export const DEMO_ROADMAP_STEPS = [
  'SOC Environment & Analyst Role Orientation',
  'Phishing Investigation Workflow',
  'MFA & IAM Concepts in Practice',
  'Ticket Triage & Escalation Procedures',
  'Incident Response Process',
  'Log Analysis & SIEM Fundamentals',
  'Operational Readiness Assessment',
]

/** Full step objects for roadmap view (client demo) */
export const DEMO_ROADMAP_STEPS_FULL = [
  {
    step_number: 1,
    title: 'SOC Environment & Analyst Role Orientation',
    description: 'Understand how a Security Operations Center is structured, what analysts do on each shift, how alerts flow from detection tools into the ticketing system, and how teams communicate during investigations. This step builds the organizational context that everything else depends on.',
    skills: ['SOC structure', 'Alert workflow', 'Analyst responsibilities', 'Shift handoff documentation'],
    resources: [{ name: 'TrainPi guided lesson: SOC Environment Overview', url: 'trainpi://guided/soc-environment-overview' }],
    estimated_time: '1–2 weeks',
  },
  {
    step_number: 2,
    title: 'Phishing Investigation Workflow',
    description: 'Learn how analysts investigate phishing alerts end-to-end — from the initial alert or user report, through email header analysis, domain and IP reputation checks, identifying indicators of compromise, containing the threat, and documenting the ticket. Understand when to escalate and what evidence to preserve.',
    skills: ['Email header analysis', 'IOC identification', 'Containment steps', 'Incident ticket documentation'],
    resources: [{ name: 'TrainPi guided lesson: Phishing Investigation Workflow', url: 'trainpi://guided/phishing-investigation-workflow' }],
    estimated_time: '2–3 weeks',
  },
  {
    step_number: 3,
    title: 'MFA & IAM Concepts in Practice',
    description: 'Understand identity and access management from an operational security perspective — suspicious login triage, MFA fatigue attacks, credential compromise indicators, and how IAM events show up in security alerts. Learn what an analyst investigates when an MFA alert fires.',
    skills: ['Suspicious login triage', 'MFA fatigue recognition', 'Credential compromise response', 'Identity workflow triage'],
    resources: [{ name: 'TrainPi guided lesson: MFA and IAM Security Workflows', url: 'trainpi://guided/mfa-iam-security-workflows' }],
    estimated_time: '2 weeks',
  },
  {
    step_number: 4,
    title: 'Ticket Triage & Escalation Procedures',
    description: 'Master the operational mechanics of SOC ticketing — how to classify alert severity, what information belongs in a ticket, escalation criteria, how to write analyst notes that the next tier can act on, and how to communicate urgency without overloading the escalation path.',
    skills: ['Severity classification', 'Escalation criteria', 'Analyst notes standards', 'Ticket lifecycle management'],
    resources: [{ name: 'TrainPi guided lesson: SOC Ticket Triage and Escalation', url: 'trainpi://guided/soc-ticket-triage-escalation' }],
    estimated_time: '1–2 weeks',
  },
  {
    step_number: 5,
    title: 'Incident Response Process',
    description: 'Understand the full incident response lifecycle — detection, containment, eradication, recovery, and post-incident documentation. Learn what containment looks like for different threat types (endpoint malware vs. credential compromise vs. phishing campaign) and why documentation quality matters for legal and compliance reasons.',
    skills: ['IR lifecycle phases', 'Containment strategies', 'Eradication steps', 'Post-incident reporting'],
    resources: [{ name: 'TrainPi guided lesson: Incident Response Fundamentals', url: 'trainpi://guided/incident-response-fundamentals' }],
    estimated_time: '2–3 weeks',
  },
  {
    step_number: 6,
    title: 'Log Analysis & SIEM Fundamentals',
    description: 'Learn to read and interpret the logs that security analysts work with daily — Windows event logs, authentication logs, firewall logs, and endpoint detection telemetry. Understand what normal looks like so anomalies stand out, and how SIEM platforms surface these logs in alert dashboards.',
    skills: ['Windows event log reading', 'Authentication log analysis', 'SIEM alert navigation', 'Anomaly identification'],
    resources: [{ name: 'TrainPi guided lesson: Log Analysis for SOC Analysts', url: 'trainpi://guided/log-analysis-soc-analysts' }],
    estimated_time: '2–3 weeks',
  },
  {
    step_number: 7,
    title: 'Operational Readiness Assessment',
    description: 'Synthesize everything into a self-assessment of your operational readiness. Walk through scenario-based exercises covering the full analyst workflow — from receiving an alert to closing the ticket. Identify your remaining gaps and build a targeted plan for closing them before applying for roles.',
    skills: ['Scenario-based assessment', 'Gap identification', 'Readiness scoring', 'Job application preparation'],
    resources: [{ name: 'TrainPi guided lesson: Operational Readiness Self-Assessment', url: 'trainpi://guided/operational-readiness-assessment' }],
    estimated_time: '1–2 weeks',
  },
]

/** Demo resumes for profile/job-readiness (mock) */
export const DEMO_RESUMES = [
  {
    id: 1,
    filename: 'John_Doe_Resume.pdf',
    url: '/uploads/demo-resume.pdf',
    created_at: '2025-01-15',
    score: 78,
  },
]
