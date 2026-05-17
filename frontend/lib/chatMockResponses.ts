/**
 * AI Operational Readiness Mentor — mocked responses for the demo.
 *
 * Responses follow the operational-readiness response template:
 *   1. Current readiness level
 *   2. Strengths detected
 *   3. Critical gaps
 *   4. Operational relevance
 *   5. Next best actions
 *   6. Practice / scenario suggestion
 *
 * Tone: direct, workflow-aware, role-specific. Never generic.
 */

type Match = { test: (msg: string) => boolean; reply: string }

const matchers: Match[] = [
  // ──────────────────────────────────────────────────────────────────
  // CYBERSECURITY / SOC analyst readiness
  // ──────────────────────────────────────────────────────────────────
  {
    test: (m) =>
      /\b(soc|cyber( ?security)?|security analyst)\b/.test(m) &&
      /\b(ready|readiness|assess|gap|prepar)/.test(m),
    reply:
`**Current readiness level:** Early SOC Analyst preparation — *Developing*, not pure beginner.

**Strengths detected**
• Foundational cybersecurity vocabulary (phishing, malware, ransomware concepts).
• Windows familiarity — useful for endpoint and event log work.

**Critical gaps**
1. Linux operational familiarity (logs, processes, grep, permissions).
2. MFA/IAM workflows — suspicious logins, MFA fatigue, impossible-travel triage.
3. SIEM / log analysis — Windows event logs, authentication logs, alert pivoting.
4. SOC ticket workflow — severity classification, escalation criteria, analyst notes.

**Why this matters operationally**
In a real SOC, analysts spend their shift triaging alerts in a SIEM, validating MFA prompts, and writing tickets that the next tier can act on. Without Linux + IAM fluency, you can't close those tickets.

**Next 3 best actions**
1. Linux for analysts: \`grep\`, \`tail\`, \`ps\`, \`ss\`, log paths under \`/var/log\`.
2. Walk an MFA-fatigue alert end-to-end: detection → user contact → containment → ticket.
3. Read 10 phishing tickets and write one yourself — escalation rationale included.

**Practice scenario**
A user clicked a suspicious link and immediately received an MFA prompt they didn't initiate. What evidence do you collect first, and when do you escalate?`,
  },

  // Phishing investigation
  {
    test: (m) => /\bphish/.test(m),
    reply:
`**Phishing investigation workflow — what analysts actually do**

1. **Triage the alert** — Who reported it? Was the link clicked? Were credentials entered? MFA approved?
2. **Email header analysis** — \`Return-Path\`, \`Received\` chain, SPF/DKIM/DMARC results, sender domain age.
3. **URL/domain check** — VirusTotal, URLScan, sandbox the URL. Check redirect chains.
4. **User impact** — Did they enter creds? Look for suspicious logins, MFA prompts, new OAuth grants in the last 24h.
5. **Containment** — Reset password, revoke sessions, block the sender domain at the email gateway.
6. **Ticket documentation** — IOCs (sender, URL, domain, IPs), user actions, containment steps, escalation rationale.
7. **Decision: escalate or close?** — Escalate if credentials were entered, MFA was approved, or the attacker has a foothold.

**Quick checkpoint** — In a real ticket, where do the IOCs live, and who reads them next? (Answer: in the analyst notes field, read by the Tier 2 / IR lead during handoff.)`,
  },

  // MFA / IAM
  {
    test: (m) => /\b(mfa|iam|identity|sso|authentication)\b/.test(m),
    reply:
`**MFA & IAM — operational meaning, not the textbook definition**

In a real organization, MFA is not just "an extra code." Analysts triage these MFA-related alerts daily:

• **MFA fatigue** — Repeated push prompts to a real user from an attacker who already has the password. Look for >5 prompts in <10 min.
• **Impossible travel** — Same account authenticating from two distant geos within minutes. Often the second login is the attacker.
• **MFA bypass attempts** — Token theft, session cookie reuse, OAuth consent phishing.
• **New device enrollment** — Was it the user, or an attacker enrolling their own device?

**What an analyst checks**
1. Is the login from a known device / known IP / known geo?
2. Did the user just call the help desk? (Common social-engineering precursor.)
3. Any OAuth grants or inbox rules created post-login? (Persistence indicator.)
4. Reset password + revoke sessions + disable token if compromise is suspected.

**Practice question** — A user got 8 MFA prompts at 2am and didn't approve any. The 9th was approved. What do you do *first*?`,
  },

  // Ticketing / triage / escalation
  {
    test: (m) => /\b(ticket|triage|escalat|severity)\b/.test(m),
    reply:
`**SOC ticket triage — operational mechanics**

**Severity classification (most teams use):**
• **Critical** — Active compromise, data loss, ransomware, exec target.
• **High** — Confirmed credential compromise, malware on endpoint, MFA bypass.
• **Medium** — Suspicious login, phishing click without creds entered, policy violation.
• **Low** — User-reported phish (caught by filter), benign anomaly.

**What goes in a good ticket**
1. **Summary** — One line: who, what, when, where.
2. **Evidence** — IOCs, log snippets, timestamps in UTC.
3. **Actions taken** — Containment steps, user contacts, resets performed.
4. **Escalation rationale** — Why this is going to Tier 2 (or staying closed).
5. **Next steps** — What the next analyst should do.

**Escalation criteria**
• Authentication on critical systems by non-admin accounts.
• Lateral movement indicators (new RDP, PowerShell remoting, SMB to unusual hosts).
• Any user-impact you can't fully contain in your shift.

**Pro tip:** "I couldn't reproduce it" is not a closure reason. "User confirmed it was them, MFA from known device, no follow-on activity in 24h" is.`,
  },

  // Career path / role recommendation
  {
    test: (m) =>
      /\b(career|role|path|job)\b/.test(m) &&
      /\b(choose|pick|which|what should|help|recommend)\b/.test(m),
    reply:
`**Operational career paths in TrainPi**

The five tracks are mapped to real workforce roles — not abstract titles.

• **Cybersecurity Analyst** — General-purpose enterprise security. Endpoint, identity, phishing, vuln mgmt.
• **SOC Analyst (Tier 1/2)** — Shift-based alert triage. SIEM, ticketing, escalation playbooks.
• **IT Support → Cyber Transition** — Leverages help-desk and Windows admin experience. Lowest barrier from existing IT roles.
• **IAM Specialist** — Identity lifecycle, MFA admin, access reviews, PAM. Heavy on AD/Entra/Okta.
• **AI Business Analyst** — Bridges security and AI. Maps workflows to AI tools, requirements, governance.

**How to pick**
1. Open the **Operational Readiness Score** dashboard — see where your strengths already cluster.
2. Run **Resume Analysis** — it'll tell you which path closes the fewest gaps.
3. Pick one, generate a roadmap, and run a scenario to gut-check the fit.

Which one sounds closest to what you want? I'll deep-dive that role.`,
  },

  // Weekly plan
  {
    test: (m) => /\b(weekly|week|plan|schedule|study)\b/.test(m),
    reply:
`**4-week operational readiness plan (analyst path)**

**Week 1 — Foundations + log fluency**
• Mon: Windows event logs — read 50 lines, label them.
• Wed: Linux basics — \`grep\`, \`tail\`, \`/var/log\` walk.
• Fri: One phishing scenario, end-to-end.
*Deliverable:* short writeup of one log anomaly.

**Week 2 — Identity & MFA**
• MFA fatigue, impossible travel, session token theft.
• Run the MFA scenario from /scenarios.
*Deliverable:* triage notes for two simulated logins.

**Week 3 — Ticket workflow**
• Severity classification, escalation criteria, analyst notes.
• Read 10 sample tickets — rewrite the 3 weakest.
*Deliverable:* one full ticket you'd hand off to Tier 2.

**Week 4 — Operational assessment**
• Run the Operational Readiness Assessment.
• Address the top 2 gaps it flags.
• Update your resume with the operational language you learned.
*Deliverable:* updated readiness score + interview-ready scenario answers.

Set this as your weekly goal on the dashboard. Want me to break Week 1 into daily tasks?`,
  },

  // Resume
  {
    test: (m) => /\b(resume|cv)\b/.test(m),
    reply:
`**Resume guidance — operational, not cosmetic**

Recruiters skim for *operational vocabulary*, not job titles. Rewrite bullets in this shape:

❌ *"Helped with security incidents."*
✅ *"Triaged 30+ phishing alerts in SIEM weekly; escalated 4 confirmed credential-compromise tickets to Tier 2 with full IOC documentation."*

**What to add right now**
1. Tools you've actually touched: SIEM name, EDR name, ticketing system.
2. Workflows you've run: phishing investigation, MFA alert triage, ticket escalation.
3. Outcomes: tickets closed, mean time to triage, escalations done correctly.

**Upload your resume in /profile** — TrainPi will return:
• Your current operational readiness level (Beginner / Developing / Operational)
• 3-5 specific operational gaps mapped to a target role
• The single highest-priority gap to close first

Want me to walk you through what a strong SOC-analyst bullet looks like?`,
  },

  // Greetings
  {
    test: (m) => /^\s*(hi|hello|hey|yo|sup|good (morning|afternoon|evening))\b/.test(m),
    reply:
`Hi — I'm your AI Operational Readiness Mentor.

I help you become workforce-ready, not just course-complete. Tell me:

• Your **target role** (e.g. SOC Analyst, IAM Specialist, IT-to-Cyber transition)
• Your **current background** (tools, OS, prior security exposure)

Or jump into one of these:
• "Analyze my readiness for a SOC Analyst role"
• "Walk me through a phishing investigation"
• "What does MFA/IAM mean operationally?"
• "Build me a 4-week analyst plan"`,
  },

  // Help
  {
    test: (m) => /\b(help|what can you|capabilities|what do you do)\b/.test(m),
    reply:
`I'm an **AI Operational Readiness Mentor** — I help you become job-ready for real security/IT roles.

**I can help with:**
• **Readiness assessment** — Where you are vs. where a real role expects you to be.
• **Operational workflows** — Phishing, MFA/IAM, ticketing, incident response, log analysis.
• **Role-specific gaps** — What's blocking you from SOC Analyst / IAM / IT-to-Cyber.
• **Practice scenarios** — Interactive walkthroughs of real analyst decisions.
• **Resume coaching** — Operational vocabulary, not motivational fluff.

Ask me anything — I'll respond in the structured "readiness → gaps → next actions → scenario" format.`,
  },

  // Thanks
  {
    test: (m) => /\b(thanks|thank you|appreciate|cheers)\b/.test(m),
    reply:
`You're welcome. Two things you can do next:

1. Open **Operational Readiness Score** to see your current level.
2. Try the **MFA Fatigue Scenario** in /scenarios — it takes 6 minutes and shows you how analysts actually think.

Ping me when you want a debrief.`,
  },
]

const DEFAULT_REPLY =
`I'm your **AI Operational Readiness Mentor**. I respond best when you tell me:

• **What role you're targeting** (SOC Analyst, Cybersecurity Analyst, IAM Specialist, IT-to-Cyber, AI Business Analyst).
• **Your current background** (tools you've used, OS, prior security exposure).

Try one of these:
• "Analyze my readiness for a SOC Analyst role."
• "Walk me through a phishing investigation."
• "What's the difference between MFA fatigue and impossible travel?"
• "Build me a 4-week analyst plan."

I'll always answer with: current level → strengths → gaps → next actions → a practice scenario.`

export function getMockChatResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase().trim()
  for (const m of matchers) {
    if (m.test(msg)) return m.reply
  }
  return DEFAULT_REPLY
}
