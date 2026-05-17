/**
 * Demo data for the full TrainPi flow (client demo / mock mode).
 *
 * Everything here drives the operational-readiness experience when the backend
 * is disconnected — careers, roadmap, readiness score, scenarios, workflows,
 * dashboard stats, exceptions, resumes.
 */

// ──────────────────────────────────────────────────────────────────────────
// CAREER PATHS (operational, role-specific — not generic SWE/Data)
// ──────────────────────────────────────────────────────────────────────────

export const DEMO_CAREERS = [
  {
    id: 'Cybersecurity Analyst',
    description:
      'Monitor, investigate, and respond to security threats inside an organization. Work in SOC environments handling phishing alerts, endpoint detections, MFA events, and incident documentation.',
    skills: ['Incident Response', 'Log Analysis', 'MFA/IAM Triage', 'SIEM Navigation', 'Threat Investigation'],
  },
  {
    id: 'SOC Analyst',
    description:
      'Tier 1/2 security operations center analyst. Triage alert queues, investigate suspicious logins, execute response playbooks, and document tickets with escalation recommendations.',
    skills: ['Alert Triage', 'Ticket Escalation', 'Endpoint Detection', 'Phishing Investigation', 'Shift Handoff Documentation'],
  },
  {
    id: 'IT Support to Cyber Transition',
    description:
      'Leverage existing IT support, Windows administration, and help desk experience to transition into a cybersecurity analyst or SOC analyst role.',
    skills: ['Help Desk Foundations', 'Windows Administration', 'Security Fundamentals', 'Network Basics', 'Access Management'],
  },
  {
    id: 'IAM Specialist',
    description:
      'Manage user identity lifecycles, review access anomalies, administer MFA, and enforce least-privilege access policies across an enterprise environment.',
    skills: ['Active Directory', 'MFA Administration', 'Access Reviews', 'Privileged Access Management', 'Identity Governance'],
  },
  {
    id: 'AI Business Analyst',
    description:
      'Bridge cybersecurity and AI — translate operational security needs into AI tool requirements, document workflows, and evaluate AI-driven security solutions.',
    skills: ['Requirements Gathering', 'Process Documentation', 'Security Workflow Mapping', 'AI Tool Evaluation', 'Stakeholder Communication'],
  },
] as const

export const DEMO_WEEKLY_GOALS = [2, 3, 5] as const

// ──────────────────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ──────────────────────────────────────────────────────────────────────────

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
  readiness_level: 'Beginner' as ReadinessLevel,
  readiness_score: 28,
  weekly_goals: [
    'Complete career discovery',
    'Set a weekly goal',
    'Start your first lesson',
  ],
  suggested_next_steps: [
    'Run the Operational Readiness Score to see where you are',
    'Pick a target role in /career',
    'Try the MFA Fatigue Scenario in /scenarios',
  ],
  exceptions: [] as any[],
}

export function getDemoStatsWithSelections(careerPath: string | null, weeklyGoal: number) {
  const hasCareer = !!careerPath
  return {
    ...DEMO_STATS,
    career_path: careerPath,
    roadmap_completion: hasCareer ? 64 : 0,
    skills_acquired: hasCareer ? 6 : 0,
    skills_required: 10,
    courses_enrolled: hasCareer ? 3 : 0,
    courses_completed: hasCareer ? 1 : 0,
    lessons_in_progress: hasCareer ? 2 : 0,
    lessons_completed: hasCareer ? 11 : 0,
    resume_score: hasCareer ? 78 : null,
    last_resume_update: hasCareer ? '2026-04-22' : null,
    readiness_level: hasCareer ? ('Developing' as ReadinessLevel) : ('Beginner' as ReadinessLevel),
    readiness_score: hasCareer ? 62 : 28,
    current_roadmap_step: hasCareer ? DEMO_ROADMAP_STEPS_FULL[2] : null,
    roadmap_id: hasCareer ? 1 : null,
    weekly_goals: [
      `Complete ${weeklyGoal} lessons this week`,
      'Run one operational scenario (phishing or MFA)',
      'Update profile + readiness score',
    ],
    suggested_next_steps: hasCareer
      ? [
          `Continue Step 3 of your ${careerPath} roadmap (MFA & IAM)`,
          'Run the MFA Fatigue Scenario in /scenarios',
          'Review the SOC Ticket Triage workflow',
        ]
      : DEMO_STATS.suggested_next_steps,
    exceptions: hasCareer ? getDemoExceptions() : [],
  }
}

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
      remarks: 'Pending completion of MFA/IAM module.',
      duration_seconds: null as number | null,
      clearedAt: undefined as string | undefined,
    },
    {
      id: 2,
      type: 'Compliance',
      status: 'exception',
      createdAt: oneDayAgo.toISOString(),
      created_at: oneDayAgo.toISOString(),
      remarks: 'Awaiting manager approval for scenario practice.',
      duration_seconds: null,
      clearedAt: undefined,
    },
  ]
}

// ──────────────────────────────────────────────────────────────────────────
// ROADMAP STEPS (operational progression)
// ──────────────────────────────────────────────────────────────────────────

export const DEMO_ROADMAP_STEPS = [
  'SOC Environment & Analyst Role Orientation',
  'Phishing Investigation Workflow',
  'MFA & IAM Concepts in Practice',
  'Ticket Triage & Escalation Procedures',
  'Incident Response Process',
  'Log Analysis & SIEM Fundamentals',
  'Operational Readiness Assessment',
]

export const DEMO_ROADMAP_STEPS_FULL = [
  {
    step_number: 1,
    title: 'SOC Environment & Analyst Role Orientation',
    description:
      'Understand how a Security Operations Center is structured, what analysts do on each shift, how alerts flow from detection tools into the ticketing system, and how teams communicate during investigations. This step builds the organizational context that everything else depends on.',
    skills: ['SOC structure', 'Alert workflow', 'Analyst responsibilities', 'Shift handoff documentation'],
    resources: [{ name: 'TrainPi guided lesson: SOC Environment Overview', url: 'trainpi://guided/soc-environment-overview' }],
    estimated_time: '1–2 weeks',
    status: 'completed' as const,
  },
  {
    step_number: 2,
    title: 'Phishing Investigation Workflow',
    description:
      'Learn how analysts investigate phishing alerts end-to-end — from the initial alert or user report, through email header analysis, domain and IP reputation checks, identifying indicators of compromise, containing the threat, and documenting the ticket.',
    skills: ['Email header analysis', 'IOC identification', 'Containment steps', 'Incident ticket documentation'],
    resources: [{ name: 'TrainPi guided lesson: Phishing Investigation Workflow', url: 'trainpi://guided/phishing-investigation-workflow' }],
    estimated_time: '2–3 weeks',
    status: 'completed' as const,
  },
  {
    step_number: 3,
    title: 'MFA & IAM Concepts in Practice',
    description:
      'Understand identity and access management from an operational security perspective — suspicious login triage, MFA fatigue attacks, credential compromise indicators, and how IAM events show up in security alerts. Learn what an analyst investigates when an MFA alert fires.',
    skills: ['Suspicious login triage', 'MFA fatigue recognition', 'Credential compromise response', 'Identity workflow triage'],
    resources: [{ name: 'TrainPi guided lesson: MFA and IAM Security Workflows', url: 'trainpi://guided/mfa-iam-security-workflows' }],
    estimated_time: '2 weeks',
    status: 'in_progress' as const,
  },
  {
    step_number: 4,
    title: 'Ticket Triage & Escalation Procedures',
    description:
      'Master the operational mechanics of SOC ticketing — how to classify alert severity, what information belongs in a ticket, escalation criteria, how to write analyst notes that the next tier can act on.',
    skills: ['Severity classification', 'Escalation criteria', 'Analyst notes standards', 'Ticket lifecycle management'],
    resources: [{ name: 'TrainPi guided lesson: SOC Ticket Triage and Escalation', url: 'trainpi://guided/soc-ticket-triage-escalation' }],
    estimated_time: '1–2 weeks',
    status: 'upcoming' as const,
  },
  {
    step_number: 5,
    title: 'Incident Response Process',
    description:
      'Understand the full incident response lifecycle — detection, containment, eradication, recovery, and post-incident documentation. Learn what containment looks like for different threat types and why documentation quality matters for legal and compliance reasons.',
    skills: ['IR lifecycle phases', 'Containment strategies', 'Eradication steps', 'Post-incident reporting'],
    resources: [{ name: 'TrainPi guided lesson: Incident Response Fundamentals', url: 'trainpi://guided/incident-response-fundamentals' }],
    estimated_time: '2–3 weeks',
    status: 'upcoming' as const,
  },
  {
    step_number: 6,
    title: 'Log Analysis & SIEM Fundamentals',
    description:
      'Learn to read and interpret the logs that security analysts work with daily — Windows event logs, authentication logs, firewall logs, and endpoint detection telemetry. Understand what normal looks like so anomalies stand out.',
    skills: ['Windows event log reading', 'Authentication log analysis', 'SIEM alert navigation', 'Anomaly identification'],
    resources: [{ name: 'TrainPi guided lesson: Log Analysis for SOC Analysts', url: 'trainpi://guided/log-analysis-soc-analysts' }],
    estimated_time: '2–3 weeks',
    status: 'upcoming' as const,
  },
  {
    step_number: 7,
    title: 'Operational Readiness Assessment',
    description:
      'Synthesize everything into a self-assessment of your operational readiness. Walk through scenario-based exercises covering the full analyst workflow — from receiving an alert to closing the ticket. Identify your remaining gaps and build a targeted plan for closing them before applying for roles.',
    skills: ['Scenario-based assessment', 'Gap identification', 'Readiness scoring', 'Job application preparation'],
    resources: [{ name: 'TrainPi guided lesson: Operational Readiness Self-Assessment', url: 'trainpi://guided/operational-readiness-assessment' }],
    estimated_time: '1–2 weeks',
    status: 'upcoming' as const,
  },
]

// ──────────────────────────────────────────────────────────────────────────
// RESUMES
// ──────────────────────────────────────────────────────────────────────────

export const DEMO_RESUMES = [
  {
    id: 1,
    filename: 'Demo_Resume.pdf',
    url: '/uploads/demo-resume.pdf',
    created_at: '2026-04-22',
    score: 78,
  },
]

/** Operational-readiness style resume analysis (matches resume.py spec) */
export function getDemoResumeAnalysis(careerPath: string | null) {
  const role = careerPath || 'SOC Analyst'
  return {
    recommended_career: role,
    skills_found: [
      'Windows administration',
      'Phishing awareness',
      'Help desk fundamentals',
      'Endpoint troubleshooting',
      'Active Directory basics',
    ],
    match_score: 72,
    summary:
      'Strong IT-support foundation with confirmed phishing/malware awareness and Windows fluency. Operational background is helpdesk-leaning; security workflow exposure is limited but the analyst mindset is present.',
    operational_readiness_level: 'Developing' as ReadinessLevel,
    operational_strengths: [
      'Understands phishing user-behavior from end-user support work',
      'Windows event-log familiarity from troubleshooting incidents',
      'Comfortable with ticketing systems and analyst-style documentation',
    ],
    operational_gaps: [
      'No Linux CLI experience for log/process investigation',
      'No SIEM or structured log analysis exposure',
      'No MFA/IAM alert triage experience',
      'No incident-ticket documentation in a security context',
    ],
    priority_gap:
      'Linux operational fluency — without it, you cannot run the basic log/process pivots a SOC analyst executes during phishing or credential-compromise investigations.',
  }
}

// ──────────────────────────────────────────────────────────────────────────
// OPERATIONAL READINESS SCORE
// ──────────────────────────────────────────────────────────────────────────

export type ReadinessLevel = 'Beginner' | 'Developing' | 'Operational'

export type ReadinessDimension = {
  key: string
  label: string
  description: string
  score: number // 0-100
  level: ReadinessLevel
  evidence: string[]
  next_action: string
}

export function getDemoReadinessReport(careerPath: string | null): {
  overall_score: number
  overall_level: ReadinessLevel
  target_role: string
  last_updated: string
  summary: string
  dimensions: ReadinessDimension[]
  priority_gap: string
  recommended_next_steps: string[]
} {
  const role = careerPath || 'SOC Analyst'
  return {
    overall_score: 62,
    overall_level: 'Developing',
    target_role: role,
    last_updated: '2026-05-12',
    summary:
      'You are at early SOC Analyst preparation level — not pure beginner. You already demonstrate cybersecurity thinking but lack hands-on Linux/SIEM exposure and MFA-IAM triage practice.',
    dimensions: [
      {
        key: 'identity_iam',
        label: 'Identity & MFA Triage',
        description:
          'Can you triage suspicious logins, MFA fatigue, and impossible-travel alerts?',
        score: 42,
        level: 'Developing',
        evidence: [
          'Understands MFA concept from end-user perspective',
          'No exposure to MFA fatigue attack patterns',
          'No experience reviewing IAM/login audit logs',
        ],
        next_action: 'Run the MFA Fatigue scenario in /scenarios and read the IAM workflow.',
      },
      {
        key: 'phishing',
        label: 'Phishing Investigation',
        description:
          'Can you walk a phishing alert from detection through containment and ticket closure?',
        score: 71,
        level: 'Developing',
        evidence: [
          'Strong end-user phishing awareness',
          'Understands header/domain reputation concepts',
          'No practice writing analyst notes for escalation',
        ],
        next_action: 'Complete the phishing investigation scenario end-to-end and submit a written ticket.',
      },
      {
        key: 'log_siem',
        label: 'Log Analysis & SIEM',
        description:
          'Can you read Windows event logs, auth logs, and pivot inside a SIEM?',
        score: 38,
        level: 'Beginner',
        evidence: [
          'Familiar with Windows Event Viewer from IT support',
          'No structured log analysis training',
          'No SIEM (Splunk/Sentinel/Elastic) hands-on yet',
        ],
        next_action: 'Walk Step 6 of your roadmap (Log Analysis & SIEM Fundamentals).',
      },
      {
        key: 'ticketing',
        label: 'Ticket Triage & Escalation',
        description:
          'Can you classify severity, write analyst notes, and decide when to escalate?',
        score: 55,
        level: 'Developing',
        evidence: [
          'Comfortable using a ticketing system from help desk',
          'No security-specific severity classification practice',
          'Has not written a Tier 2 handoff note',
        ],
        next_action: 'Read the Ticket Triage workflow and run the triage scenario.',
      },
      {
        key: 'incident_response',
        label: 'Incident Response Process',
        description:
          'Do you know the IR lifecycle and what containment means per threat type?',
        score: 48,
        level: 'Developing',
        evidence: [
          'Conceptual understanding of incident response stages',
          'Has not executed a containment workflow',
          'No post-incident documentation experience',
        ],
        next_action: 'Read the Incident Response workflow and try the containment decision scenario.',
      },
      {
        key: 'linux',
        label: 'Linux Operational Fluency',
        description:
          'Can you read logs and investigate processes on a Linux host?',
        score: 22,
        level: 'Beginner',
        evidence: [
          'No prior Linux experience',
          'Has not used grep / tail / ps / ss / journalctl',
        ],
        next_action: 'This is your priority gap — start with `grep`, `tail`, and `/var/log` orientation.',
      },
    ],
    priority_gap:
      'Linux operational fluency — without it, you cannot run the basic log/process pivots a SOC analyst executes during phishing or credential-compromise investigations.',
    recommended_next_steps: [
      'Open the MFA Fatigue Scenario — it covers your biggest IAM gap in 6 minutes',
      'Walk Step 3 of your roadmap (MFA & IAM Concepts in Practice)',
      'Read the SOC Ticket Triage workflow before your next scenario',
    ],
  }
}

// ──────────────────────────────────────────────────────────────────────────
// SCENARIOS — interactive operational practice
// ──────────────────────────────────────────────────────────────────────────

export type ScenarioChoice = {
  id: string
  label: string
  is_correct: boolean
  rationale: string
}

export type ScenarioStep = {
  step_number: number
  title: string
  narrative: string
  question: string
  choices: ScenarioChoice[]
}

export type Scenario = {
  id: string
  title: string
  category: 'Phishing' | 'MFA / IAM' | 'Ticket Triage' | 'Incident Response' | 'Log Analysis'
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  duration_minutes: number
  role: string
  summary: string
  learning_objectives: string[]
  steps: ScenarioStep[]
}

export const DEMO_SCENARIOS: Scenario[] = [
  {
    id: 'mfa-fatigue',
    title: 'MFA Fatigue at 2 AM',
    category: 'MFA / IAM',
    difficulty: 'Beginner',
    duration_minutes: 6,
    role: 'SOC Analyst',
    summary:
      'A finance user receives 8 MFA push prompts at 2 AM and approves the 9th. The IAM platform fires an alert. Walk the triage from initial alert through containment.',
    learning_objectives: [
      'Recognize MFA fatigue attack patterns',
      'Decide when to revoke sessions vs. just reset credentials',
      'Write a Tier 2 handoff note',
    ],
    steps: [
      {
        step_number: 1,
        title: 'Initial alert',
        narrative:
          'Your SIEM fires a "Repeated MFA Prompts" alert for user `jdoe@acme.com`. 8 denied prompts in 9 minutes, then a single approval at 02:11 AM. The login is from an IP in a country the user has never authenticated from.',
        question: 'What do you do first?',
        choices: [
          {
            id: 'a',
            label: 'Call the user immediately to confirm whether they approved the prompt',
            is_correct: true,
            rationale:
              'Correct. User confirmation drives every downstream decision. If they didn\'t approve, you treat this as confirmed compromise.',
          },
          {
            id: 'b',
            label: 'Reset the password immediately',
            is_correct: false,
            rationale:
              'Premature. You haven\'t confirmed compromise, and resetting before contact loses the chance to gather context.',
          },
          {
            id: 'c',
            label: 'Close the ticket — the user approved, so it\'s legitimate',
            is_correct: false,
            rationale:
              'Wrong. The 8 prior denials and the foreign IP are classic MFA fatigue indicators. Approval after denials is suspicious, not exculpatory.',
          },
        ],
      },
      {
        step_number: 2,
        title: 'User contact',
        narrative:
          'You reach the user. They confirm they were asleep and did NOT approve any prompt — they tap "Approve" by reflex when their phone buzzes. They are alarmed.',
        question: 'Containment — what do you do next?',
        choices: [
          {
            id: 'a',
            label: 'Revoke all active sessions, reset password, force MFA re-enrollment',
            is_correct: true,
            rationale:
              'Correct. Attacker likely has session tokens; only revocation kills the foothold. Reset alone does not invalidate live sessions on most platforms.',
          },
          {
            id: 'b',
            label: 'Reset the password and tell the user to be more careful',
            is_correct: false,
            rationale:
              'Insufficient. Password reset doesn\'t kill active sessions. The attacker stays in.',
          },
          {
            id: 'c',
            label: 'Block the foreign IP at the firewall',
            is_correct: false,
            rationale:
              'Useful but not primary. Attackers rotate IPs. You must invalidate the identity, not just the network path.',
          },
        ],
      },
      {
        step_number: 3,
        title: 'Persistence check',
        narrative:
          'You\'ve revoked sessions and reset credentials. Before closing, you check for attacker persistence.',
        question: 'Which check matters most operationally?',
        choices: [
          {
            id: 'a',
            label: 'Look for new inbox rules, OAuth grants, and MFA device enrollments in the last 24h',
            is_correct: true,
            rationale:
              'Correct. These are the top three persistence vectors after credential compromise. Skip this and the attacker comes back tomorrow.',
          },
          {
            id: 'b',
            label: 'Run a full malware scan on the user\'s laptop',
            is_correct: false,
            rationale:
              'Not the priority. This was an identity attack, not endpoint malware. Persistence here lives in the identity layer.',
          },
          {
            id: 'c',
            label: 'Reboot the user\'s workstation',
            is_correct: false,
            rationale:
              'Wrong. Rebooting doesn\'t address identity-layer persistence.',
          },
        ],
      },
      {
        step_number: 4,
        title: 'Ticket handoff',
        narrative:
          'You found one new inbox rule auto-forwarding finance emails to an external address. You\'ve deleted it. Tier 2 picks this up next shift.',
        question: 'What MUST be in your Tier 2 handoff note?',
        choices: [
          {
            id: 'a',
            label:
              'Timeline (UTC), IOCs (source IP, user agent, rule ID), actions taken (revoked, reset, deleted rule), recommended next steps (review last 30 days of email forwarding)',
            is_correct: true,
            rationale:
              'Correct. Tier 2 needs to act, not investigate from scratch. A good handoff note is the difference between a 4-hour and a 4-day investigation.',
          },
          {
            id: 'b',
            label: '"Suspicious login, handled it, please follow up."',
            is_correct: false,
            rationale:
              'Useless. Tier 2 has to redo the entire investigation from scratch. This is the #1 ticket-quality failure mode.',
          },
          {
            id: 'c',
            label: 'Just the ticket ID and the user\'s name',
            is_correct: false,
            rationale: 'Wrong. Insufficient context for downstream action.',
          },
        ],
      },
    ],
  },
  {
    id: 'phishing-with-creds',
    title: 'Phishing — User Entered Credentials',
    category: 'Phishing',
    difficulty: 'Intermediate',
    duration_minutes: 8,
    role: 'SOC Analyst',
    summary:
      'A user reports clicking a phishing link and entering credentials before "realizing." Walk the investigation from report through containment.',
    learning_objectives: [
      'Header analysis basics',
      'IOC identification and documentation',
      'Containment decision tree for credential exposure',
    ],
    steps: [
      {
        step_number: 1,
        title: 'Initial report',
        narrative:
          'User submits a "phish report" via the email-client button. The email impersonates IT, asks for password reset, and links to `it-acme-portal[.]net`. User confirms they entered email + password.',
        question: 'First triage step?',
        choices: [
          {
            id: 'a',
            label: 'Treat as confirmed credential exposure — initiate containment immediately',
            is_correct: true,
            rationale:
              'Correct. Credentials are out. Investigation continues in parallel, but containment cannot wait.',
          },
          {
            id: 'b',
            label: 'Run a URL sandbox first to confirm it\'s malicious',
            is_correct: false,
            rationale:
              'Wastes time. The user confirmed they entered creds; you contain first, validate the URL in parallel.',
          },
          {
            id: 'c',
            label: 'Email the user back and ask for the original email',
            is_correct: false,
            rationale: 'Slow. You already have it via the phish-report submission.',
          },
        ],
      },
      {
        step_number: 2,
        title: 'Containment',
        narrative: 'You\'re containing. Which combination is correct?',
        question: 'Pick the right containment set:',
        choices: [
          {
            id: 'a',
            label:
              'Reset password, revoke sessions, force MFA re-prompt, check for MFA approval in last 30 min, block the phishing domain at email gateway and DNS',
            is_correct: true,
            rationale:
              'Correct. Identity containment + threat containment. Both layers.',
          },
          {
            id: 'b',
            label: 'Reset password only',
            is_correct: false,
            rationale: 'Misses session revocation and domain blocking. Attacker keeps the foothold.',
          },
          {
            id: 'c',
            label: 'Block the domain at the firewall',
            is_correct: false,
            rationale: 'Only addresses one user, doesn\'t protect the rest of the org or kill the existing session.',
          },
        ],
      },
      {
        step_number: 3,
        title: 'IOC documentation',
        narrative: 'You need to document IOCs in the ticket.',
        question: 'Which IOC set is correct and complete?',
        choices: [
          {
            id: 'a',
            label:
              'Sender address, sender display name, sender domain, return-path, originating IP, link URL, link domain, link IP, attachment hash (if any), MX of phishing domain',
            is_correct: true,
            rationale:
              'Correct. Each IOC enables a different downstream action (blocking, hunting, correlation).',
          },
          {
            id: 'b',
            label: 'Sender address and link URL',
            is_correct: false,
            rationale:
              'Too thin. Threat hunters can\'t pivot on this — you miss correlation opportunities.',
          },
          {
            id: 'c',
            label: 'Just a screenshot of the email',
            is_correct: false,
            rationale:
              'Screenshots are unsearchable. IOCs must be extracted as text in the ticket.',
          },
        ],
      },
    ],
  },
  {
    id: 'ticket-triage',
    title: 'Triage 5 Alerts in 15 Minutes',
    category: 'Ticket Triage',
    difficulty: 'Intermediate',
    duration_minutes: 10,
    role: 'SOC Analyst',
    summary:
      'A queue of 5 alerts hits at shift start. Classify severity and decide which to escalate. Time pressure mirrors a real morning queue.',
    learning_objectives: [
      'Severity classification under time pressure',
      'Escalation criteria',
      'Recognizing benign vs. actionable alerts',
    ],
    steps: [
      {
        step_number: 1,
        title: 'Alert 1 — Failed login burst',
        narrative:
          '`svc-backup` account had 47 failed logins in 12 minutes from a single internal IP, then 2 successes. The IP belongs to the backup server. Today is patch Tuesday.',
        question: 'Severity?',
        choices: [
          {
            id: 'a',
            label: 'Low — Service account misconfigured after patching; verify with infra and close',
            is_correct: true,
            rationale:
              'Correct. Pattern + context (patch day, internal IP, service account) makes this almost certainly misconfig. Verify, document, close.',
          },
          {
            id: 'b',
            label: 'Critical — Brute force success!',
            is_correct: false,
            rationale: 'Misreads context. Brute force from your own backup server during patch day is misconfig 99% of the time.',
          },
          {
            id: 'c',
            label: 'High — Lateral movement attempt',
            is_correct: false,
            rationale: 'No lateral movement evidence. Same source IP, same target account.',
          },
        ],
      },
      {
        step_number: 2,
        title: 'Alert 2 — Login from new country',
        narrative:
          'CEO\'s account authenticates from Singapore. CEO is normally in NYC. Last login was 6 hours ago from NYC.',
        question: 'Severity?',
        choices: [
          {
            id: 'a',
            label: 'High — Impossible travel; contact CEO/EA immediately, hold containment pending response',
            is_correct: true,
            rationale:
              'Correct. Impossible travel + executive target = High at minimum. Don\'t auto-contain CEO without confirmation; but don\'t wait either.',
          },
          {
            id: 'b',
            label: 'Critical — Auto-contain immediately',
            is_correct: false,
            rationale:
              'Risky without verification. Auto-containing the CEO during a board meeting in Singapore is a career-limiting move. Verify first, fast.',
          },
          {
            id: 'c',
            label: 'Low — They\'re probably traveling',
            is_correct: false,
            rationale:
              'Doesn\'t match the data. Last NYC login was 6 hours ago — Singapore is not reachable in 6 hours from NYC.',
          },
        ],
      },
    ],
  },
  {
    id: 'log-pivot',
    title: 'Log Pivot — Suspicious PowerShell',
    category: 'Log Analysis',
    difficulty: 'Advanced',
    duration_minutes: 12,
    role: 'SOC Analyst',
    summary:
      'EDR fires on suspicious encoded PowerShell. Pivot through Windows Event Logs to determine impact.',
    learning_objectives: [
      'PowerShell event log interpretation',
      'Process ancestry analysis',
      'Lateral movement detection basics',
    ],
    steps: [
      {
        step_number: 1,
        title: 'Initial detection',
        narrative:
          'EDR flags `powershell.exe -enc <base64>` on `WS-FIN-04`. Parent process is `winword.exe`. The user opened an Excel attachment 90 seconds before.',
        question: 'First pivot?',
        choices: [
          {
            id: 'a',
            label: 'Decode the base64 and check process tree + network connections from that PowerShell PID',
            is_correct: true,
            rationale:
              'Correct. Word→PowerShell is a known macro-attack pattern. Decode the command and check what it did.',
          },
          {
            id: 'b',
            label: 'Reimage the workstation immediately',
            is_correct: false,
            rationale: 'Premature. You haven\'t scoped impact yet — reimaging destroys forensic evidence.',
          },
        ],
      },
    ],
  },
]

// ──────────────────────────────────────────────────────────────────────────
// SOC WORKFLOW LIBRARY — reference material
// ──────────────────────────────────────────────────────────────────────────

export type WorkflowSection = {
  heading: string
  body: string[]
}

export type Workflow = {
  id: string
  title: string
  category: string
  summary: string
  applies_to_roles: string[]
  estimated_read_minutes: number
  why_it_matters: string
  sections: WorkflowSection[]
  related_scenarios: string[]
}

export const DEMO_WORKFLOWS: Workflow[] = [
  {
    id: 'phishing-investigation',
    title: 'Phishing Investigation Workflow',
    category: 'Email & Identity',
    summary:
      'End-to-end analyst workflow for a phishing alert — from triage through containment to ticket closure.',
    applies_to_roles: ['SOC Analyst', 'Cybersecurity Analyst', 'IT Support to Cyber Transition'],
    estimated_read_minutes: 8,
    why_it_matters:
      'Phishing is the #1 entry vector for credential compromise. Every analyst handles these on every shift; speed and quality of triage directly determine whether an attacker gets a foothold.',
    sections: [
      {
        heading: 'Step 1 — Triage',
        body: [
          'Who reported it? (User-reported / mail filter / SOAR auto-alert)',
          'Was the link clicked? Were credentials entered? Was MFA approved?',
          'Time-since-click matters — credentials in attacker hands within minutes.',
        ],
      },
      {
        heading: 'Step 2 — Email header analysis',
        body: [
          'Return-Path mismatch with From header is suspicious.',
          'SPF / DKIM / DMARC failures in the Authentication-Results header.',
          'Received chain — what IPs did the email actually pass through?',
          'Sender domain age (less than 30 days = high risk).',
        ],
      },
      {
        heading: 'Step 3 — URL / domain analysis',
        body: [
          'VirusTotal, URLScan, urlhaus for reputation.',
          'Sandbox the URL to see redirects and final landing page.',
          'Resolve the domain — check the hosting ASN, registrar, WHOIS.',
        ],
      },
      {
        heading: 'Step 4 — User impact',
        body: [
          'Auth logs for the user — any logins from unusual IP/geo in the last 24h?',
          'MFA prompts approved that the user doesn\'t recognize?',
          'OAuth grants or inbox rules created post-incident?',
        ],
      },
      {
        heading: 'Step 5 — Containment',
        body: [
          'Reset password.',
          'Revoke all active sessions (critical — password reset alone does NOT kill sessions).',
          'Force MFA re-enrollment if MFA was approved.',
          'Block the phishing sender domain at the email gateway.',
          'Block the phishing URL at DNS and at the web proxy.',
        ],
      },
      {
        heading: 'Step 6 — Documentation',
        body: [
          'IOCs in the ticket (text, not screenshots).',
          'Timeline in UTC.',
          'Containment actions and timestamps.',
          'Escalation rationale (or closure rationale).',
        ],
      },
    ],
    related_scenarios: ['phishing-with-creds'],
  },
  {
    id: 'mfa-iam-triage',
    title: 'MFA / IAM Alert Triage',
    category: 'Identity',
    summary:
      'How analysts triage MFA fatigue, impossible travel, and suspicious-login alerts in real operations.',
    applies_to_roles: ['SOC Analyst', 'IAM Specialist', 'Cybersecurity Analyst'],
    estimated_read_minutes: 7,
    why_it_matters:
      'Identity is the new perimeter. Most modern attacks bypass network defenses by stealing or abusing credentials. MFA-IAM triage is where analysts actually catch live attackers.',
    sections: [
      {
        heading: 'Common MFA/IAM alert patterns',
        body: [
          '**MFA fatigue** — repeated denied prompts followed by an approval. Attacker has the password; user eventually mis-taps.',
          '**Impossible travel** — same account, two geos, no reachable travel time.',
          '**New device enrollment** — user, or attacker registering their own device?',
          '**OAuth consent phishing** — attacker tricks user into granting an app access; bypasses MFA entirely.',
          '**Session token theft** — attacker reuses stolen cookies; bypasses MFA.',
        ],
      },
      {
        heading: 'What an analyst checks',
        body: [
          'Geo + IP + user-agent for the suspicious login.',
          'Authentication method — password+MFA? Session token? OAuth?',
          'Did the user just call the help desk? (Social engineering precursor.)',
          'Any post-auth activity — inbox rules, OAuth grants, password changes, MFA device adds.',
        ],
      },
      {
        heading: 'Containment when compromise is confirmed',
        body: [
          'Revoke all sessions (kills the cookie/token).',
          'Reset password.',
          'Force MFA re-enrollment.',
          'Audit OAuth grants for the past 30 days.',
          'Audit inbox rules — auto-forwards to external addresses are a classic exfil pattern.',
        ],
      },
    ],
    related_scenarios: ['mfa-fatigue'],
  },
  {
    id: 'ticket-triage-escalation',
    title: 'SOC Ticket Triage & Escalation',
    category: 'Operations',
    summary:
      'Severity classification, what belongs in an analyst note, and when to escalate vs. close.',
    applies_to_roles: ['SOC Analyst', 'Cybersecurity Analyst'],
    estimated_read_minutes: 6,
    why_it_matters:
      'A SOC runs on tickets. The quality of your analyst notes determines whether your team can defend the org or just push paper. This is the most-graded skill in junior-analyst interviews.',
    sections: [
      {
        heading: 'Severity scale (common four-tier)',
        body: [
          '**Critical** — Active compromise, data loss, ransomware, exec target.',
          '**High** — Confirmed credential compromise, malware on endpoint, MFA bypass.',
          '**Medium** — Suspicious login, phishing click without creds entered, policy violation.',
          '**Low** — User-reported phish (filter caught it), benign anomaly.',
        ],
      },
      {
        heading: 'What goes in a strong analyst note',
        body: [
          'Summary — one line.',
          'Evidence — IOCs, log snippets, timestamps in UTC.',
          'Actions taken — containment, resets, contact attempts.',
          'Escalation rationale — why this is going to Tier 2.',
          'Next steps — what the next analyst should do.',
        ],
      },
      {
        heading: 'Escalation criteria',
        body: [
          'Authentication on critical systems by non-admin accounts.',
          'Lateral movement indicators (new RDP, PowerShell remoting, SMB to unusual hosts).',
          'Any user impact you cannot fully contain in your shift.',
          'Executive accounts, finance accounts, or accounts with privileged access.',
        ],
      },
    ],
    related_scenarios: ['ticket-triage'],
  },
  {
    id: 'incident-response',
    title: 'Incident Response Lifecycle',
    category: 'Incident Response',
    summary:
      'The standard IR lifecycle (detect → contain → eradicate → recover → document) with what each phase looks like in practice.',
    applies_to_roles: ['SOC Analyst', 'Cybersecurity Analyst'],
    estimated_read_minutes: 9,
    why_it_matters:
      'IR is the highest-stakes workflow an analyst executes. Knowing the lifecycle prevents premature closure, evidence destruction, or scope creep — three of the most common analyst mistakes.',
    sections: [
      {
        heading: 'Detection',
        body: [
          'Where did the signal come from — SIEM, EDR, user report, threat intel?',
          'Confidence: True positive, false positive, benign true positive?',
          'Initial scoping — what systems / users / data are in scope?',
        ],
      },
      {
        heading: 'Containment',
        body: [
          'Network containment — isolate the endpoint without powering it off (preserves memory).',
          'Identity containment — revoke sessions, reset credentials, disable account if needed.',
          'Data containment — block exfil paths (email rules, DLP, egress).',
        ],
      },
      {
        heading: 'Eradication',
        body: [
          'Remove the foothold — malware, persistence (scheduled tasks, services, registry runs, inbox rules).',
          'Patch / harden the entry vector.',
          'Validate eradication — re-run detection rules; ensure no re-trigger.',
        ],
      },
      {
        heading: 'Recovery',
        body: [
          'Restore the affected systems / accounts.',
          'Monitor for re-emergence — attackers often return through the same vector.',
        ],
      },
      {
        heading: 'Documentation',
        body: [
          'Timeline in UTC.',
          'Root cause and entry vector.',
          'Lessons learned — what should change in detection, training, or controls.',
        ],
      },
    ],
    related_scenarios: ['phishing-with-creds'],
  },
  {
    id: 'log-analysis-fundamentals',
    title: 'Log Analysis & SIEM Fundamentals',
    category: 'Detection',
    summary:
      'How to read Windows event logs, auth logs, and pivot inside a SIEM the way an analyst does.',
    applies_to_roles: ['SOC Analyst', 'Cybersecurity Analyst'],
    estimated_read_minutes: 10,
    why_it_matters:
      'Logs are the source of truth. If you can\'t read logs, you can\'t investigate. This is the gap that separates "knows security concepts" from "can actually work a shift."',
    sections: [
      {
        heading: 'Windows Event Logs — the events that matter',
        body: [
          '4624 — successful logon (look at logon type: 2 interactive, 3 network, 10 RDP).',
          '4625 — failed logon. Burst = brute force attempt.',
          '4672 — special privileges assigned (admin equivalents).',
          '4688 — process creation. Pair with command line auditing.',
          '4720 / 4732 — account created / added to security group.',
        ],
      },
      {
        heading: 'PowerShell event log basics',
        body: [
          '4103 — module logging.',
          '4104 — script block logging (the ground truth for what code ran).',
          'Encoded commands — `-enc` flag indicates base64; decode and review.',
        ],
      },
      {
        heading: 'SIEM pivots',
        body: [
          'Start with the IOC: user / IP / hostname / hash.',
          'Pivot to time-adjacent activity (±15 min).',
          'Pivot to other artifacts of the same user/host.',
          'Build a timeline — sort all events chronologically before drawing conclusions.',
        ],
      },
    ],
    related_scenarios: ['log-pivot'],
  },
  {
    id: 'soc-shift-handoff',
    title: 'SOC Shift Handoff Notes',
    category: 'Operations',
    summary:
      'How analysts hand off open work between shifts so nothing falls through the cracks.',
    applies_to_roles: ['SOC Analyst'],
    estimated_read_minutes: 4,
    why_it_matters:
      'SOCs run 24/7. The handoff between shifts is where attackers slip through — incomplete notes mean the incoming analyst has to re-investigate, losing time on a live threat.',
    sections: [
      {
        heading: 'What every handoff note must contain',
        body: [
          'Open tickets with current state and next action.',
          'Suspicious-but-not-yet-classified activity worth watching.',
          'Anything blocked on external teams (waiting for user response, infra team, etc.).',
          'Active investigations — current hypothesis and the next pivot.',
        ],
      },
      {
        heading: 'Common handoff failure modes',
        body: [
          '"Suspicious, please follow up" — useless without context.',
          'Missing IOCs in plaintext — screenshots are unsearchable.',
          'No timeline — incoming analyst can\'t reconstruct what happened.',
          'No next action — incoming analyst has to redo your investigation to figure out where to start.',
        ],
      },
    ],
    related_scenarios: ['mfa-fatigue', 'ticket-triage'],
  },
]
