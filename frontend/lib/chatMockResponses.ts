/**
 * Assumed / mock AI replies for demo when backend or API key is not available.
 * Replies are based on common user questions so the chat feels real.
 */

export function getMockChatResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase().trim()

  if (msg.includes('career') && (msg.includes('choose') || msg.includes('path') || msg.includes('help'))) {
    return `Great question! Based on your interests, I'd suggest exploring these paths:\n\n• **Software Engineer** — if you enjoy building products and coding.\n• **Data Analyst** — if you love numbers and storytelling with data.\n• **AI Engineer** — if you're curious about ML and automation.\n\nGo to Dashboard → Select Career Path to lock in your choice. You can change it anytime. Want a weekly plan for one of these?`
  }

  if (msg.includes('weekly') && (msg.includes('plan') || msg.includes('goal'))) {
    return `Here’s a simple weekly plan you can start with:\n\n**Week 1:**\n• Mon–Wed: 1 lesson each day (fundamentals)\n• Thu: Practice problem set\n• Fri: Review + 1 micro-lesson\n\n**Week 2 onward:**\n• Aim for 3–5 lessons per week (you can set this in “Set Weekly Goal” on the dashboard).\n• Mix reading, practice, and one small project.\n\nI recommend setting your weekly goal to 3 lessons to stay consistent without burnout. Want to focus on a specific skill next?`
  }

  if (msg.includes('skill') && (msg.includes('learn') || msg.includes('first') || msg.includes('focus'))) {
    return `Focus on these first, in order:\n\n1. **Basics of your path** — e.g. programming fundamentals or data basics.\n2. **One main tool** — e.g. React for front-end, Python for data/AI.\n3. **Practice** — use Practice Problems and Gamified Learning on the dashboard.\n\nCheck **Personalized Learning** to see how we’ve adapted to your style, and **Job Readiness** to see what’s left before you’re “job ready”. Want a checklist for your chosen career?`
  }

  if (msg.includes('roadmap') || msg.includes('step') || msg.includes('next')) {
    return `Your roadmap progress is on the dashboard. Next steps:\n\n1. Complete **Step 1** of your career path (fundamentals).\n2. Do at least one **Practice Problem** and one **Gamified** challenge this week.\n3. Update your **Job Readiness** — resume and projects.\n\nYou can open **Career Path Progress** on the dashboard to see the full roadmap. Need a weekly plan tailored to your path?`
  }

  if (msg.includes('resume') || msg.includes('job ready') || msg.includes('apply')) {
    return `To get job-ready:\n\n• **Job Readiness** (dashboard) — see your checklist: career path, roadmap %, resume, projects.\n• **Resume** — upload and optimize in the Resume section; we’ll suggest improvements.\n• **Practice & Gamified** — complete challenges so you can talk about them in interviews.\n\nAim for 80%+ roadmap completion and at least one project before applying. Want a short interview-prep checklist?`
  }

  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return `Hi! I'm your AI Career Mentor. You can ask me about:\n\n• Choosing a career path\n• Weekly plans and goals\n• Which skills to learn first\n• Your roadmap and next steps\n• Job readiness and resume\n\nWhat would you like to work on today?`
  }

  if (msg.includes('thank')) {
    return `You're welcome! If you need more help with your plan, skills, or job readiness, just ask. Good luck! 🚀`
  }

  if (msg.includes('help') || msg.includes('what can you')) {
    return `I can help you with:\n\n• **Career path** — choosing and changing your path\n• **Weekly plans** — building a sustainable study schedule\n• **Skills** — what to learn first and in what order\n• **Roadmap** — next steps and progress\n• **Job readiness** — resume, projects, and applying\n\nAsk anything in your own words — e.g. “Help me choose a career” or “Create a weekly plan”.`
  }

  // Default: friendly assumed reply
  return `I’m here to help with your career path, weekly goals, and skills. Try asking:\n\n• “Help me choose a career path”\n• “Create a weekly plan”\n• “What skills should I learn first?”\n\nOr describe what you want to achieve and I’ll guide you step by step.`
}
