import { NextRequest, NextResponse } from 'next/server';
import { analyzeResumeWithAI, quantifyAchievements } from '@/lib/gemini';
import { checkATSCompatibility, suggestImprovements } from '@/lib/ats-checker';
import { simulateATSCheck } from '@/lib/ats-simulator';
import { parseResume } from '@/lib/resume-parser';

export async function POST(request: NextRequest) {
    try {
        const { resumeText, jobDescription } = await request.json();

        // Debug logging
        console.log('Analyze Request received');
        if (!resumeText) console.error('Missing resumeText');
        if (!jobDescription) console.error('Missing jobDescription');

        if (!resumeText || !jobDescription) {
            return NextResponse.json(
                { error: 'Resume text and job description are required' },
                { status: 400 }
            );
        }

        // Parallelize operations: AI Analysis, Standard ATS Check, Quantification
        const results = await Promise.allSettled([
            analyzeResumeWithAI(resumeText, jobDescription),
            checkATSCompatibility(resumeText),
            quantifyAchievements(resumeText)
        ]);

        const aiAnalysis = results[0].status === 'fulfilled' ? results[0].value : await analyzeResumeWithAI(resumeText, jobDescription).catch(() => ({ score: 0, keywordMatches: [], missingKeywords: [], suggestions: [], strengths: [], formatIssues: [] })); // Fallback handled inside analyzeResumeWithAI anyway

        // Actually, better to just let analyzeResumeWithAI handle its own fallback internally (which it does), 
        // but if it throws unexpectedly, we need to be safe.
        // Let's unpack carefully.

        const aiAnalysisResult = results[0].status === 'fulfilled' ? results[0].value : {
            score: 0,
            keywordMatches: [],
            missingKeywords: [],
            missingKeywordsByCategory: undefined,
            suggestions: ['AI Analysis failed temporarily. Please try again.'],
            strengths: [],
            formatIssues: []
        };

        const standardCheckResult = results[1].status === 'fulfilled' ? results[1].value : { score: 0, issues: [] };
        const quantifiedImpactResult = results[2].status === 'fulfilled' ? results[2].value : [];

        if (results[0].status === 'rejected') console.error('AI Analysis failed:', results[0].reason);
        if (results[1].status === 'rejected') console.error('Standard Check failed:', results[1].reason);
        if (results[2].status === 'rejected') console.error('Quantification failed:', results[2].reason);

        // Run Multi-ATS Simulation
        // Create a dummy ResumeData object for the simulator since we only have text for now
        // In a future refactor, we could structure the data first, but text heuristics work for now.
        const atsSimulation = simulateATSCheck(resumeText, {
            personalInfo: { fullName: '', email: '', phone: '' },
            summary: '',
            experience: [],
            education: [],
            skills: []
        } as any);

        // Calculate final score
        const finalScore = Math.round((aiAnalysisResult.score + standardCheckResult.score) / 2);

        // Get improvement suggestions based on the final score and issues
        const improvements = suggestImprovements(finalScore, standardCheckResult.issues);

        // Merge suggestions
        const allSuggestions = [
            ...new Set([...(aiAnalysisResult.suggestions || []), ...improvements])
        ];

        const analysis = {
            score: finalScore,
            keywordMatches: aiAnalysisResult.keywordMatches || [],
            missingKeywords: aiAnalysisResult.missingKeywords || [],
            missingKeywordsByCategory: aiAnalysisResult.missingKeywordsByCategory,
            formatIssues: [...standardCheckResult.issues, ...(aiAnalysisResult.formatIssues || [])],
            suggestions: allSuggestions,
            strengths: aiAnalysisResult.strengths || [],
            atsSimulation: atsSimulation,
            quantificationSuggestions: quantifiedImpactResult
        };

        return NextResponse.json(analysis);
    } catch (error) {
        console.error('CRITICAL ERROR in analyze route:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to analyze resume',
                details: error instanceof Error ? error.stack : String(error)
            },
            { status: 500 }
        );
    }
}
