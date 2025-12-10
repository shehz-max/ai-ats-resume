import { ResumeData } from '@/types';

export interface ATSSystemProfile {
    name: string;
    type: 'legacy' | 'modern' | 'semantic';
    description: string;
    parsingRules: {
        tablesAllowed: boolean;
        columnsAllowed: boolean;
        graphicsAllowed: boolean;
        minKeywordDensity: number;
        standardHeadingsOnly: boolean;
        dateFormats: ('MM/YYYY' | 'Month YYYY' | 'YYYY')[];
    };
}

export const ATS_PROFILES: ATSSystemProfile[] = [
    {
        name: 'Legacy ATS (Taleo/BrassRing)',
        type: 'legacy',
        description: 'Strict older systems that struggle with formatting. Best to keep it simple.',
        parsingRules: {
            tablesAllowed: false,
            columnsAllowed: false,
            graphicsAllowed: false,
            minKeywordDensity: 0.05, // High reliance on exact keywords
            standardHeadingsOnly: true,
            dateFormats: ['MM/YYYY', 'Month YYYY'],
        },
    },
    {
        name: 'Modern ATS (Greenhouse/Lever)',
        type: 'modern',
        description: 'Flexible systems that can parse PDF columns and simple tables.',
        parsingRules: {
            tablesAllowed: true,
            columnsAllowed: true,
            graphicsAllowed: false,
            minKeywordDensity: 0.02,
            standardHeadingsOnly: false,
            dateFormats: ['MM/YYYY', 'Month YYYY', 'YYYY'],
        },
    },
    {
        name: 'AI-Powered Matcher (Eightfold/Daxtra)',
        type: 'semantic',
        description: 'Uses AI to understand context, not just keywords. Focuses on skills and impact.',
        parsingRules: {
            tablesAllowed: true,
            columnsAllowed: true,
            graphicsAllowed: true, // OCR capabilities
            minKeywordDensity: 0.0, // Semantic matching
            standardHeadingsOnly: false,
            dateFormats: ['MM/YYYY', 'Month YYYY', 'YYYY'],
        },
    },
];

export interface SimulatorResult {
    systemName: string;
    compatibilityScore: number;
    status: 'passed' | 'warning' | 'failed';
    issues: string[];
}

export function simulateATSCheck(resumeText: string, data: ResumeData): SimulatorResult[] {
    return ATS_PROFILES.map((profile) => {
        const issues: string[] = [];
        let score = 100;

        // 1. Tables/Columns Check (Simulated based on text structure heuristics)
        // Since we only have text, we look for indicators of complex layouts
        // This is a heuristic approximation
        const hasComplexLayout = resumeText.includes('   ') && resumeText.split('\n').some(line => line.length > 80 && line.includes('  '));

        if (!profile.parsingRules.columnsAllowed && hasComplexLayout) {
            score -= 20;
            issues.push('Layout may be too complex (columns detected) for this legacy system.');
        }

        // 2. Standard Headings Check
        if (profile.parsingRules.standardHeadingsOnly) {
            const standardHeaders = ['experience', 'education', 'skills', 'summary', 'projects'];
            const hasStandardHeaders = standardHeaders.every(h =>
                resumeText.toLowerCase().includes(h)
            );
            if (!hasStandardHeaders) {
                score -= 15;
                issues.push('Missing standard section headings required by this system.');
            }
        }

        // 3. Keyword Density Check (Simulated)
        // In a real scenario, we'd check against jd keywords, here we check general technical terms density
        const words = resumeText.split(/\s+/).length;
        // Simple heuristic: if resume is too short or too long
        if (words < 200) {
            score -= 10;
            issues.push('Content length is too short for accurate parsing.');
        }

        // Determine Status
        let status: 'passed' | 'warning' | 'failed' = 'passed';
        if (score < 60) status = 'failed';
        else if (score < 85) status = 'warning';

        return {
            systemName: profile.name,
            compatibilityScore: score,
            status,
            issues,
        };
    });
}
