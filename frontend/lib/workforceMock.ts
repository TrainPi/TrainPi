/**
 * Deterministic mock analysis generator for the Workforce Readiness flow.
 *
 * Takes the participant profile + uploaded org docs and produces a realistic-looking
 * analysis result. The trick: the user's actual entered skills and doc filenames are
 * echoed back into the output so the demo feels real, not random.
 */

import type {
  ParticipantProfile,
  OperationalDocument,
  DocumentCategory,
} from './workforceState'
import { CATEGORY_LABELS } from './workforceState'

// ──────────────────────────────────────────────────────────────────────────
// Canonical skill libraries
// ──────────────────────────────────────────────────────────────────────────

// Skills that are operationally relevant for a cyber/IT analyst role.
// If the user enters one of these (case-insensitive substring), we count it as
// "matched" against the agency's operational requirements.
const CYBER_RELEVANT_SKILLS = [
  'active directory',
  'windows',
  'microsoft 365',
  'office 365',
  'help desk',
  'helpdesk',
  'ticketing',
  'phishing',
  'malware',
  'endpoint',
  'mfa',
  'iam',
  'identity',
  'linux',
  'siem',
  'splunk',
  'sentinel',
  'log analysis',
  'firewall',
  'networking',
  'tcp',
  'dns',
  'incident',
  'soc',
  'documentation',
  'compliance',
  'audit',
  'vulnerability',
  'patch',
  'powershell',
  'python',
  'bash',
  'system administration',
  'sysadmin',
  'troubleshooting',
  'customer service',
]

// Canonical cyber operational requirements an agency expects.
// These become "Top Gaps" when the user hasn't entered the matching skill.
const CANONICAL_REQUIREMENTS = [
  { id: 'incident_response', label: 'Incident Response Workflow', match_terms: ['incident', 'ir', 'response'] },
  { id: 'siem', label: 'SIEM & Log Analysis', match_terms: ['siem', 'splunk', 'sentinel', 'log', 'elastic'] },
  { id: 'compliance', label: 'Security Policies & Compliance', match_terms: ['compliance', 'audit', 'policy'] },
  { id: 'threat_detection', label: 'Threat Detection & Triage', match_terms: ['threat', 'detection', 'malware', 'phishing'] },
  { id: 'cloud_security', label: 'Cloud Security Fundamentals', match_terms: ['cloud', 'aws', 'azure', 'gcp'] },
  { id: 'mfa_iam', label: 'MFA & IAM Triage', match_terms: ['mfa', 'iam', 'identity', 'sso'] },
  { id: 'linux', label: 'Linux Operational Fluency', match_terms: ['linux', 'bash', 'unix'] },
  { id: 'ticketing', label: 'Ticket Triage & Escalation', match_terms: ['ticket', 'escalat', 'jira', 'servicenow'] },
  { id: 'networking', label: 'Network Security Basics', match_terms: ['network', 'tcp', 'firewall', 'dns', 'ip'] },
  { id: 'vuln_management', label: 'Vulnerability Management', match_terms: ['vulnerability', 'patch', 'cve', 'cvss'] },
] as const

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().trim()
}

function userSkillMatchesTerms(userSkill: string, terms: readonly string[]): boolean {
  const n = normalize(userSkill)
  return terms.some((t) => n.includes(t))
}

function profileContainsAnyTerm(profile: ParticipantProfile, terms: readonly string[]): boolean {
  const allText = [
    profile.current_job_title,
    profile.additional_notes,
    ...profile.primary_skills,
  ].join(' ').toLowerCase()
  return terms.some((t) => allText.includes(t))
}

function classifySkillForCyber(skill: string): boolean {
  return CYBER_RELEVANT_SKILLS.some((c) => normalize(skill).includes(c))
}

// ──────────────────────────────────────────────────────────────────────────
// Participant capability profile (used in Step 3 left column)
// ──────────────────────────────────────────────────────────────────────────

export type ExtractedProfile = {
  experience_signals: string[]   // from job title + years
  skills_detected: string[]      // user's primary skills, deduped
  certifications: string[]       // synthesized when profile suggests
  tools_detected: string[]
  strengths: string[]            // best-of from skills_detected
}

export function buildExtractedProfile(profile: ParticipantProfile): ExtractedProfile {
  const skills = (profile.primary_skills || []).map((s) => s.trim()).filter(Boolean)
  const tools_detected = skills.filter((s) => /365|directory|sentinel|splunk|jira|servicenow|wireshark|edr|antivirus|windows|linux/i.test(s))
  const certifications: string[] = []
  if (/security\s*\+|sec\+|comptia/i.test(profile.additional_notes)) certifications.push('CompTIA Security+')
  if (/network\s*\+/i.test(profile.additional_notes)) certifications.push('CompTIA Network+')
  if (/ccna/i.test(profile.additional_notes)) certifications.push('Cisco CCNA')
  if (/cissp/i.test(profile.additional_notes)) certifications.push('CISSP')

  const experience_signals: string[] = []
  if (profile.current_job_title) experience_signals.push(`Current role: ${profile.current_job_title}`)
  if (profile.years_experience) experience_signals.push(`${profile.years_experience} of relevant experience`)
  if (profile.resume_filename) experience_signals.push(`Resume parsed: ${profile.resume_filename}`)

  // Strengths = up to 5 skills the user entered (prefer cyber-relevant ones)
  const cyberFirst = [...skills].sort((a, b) => Number(classifySkillForCyber(b)) - Number(classifySkillForCyber(a)))
  const strengths = cyberFirst.slice(0, 5)

  return { experience_signals, skills_detected: skills, certifications, tools_detected, strengths }
}

// ──────────────────────────────────────────────────────────────────────────
// Operational requirements profile (used in Step 3 right column)
// ──────────────────────────────────────────────────────────────────────────

export type ExtractedOrgContext = {
  total_documents: number
  by_category: Record<DocumentCategory, number>
  extracted_requirements: string[]
  extracted_workflows: string[]
  extracted_role_expectations: string[]
}

const CATEGORY_REQUIREMENTS: Record<DocumentCategory, string[]> = {
  sop: [
    'Incident response procedure',
    'User access review SOP',
    'Phishing escalation policy',
  ],
  workflow: [
    'Tier-1 alert triage workflow',
    'MFA reset and validation flow',
    'Ticket-to-escalation handoff',
  ],
  role: [
    'SOC analyst role expectations',
    'Tier-1 triage responsibilities',
    'Documentation quality standards',
  ],
  mission: [
    'Operational security objectives',
    'Compliance and audit posture',
    'Stakeholder reporting cadence',
  ],
  skill_framework: [
    'NICE Framework — Protect & Defend',
    'Required tools by tier',
    'Capability maturity model',
  ],
  other: [
    'Supplementary onboarding notes',
    'Environment-specific references',
  ],
}

export function buildExtractedOrgContext(docs: OperationalDocument[]): ExtractedOrgContext {
  const by_category: Record<DocumentCategory, number> = {
    sop: 0, workflow: 0, role: 0, mission: 0, skill_framework: 0, other: 0,
  }
  for (const d of docs) by_category[d.category]++

  const extracted_requirements: string[] = []
  const extracted_workflows: string[] = []
  const extracted_role_expectations: string[] = []

  if (by_category.sop > 0) extracted_requirements.push(...CATEGORY_REQUIREMENTS.sop)
  if (by_category.workflow > 0) extracted_workflows.push(...CATEGORY_REQUIREMENTS.workflow)
  if (by_category.role > 0) extracted_role_expectations.push(...CATEGORY_REQUIREMENTS.role)
  if (by_category.mission > 0) extracted_requirements.push(...CATEGORY_REQUIREMENTS.mission)
  if (by_category.skill_framework > 0) extracted_role_expectations.push(...CATEGORY_REQUIREMENTS.skill_framework)
  if (by_category.other > 0) extracted_requirements.push(...CATEGORY_REQUIREMENTS.other)

  // Fallback if no docs uploaded — still show plausible defaults so step 3 has content
  if (docs.length === 0) {
    extracted_requirements.push(
      'Public-guidance baseline: incident escalation procedure',
      'Public-guidance baseline: ticket documentation standards',
    )
    extracted_workflows.push('Default workflow: alert triage → containment → ticket close')
    extracted_role_expectations.push('Default role expectations: Tier-1 SOC analyst readiness')
  }

  return {
    total_documents: docs.length,
    by_category,
    extracted_requirements,
    extracted_workflows,
    extracted_role_expectations,
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Final comparison result — used in Step 4 (Results) and Step 5 (Roadmap)
// ──────────────────────────────────────────────────────────────────────────

export type AnalysisRow = {
  area: string
  participant: string
  agency_requirement: string
  result: 'Major gap' | 'Moderate gap' | 'Match' | 'Strength'
}

export type AnalysisResult = {
  overall_score: number
  readiness_label: 'Beginner Readiness' | 'Moderate Readiness' | 'High Readiness' | 'Operational Readiness'
  summary: string

  top_strengths: string[]
  top_gaps: string[]
  key_insights: string[]

  capability_alignment: { label: string; pct: number; color: string }[]
  gap_summary: { major: number; moderate: number; minor: number }

  comparison_table: AnalysisRow[]
}

function readinessLabel(score: number): AnalysisResult['readiness_label'] {
  if (score >= 85) return 'Operational Readiness'
  if (score >= 70) return 'High Readiness'
  if (score >= 50) return 'Moderate Readiness'
  return 'Beginner Readiness'
}

export function generateAnalysis(profile: ParticipantProfile, docs: OperationalDocument[]): AnalysisResult {
  const skills = profile.primary_skills || []
  const skillCount = skills.length

  // 1. Top strengths — pull from user's entered skills, prefer cyber-relevant.
  const cyberSkills = skills.filter(classifySkillForCyber)
  const nonCyberSkills = skills.filter((s) => !classifySkillForCyber(s))

  // Always include role-derived strength if job title is IT/cyber-adjacent
  const roleStrengths: string[] = []
  const title = (profile.current_job_title || '').toLowerCase()
  if (/support|help\s*desk|helpdesk|service/.test(title)) roleStrengths.push('IT Support & Troubleshooting')
  if (/admin|sysadmin|system/.test(title)) roleStrengths.push('System Administration')
  if (/customer|service|support/.test(title)) roleStrengths.push('Customer Service')
  if (/document/.test(title)) roleStrengths.push('Technical Documentation')

  // De-dupe and assemble
  const seen = new Set<string>()
  const allCandidates: string[] = []
  for (const item of [...roleStrengths, ...cyberSkills, ...nonCyberSkills]) {
    const key = item.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      allCandidates.push(item)
    }
  }
  const top_strengths = allCandidates.slice(0, 5)
  // Ensure 5 by padding with canonical IT strengths if user entered too few
  const padStrengths = ['IT Support & Troubleshooting', 'System Administration', 'Customer Service', 'Active Directory', 'Technical Documentation']
  for (const p of padStrengths) {
    if (top_strengths.length >= 5) break
    if (!top_strengths.find((s) => normalize(s) === normalize(p))) top_strengths.push(p)
  }

  // 2. Top gaps — canonical requirements not covered by entered skills/notes.
  const top_gaps: string[] = []
  for (const req of CANONICAL_REQUIREMENTS) {
    if (profileContainsAnyTerm(profile, req.match_terms)) continue
    top_gaps.push(req.label)
    if (top_gaps.length >= 5) break
  }

  // 3. Comparison table — small, illustrative, deterministic from profile data.
  const comparison_table: AnalysisRow[] = []
  const hasSIEM = profileContainsAnyTerm(profile, ['siem', 'splunk', 'sentinel'])
  const hasTicket = profileContainsAnyTerm(profile, ['ticket', 'help', 'service desk'])
  const hasIR = profileContainsAnyTerm(profile, ['incident', 'response'])
  const hasM365 = profileContainsAnyTerm(profile, ['microsoft 365', '365', 'office'])
  const hasAD = profileContainsAnyTerm(profile, ['active directory', 'ad ', 'sso'])
  const hasMFA = profileContainsAnyTerm(profile, ['mfa', 'iam', 'identity'])

  comparison_table.push({
    area: 'SIEM',
    participant: hasSIEM ? 'Experience shown' : 'No experience shown',
    agency_requirement: 'Must triage alerts',
    result: hasSIEM ? 'Match' : 'Major gap',
  })
  comparison_table.push({
    area: 'Ticketing',
    participant: hasTicket ? 'Has experience' : 'Limited mention',
    agency_requirement: 'Required for documentation',
    result: hasTicket ? 'Match' : 'Moderate gap',
  })
  comparison_table.push({
    area: 'Incident escalation',
    participant: hasIR ? 'Some experience' : 'Not shown',
    agency_requirement: 'Required in SOP',
    result: hasIR ? 'Match' : 'Major gap',
  })
  comparison_table.push({
    area: 'Microsoft 365',
    participant: hasM365 ? 'Has experience' : 'Not shown',
    agency_requirement: 'Helpful for environment',
    result: hasM365 ? 'Strength' : 'Moderate gap',
  })
  comparison_table.push({
    area: 'Active Directory',
    participant: hasAD ? 'Confirmed' : 'Not detected',
    agency_requirement: 'Used in identity workflows',
    result: hasAD ? 'Strength' : 'Moderate gap',
  })
  comparison_table.push({
    area: 'MFA / IAM triage',
    participant: hasMFA ? 'Familiar' : 'No exposure',
    agency_requirement: 'Daily SOC workflow',
    result: hasMFA ? 'Match' : 'Major gap',
  })

  // 4. Score — driven by matches in the comparison table + skill count
  const matches = comparison_table.filter((r) => r.result === 'Match' || r.result === 'Strength').length
  const baseFromMatches = Math.round((matches / comparison_table.length) * 60) // up to 60 from matches
  const skillsBoost = Math.min(15, skillCount * 2) // up to 15 from skill count
  const docsBoost = Math.min(15, docs.length * 2) // up to 15 from uploaded docs
  const yearsBoost =
    profile.years_experience === '10+ years' ? 10 :
    profile.years_experience === '5-10 years' ? 8 :
    profile.years_experience === '3-5 years' ? 6 :
    profile.years_experience === '1-3 years' ? 4 :
    profile.years_experience === 'Less than 1 year' ? 2 : 0

  const overall_score = Math.max(28, Math.min(96, baseFromMatches + skillsBoost + docsBoost + yearsBoost))
  const readiness_label = readinessLabel(overall_score)

  // 5. Capability alignment bars (deterministic from score)
  const baseAlignment = overall_score
  const capability_alignment = [
    { label: 'Technical Skills', pct: Math.min(100, baseAlignment + 3), color: 'indigo' },
    { label: 'Experience', pct: Math.min(100, baseAlignment - 7), color: 'blue' },
    { label: 'Workflow Readiness', pct: Math.min(100, baseAlignment - 12), color: 'amber' },
    { label: 'Mission Alignment', pct: Math.min(100, baseAlignment + 8), color: 'violet' },
    { label: 'Overall Alignment', pct: baseAlignment, color: 'emerald' },
  ]

  // 6. Gap summary
  const major = comparison_table.filter((r) => r.result === 'Major gap').length
  const moderate = comparison_table.filter((r) => r.result === 'Moderate gap').length
  const minor = Math.max(1, 8 - major - moderate)
  const gap_summary = { major, moderate, minor }

  // 7. Key insights — reference the user's actual profile
  const key_insights: string[] = []
  if (skillCount > 0) {
    key_insights.push(`You're well aligned on ${Math.min(skillCount, 3)} skill${skillCount === 1 ? '' : 's'} you listed.`)
  } else {
    key_insights.push('Add primary skills to your profile for sharper alignment.')
  }
  if (profile.current_job_title) {
    key_insights.push(`Strong baseline from your "${profile.current_job_title}" experience — translates directly into operational support.`)
  } else {
    key_insights.push('Adding a current job title would refine the role-fit analysis.')
  }
  key_insights.push('Focus on incident response and security skills to close critical capability gaps.')
  key_insights.push(`Building these skill${top_gaps.length === 1 ? '' : 's'} will close ${top_gaps.length} highest-impact gap${top_gaps.length === 1 ? '' : 's'}.`)

  // 8. Summary
  const summary =
    overall_score >= 70
      ? `You have a strong foundation and are well-positioned for an operational role with focused upskilling.`
      : overall_score >= 50
      ? `You have a solid foundation with some gaps to address before being fully operationally ready.`
      : `You're early in your readiness journey — the roadmap below will get you to operational level systematically.`

  return {
    overall_score,
    readiness_label,
    summary,
    top_strengths,
    top_gaps,
    key_insights,
    capability_alignment,
    gap_summary,
    comparison_table,
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Roadmap generator (Step 5) — driven by the gaps from analysis
// ──────────────────────────────────────────────────────────────────────────

export type RoadmapPhase = {
  number: number
  label: string
  duration: string
  items: string[]
}

export type RoadmapOverview = {
  recommended_skills: number
  learning_modules: number
  key_projects: number
  days_to_complete: string
  phases: RoadmapPhase[]
  top_priorities: string[]
  next_steps: string[]
}

export function generateRoadmap(analysis: AnalysisResult, profile: ParticipantProfile): RoadmapOverview {
  // Top priorities = first 3 gaps
  const top_priorities = analysis.top_gaps.slice(0, 3)

  // Phase 1 — Foundation: pick from gaps that are foundational
  const phase1Items = ['Incident Response Fundamentals', 'Security Policies & Procedures', 'Network Security Basics']
  const phase2Items = ['SIEM Tools & Log Analysis', 'Threat Detection & Triage', 'Incident Response Workflow']
  const phase3Items = ['Advanced Threat Analysis', 'Security Compliance & Reporting', 'Cross-functional Collaboration']
  const phase4Items = ['Threat Hunting', 'Automation & Scripting', 'Leadership & Communication']

  const phases: RoadmapPhase[] = [
    { number: 1, label: 'Foundation', duration: '0–30 Days', items: phase1Items },
    { number: 2, label: 'Build Skills', duration: '31–90 Days', items: phase2Items },
    { number: 3, label: 'Advance', duration: '91–180 Days', items: phase3Items },
    { number: 4, label: 'Optimize', duration: '180+ Days', items: phase4Items },
  ]

  const next_steps = [
    'Start with Phase 1 foundation skills',
    'Complete recommended learning modules',
    'Apply skills in hands-on projects',
    'Track progress and update roadmap',
  ]

  return {
    recommended_skills: 12,
    learning_modules: 8,
    key_projects: 4,
    days_to_complete: '180+',
    phases,
    top_priorities,
    next_steps,
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Realistic synthesized doc names (used when user clicks "Upload Files" but
// doesn't pick anything — gives demo a "files appeared" feel)
// ──────────────────────────────────────────────────────────────────────────

export const SAMPLE_DOC_NAMES: Record<DocumentCategory, string[]> = {
  sop: ['IT_Incident_Response_SOP.pdf', 'User_Access_Review_Policy.docx', 'Phishing_Escalation_SOP.pdf'],
  workflow: ['SOC_Tier1_Triage_Workflow.pdf', 'MFA_Reset_Process.docx', 'Ticket_Escalation_Flow.png'],
  role: ['SOC_Analyst_Job_Description.docx', 'Cybersecurity_Analyst_Role.pdf'],
  mission: ['Agency_Security_Mission_2026.pdf', 'Compliance_Posture_Statement.docx'],
  skill_framework: ['NICE_Framework_Mapping.pdf', 'Capability_Maturity_Model.docx'],
  other: ['Onboarding_Notes.pdf', 'Environment_References.docx'],
}

export { CATEGORY_LABELS }
