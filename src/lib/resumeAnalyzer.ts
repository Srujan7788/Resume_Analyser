import type { ResumeAnalysis, Skill, SkillGap, ActionPlanItem, ResumeSuggestion, LearningRecommendation, JobRecommendation, ResumeProfile, StructuredResumeReport } from '../types';
import { sampleResumeData } from '../data/sampleResume';

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const extractEmails = (text: string): string[] => [...text.matchAll(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g)].map((match) => match[1]);
const extractPhones = (text: string): string[] => [...text.matchAll(/(?:\+?\d[\d\s().-]{7,}\d)/g)].map((match) => match[0].replace(/\s+/g, ' ').trim());
const extractLinks = (text: string): string[] => [...text.matchAll(/https?:\/\/[^\s]+|www\.[^\s]+/gi)].map((match) => match[0]);

const splitIntoSections = (text: string): string[] => {
  const normalized = text
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const segments = normalized.split(/\n\s*\n+/).map((segment) => normalizeWhitespace(segment)).filter(Boolean);
  return segments.length > 0 ? segments : [normalizeWhitespace(text)];
};

const detectProfessionalSummary = (sections: string[]): string => {
  const summaryCandidates = sections.filter((section) => {
    const lower = section.toLowerCase();
    return lower.includes('summary') || lower.includes('profile') || lower.includes('about') || lower.includes('experience') || lower.includes('developer') || lower.includes('engineer');
  });

  if (summaryCandidates.length > 0) {
    const summary = summaryCandidates[0];
    return summary.replace(/^(summary|profile|about)\s*:?\s*/i, '');
  }

  return sections[0] || 'Experienced professional with a strong focus on product quality, collaboration, and measurable results.';
};

const detectContactInfo = (text: string) => {
  const emails = extractEmails(text);
  const phones = extractPhones(text);
  const links = extractLinks(text);
  const website = links.find((link) => /https?:\/\//.test(link) || /linkedin|github|portfolio|dev/i.test(link));

  return {
    email: emails[0],
    phone: phones[0],
    location: /\b(?:[A-Z][a-z]+,\s*[A-Z]{2}|[A-Z][a-z]+\s+[A-Z][a-z]+,\s*[A-Z]{2}|[A-Z][a-z]+\s+[A-Z][a-z]+)\b/.test(text) ? text.match(/\b(?:[A-Z][a-z]+,\s*[A-Z]{2}|[A-Z][a-z]+\s+[A-Z][a-z]+,\s*[A-Z]{2}|[A-Z][a-z]+\s+[A-Z][a-z]+)\b/)?.[0] : undefined,
    website: website,
    linkedin: links.find((link) => /linkedin/i.test(link)),
    github: links.find((link) => /github/i.test(link))
  };
};

const detectSkills = (text: string, category: 'technical' | 'soft'): string[] => {
  const technical = ['React', 'TypeScript', 'JavaScript', 'Node.js', 'Node', 'HTML', 'CSS', 'Tailwind', 'UI', 'UX', 'Git', 'SQL', 'Python', 'Figma', 'Testing', 'Accessibility', 'Design Systems', 'Performance Optimization'];
  const soft = ['Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Collaboration', 'Documentation', 'Mentoring', 'Adaptability'];

  const pool = category === 'technical' ? technical : soft;
  const lowerText = text.toLowerCase();

  return pool.filter((skill) => lowerText.includes(skill.toLowerCase()));
};

const parseWorkExperience = (text: string): any[] => {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const entries: any[] = [];

  for (const line of lines) {
    if (/\b(Software|Frontend|Developer|Engineer|Manager|Analyst|Designer|Product)\b/i.test(line) && /(\b(at|@|with)\b|\binc\b|\bllc\b|\bco\b)/i.test(line)) {
      entries.push({
        role: line.split(/\s+-\s+|\s+at\s+|\s+@\s+/i)[0] || 'Role',
        company: line.match(/(?:at|@)\s+([A-Z][A-Za-z0-9.& ]+)/i)?.[1] || 'Company',
        period: '2019 – Present',
        summary: 'Product and engineering contribution in a collaborative environment.',
        highlights: ['Delivered high-quality product work', 'Worked closely with cross-functional teams']
      });
    }
  }

  if (entries.length === 0) {
    return [{
      role: 'Frontend Engineer',
      company: 'Product Team',
      period: 'Recent experience',
      summary: 'Built and refined user-facing interfaces with a focus on clean implementation and usability.',
      highlights: ['Improved user experience', 'Collaborated with product and design partners']
    }];
  }

  return entries;
};

const parseProjects = (text: string): any[] => {
  const projectKeywords = ['project', 'portfolio', 'dashboard', 'platform', 'application'];
  const lowerText = text.toLowerCase();

  if (projectKeywords.some((keyword) => lowerText.includes(keyword))) {
    return [{
      name: 'Product Experience Project',
      period: 'Recent work',
      description: 'Built an interactive product experience with a focus on performance, responsiveness, and usability.',
      highlights: ['Improved interfaces and interaction quality', 'Worked with a product-oriented design and engineering workflow']
    }];
  }

  return [];
};

const parseEducation = (text: string): any[] => {
  const degrees = ['bachelor', 'master', 'degree', 'bsc', 'ba', 'b.e.', 'b.tech', 'computer science'];
  if (degrees.some((degree) => text.toLowerCase().includes(degree))) {
    return [{
      degree: 'Bachelor\'s / Relevant Degree',
      school: 'University or Institution',
      period: 'Year – Year',
      details: 'Focused on technology, design, or quantitative problem solving.'
    }];
  }

  return [];
};

const parseCertifications = (text: string): any[] => {
  const certKeywords = ['certified', 'aws', 'google', 'meta', 'scrum', 'azure'];
  const lowerText = text.toLowerCase();

  if (certKeywords.some((keyword) => lowerText.includes(keyword))) {
    return [{
      name: 'Relevant Professional Certification',
      issuer: 'Industry provider',
      period: 'Recent'
    }];
  }

  return [];
};

const buildStructuredResumeReport = (text: string): StructuredResumeReport => {
  const sections = splitIntoSections(text);
  const summary = detectProfessionalSummary(sections);

  return {
    professionalSummary: summary,
    contactInformation: detectContactInfo(text),
    technicalSkills: detectSkills(text, 'technical'),
    softSkills: detectSkills(text, 'soft'),
    workExperience: parseWorkExperience(text),
    projects: parseProjects(text),
    education: parseEducation(text),
    certifications: parseCertifications(text),
    majorFindings: [
      'Strong product and frontend-oriented foundation',
      'Clear communication and collaboration strengths',
      'Focus on measurable experience and skill depth can improve clarity'
    ],
    missingSkills: ['Accessibility testing', 'Design systems', 'Performance optimization'],
    improvementSuggestions: [
      'Add measurable project outcomes and impact metrics.',
      'Highlight key technologies and business outcomes in a focused summary.',
      'Separate work experience and education into clearly formatted entries.'
    ]
  };
};

export const createSkillSet = (text: string): Skill[] => {
  const lowerText = text.toLowerCase();
  const skills: Skill[] = [
    { name: 'React', category: 'Technical', level: 86, confidence: 88 },
    { name: 'JavaScript', category: 'Technical', level: 88, confidence: 90 },
    { name: 'TypeScript', category: 'Technical', level: 80, confidence: 85 },
    { name: 'HTML', category: 'Technical', level: 86, confidence: 92 },
    { name: 'CSS', category: 'Technical', level: 82, confidence: 88 },
    { name: 'Communication', category: 'Soft', level: 77, confidence: 80 },
    { name: 'Problem Solving', category: 'Soft', level: 84, confidence: 89 },
    { name: 'Team Collaboration', category: 'Soft', level: 76, confidence: 79 },
    { name: 'Git', category: 'Tools', level: 80, confidence: 85 },
    { name: 'UI Design', category: 'Technical', level: 72, confidence: 74 }
  ];

  const detected = skills.filter((skill) => lowerText.includes(skill.name.toLowerCase()));

  return detected.length > 0 ? detected : sampleResumeData.skills;
};

export const analyzeResume = (text: string, targetRole: string): ResumeAnalysis => {
  const normalizedText = normalizeWhitespace(text || sampleResumeData.summary);
  const skillSet = createSkillSet(normalizedText);
  const totalSkills = skillSet.length;
  const score = Math.max(68, Math.min(96, 72 + totalSkills * 2 + (targetRole.toLowerCase().includes('frontend') ? 8 : 4)));
  const atsReadiness = Math.max(70, Math.min(98, score - 3));
  const skillsMatch = Math.max(60, Math.min(96, 68 + Math.round((skillSet.length / 10) * 16)));
  const jobCompatibility = Math.max(62, Math.min(95, skillsMatch + 3));
  const recommendedImprovements = 6;

  const missingSkills: SkillGap[] = [
    { skill: 'Accessibility testing', priority: 'High', reason: 'Improves inclusive UI quality and helps pass user-centric evaluation.', required: true, detected: false, progress: 35 },
    { skill: 'Design systems', priority: 'High', reason: 'Critical for front-end consistency and maintainability in product teams.', required: true, detected: false, progress: 42 },
    { skill: 'Performance optimization', priority: 'Medium', reason: 'Supports smooth product experiences and technical polish.', required: true, detected: false, progress: 52 },
    { skill: 'Testing frameworks', priority: 'Medium', reason: 'Important for production-ready front-end delivery.', required: false, detected: false, progress: 48 },
    { skill: 'API integration strategy', priority: 'Low', reason: 'Useful when connecting product interfaces to business data.', required: false, detected: false, progress: 60 }
  ];

  const profile: ResumeProfile = {
    name: 'Demo Candidate',
    targetRole,
    experienceLevel: 'Mid-level',
    preferredIndustry: 'Technology',
    skills: skillSet,
    summary: normalizedText
      ? 'Candidate appears to have a solid foundation in frontend work with strong technical and communication skills, with opportunities to deepen performance, testing, and accessibility knowledge.'
      : 'Local demo analysis is shown because no resume text was extracted. This sample profile is intended for UI exploration and does not represent a real candidate.'
  };

  const jobRecommendations: JobRecommendation[] = [
    {
      id: 'job-1',
      title: 'Frontend Developer',
      industry: 'Software',
      experience: 'Mid-level',
      skills: ['React', 'TypeScript', 'UX', 'Responsive UI'],
      match: 92,
      matchingSkills: ['React', 'TypeScript', 'CSS'],
      missingSkills: ['Accessibility testing', 'Design systems'],
      explanation: 'Best fit because the profile already demonstrates skills in modern frontend implementation and interface quality.'
    },
    {
      id: 'job-2',
      title: 'Product Designer',
      industry: 'Design',
      experience: 'Mid-level',
      skills: ['Figma', 'UX Research', 'Prototyping', 'Design Thinking'],
      match: 84,
      matchingSkills: ['UI Design', 'Problem Solving'],
      missingSkills: ['User research', 'Rapid prototyping'],
      explanation: 'A meaningful adjacent role where your visual and product-thinking strengths matter.'
    },
    {
      id: 'job-3',
      title: 'UI Engineer',
      industry: 'Technology',
      experience: 'Mid-level',
      skills: ['React', 'CSS', 'Accessibility', 'Performance'],
      match: 89,
      matchingSkills: ['React', 'CSS', 'JavaScript'],
      missingSkills: ['Testing automation', 'Design tokens'],
      explanation: 'Strong technical alignment for a product-focused front-end engineering role.'
    }
  ];

  const learningSuggestions: LearningRecommendation[] = [
    {
      id: 'learn-1',
      skill: 'Accessibility Testing',
      why: 'Helps make interfaces usable and compliant across assistive technologies.',
      sequence: '1. Learn fundamentals 2. Practice keyboard flows 3. Validate with automated checks',
      time: '2-3 weeks',
      difficulty: 'Intermediate',
      projectIdeas: ['Build a dashboard with keyboard navigation', 'Audit a component library for contrast and focus states'],
      resources: [
        { label: 'MDN Accessibility', url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility' },
        { label: 'WebAIM', url: 'https://webaim.org/' }
      ]
    },
    {
      id: 'learn-2',
      skill: 'Design Systems',
      why: 'Improves consistency and collaboration across product teams and UI surfaces.',
      sequence: '1. Explore token strategy 2. Create reusable components 3. Document usage patterns',
      time: '3 weeks',
      difficulty: 'Intermediate',
      projectIdeas: ['Build a small design token library', 'Refactor an app into shared components'],
      resources: [
        { label: 'Figma Design Systems', url: 'https://www.figma.com/resource-library/design-systems/' },
        { label: 'Material Design', url: 'https://m3.material.io/' }
      ]
    }
  ];

  const resumeSuggestions: ResumeSuggestion[] = [
    {
      section: 'Professional summary',
      issue: 'Summary is too generic',
      why: 'Has limited impact without showing measurable product contributions or focus areas.',
      recommendation: 'Add a sharper summary that mentions the target role, primary stack, and user-facing outcomes.',
      example: 'Frontend engineer with experience building accessible, responsive user interfaces in fast-paced product teams. Skilled in React, TypeScript, and design systems, with a focus on usability, performance, and collaborative execution.'
    },
    {
      section: 'Skills section',
      issue: 'Missing keyword context',
      why: 'Recruiters and ATS systems look for role-matched keywords such as accessibility and performance.',
      recommendation: 'Surface relevant keywords and pair them with implementation examples.',
      example: 'Skills: React, TypeScript, JavaScript, UI Architecture, Accessibility, Performance Optimization, Design Systems.'
    }
  ];

  const actionPlan: ActionPlanItem[] = [
    { id: 'plan-1', title: 'Add measurable impact statements to the summary', category: 'Resume', done: false },
    { id: 'plan-2', title: 'Learn accessibility testing fundamentals', category: 'Skills', done: false },
    { id: 'plan-3', title: 'Build a small design-system dashboard project', category: 'Projects', done: false },
    { id: 'plan-4', title: 'Practice behavioral stories for product interviews', category: 'Interview', done: false },
    { id: 'plan-5', title: 'Polish resume formatting and keywords', category: 'High priority', done: false }
  ];

  const distribution = [
    { name: 'Frontend', value: 36 },
    { name: 'Product', value: 22 },
    { name: 'Communication', value: 18 },
    { name: 'Research', value: 14 },
    { name: 'Leadership', value: 10 }
  ];

  return {
    rawText: normalizedText,
    score: Math.round(score),
    atsReadiness: Math.round(atsReadiness),
    skillsMatch: Math.round(skillsMatch),
    jobCompatibility: Math.round(jobCompatibility),
    recommendedImprovements,
    summary:
      'Estimated assessment based on the available resume text and mock analysis rules. This score should be used as a directional guide, not as a guaranteed ATS outcome.',
    profile,
    strengths: ['Modern frontend stack understanding', 'Effective communication', 'Strong product-oriented thinking'],
    missingSkills,
    jobRecommendations,
    learningSuggestions,
    resumeSuggestions,
    actionPlan,
    skillDistribution: distribution,
    structuredReport: buildStructuredResumeReport(normalizedText)
  };
};
