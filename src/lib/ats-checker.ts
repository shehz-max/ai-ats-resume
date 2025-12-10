import { FormatIssue, ATSScoreLevel } from '@/types';

// ATS-safe fonts
const ATS_SAFE_FONTS = [
    'Arial',
    'Calibri',
    'Times New Roman',
    'Georgia',
    'Helvetica',
    'Verdana',
    'Cambria'
];

// Common ATS keywords by category
const COMMON_ATS_KEYWORDS = {
    technical: ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker'],
    soft: ['leadership', 'communication', 'teamwork', 'problem-solving', 'analytical'],
    action: ['developed', 'managed', 'led', 'created', 'implemented', 'designed', 'improved']
};

export function checkATSCompatibility(resumeText: string): {
    issues: FormatIssue[];
    score: number;
} {
    const issues: FormatIssue[] = [];
    let score = 100;

    // Check for complex formatting indicators
    if (resumeText.includes('│') || resumeText.includes('┌') || resumeText.includes('─')) {
        issues.push({
            type: 'formatting',
            severity: 'critical',
            message: 'Resume contains table borders or special characters',
            fix: 'Remove tables and use simple bullet points instead'
        });
        score -= 20;
    }

    // Check for headers/footers indicators
    if (resumeText.match(/page \d+ of \d+/i)) {
        issues.push({
            type: 'formatting',
            severity: 'warning',
            message: 'Resume may contain headers or footers',
            fix: 'Remove headers and footers as ATS systems may not read them'
        });
        score -= 10;
    }

    // Check resume length
    const wordCount = resumeText.split(/\s+/).length;
    if (wordCount < 200) {
        issues.push({
            type: 'length',
            severity: 'warning',
            message: 'Resume is too short',
            fix: 'Add more details about your experience and achievements'
        });
        score -= 15;
    } else if (wordCount > 1000) {
        issues.push({
            type: 'length',
            severity: 'info',
            message: 'Resume is quite long',
            fix: 'Consider condensing to 1-2 pages for better ATS performance'
        });
        score -= 5;
    }

    // Check for contact information
    const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(resumeText);
    const hasPhone = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(resumeText);

    if (!hasEmail) {
        issues.push({
            type: 'structure',
            severity: 'critical',
            message: 'No email address found',
            fix: 'Add your email address at the top of your resume'
        });
        score -= 15;
    }

    if (!hasPhone) {
        issues.push({
            type: 'structure',
            severity: 'warning',
            message: 'No phone number found',
            fix: 'Add your phone number for better contact options'
        });
        score -= 5;
    }

    // Check for standard sections
    const hasExperience = /experience|work history|employment/i.test(resumeText);
    const hasEducation = /education|academic/i.test(resumeText);
    const hasSkills = /skills|competencies|expertise/i.test(resumeText);

    if (!hasExperience) {
        issues.push({
            type: 'structure',
            severity: 'critical',
            message: 'No "Experience" section found',
            fix: 'Add a clearly labeled "Work Experience" or "Professional Experience" section'
        });
        score -= 20;
    }

    if (!hasEducation) {
        issues.push({
            type: 'structure',
            severity: 'warning',
            message: 'No "Education" section found',
            fix: 'Add an "Education" section with your degrees and institutions'
        });
        score -= 10;
    }

    if (!hasSkills) {
        issues.push({
            type: 'structure',
            severity: 'warning',
            message: 'No "Skills" section found',
            fix: 'Add a "Skills" section to highlight your technical and soft skills'
        });
        score -= 10;
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    return { issues, score };
}

export function getScoreLevel(score: number): ATSScoreLevel {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
}

export function getScoreColor(score: number): string {
    if (score >= 80) return 'var(--score-excellent)';
    if (score >= 60) return 'var(--score-good)';
    if (score >= 40) return 'var(--score-fair)';
    return 'var(--score-poor)';
}

export function calculateKeywordDensity(text: string, keywords: string[]): number {
    const lowerText = text.toLowerCase();
    const totalWords = text.split(/\s+/).length;
    let matchCount = 0;

    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
        const matches = lowerText.match(regex);
        if (matches) {
            matchCount += matches.length;
        }
    });

    return (matchCount / totalWords) * 100;
}

export function suggestImprovements(score: number, issues: FormatIssue[]): string[] {
    const suggestions: string[] = [];

    if (score < 60) {
        suggestions.push('Your resume needs significant improvements for ATS compatibility');
    }

    if (issues.some(i => i.type === 'formatting')) {
        suggestions.push('Use simple, clean formatting without tables or text boxes');
        suggestions.push('Stick to standard fonts like Arial, Calibri, or Times New Roman');
    }

    if (issues.some(i => i.type === 'structure')) {
        suggestions.push('Include all standard sections: Contact, Summary, Experience, Education, Skills');
        suggestions.push('Use clear section headings that ATS systems can recognize');
    }

    if (issues.some(i => i.message.includes('keyword'))) {
        suggestions.push('Incorporate more relevant keywords from the job description');
        suggestions.push('Use industry-standard terminology and action verbs');
    }

    suggestions.push('Save your resume as a .docx file for best ATS compatibility');
    suggestions.push('Avoid images, graphics, and fancy formatting');
    suggestions.push('Use bullet points to list achievements and responsibilities');

    return suggestions;
}
