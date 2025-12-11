import Groq from 'groq-sdk';
import { ATSAnalysis, ResumeData } from '@/types';

const API_KEY = process.env.GROQ_API_KEY || '';
const groq = new Groq({ apiKey: API_KEY });

const MODEL = 'llama-3.3-70b-versatile';

async function generateWithRetry(prompt: string, jsonMode: boolean = true): Promise<string> {
    if (!API_KEY) {
        throw new Error('Groq API key is not configured');
    }

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: MODEL,

            temperature: 0.1, // Lower temperature for precision
            max_tokens: 4096,
            response_format: jsonMode ? { type: "json_object" } : undefined,
        });

        return completion.choices[0]?.message?.content || '';
    } catch (error: any) {
        console.error('Groq API Error Details:', {
            message: error.message,
            type: error.type,
            code: error.code
        });
        throw error;
    }
}

// Fallback analysis when AI fails
function getFallbackAnalysis(resumeText: string, jobDescription: string) {
    const keywords = jobDescription
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 4)
        .filter((v, i, a) => a.indexOf(v) === i)
        .slice(0, 20);

    const foundKeywords = keywords.filter(k => resumeText.toLowerCase().includes(k));
    const missingKeywords = keywords.filter(k => !resumeText.toLowerCase().includes(k));
    const score = Math.round((foundKeywords.length / keywords.length) * 100);

    return {
        score: Math.max(score, 40),
        keywordMatches: foundKeywords,
        missingKeywords: missingKeywords,
        formatIssues: [],
        suggestions: ["Ensure your resume includes keywords from the job description.", "Quantify achievements."],
        strengths: ["Resume content is readable"],
        missingKeywordsByCategory: { technical: [], soft: [], tools: [] }
    };
}

export async function generateContent(prompt: string): Promise<string> {
    return generateWithRetry(prompt, false);
}

export async function analyzeResumeWithAI(resumeText: string, jobDescription: string) {
    if (!groq) return getFallbackAnalysis(resumeText, jobDescription);

    const prompt = `
    You are an expert ATS (Applicant Tracking System) optimizer.
    Analyze the resume against the job description.
    
    Resume: ${resumeText.substring(0, 10000)}
    Job Description: ${jobDescription.substring(0, 5000)}
    
    Return a JSON object with this EXACT structure:
    {
      "score": number (0-100),
      "keywordMatches": ["string"],
      "missingKeywords": ["string"],
      "missingKeywordsByCategory": {
        "technical": ["string"],
        "soft": ["string"],
        "tools": ["string"]
      },
      "formatIssues": [
        {
          "type": "formatting" | "structure" | "content" | "length",
          "severity": "critical" | "warning" | "info",
          "message": "string",
          "fix": "string"
        }
      ],
      "suggestions": ["string"],
      "strengths": ["string"]
    }
    
    IMPORTANT: Return ONLY the JSON. No preamble.
  `;

    try {
        const text = await generateWithRetry(prompt);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : text;
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('Groq Analysis Failed:', error);
        return getFallbackAnalysis(resumeText, jobDescription);
    }
}

export async function quantifyAchievements(resumeText: string): Promise<{ original: string; suggestion: string }[]> {
    const prompt = `
    Find 3-5 sub-optimal bullet points in this resume and provide a quantified version (adding numbers/metrics).
    
    Resume: ${resumeText.substring(0, 5000)}
    
    Return ONLY a JSON array: [{"original": "...", "suggestion": "..."}]
  `;

    try {
        const text = await generateWithRetry(prompt);
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (error) {
        return [];
    }
}

export async function optimizeResumeContent(resumeText: string, jobDescription: string, missingKeywords: string[]) {
    const prompt = `
    Rewrite this resume content to match the job description.
    Include these keywords: ${missingKeywords.join(', ')}.
    Improve action verbs and quantify results.
    
    Resume: ${resumeText.substring(0, 10000)}
    Job Desc: ${jobDescription.substring(0, 5000)}
    
    Return ONLY the optimized text.
  `;
    return generateWithRetry(prompt, false);
}

export async function parseResumeToStructure(resumeText: string): Promise<ResumeData> {
    // Robust Client-Side Fallback
    const createFallbackData = (text: string): ResumeData => ({
        personalInfo: { fullName: "Candidate", email: "", phone: "", location: "" },
        summary: text.substring(0, 300) + '...',
        experience: [{
            company: "Previous Role",
            position: "Role",
            startDate: "Date",
            endDate: "Date",
            description: "Could not optimize automatically. Please edit.",
            location: ""
        }],
        education: [],
        skills: ["Professional Skills"],
        certifications: [],
        projects: []
    });

    if (!groq) return createFallbackData(resumeText);

    // Prompt requesting OPTIMIZATION + STRUCTURING
    const prompt = `
    You are an expert Resume Optimizer. 
    1. Optimize the resume content (improve verbs, fix grammar, profession tone).
    2. Convert the OPTIMIZED content to JSON.

    Resume: ${resumeText.substring(0, 11000)}

    Return JSON with this structure:
    {
      "personalInfo": { "fullName": "", "email": "", "phone": "", "linkedin": "", "location": "", "portfolio": "" },
      "summary": "Optimized Summary",
      "experience": [{ "company": "", "position": "", "location": "", "startDate": "", "endDate": "", "description": "Optimized Description" }],
      "education": [{ "school": "", "degree": "", "field": "", "startDate": "", "endDate": "" }],
      "skills": ["string"],
      "certifications": ["string"],
      "projects": [{ "name": "", "description": "", "link": "" }]
    }
    
    Return ONLY valid JSON.
  `;

    try {
        const text = await generateWithRetry(prompt);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : text;
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('Groq Parsing Failed:', error);
        return createFallbackData(resumeText);
    }
}
