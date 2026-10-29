import { Routes, Route } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Download,
  FileText,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  MessageSquareText,
  Search,
  Settings,
  Sparkles,
  Star,
  Target,
  Upload,
  BookOpen,
  UserRound,
  Lightbulb,
  Bell,
  Menu,
  X,
  CloudUpload,
  FileCheck2,
  BriefcaseBusiness,
  Wand2,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  Check,
  Plus,
  Filter,
  BadgeCheck,
  BrainCircuit,
  PenLine,
  Clock3,
  ListChecks,
  Save,
  FolderOpen,
  Trash2,
  Info,
  CircleDashed
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line
} from 'recharts';
import { getRecommendedJobs } from './lib/jobRecommendationEngine';
import { analyzeResume } from './lib/resumeAnalyzer';
import { sampleResumeData } from './data/sampleResume';
import { learningRoadmap } from './lib/learningRecommendationEngine';
import { improvementSections } from './lib/resumeSuggestionEngine';
import { parseResumeFile } from './lib/resumeParser';
import type { ResumeAnalysis, SkillGap, JobRecommendation } from './types';

const navItems = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { label: 'Analyze Resume', path: '/analyzer', icon: Upload },
  { label: 'Analysis Results', path: '/analysis', icon: BarChart3 },
  { label: 'Job Explorer', path: '/jobs', icon: Briefcase },
  { label: 'Learning Roadmap', path: '/learning', icon: BookOpen },
  { label: 'Resume Studio', path: '/improve', icon: PenLine },
  { label: 'Interview Prep', path: '/interview', icon: MessageSquareText },
  { label: 'Settings', path: '/settings', icon: Settings }
];

const defaultAnalysis: ResumeAnalysis = analyzeResume(sampleResumeData.summary, sampleResumeData.targetRole);

const jobFilters = ['All', 'Software', 'Tech', 'Design', 'Analytics', 'Security', 'Marketing', 'Consulting', 'SaaS', 'Operations'];
const experienceFilters = ['All', 'Entry-level', 'Junior', 'Mid-level'];
const skillFilters = ['All', 'React', 'TypeScript', 'SQL', 'Python', 'Figma', 'SEO', 'Communication', 'Excel'];

const allowedResumeExtensions = ['pdf', 'docx', 'doc', 'txt', 'png', 'jpg', 'jpeg'];

const normalizeFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

const getFileTypeLabel = (file: File | undefined) => {
  if (!file) return 'Resume';

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (['png', 'jpg', 'jpeg'].includes(extension)) return 'Image resume';
  if (['pdf'].includes(extension)) return 'PDF resume';
  if (['docx', 'doc'].includes(extension)) return 'Document resume';
  return 'Text resume';
};

const isAllowedResumeFile = (file?: File) => {
  if (!file) return false;

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const mimeType = file.type.toLowerCase();

  return allowedResumeExtensions.includes(extension) ||
    mimeType === 'application/pdf' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    mimeType === 'text/plain' ||
    mimeType === 'image/png' ||
    mimeType === 'image/jpeg';
};

const describeUnsupportedFile = (file?: File) => {
  if (!file) return 'Please choose a supported resume file.';

  const extension = file.name.split('.').pop()?.toLowerCase() || 'unknown';
  return `Unsupported file type ".${extension}". Please upload a PDF, DOCX, DOC, TXT, PNG, JPG, or JPEG resume.`;
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>(['job-2']);
  const [analysis, setAnalysis] = useState<ResumeAnalysis>(defaultAnalysis);
  const [uploadError, setUploadError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [resumeText, setResumeText] = useState(sampleResumeData.summary);
  const [selectedJob, setSelectedJob] = useState('Frontend Developer');
  const [jobDescription, setJobDescription] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const storedJobs = localStorage.getItem('resumind-saved-jobs');
    const storedPrefs = localStorage.getItem('resumind-preferences');
    if (storedJobs) setSavedJobs(JSON.parse(storedJobs));
    if (storedPrefs) {
      const prefs = JSON.parse(storedPrefs);
      if (prefs.targetRole) setSelectedJob(prefs.targetRole);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('resumind-saved-jobs', JSON.stringify(savedJobs));
  }, [savedJobs]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLoadingStage((prev) => (prev + 1) % 4);
    }, 1100);
    return () => clearInterval(timer);
  }, []);

  const handleFileSelect = async (file?: File) => {
    if (!file) return;

    if (!isAllowedResumeFile(file)) {
      setUploadError(describeUnsupportedFile(file));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File exceeds 10MB. Please upload a smaller resume.');
      return;
    }

    setUploadError('');
    setUploadedFileName(file.name);
    setFileSize(normalizeFileSize(file.size));
    setProcessing(true);
    setLoadingStage(0);

    if (file.type.startsWith('image/')) {
      setPreviewImage(URL.createObjectURL(file));
    } else {
      setPreviewImage(null);
    }

    try {
      const parsed = await parseResumeFile(file);
      if (!parsed.text.trim()) {
        setUploadError('We could not extract readable text from this document. Please try a clearer scan, another file, or use the demo analysis option.');
        setProcessing(false);
        return;
      }

      setResumeText(parsed.text);
      setAnalysis(analyzeResume(parsed.text, selectedJob));
    } catch (error) {
      console.error('File processing error', error);
      setUploadError('The selected file could not be processed. Please make sure the resume is readable and try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleAnalyze = () => {
    setProcessing(true);
    setUploadError('');

    const stageSequence = [
      'Reading resume content',
      'Identifying skills and experience',
      'Comparing the resume with target role requirements',
      'Preparing improvement recommendations'
    ];

    let stage = 0;
    const timer = setInterval(() => {
      setLoadingStage(stage);
      stage += 1;
      if (stage > 3) {
        clearInterval(timer);
        const newAnalysis = analyzeResume(resumeText || sampleResumeData.summary, selectedJob || sampleResumeData.targetRole);
        setAnalysis(newAnalysis);
        setProcessing(false);
      }
    }, 1200);
  };

  const handleSaveJob = (jobId: string) => {
    setSavedJobs((prev) => prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]);
  };

  const computedSavedJobs = useMemo(() => getRecommendedJobs().filter((job) => savedJobs.includes(job.id)), [savedJobs]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardShell setSidebarOpen={setSidebarOpen} sidebarOpen={sidebarOpen} analysis={analysis} savedJobs={computedSavedJobs} onSaveJob={handleSaveJob} />} />
        <Route path="/analyzer" element={<AnalyzerPage {...{ selectedJob, setSelectedJob, jobDescription, setJobDescription, uploadError, processing, loadingStage, resumeText, setResumeText, uploadedFileName, fileSize, dragActive, setDragActive, handleFileSelect, handleAnalyze, setSidebarOpen, sidebarOpen, previewImage, getFileTypeLabel }} />} />
        <Route path="/analysis" element={<AnalysisPage analysis={analysis} savedJobs={computedSavedJobs} onSaveJob={handleSaveJob} />} />
        <Route path="/jobs" element={<JobsPage savedJobs={savedJobs} onSaveJob={handleSaveJob} />} />
        <Route path="/learning" element={<LearningPage />} />
        <Route path="/improve" element={<ImprovePage />} />
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="mx-auto max-w-7xl px-6 py-5">
        <nav className="flex items-center justify-between rounded-full border border-slate-800/80 bg-slate-900/60 px-4 py-3 shadow-[0_20px_60px_rgba(15,23,42,0.5)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-400 text-white shadow-glow">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight">RESUMIND AI</div>
            </div>
          </div>
          <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#how-it-works" className="transition hover:text-white">How it works</a>
            <a href="#career-insights" className="transition hover:text-white">Career insights</a>
            <a href="#" className="transition hover:text-white">Sign in</a>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 md:inline-flex">Sign in</button>
            <a href="/analyzer" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(99,102,241,0.45)] transition hover:translate-y-[-1px]">
              Analyze My Resume <ArrowRight size={16} />
            </a>
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-16 pt-6 lg:grid-cols-[1.1fr_0.9fr] lg:pb-24">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-100">
              <Sparkles size={14} /> AI-powered resume intelligence
            </div>
            <div className="space-y-5">
              <h1 className="max-w-xl text-5xl font-black leading-[1.02] tracking-[-0.06em] text-white md:text-6xl">
                Turn Your Resume Into Your Next Opportunity.
              </h1>
              <p className="max-w-xl text-lg text-slate-300">
                RESUMIND AI reads your resume, highlights your strengths, finds skill gaps, recommends relevant roles, and helps you prepare with confidence.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <a href="/analyzer" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-[0_22px_50px_rgba(99,102,241,0.45)]">Analyze My Resume <ArrowRight size={18} /></a>
              <a href="#features" className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/50 px-6 py-3 font-semibold text-slate-200">Explore Features</a>
            </div>
            <div className="flex items-center gap-8 text-sm text-slate-400">
              <div className="flex items-center gap-2"><BadgeCheck size={15} className="text-emerald-400" /> 12k+ career profiles</div>
              <div className="flex items-center gap-2"><BadgeCheck size={15} className="text-emerald-400" /> 94% job-match confidence</div>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative">
            <div className="gradient-border overflow-hidden rounded-[28px] bg-slate-900/80 p-4 shadow-[0_35px_80px_rgba(79,70,229,0.3)]">
              <div className="rounded-[24px] border border-slate-800 bg-slate-950/90 p-4">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Resume insight</p>
                    <h3 className="mt-1 text-2xl font-bold text-white">Profile overview</h3>
                  </div>
                  <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">Live analysis</div>
                </div>

                <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                    <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
                      <div className="absolute inset-0 rounded-full border border-violet-500/20" />
                      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                        <circle cx="60" cy="60" r="52" stroke="rgba(148,163,184,.2)" strokeWidth="8" fill="none" />
                        <circle cx="60" cy="60" r="52" stroke="url(#scoreGradient)" strokeWidth="8" fill="none" strokeDasharray="326" strokeDashoffset="90" strokeLinecap="round" />
                        <defs>
                          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="50%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#22d3ee" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute text-center">
                        <div className="text-3xl font-black text-white">91</div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Score</div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3 text-sm text-slate-300">
                      <div className="flex items-center justify-between"><span>ATS ready</span><span className="font-semibold text-violet-300">92%</span></div>
                      <div className="flex items-center justify-between"><span>Skills match</span><span className="font-semibold text-cyan-300">87%</span></div>
                      <div className="flex items-center justify-between"><span>Job fit</span><span className="font-semibold text-emerald-300">94%</span></div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="text-sm font-medium text-slate-400">Skill alignment</div>
                        <div className="text-xs text-violet-300">Frontend</div>
                      </div>
                      <div className="space-y-3 text-xs text-slate-300">
                        {['React', 'TypeScript', 'UX', 'Accessibility'].map((item, index) => (
                          <div key={item}>
                            <div className="mb-1 flex justify-between"><span>{item}</span><span>{88 - index * 6}%</span></div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400" style={{ width: `${88 - index * 6}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        ['Goal fit', '94%'],
                        ['Missing skills', '4'],
                        ['Learning plan', '3 weeks']
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3">
                          <div className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</div>
                          <div className="mt-1 text-xl font-bold text-white">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">Features</p>
            <h2 className="mt-3 text-4xl font-black text-white">Everything you need to move forward.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[
              ['AI Resume Scoring', 'Paired with role-specific scoring for a realistic signal on readiness and fit.', 'Gauge'],
              ['Skill Gap Detection', 'Pinpoint the exact capabilities that could improve your next application.', 'Target'],
              ['Personalized Job Recommendations', 'Match your background against opportunities and uncover the right role fit.', 'BriefcaseBusiness'],
              ['Learning Roadmaps', 'Turn gaps into a practical next-step plan with time-boxed recommendations.', 'BookOpen'],
              ['Resume Improvement Suggestions', 'Refine summary, skills, and keyword alignment without guessing.', 'PenLine'],
              ['Interview Preparation', 'Practice role-specific questions with framework-based guidance.', 'BrainCircuit']
            ].map(([title, description, iconName]) => {
              const IconMap = {
                Gauge,
                Target,
                BriefcaseBusiness,
                BookOpen,
                PenLine,
                BrainCircuit
              };
              const Icon = IconMap[iconName as keyof typeof IconMap];

              return (
                <div key={title} className="gradient-border rounded-3xl bg-slate-900/70 p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 via-indigo-500/20 to-cyan-400/20 text-violet-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{title}</h3>
                  <p className="mt-2 text-slate-300">{description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">How it works</p>
            <h2 className="mt-3 text-4xl font-black text-white">A smarter path to better opportunities.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              ['Upload your resume', 'Drop in your PDF or DOCX and let the app read your profile locally.', '01'],
              ['Discover your strengths and skill gaps', 'Compare your experience to role requirements and see what stands out.', '02'],
              ['Improve your resume and prepare for opportunities', 'Use tailored suggestions to refine your story and interview readiness.', '03']
            ].map(([title, description, count]) => (
              <div key={count} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 text-lg font-bold text-white">{count}</div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <p className="mt-2 text-slate-300">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="rounded-[30px] border border-slate-800 bg-slate-900/80 p-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">Resume score</p>
                <h2 className="mt-3 text-4xl font-black text-white">Your resume, reviewed.</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {[
                    ['Resume score', '91/100'],
                    ['ATS readiness', '92%'],
                    ['Potential roles', '8']
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-400">{label}</div>
                      <div className="mt-2 text-2xl font-black text-white">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[24px] border border-slate-800 bg-slate-950/70 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">Skill distribution</span>
                  <span className="text-xs text-violet-300">Balanced</span>
                </div>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={defaultAnalysis.skillDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="url(#barGradient)" />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#22d3ee" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        <section id="career-insights" className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Testimonials</p>
            <h2 className="mt-3 text-4xl font-black text-white">Loved by career switchers and job seekers.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              ['“The resume score and job-match view helped me position my experience with clarity and confidence.”', 'Priya S.', 'Product Designer'],
              ['“I discovered missing keywords and examples that gave me a stronger story for my applications.”', 'Daniel T.', 'Frontend Developer'],
              ['“The roadmap made my upskilling realistic and the interview prep was immediately useful.”', 'Maya K.', 'Data Analyst']
            ].map(([quote, name, role]) => (
              <div key={name} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
                <div className="mb-4 flex gap-1 text-amber-400">
                  {[...Array(5)].map((_, index) => <Star key={index} size={16} fill="currentColor" />)}
                </div>
                <p className="text-slate-200">{quote}</p>
                <div className="mt-6 border-t border-slate-800 pt-4">
                  <div className="font-semibold text-white">{name}</div>
                  <div className="text-sm text-slate-400">{role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="rounded-[30px] border border-violet-500/30 bg-gradient-to-r from-violet-500/15 via-indigo-500/10 to-cyan-500/15 p-8 text-center">
            <h2 className="text-4xl font-black text-white">Build a stronger resume. Start with clarity.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-300">Use RESUMIND AI to uncover your strongest fit, strengthen your profile, and prepare for the next opportunity.</p>
            <div className="mt-6 flex justify-center gap-4">
              <a href="/analyzer" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-slate-900">Analyze My Resume</a>
              <a href="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/30 px-6 py-3 font-semibold text-white">View dashboard</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950/80">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-500 text-white"><Sparkles size={16} /></div>
              <span className="text-lg font-black text-white">RESUMIND AI</span>
            </div>
            <p className="mt-4 text-sm text-slate-400">Your resume. Your potential. Your next opportunity.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-400">Product</h4>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li><a href="#features">Features</a></li>
              <li><a href="/dashboard">Dashboard</a></li>
              <li><a href="/jobs">Job Explorer</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-400">Company</h4>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li><a href="#how-it-works">How it works</a></li>
              <li><a href="#career-insights">Career insights</a></li>
              <li><a href="/settings">Settings</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-400">Privacy</h4>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>Local-only processing</li>
              <li>No permanent resume storage</li>
              <li>Demo data by default</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DashboardShell({ setSidebarOpen, sidebarOpen, analysis, savedJobs, onSaveJob }: { setSidebarOpen: (value: boolean) => void; sidebarOpen: boolean; analysis: ResumeAnalysis; savedJobs: JobRecommendation[]; onSaveJob: (id: string) => void; }) {
  const leftSidebar = (
    <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-800 bg-slate-950/95 p-5 transition-transform duration-300 lg:static lg:translate-x-0`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-500 text-white">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="font-black tracking-tight text-white">RESUMIND AI</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Demo workspace</div>
          </div>
        </div>
        <button className="rounded-lg border border-slate-700 p-2 text-slate-200 lg:hidden" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
      </div>

      <nav className="mt-8 space-y-2">
        {navItems.map(({ label, path, icon: Icon }) => (
          <a key={path} href={path} className={`flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-medium ${label === 'Overview' ? 'bg-violet-500/10 text-violet-100' : 'text-slate-300 hover:bg-slate-900/70 hover:text-white'}`}>
            <div className="flex items-center gap-3">
              <Icon size={16} />
              {label}
            </div>
            <ChevronRight size={14} />
          </a>
        ))}
      </nav>

      <div className="mt-auto rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-violet-200">Demo data</p>
        <p className="mt-2 text-sm text-slate-200">Local analysis is an estimate and not a guaranteed ATS result.</p>
      </div>
    </aside>
  );

  const metrics = [
    { label: 'Resume Score', value: `${analysis.score}/100`, color: 'text-violet-300', icon: Gauge },
    { label: 'ATS Readiness', value: `${analysis.atsReadiness}%`, color: 'text-cyan-300', icon: ShieldCheck },
    { label: 'Skills Match', value: `${analysis.skillsMatch}%`, color: 'text-emerald-300', icon: Target },
    { label: 'Job Fit', value: `${analysis.jobCompatibility}%`, color: 'text-pink-300', icon: BriefcaseBusiness }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        {leftSidebar}
        <div className="flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/80 px-4 py-4 backdrop-blur-xl sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button className="rounded-xl border border-slate-700 p-2 text-slate-200 lg:hidden" onClick={() => setSidebarOpen(true)}><Menu size={18} /></button>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Overview</div>
                  <div className="text-xl font-bold text-white">Dashboard</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-200"><Bell size={16} /></button>
                <div className="flex items-center gap-3 rounded-full border border-slate-700 bg-slate-900 px-3 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 font-bold text-white">AM</div>
                  <div className="hidden text-sm sm:block">
                    <div className="font-semibold text-white">Aarav Mehta</div>
                    <div className="text-xs text-slate-400">Career profile</div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="space-y-6 p-4 sm:p-6">
            <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-[28px] border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/40 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Good morning</p>
                    <h2 className="mt-2 text-3xl font-black text-white">Aarav, your resume is trending up.</h2>
                  </div>
                  <a href="/analyzer" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white">
                    <Upload size={16} /> New analysis
                  </a>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {metrics.map(({ label, value, color, icon: Icon }) => (
                    <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-[0.16em] text-slate-400">{label}</span>
                        <Icon size={16} className={color} />
                      </div>
                      <div className={`mt-3 text-2xl font-black ${color}`}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Resume upload</h3>
                  <FileText className="text-violet-300" size={18} />
                </div>
                <div className="rounded-2xl border border-dashed border-violet-500/40 bg-violet-500/5 p-5 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10 text-violet-200"><CloudUpload size={22} /></div>
                  <p className="mt-4 text-sm text-slate-200">Upload PDF, DOCX, or TXT resume</p>
                  <a href="/analyzer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white">Go to analyzer</a>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Resume score breakdown</h3>
                  <div className="text-sm text-violet-300">Estimated snapshot</div>
                </div>
                <div className="space-y-4">
                  {[
                    ['Experience impact', 82],
                    ['Skills alignment', 91],
                    ['ATS optimization', 88],
                    ['Achievement clarity', 74]
                  ].map(([name, value]) => (
                    <div key={name}>
                      <div className="mb-1 flex items-center justify-between text-sm text-slate-200">
                        <span>{name}</span>
                        <span>{value}%</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-800">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Skill distribution</h3>
                  <TrendingUp size={18} className="text-cyan-300" />
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={analysis.skillDistribution}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                      <PolarRadiusAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.45} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Recommended jobs</h3>
                  <a href="/jobs" className="text-sm font-medium text-violet-300">View all</a>
                </div>
                <div className="space-y-3">
                  {analysis.jobRecommendations.map((job) => (
                    <div key={job.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-bold text-white">{job.title}</div>
                          <div className="text-sm text-slate-400">{job.industry} • {job.experience}</div>
                        </div>
                        <div className="rounded-full bg-emerald-500/10 px-2 py-1 text-sm font-semibold text-emerald-300">{job.match}%</div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-violet-200">
                        {job.skills.map((skill) => (
                          <span key={skill} className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-1">{skill}</span>
                        ))}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button onClick={() => onSaveJob(job.id)} className="flex-1 rounded-full border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-white">{savedJobs.some((savedJob) => savedJob.id === job.id) ? 'Saved' : 'Save'}</button>
                        <a href="/jobs" className="rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 px-3 py-2 text-sm font-semibold text-white">Details</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Recommended next steps</h3>
                    <ListChecks size={18} className="text-violet-300" />
                  </div>
                  <div className="space-y-3">
                    {analysis.actionPlan.slice(0, 4).map((step) => (
                      <div key={step.id} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full ${step.done ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>
                          {step.done ? <Check size={14} /> : <CircleDashed size={14} />}
                        </div>
                        <span className="text-sm text-slate-200">{step.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-5">
                  <h3 className="text-xl font-bold text-white">Recent activity</h3>
                  <div className="mt-4 space-y-3">
                    {[
                      ['Resume score improved by 8 pts', '2h ago'],
                      ['Frontend role recommendation saved', 'Yesterday'],
                      ['Interview prep checklist updated', '3 days ago']
                    ].map(([item, time]) => (
                      <div key={item} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                        <span className="text-sm text-slate-200">{item}</span>
                        <span className="text-xs text-slate-400">{time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

function AnalyzerPage({ selectedJob, setSelectedJob, jobDescription, setJobDescription, uploadError, processing, loadingStage, resumeText, setResumeText, uploadedFileName, fileSize, dragActive, setDragActive, handleFileSelect, handleAnalyze, setSidebarOpen, sidebarOpen, previewImage, getFileTypeLabel }: any) {
  const stageList = [
    'Reading resume content',
    'Identifying skills and experience',
    'Comparing the resume with target role requirements',
    'Preparing improvement recommendations'
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-800 bg-slate-950/95 p-5 transition-transform duration-300 lg:static lg:translate-x-0`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-500 text-white"><Sparkles size={18} /></div>
              <div className="font-black tracking-tight text-white">RESUMIND AI</div>
            </div>
            <button className="rounded-lg border border-slate-700 p-2 text-slate-200 lg:hidden" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
          </div>

          <nav className="mt-8 space-y-2">
            {navItems.map(({ label, path, icon: Icon }) => (
              <a key={path} href={path} className="flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-900/70 hover:text-white">
                <div className="flex items-center gap-3"><Icon size={16} />{label}</div>
                <ChevronRight size={14} />
              </a>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-6">
          <header className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="rounded-xl border border-slate-700 p-2 text-slate-200 lg:hidden" onClick={() => setSidebarOpen(true)}><Menu size={18} /></button>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Analyze resume</div>
                <h1 className="text-2xl font-black text-white">Upload and assess your profile</h1>
              </div>
            </div>
            <a href="/analysis" className="hidden rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-white md:inline-flex">View results</a>
          </header>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-5">
                <label
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => { e.preventDefault(); setDragActive(false); const file = e.dataTransfer.files?.[0]; handleFileSelect(file); }}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed p-8 text-center transition ${dragActive ? 'border-violet-400 bg-violet-500/10' : 'border-slate-700 bg-slate-950/60'}`}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/10 text-violet-200">
                    <Upload size={24} />
                  </div>
                  <div className="mt-5 text-xl font-bold text-white">Drag & drop your resume here</div>
                  <div className="mt-2 text-sm text-slate-400">PDF, DOCX, DOC, TXT, PNG, JPG, or JPEG. Max size 10MB.</div>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain,image/png,image/jpeg"
                      onChange={(e) => handleFileSelect(e.target.files?.[0])}
                    />
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-white">Browse files</span>
                  </div>
                  {processing && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-200">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-violet-300" />
                      Extracting text from resume...
                    </div>
                  )}
                </label>

                {previewImage && (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 p-2">
                    <img src={previewImage} alt="Resume preview" className="max-h-56 w-full rounded-xl object-contain" />
                  </div>
                )}

                {(uploadedFileName || fileSize) && (
                  <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300"><FileCheck2 size={18} /></div>
                      <div>
                        <div className="font-medium text-white">{uploadedFileName || 'Resume uploaded'}</div>
                        <div className="text-xs text-slate-400">{fileSize || 'Ready for analysis'} · {previewImage ? 'Image preview ready' : getFileTypeLabel(new File([], uploadedFileName || 'resume.txt'))}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded-full border border-slate-700 bg-slate-900 p-2 text-slate-200" title="Replace file"><FolderOpen size={15} /></button>
                      <button className="rounded-full border border-slate-700 bg-slate-900 p-2 text-slate-200" title="Remove file"><Trash2 size={15} /></button>
                    </div>
                  </div>
                )}

                {uploadError && <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{uploadError}</div>}
              </div>

              <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-5">
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">Target job title</label>
                    <input value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0 transition focus:border-violet-400" placeholder="e.g. Frontend Developer" />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">Job description (optional)</label>
                    <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={6} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-violet-400" placeholder="Paste a job description to improve skill and keyword matching." />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button onClick={handleAnalyze} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-[0_18px_40px_rgba(99,102,241,0.4)]">
                      {processing ? 'Analyzing...' : 'Analyze Resume'}
                    </button>
                    <button onClick={() => setResumeText(sampleResumeData.summary)} className="rounded-full border border-slate-700 bg-slate-950 px-5 py-3 font-medium text-slate-200">Use demo analysis</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Resume preview</h3>
                <div className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-300">Local preview</div>
              </div>
              <div className="min-h-[380px] rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-7 text-slate-300">
                {resumeText ? resumeText : 'No resume text detected yet. Upload a file or use the demo analysis option.'}
              </div>

              {processing && (
                <div className="mt-5 rounded-2xl border border-violet-500/25 bg-violet-500/5 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-violet-200">AI analysis in progress</span>
                    <span className="text-xs text-violet-300">{(loadingStage + 1)}/4</span>
                  </div>
                  <div className="space-y-3">
                    {stageList.map((stage, index) => (
                      <div key={stage} className="flex items-center gap-3">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full ${index <= loadingStage ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          {index <= loadingStage ? <Check size={12} /> : index + 1}
                        </div>
                        <span className={`text-sm ${index <= loadingStage ? 'text-violet-100' : 'text-slate-400'}`}>{stage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function AnalysisPage({ analysis, savedJobs, onSaveJob }: { analysis: ResumeAnalysis; savedJobs: JobRecommendation[]; onSaveJob: (id: string) => void; }) {
  const chartData = [
    { name: 'Technical', value: 86 },
    { name: 'Soft', value: 72 },
    { name: 'Experience', value: 64 },
    { name: 'Keywords', value: 78 }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-violet-300">Analysis results</div>
          <h1 className="mt-2 text-3xl font-black text-white">Resume analysis overview</h1>
        </div>
        <a href="/dashboard" className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Back to dashboard</a>
      </header>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative flex h-44 w-44 items-center justify-center">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="52" stroke="rgba(148,163,184,.2)" strokeWidth="8" fill="none" />
                  <circle cx="60" cy="60" r="52" stroke="url(#analysisGradient)" strokeWidth="8" fill="none" strokeDasharray="326" strokeDashoffset={326 - (326 * analysis.score) / 100} strokeLinecap="round" />
                  <defs>
                    <linearGradient id="analysisGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="50%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute text-center">
                  <div className="text-4xl font-black text-white">{analysis.score}</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">/100</div>
                </div>
              </div>
              <div className="mt-4 max-w-sm text-slate-300">{analysis.summary}</div>
              <div className="mt-4 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-xs text-amber-200">Estimated assessment — not a guaranteed ATS result.</div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-6">
            <h3 className="text-xl font-bold text-white">Resume summary</h3>
            <div className="mt-4 space-y-4 text-sm text-slate-300">
              <div><span className="font-semibold text-white">Profile:</span> {analysis.profile.summary}</div>
              <div><span className="font-semibold text-white">Experience level:</span> {analysis.profile.experienceLevel}</div>
              <div><span className="font-semibold text-white">Primary strengths:</span> {analysis.strengths.join(', ')}</div>
              <div><span className="font-semibold text-white">Target-role alignment:</span> {analysis.profile.targetRole}</div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-6">
            <h3 className="text-xl font-bold text-white">Skills analysis</h3>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div>
                <div className="mb-3 text-sm font-medium text-slate-300">Technical skills</div>
                <div className="flex flex-wrap gap-2">
                  {analysis.profile.skills.filter((skill) => skill.category === 'Technical').map((skill) => (
                    <span key={skill.name} className="rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-sm text-violet-100">{skill.name}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-3 text-sm font-medium text-slate-300">Soft skills</div>
                <div className="flex flex-wrap gap-2">
                  {analysis.profile.skills.filter((skill) => skill.category === 'Soft').map((skill) => (
                    <span key={skill.name} className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-100">{skill.name}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="url(#colors)" />
                  <defs>
                    <linearGradient id="colors" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-6">
          <h3 className="text-xl font-bold text-white">Missing skills</h3>
          <div className="mt-5 space-y-4">
            {analysis.missingSkills.map((gap) => (
              <div key={gap.skill} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">{gap.skill}</div>
                    <div className="text-xs uppercase tracking-[0.12em] text-slate-400">{gap.priority} priority</div>
                  </div>
                  <div className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-xs text-amber-200">{gap.required ? 'Essential' : 'Desirable'}</div>
                </div>
                <p className="mt-2 text-sm text-slate-300">{gap.reason}</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${gap.progress}%` }} />
                  </div>
                  <span className="text-xs text-slate-300">{gap.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-6">
          <h3 className="text-xl font-bold text-white">Job recommendations</h3>
          <div className="mt-5 space-y-4">
            {analysis.jobRecommendations.map((job) => (
              <div key={job.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">{job.title}</div>
                    <div className="mt-1 text-sm text-slate-400">{job.industry} • {job.experience}</div>
                  </div>
                  <button onClick={() => onSaveJob(job.id)} className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200">{savedJobs.some((savedJob) => savedJob.id === job.id) ? 'Saved' : 'Save'}</button>
                </div>
                <div className="mt-3 text-sm text-violet-200">Match: {job.match}%</div>
                <p className="mt-2 text-sm text-slate-300">{job.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-6">
          <h3 className="text-xl font-bold text-white">Learning suggestions</h3>
          <div className="mt-5 space-y-4">
            {analysis.learningSuggestions.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-white">{item.skill}</div>
                  <div className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-100">{item.difficulty}</div>
                </div>
                <p className="mt-2 text-sm text-slate-300">{item.why}</p>
                <div className="mt-3 text-xs text-slate-400">{item.sequence}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.resources.map((resource) => (
                    <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer" className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-violet-200">{resource.label}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-6">
          <h3 className="text-xl font-bold text-white">Action plan</h3>
          <div className="mt-5 space-y-3">
            {analysis.actionPlan.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${item.done ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>
                  {item.done ? <Check size={14} /> : <CircleDashed size={14} />}
                </div>
                <div className="flex-1 text-sm text-slate-200">{item.title}</div>
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{item.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function JobsPage({ savedJobs, onSaveJob }: { savedJobs: string[]; onSaveJob: (id: string) => void; }) {
  const [query, setQuery] = useState('');
  const [industry, setIndustry] = useState('All');
  const [experience, setExperience] = useState('All');
  const [skill, setSkill] = useState('All');
  const jobs = getRecommendedJobs(query, { industry, experience, skill });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-violet-300">Job explorer</div>
          <h1 className="mt-2 text-3xl font-black text-white">Recommended opportunities</h1>
        </div>
        <a href="/dashboard" className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Dashboard</a>
      </header>

      <div className="mb-6 rounded-[28px] border border-slate-800 bg-slate-900/80 p-4">
        <div className="grid gap-3 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr]">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none" placeholder="Search role or keyword" />
          </div>
          <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none">
            {jobFilters.map((option) => <option key={option}>{option}</option>)}
          </select>
          <select value={experience} onChange={(e) => setExperience(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none">
            {experienceFilters.map((option) => <option key={option}>{option}</option>)}
          </select>
          <select value={skill} onChange={(e) => setSkill(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none">
            {skillFilters.map((option) => <option key={option}>{option}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {jobs.map((job) => (
          <div key={job.id} className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xl font-bold text-white">{job.title}</div>
                <div className="mt-1 text-sm text-slate-400">{job.industry} • {job.experience}</div>
              </div>
              <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-sm font-semibold text-emerald-300">{job.match}%</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {job.matchingSkills.map((skill) => (
                <span key={skill} className="rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-xs text-violet-100">{skill}</span>
              ))}
            </div>
            <div className="mt-4 text-sm text-slate-300">{job.explanation}</div>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Skills gaps</div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-200">
                {job.missingSkills.map((skill) => <span key={skill} className="rounded-full bg-slate-800 px-2 py-1">{skill}</span>)}
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => onSaveJob(job.id)} className="flex-1 rounded-full border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-white">{savedJobs.includes(job.id) ? 'Saved' : 'Save'}</button>
              <button className="rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 px-3 py-2 text-sm font-semibold text-white">View details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LearningPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Learning roadmap</div>
          <h1 className="mt-2 text-3xl font-black text-white">Skills to learn next</h1>
        </div>
        <a href="/dashboard" className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Overview</a>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          {learningRoadmap.map((skill, index) => (
            <div key={skill.skill} className="rounded-[24px] border border-slate-800 bg-slate-900/80 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-bold text-white">{index + 1}. {skill.skill}</div>
                  <div className="mt-1 text-sm text-slate-400">Priority: {skill.priority} • {skill.time}</div>
                </div>
                <div className="rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-xs text-violet-100">{skill.progress}%</div>
              </div>
              <div className="mt-4 h-2.5 rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400" style={{ width: `${skill.progress}%` }} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href="https://developer.mozilla.org" target="_blank" rel="noreferrer" className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200">MDN</a>
                <a href="https://www.freecodecamp.org" target="_blank" rel="noreferrer" className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200">FreeCodeCamp</a>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-5">
          <h3 className="text-xl font-bold text-white">Weekly learning goals</h3>
          <div className="mt-5 space-y-3">
            {[
              ['Watch 2 short tutorials', '3/5'],
              ['Build a practice project', '1/3'],
              ['Practice core interview questions', '4/6']
            ].map(([goal, progress]) => (
              <div key={goal} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="mb-2 flex justify-between text-sm text-slate-200"><span>{goal}</span><span>{progress}</span></div>
                <div className="h-2 rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500" style={{ width: progress.includes('3/5') ? '60%' : '35%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ImprovePage() {
  const [selectedSection, setSelectedSection] = useState('Professional summary');
  const [resumeText, setResumeText] = useState('Experienced frontend professional with strong interest in building polished product experiences and collaborating across teams.');
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-violet-300">Resume studio</div>
          <h1 className="mt-2 text-3xl font-black text-white">Improve your resume with guided edits</h1>
        </div>
        <button onClick={() => window.print()} className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Export / Print</button>
      </header>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr_1.1fr]">
        <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-4">
          <h3 className="text-lg font-bold text-white">Sections</h3>
          <div className="mt-4 space-y-2">
            {improvementSections.map((section) => (
              <button key={section} onClick={() => setSelectedSection(section)} className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm ${selectedSection === section ? 'bg-violet-500/10 text-violet-100' : 'bg-slate-950/60 text-slate-300'}`}>
                {section}
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Original text</h3>
            <span className="text-xs text-slate-400">{resumeText.split(' ').length} words</span>
          </div>
          <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} className="h-[320px] w-full resize-none rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-sm text-slate-200 outline-none" />
        </div>

        <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Suggested rewrite</h3>
            <div className="flex gap-2">
              <button onClick={() => setAccepted((prev) => ({ ...prev, [selectedSection]: true }))} className="rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-200">Accept</button>
              <button onClick={() => setAccepted((prev) => ({ ...prev, [selectedSection]: false }))} className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200">Reject</button>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 text-sm leading-7 text-slate-200">
            {accepted[selectedSection] ? resumeText : 'Frontend-focused professional with experience building accessible, responsive interfaces and collaborating with product teams. Skilled in React, TypeScript, and design systems with a strong interest in user-centered product experiences.'}
          </div>
          <div className="mt-4 text-xs text-slate-400">Demo suggestion only. Original resume content is preserved until you accept a change.</div>
        </div>
      </div>
    </div>
  );
}

function InterviewPage() {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const questions = [
    { type: 'Technical', question: 'How would you improve performance in a React app with frequent re-renders?', framework: 'Explain the problem, identify render triggers, suggest memoization and profiling, and mention measurement before optimization.' },
    { type: 'Behavioral', question: 'Tell me about a time you solved a challenge with limited information.', framework: 'Use STAR: context, task, actions, result, and highlight ownership and learning.' },
    { type: 'Resume-based', question: 'Walk me through a project that demonstrates your strongest user-centric work.', framework: 'Describe the problem, decisions, trade-offs, collaboration, and outcome in concise steps.' }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-violet-300">Interview prep</div>
          <h1 className="mt-2 text-3xl font-black text-white">Practice for your target role</h1>
        </div>
        <a href="/dashboard" className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Dashboard</a>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {questions.map((item, index) => (
            <div key={item.question} className="rounded-[24px] border border-slate-800 bg-slate-900/80 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-xs text-violet-100">{item.type}</div>
                <button onClick={() => setChecked((prev) => ({ ...prev, [item.question]: !prev[item.question] }))} className="rounded-full border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200">{checked[item.question] ? 'Practiced' : 'Mark practiced'}</button>
              </div>
              <div className="mt-4 text-lg font-bold text-white">{index + 1}. {item.question}</div>
              <button onClick={() => setRevealed((prev) => ({ ...prev, [item.question]: !prev[item.question] }))} className="mt-4 rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm font-medium text-slate-200">
                {revealed[item.question] ? 'Hide answer framework' : 'Reveal answer framework'}
              </button>
              {revealed[item.question] && <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-200">{item.framework}</div>}
            </div>
          ))}
        </div>

        <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-5">
          <h3 className="text-xl font-bold text-white">Preparation checklist</h3>
          <div className="mt-5 space-y-3">
            {['Review core stack and trade-offs', 'Prepare 3 project stories', 'Practice STAR responses', 'Review target role requirements'].map((task) => (
              <label key={task} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200">
                <input type="checkbox" className="h-4 w-4 accent-violet-500" />
                <span>{task}</span>
              </label>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-cyan-200">Self assessment</div>
            <div className="mt-2 text-3xl font-black text-white">82%</div>
            <div className="mt-2 text-sm text-slate-300">Interview readiness estimate based on your role prep and current confidence.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  const [name, setName] = useState('Aarav Mehta');
  const [targetRole, setTargetRole] = useState('Frontend Developer');
  const [experienceLevel, setExperienceLevel] = useState('Mid-level');
  const [industry, setIndustry] = useState('Technology');

  useEffect(() => {
    const prefs = { name, targetRole, experienceLevel, industry };
    localStorage.setItem('resumind-preferences', JSON.stringify(prefs));
  }, [name, targetRole, experienceLevel, industry]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <div className="text-xs uppercase tracking-[0.18em] text-violet-300">Settings</div>
        <h1 className="mt-2 text-3xl font-black text-white">Profile and preferences</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-5">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm text-slate-200">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-slate-100" />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-200">Target job role</label>
              <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-slate-100" />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-200">Experience level</label>
              <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-slate-100">
                <option>Entry-level</option>
                <option>Junior</option>
                <option>Mid-level</option>
                <option>Senior</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-200">Preferred industry</label>
              <input value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-slate-100" />
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-5">
          <h3 className="text-lg font-bold text-white">Privacy and data</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li>• Resume content is processed locally in the browser.</li>
            <li>• Uploaded files are not permanently stored in localStorage.</li>
            <li>• Analysis is an estimate and should not be treated as a guaranteed ATS result.</li>
            <li>• Demo-data reset removes saved recommendation preferences in this browser.</li>
          </ul>
          <button onClick={() => { localStorage.removeItem('resumind-saved-jobs'); localStorage.removeItem('resumind-preferences'); window.location.reload(); }} className="mt-6 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200">Reset demo data</button>
        </div>
      </div>
    </div>
  );
}

export default App;
