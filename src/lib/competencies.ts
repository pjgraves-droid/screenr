export interface Competency {
  rank: number;
  name: string;
  category: "CRITICAL" | "HIGH" | "IMPORTANT" | "NICE_TO_HAVE";
  foundersFundPrinciple: string;
  cognitionSignal: string;
  description: string;
  questions: string[];
}

export const competencies: Competency[] = [
  {
    rank: 1,
    name: "Founder Mentality / Builder DNA",
    category: "CRITICAL",
    foundersFundPrinciple: "Seek outlier founders",
    cognitionSignal: "21 of 35 employees are ex-founders",
    description:
      "Acts like an owner, not a manager. Builds from zero. Takes accountability without being asked. Will do three jobs at once.",
    questions: [
      "Have you ever built a business unit, team, or function from scratch (not inherited one)? What was the starting point and what did it become?",
      "When was the last time you personally did work that was 'below your pay grade' because it needed to get done?",
      "If you joined Cognition tomorrow and had zero infrastructure, zero team, and zero pipeline - what would your first 30 days look like?",
    ],
  },
  {
    rank: 2,
    name: "Intensity & Work Ethic",
    category: "CRITICAL",
    foundersFundPrinciple: "Concentrate maniacally",
    cognitionSignal:
      "80+ hr weeks, 6 days in-office, 'we don't believe in work-life balance'",
    description:
      "Capacity for sustained, extreme output. Not just willing - energized by the grind. This is the explicit cultural filter.",
    questions: [
      "What does a typical work week look like for you in terms of hours? Be honest - what's your peak sustainable intensity?",
      "How would your family or partner describe your relationship with work? Would they say you're energized by long hours, or that it takes a toll?",
      "Describe a period where you worked at an extreme level for an extended time. What drove you, and how did it end?",
    ],
  },
  {
    rank: 3,
    name: "First-Principles / Contrarian Thinking",
    category: "CRITICAL",
    foundersFundPrinciple: "Counterposition; Avoid mimicry",
    cognitionSignal: "IOI gold medalist founders; anti-playbook culture",
    description:
      "Can invert conventional wisdom. Doesn't copy playbooks - designs new ones. Thiel's question: 'What truth do few agree with you on?'",
    questions: [
      "Give an example where you held a view about your market or product strategy that most people in your organization disagreed with - and you turned out to be right.",
      "Peter Thiel's question: 'What truth about enterprise software sales do very few people agree with you on?'",
      "When was the last time you changed your mind about something fundamental in your industry? What caused the shift?",
    ],
  },
  {
    rank: 4,
    name: "Technical Fluency (AI / Product)",
    category: "HIGH",
    foundersFundPrinciple: "Process-light, content-heavy",
    cognitionSignal:
      "Devin's 3-layer architecture; Kevin-32B model; DeepWiki",
    description:
      "Can credibly discuss AI architectures, agent workflows, and the sync/async paradigm with engineering-minded buyers. Not a tourist.",
    questions: [
      "Could you explain to a CTO how Devin's architecture differs from Codex or Claude Code - covering the agent harness, sandbox environment, and async vs. sync paradigm? Rate your confidence 1-10.",
      "How do you currently stay current on AI/ML developments? What's the last technical concept you taught yourself?",
      "If a prospect's VP of Engineering challenged you on why Devin isn't just a 'wrapper around Claude', how would you respond?",
    ],
  },
  {
    rank: 5,
    name: "Enterprise Sales Execution",
    category: "HIGH",
    foundersFundPrinciple: "Execution is table stakes",
    cognitionSignal:
      "Goldman, Citi, Dell, Cisco as customers; $150M+ ARR",
    description:
      "Proven track record closing 7-figure deals with complex, multi-stakeholder procurement. Can build pipeline from zero.",
    questions: [
      "What's the largest deal you've personally closed (ACV)? Walk through the stakeholders involved and cycle time.",
      "Have you ever built a sales pipeline from zero in a new territory or market? What was revenue at month 6 vs. month 18?",
      "Describe your approach to multi-threading an enterprise deal. How many stakeholders do you typically engage, and how?",
    ],
  },
  {
    rank: 6,
    name: "Cerebral Competitiveness",
    category: "HIGH",
    foundersFundPrinciple: "Select for cerebral competitiveness",
    cognitionSignal:
      "Engineering interview = build your own Devin in 8 hours",
    description:
      "Intellectually driven to win. Competes on depth of thought, not just effort. Treats business as a high-stakes intellectual game.",
    questions: [
      "How would you rank yourself against other enterprise sales leaders you've worked alongside - top 5%, top 25%, or somewhere else? Why?",
      "What do you actively do to sharpen your competitive edge - reading, communities, frameworks, coaching?",
      "Tell me about a deal you lost. What did you learn, and how did it change your approach?",
    ],
  },
  {
    rank: 7,
    name: "Value Translation / Storytelling",
    category: "IMPORTANT",
    foundersFundPrinciple: "Content over process",
    cognitionSignal:
      "AI must translate to 'reduce migration time by 85%'",
    description:
      "Translates deep technical capability into quantified business outcomes for skeptical CxOs in regulated industries.",
    questions: [
      "Give your 60-second pitch for Devin to a skeptical CFO at an ASX-listed bank who's been burned by AI hype.",
      "How do you quantify ROI for a product that's creating a new category where there's no established benchmark?",
      "What's the difference between selling features vs. selling transformation? Give an example from your career.",
    ],
  },
  {
    rank: 8,
    name: "Speed of Adaptation",
    category: "IMPORTANT",
    foundersFundPrinciple: "Hire young, groom for leadership",
    cognitionSignal:
      "Landscape changes weekly; Cursor at $2B ARR; model labs releasing agents",
    description:
      "Updates mental models in real-time. Comfortable with incomplete information. Half-life of knowledge here is months.",
    questions: [
      "Tell me about a time the competitive landscape shifted dramatically mid-quarter. What did you do in the first 48 hours?",
      "How quickly can you context-switch between strategic priorities? Give a concrete example.",
      "The AI coding tools market changes weekly. How would you keep your sales motion current when the product evolves faster than your pitch deck?",
    ],
  },
  {
    rank: 9,
    name: "Category Creation / Missionary Selling",
    category: "IMPORTANT",
    foundersFundPrinciple: "Avoid mimicry; escape competition",
    cognitionSignal:
      "Devin is a new category - autonomous AI engineer, not a copilot",
    description:
      "Educates before selling. Builds narratives around a future state buyers haven't imagined. Creates new budget lines.",
    questions: [
      "Have you ever sold a product where there was no existing budget line or established category? How did you create urgency?",
      "What's the difference between selling UiPath RPA (established category) vs. selling Devin (new category) in your mind?",
      "How would you handle a prospect who says 'We'll wait 12 months until this technology matures'?",
    ],
  },
  {
    rank: 10,
    name: "Talent Magnetism / Network",
    category: "NICE_TO_HAVE",
    foundersFundPrinciple: "Outlier founders attract outliers",
    cognitionSignal:
      "Best executives serve as 'beacons for talent' (a16z)",
    description:
      "Can rapidly recruit a high-performing team by tapping networks. Top candidates are available for only ~10 days.",
    questions: [
      "If Cognition asked you to build an ANZ/APAC enterprise team in 90 days, how many strong candidates could you reach out to from your existing network?",
      "Have you ever been the reason someone joined a company - not because of the brand, but because of you?",
      "How do you think about building a team culture within a larger organization that has its own strong (and intense) culture?",
    ],
  },
];

export const categoryLabels: Record<Competency["category"], string> = {
  CRITICAL: "Critical / Non-negotiable",
  HIGH: "High Importance",
  IMPORTANT: "Important",
  NICE_TO_HAVE: "Nice to Have",
};

export const categoryColors: Record<Competency["category"], string> = {
  CRITICAL: "bg-red-100 text-red-800 border-red-200",
  HIGH: "bg-orange-100 text-orange-800 border-orange-200",
  IMPORTANT: "bg-blue-100 text-blue-800 border-blue-200",
  NICE_TO_HAVE: "bg-gray-100 text-gray-800 border-gray-200",
};

export const scoringGuide = [
  { range: "9-10", level: "Exceptional", description: "Best-in-class evidence. Would be a standout even at Cognition's bar." },
  { range: "7-8", level: "Strong", description: "Clear, proven evidence with specific examples. Meets the Cognition standard." },
  { range: "5-6", level: "Developing", description: "Some evidence but gaps in depth, recency, or relevance. Addressable with preparation." },
  { range: "3-4", level: "Emerging", description: "Limited evidence. Requires significant development or reframing before interview." },
  { range: "1-2", level: "Gap", description: "No meaningful evidence. Potential risk area that needs a mitigation strategy." },
];
