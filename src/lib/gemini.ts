import { GoogleGenerativeAI } from '@google/generative-ai';
import { ATSAnalysis, ResumeData, ResumeStyleOptions } from '@/types'; // Updated import

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

const MODELS_TO_TRY = [
  'gemini-flash-latest',
  'gemini-1.5-flash',
  'gemini-pro',
  'gemini-1.5-pro-latest'
];

export async function generateContent(prompt: string): Promise<string> {
  return generateWithRetry(prompt);
}

async function generateWithRetry(prompt: string): Promise<string> {
  let lastError: any;

  if (!API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  for (const modelName of MODELS_TO_TRY) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.warn(`Model ${modelName} failed:`, error.message);
      lastError = error;
      // If it's a 429 (Too Many Requests) or 503, continue to next model
      if (error.message.includes('429') || error.message.includes('503') || error.message.includes('404')) {
        continue;
      }
      // For other errors, might be worth trying others too, but these are the main ones
    }
  }
  throw lastError || new Error('All models failed');
}

export async function quantifyAchievements(resumeText: string): Promise<{ original: string; suggestion: string }[]> {
  const prompt = `
    Analyze the following resume content and identify 3-5 bullet points that are vague or lack quantification (numbers, metrics, percentages).
    For each identified bullet point, provide a "Quantified Version" that plausibly estimates metrics to demonstrate impact.
    
    Resume Content:
    ${resumeText.substring(0, 5000)}

    Return ONLY a JSON array of objects with "original" and "suggestion" keys. Do not imply false data, but show how to structure it with placeholders if needed (e.g. "Increased sales by [X]%").
    Example:
    [
      { "original": "Managed a team of developers.", "suggestion": "Led a team of 5 developers, increasing sprint velocity by 20% through agile implementation." }
    ]
  `;

  try {
    const text = await generateWithRetry(prompt);
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error quantifying achievements:', error);
    return [];
  }
}

// Fallback analysis when AI fails
function getFallbackAnalysis(resumeText: string, jobDescription: string) {
  const keywords = jobDescription
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 4) // Filter out short words
    .filter((v, i, a) => a.indexOf(v) === i) // Unique
    .slice(0, 20); // Top 20 potential keywords

  const foundKeywords = keywords.filter(k => resumeText.toLowerCase().includes(k));
  const missingKeywords = keywords.filter(k => !resumeText.toLowerCase().includes(k));

  const score = Math.round((foundKeywords.length / keywords.length) * 100);

  return {
    score: Math.max(score, 40), // Minimum score of 40 to not be too discouraging
    keywordMatches: foundKeywords,
    missingKeywords: missingKeywords,
    formatIssues: [],
    suggestions: [
      "Ensure your resume includes keywords from the job description.",
      "Use bullet points for readability.",
      "Quantify your achievements with numbers and percentages.",
      "Check for spelling and grammatical errors."
    ],
    strengths: [
      "Resume content is machine-readable",
      "Contains some relevant keywords"
    ]
  };
}

export async function analyzeResumeWithAI(resumeText: string, jobDescription: string) {
  if (!genAI) {
    console.warn('Gemini API key not configured, using fallback analysis');
    return getFallbackAnalysis(resumeText, jobDescription);
  }

  const prompt = `
    You are an expert ATS (Applicant Tracking System) optimizer and career coach.
    Analyze the following resume against the provided job description.
    
    Resume Text:
    ${resumeText.substring(0, 10000)}
    
    Job Description:
    ${jobDescription.substring(0, 5000)}
    
    Provide a detailed analysis in the following JSON format ONLY (no markdown formatting):
    {
      "score": <number 0-100 based on keyword matching and relevance>,
      "score": <number 0-100 based on relevance>,
      "keywordMatches": [<array of soft and hard skills found>],
      "missingKeywords": [<array of critical skills missing>],
      "missingKeywordsByCategory": {
        "technical": [<array of technical skills>],
        "soft": [<array of soft skills>],
        "tools": [<array of tools/technologies>]
      },
      "formatIssues": [
        {
          "type": "formatting" | "structure" | "content",
          "severity": "critical" | "warning" | "info",
          "message": "<brief issue description>",
          "fix": "<how to fix it>"
        }
      ],
      "suggestions": [<array of specific actionable improvements>],
      "strengths": [<array of what the candidate did well>]
    }
  `;

  try {
    const text = await generateWithRetry(prompt);

    // Clean up markdown code blocks if present
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error analyzing resume with AI, using fallback:', error);
    return getFallbackAnalysis(resumeText, jobDescription);
  }
}

export async function optimizeResumeContent(resumeText: string, jobDescription: string, missingKeywords: string[]) {
  if (!genAI) {
    throw new Error('Gemini API key is not configured');
  }

  const prompt = `You are an expert resume writer. Optimize the following resume to better match the job description while maintaining truthfulness and ATS compatibility.

ORIGINAL RESUME:
${resumeText.substring(0, 10000)}

JOB DESCRIPTION:
${jobDescription.substring(0, 5000)}

MISSING KEYWORDS TO INCORPORATE:
${missingKeywords.join(', ')}

Provide an optimized version that:
1. Incorporates missing keywords naturally
2. Uses ATS-friendly formatting
3. Maintains truthfulness (don't add fake experience)
4. Improves action verbs and quantifiable achievements
5. Keeps the same structure but enhances content

Return ONLY the optimized resume text, no additional commentary.`;

  try {
    return await generateWithRetry(prompt);
  } catch (error) {
    console.error('Error optimizing resume:', error);
    throw error;
  }
}

export async function parseResumeToStructure(resumeText: string): Promise<ResumeData> {
  if (!genAI) {
    throw new Error('Gemini API key is not configured');
  }

  const prompt = `
    You are an expert resume parser. Convert the following resume text into a structured JSON object.
    
    Resume Text:
    ${resumeText.substring(0, 15000)}
    
    Return the data in this exact JSON structure:
    {
      "personalInfo": {
        "fullName": "Name",
        "email": "Email",
        "phone": "Phone",
        "linkedin": "LinkedIn URL (optional)",
        "location": "City, State (optional)",
        "portfolio": "Portfolio URL (optional)"
      },
      "summary": "Professional Summary text",
      "experience": [
        {
          "company": "Company Name",
          "position": "Job Title",
          "location": "Location",
          "startDate": "Start Date",
          "endDate": "End Date or Present",
          "description": "Description of roles and achievements"
        }
      ],
      "education": [
        {
          "school": "School Name",
          "degree": "Degree",
          "field": "Field of Study",
          "startDate": "Start Date",
          "endDate": "End Date"
        }
      ],
      "skills": ["Skill 1", "Skill 2"],
      "certifications": ["Cert 1", "Cert 2"],
      "projects": [
        {
          "name": "Project Name",
          "description": "Project Description",
          "link": "Link (optional)"
        }
      ]
    }
  `;

  try {
    const text = await generateWithRetry(prompt);
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error structuring resume:', error);
    throw error;
  }
}
