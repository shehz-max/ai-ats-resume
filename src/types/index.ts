export interface ResumeStyleOptions {
    font: 'Arial' | 'Times New Roman' | 'Calibri' | 'Helvetica';
    fontSize: 'small' | 'medium' | 'large';
    accentColor: string;
}

export interface ResumeData {
    personalInfo: {
        fullName: string;
        email: string;
        phone: string;
        linkedin?: string;
        location?: string;
        portfolio?: string;
    };
    summary: string;
    experience: Experience[];
    education: Education[];
    skills: string[];
    certifications?: string[];
    projects?: {
        name: string;
        description: string;
        link?: string;
    }[];
}

export interface Experience {
    company: string;
    position: string;
    location?: string;
    startDate: string;
    endDate: string;
    description: string;
}

export interface Education {
    school: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
}

export interface SimulatorResult {
    systemName: string;
    compatibilityScore: number;
    status: 'passed' | 'warning' | 'failed';
    issues: string[];
}

export interface ATSAnalysis {
    score: number;
    keywordMatches: string[];
    missingKeywords: string[];
    missingKeywordsByCategory?: {
        technical: string[];
        soft: string[];
        tools: string[];
    };
    formatIssues: FormatIssue[];
    suggestions: string[];
    strengths: string[];
    atsSimulation?: SimulatorResult[];
    quantificationSuggestions?: { original: string; suggestion: string }[];
}

export interface FormatIssue {
    type: 'formatting' | 'structure' | 'content' | 'length';
    severity: 'critical' | 'warning' | 'info';
    message: string;
    fix: string;
}

export interface JobDescription {
    text: string;
    title?: string;
    company?: string;
}

export type ATSScoreLevel = 'excellent' | 'good' | 'fair' | 'poor';

export interface TemplateOption {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
}
