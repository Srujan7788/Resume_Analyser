import { sampleJobs } from '../data/sampleJobs';

export const getJobs = () => sampleJobs;

export const getRecommendedJobs = (query = '', filters = {}) => {
  let jobs = [...sampleJobs];

  if (query) {
    const keyword = query.toLowerCase();
    jobs = jobs.filter((job) =>
      job.title.toLowerCase().includes(keyword) ||
      job.industry.toLowerCase().includes(keyword) ||
      job.skills.some((skill) => skill.toLowerCase().includes(keyword))
    );
  }

  if ((filters as any).industry && (filters as any).industry !== 'All') {
    jobs = jobs.filter((job) => job.industry === (filters as any).industry);
  }

  if ((filters as any).experience && (filters as any).experience !== 'All') {
    jobs = jobs.filter((job) => job.experience === (filters as any).experience);
  }

  if ((filters as any).skill && (filters as any).skill !== 'All') {
    jobs = jobs.filter((job) => job.skills.some((skill) => skill === (filters as any).skill));
  }

  return jobs.sort((a, b) => b.match - a.match);
};
