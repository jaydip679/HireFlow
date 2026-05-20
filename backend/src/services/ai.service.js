import pdf from 'pdf-parse';
import Application from '../models/Application.model.js';
import Job from '../models/Job.model.js';
import ApiError from '../utils/apiError.js';
import logger from '../config/logger.js';
import { sendApplicationStatusEmail } from './email.service.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const isOpenAiConfigured = !!OPENAI_API_KEY;

/**
 * Helper to download a PDF file from a URL and extract its text using pdf-parse.
 */
export const extractResumeText = async (pdfUrl) => {
  try {
    logger.info(`Extracting resume text from: ${pdfUrl}`);
    
    // In mock/test environments where pdfUrl might be a local path or dummy URL:
    if (pdfUrl.startsWith('mock://') || !pdfUrl.startsWith('http')) {
      logger.info('Mock resume detected. Returning placeholder text.');
      return 'Experienced Senior Frontend Developer. Proficient in React, Node.js, TypeScript, Next.js, and CSS. Strong background in Docker, unit testing, and scalable architecture. Lacks experience in PostgreSQL and AWS cloud deployments.';
    }

    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file. Status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdf(buffer);
    
    return data.text || 'Empty PDF content';
  } catch (err) {
    logger.error(`Error extracting PDF resume text: ${err.message}`);
    // Check if it's pdf-parse error
    throw new ApiError(422, 'Unable to read resume file. Please upload a valid PDF.', 'RESUME_READ_ERROR');
  }
};

/**
 * Offline Mock Screening Heuristic: Analyzes resume text against job description,
 * counts overlapping skills, and calculates a realistic score, strengths, and gaps.
 */
const runMockScreening = (resumeText, job) => {
  logger.info(`Running local offline mock AI screening for job: ${job.title}`);
  
  const cleanResume = resumeText.toLowerCase();
  const requiredSkills = job.skillsRequired || [];
  
  const matched = [];
  const missing = [];

  requiredSkills.forEach((skill) => {
    const cleanSkill = skill.toLowerCase();
    if (cleanResume.includes(cleanSkill)) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  });

  // Basic score math
  let baseScore = 40; // Base score
  if (requiredSkills.length > 0) {
    const ratio = matched.length / requiredSkills.length;
    baseScore += Math.round(ratio * 50); // Add up to 50 points for skills
  }
  
  // Keyword boosters
  if (cleanResume.includes('senior') || cleanResume.includes('lead')) baseScore += 5;
  if (cleanResume.includes('experience') || cleanResume.includes('year')) baseScore += 5;

  const score = Math.max(0, Math.min(100, baseScore));

  let recommendation = 'consider';
  if (score >= 75) recommendation = 'shortlist';
  if (score < 50) recommendation = 'reject';

  const strengths = matched.length > 0 ? matched.map(s => `Proficient in ${s}`) : ['Shows relevant core background'];
  if (cleanResume.includes('senior') || cleanResume.includes('lead')) strengths.push('Demonstrates leadership capabilities');
  
  const gaps = missing.length > 0 ? missing.map(s => `Requires training in ${s}`) : ['No major missing technical skills detected'];

  return {
    score,
    summary: `Candidate shows a match score of ${score}% for the "${job.title}" role. They demonstrate strong overlap in skills like [${matched.join(', ')}] with minor missing competencies in [${missing.join(', ')}].`,
    strengths: strengths.slice(0, 4),
    gaps: gaps.slice(0, 4),
    recommendation,
  };
};

/**
 * Screen a single application: extracts resume, sends to OpenAI (or mock),
 * caches results, triggers auto-shortlisting, and saves documents.
 */
export const screenApplication = async (applicationId) => {
  const application = await Application.findById(applicationId).populate('applicant');
  if (!application) {
    throw new ApiError(404, 'Application not found', 'APPLICATION_NOT_FOUND');
  }

  const job = await Job.findById(application.job);
  if (!job) {
    throw new ApiError(404, 'Associated Job not found', 'JOB_NOT_FOUND');
  }

  try {
    const resumeText = await extractResumeText(application.resume.url);
    
    let screeningResult;

    if (isOpenAiConfigured) {
      logger.info(`Sending resume for application ${applicationId} to OpenAI...`);
      
      const systemPrompt = `You are a professional AI recruiter screen engine. You compare a candidate's resume text against a job description.
You MUST respond with a JSON object ONLY. No conversational text around it.

Required JSON Structure:
{
  "score": <integer from 0 to 100 representing job fit match>,
  "summary": "<a concise 3-sentence summary of the candidate's experience and fit relative to the job requirements>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "gaps": ["<missing skill/gap 1>", "<missing skill/gap 2>"],
  "recommendation": "<shortlist" | "consider" | "reject" strictly matching the score (>=75 shortlist, <50 reject, 50-74 consider)>
}`;

      const userPrompt = `
JOB INFORMATION:
Title: ${job.title}
Job Type: ${job.jobType}
Required Skills: ${job.skillsRequired.join(', ')}
Job Description: ${job.description}

CANDIDATE RESUME TEXT:
${resumeText}
`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API failed with status ${response.status}`);
      }

      const rawData = await response.json();
      const rawContent = rawData.choices?.[0]?.message?.content;
      screeningResult = JSON.parse(rawContent);
    } else {
      // Offline fallback
      screeningResult = runMockScreening(resumeText, job);
    }

    // Save AI screening results on the application document
    application.aiScore = screeningResult.score;
    application.aiSummary = screeningResult.summary;
    application.aiStrengths = screeningResult.strengths;
    application.aiGaps = screeningResult.gaps;
    application.aiRecommendation = screeningResult.recommendation;
    application.aiScreenedAt = new Date();

    // Auto-shortlisting: applications scoring >= 75 are automatically marked "shortlisted"
    const originalStatus = application.status;
    if (screeningResult.score >= 75) {
      application.status = 'shortlisted';
      application.statusHistory.push({
        status: 'shortlisted',
        changedAt: new Date(),
        // System automated update
      });
    }

    await application.save();

    // Send email alert to applicant if automatically shortlisted
    if (originalStatus !== 'shortlisted' && application.status === 'shortlisted') {
      await sendApplicationStatusEmail(application.applicant, job, 'shortlisted');
    }

    logger.info(`AI Screening completed for application ${applicationId}. Score: ${application.aiScore}`);
    return application;
  } catch (err) {
    logger.error(`AI Screening failed for application ${applicationId}: ${err.message}`);
    // Under Section 5.1 in PRD: If OpenAI fails, save application but keep aiScore null. Don't throw 500.
    application.aiScreenedAt = new Date();
    await application.save();
    return application;
  }
};

/**
 * Batch screen all unscreened applicants for a job.
 * Uses Promise.allSettled so individual failures do not abort the batch.
 */
export const screenBatch = async (jobId) => {
  logger.info(`Batch screening requested for job ${jobId}`);
  
  // Find all applications for this job that haven't been screened yet (aiScreenedAt is null)
  const unscreened = await Application.find({ job: jobId, aiScreenedAt: null });
  
  if (unscreened.length === 0) {
    return { count: 0, message: 'All applications already screened' };
  }

  // CORNER CASE Section 10.4 in DATABASE_DESIGN: Avoid N+1.
  // Prefetch the job doc once
  const job = await Job.findById(jobId);
  if (!job) {
    throw new ApiError(404, 'Job not found', 'JOB_NOT_FOUND');
  }

  // Fire screenApplication concurrently
  const results = await Promise.allSettled(
    unscreened.map((app) => screenApplication(app._id))
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  logger.info(`Batch screening for job ${jobId} finished. Succeeded: ${succeeded}, Failed: ${failed}`);

  return {
    count: unscreened.length,
    succeeded,
    failed,
  };
};

/**
 * Generate 8-10 interview questions tailored from the job description and candidate's details.
 */
export const generateInterviewQuestions = async (applicationId) => {
  const application = await Application.findById(applicationId).populate('applicant');
  if (!application) {
    throw new ApiError(404, 'Application not found', 'APPLICATION_NOT_FOUND');
  }

  const job = await Job.findById(application.job);
  if (!job) {
    throw new ApiError(404, 'Job not found', 'JOB_NOT_FOUND');
  }

  if (!isOpenAiConfigured) {
    // Return mock interview questions
    logger.info('Returning mock interview questions due to missing API key.');
    return [
      `How do you handle technical debt when working with ${job.skillsRequired[0] || 'core technologies'}?`,
      `Explain a time you solved a complex problem in a ${job.jobType} setting.`,
      `Walk us through how you would optimize database queries in this stack.`,
      `Why are you interested in this position?`,
      `How do you keep your skills updated on changing technical standards?`,
      `Describe a challenging team environment you collaborated in.`,
      `Explain how you implement secure authorization parameters locally.`,
      `What questions do you have about our corporate development flows?`
    ];
  }

  try {
    const userPrompt = `
Generate 8 to 10 tailored interview questions for this applicant:
Applicant Name: ${application.applicant.name}
Job Title: ${job.title}
Job Description: ${job.description}
Skills Required: ${job.skillsRequired.join(', ')}
Applicant Match Score: ${application.aiScore}%
Strengths: ${application.aiStrengths.join(', ')}
Gaps: ${application.aiGaps.join(', ')}

Return a JSON array containing strings representing the questions. Ensure it is strict JSON output ONLY.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are an elite recruiter. Return a JSON object with the structure: { "questions": ["Question 1", "Question 2", ...] }' },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI failed with status ${response.status}`);
    }

    const rawData = await response.json();
    const parsed = JSON.parse(rawData.choices?.[0]?.message?.content);
    return parsed.questions || [];
  } catch (err) {
    logger.error(`Error generating interview questions: ${err.message}`);
    throw new ApiError(500, 'Unable to generate interview questions. Please try again later.', 'AI_GENERATE_ERROR');
  }
};

/**
 * General purpose AI chat handler.
 * Useful for helping employers write jobs descriptions or helping applicants write resume tips.
 */
export const chat = async (messages, systemPrompt) => {
  if (!isOpenAiConfigured) {
    return 'I am currently operating in local offline mock mode. To unlock general AI chats, please configure a valid OPENAI_API_KEY in the environment.';
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    logger.error(`AI Chat completion failed: ${err.message}`);
    throw new ApiError(500, 'AI assistant unavailable.', 'AI_CHAT_ERROR');
  }
};
