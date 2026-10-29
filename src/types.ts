export type ContactInfo = {
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
};

export type WorkExperienceEntry = {
  role: string;
  company: string;
  period: string;
  location?: string;
  summary: string;
  highlights: string[];
};

export type ProjectEntry = {
  name: string;
  period?: string;
  description: string;
  highlights: string[];
};

export type EducationEntry = {
  degree: string;
  school: string;
  period: string;
  details?: string;
};

export type CertificationEntry = {
  name: string;
  issuer?: string;
  period?: string;
};

export type StructuredResumeReport = {
  professionalSummary: string;
  contactInformation: ContactInfo;
  technicalSkills: string[];
  softSkills: string[];
  workExperience: WorkExperienceEntry[];
  projects: ProjectEntry[];
  education: EducationEntry[];
  certifications: CertificationEntry[];
  majorFindings: string[];
  missingSkills: string[];
  improvementSuggestions: string[];
};

export type Skill = {
  name: string;
  category: 'Technical' | 'Soft' | 'Experience' | 'Tools';
  level: number;
  confidence: number;
  evidence?: string;
};

export type SkillGap = {
  skill: string;
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
  required: boolean;
  detected: boolean;
  progress: number;
};

export type ResumeProfile = {
  name: string;
  targetRole: string;
  experienceLevel: string;
  preferredIndustry: string;
  skills: Skill[];
  summary: string;
};

export type ResumeAnalysis = {
  rawText: string;
  score: number;
  atsReadiness: number;
  skillsMatch: number;
  jobCompatibility: number;
  recommendedImprovements: number;
  summary: string;
  profile: ResumeProfile;
  strengths: string[];
  missingSkills: SkillGap[];
  jobRecommendations: JobRecommendation[];
  learningSuggestions: LearningRecommendation[];
  resumeSuggestions: ResumeSuggestion[];
  actionPlan: ActionPlanItem[];
  skillDistribution: { name: string; value: number }[];
  structuredReport: StructuredResumeReport;
};

export type JobRecommendation = {
  id: string;
  title: string;
  industry: string;
  experience: string;
  skills: string[];
  match: number;
  matchingSkills: string[];
  missingSkills: string[];
  explanation: string;
  saved?: boolean;
};

export type LearningRecommendation = {
  id: string;
  skill: string;
  why: string;
  sequence: string;
  time: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  projectIdeas: string[];
  resources: { label: string; url: string }[];
};

export type ResumeSuggestion = {
  section: string;
  issue: string;
  why: string;
  recommendation: string;
  example: string;
  accepted?: boolean;
};

export type ActionPlanItem = {
  id: string;
  title: string;
  category: 'High priority' | 'Skills' | 'Projects' | 'Resume' | 'Interview';
  done: boolean;
};
