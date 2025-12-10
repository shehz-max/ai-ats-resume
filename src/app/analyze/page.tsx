'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft, ArrowRight, Download, CheckCircle, AlertTriangle, XCircle,
    TrendingUp, FileText, Sparkles, Target, Palette, Type, Layout, ShieldCheck, Server, Zap, Edit2, Save
} from 'lucide-react';
import { ATSAnalysis, ResumeData, ResumeStyleOptions } from '@/types';

import { getScoreLevel, getScoreColor } from '@/lib/ats-checker';
import { ResumePDF } from '@/components/ResumePDF';
import dynamic from 'next/dynamic';

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    {
        ssr: false,
        loading: () => <span className="opacity-50">Loading PDF...</span>,
    }
);

export default function AnalyzePage() {
    const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [structuredData, setStructuredData] = useState<ResumeData | null>(null);
    const [isStructuring, setIsStructuring] = useState(false);
    const [styleOptions, setStyleOptions] = useState<ResumeStyleOptions>({
        font: 'Arial',
        fontSize: 'medium',
        accentColor: '#000000'
    });
    const [isEditing, setIsEditing] = useState(false);

    // Cover Letter State
    const [coverLetter, setCoverLetter] = useState('');
    const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);

    const generateCoverLetter = async () => {
        setIsGeneratingLetter(true);
        try {
            let resumeText = sessionStorage.getItem('resumeText');
            const jobDescription = sessionStorage.getItem('jobDescription') || 'General application';

            // Fallback: Construct text from structuredData if raw text is missing
            if (!resumeText && structuredData) {
                resumeText = `
                    Name: ${structuredData.personalInfo.fullName}
                    Summary: ${structuredData.summary}
                    Experience: ${structuredData.experience.map(e => `${e.position} at ${e.company} (${e.description})`).join('\n')}
                    Skills: ${structuredData.skills.join(', ')}
                `;
            }

            if (!resumeText) {
                alert('No resume data found to generate cover letter.');
                setIsGeneratingLetter(false);
                return;
            }

            const res = await fetch('/api/generate-cover-letter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resumeText, jobDescription }),
            });

            if (res.ok) {
                const data = await res.json();
                setCoverLetter(data.coverLetter);
            } else {
                const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
                throw new Error(errorData.error || 'API failed');
            }
        } catch (error) {
            console.error('Failed to generate cover letter', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Could not generate cover letter'}`);
        } finally {
            setIsGeneratingLetter(false);
        }
    };

    // Interview Prep State
    const [interviewQuestions, setInterviewQuestions] = useState<{ question: string; answerTip: string }[]>([]);
    const [isPrepLoading, setIsPrepLoading] = useState(false);

    const generateInterviewPrep = async () => {
        setIsPrepLoading(true);
        try {
            let resumeText = sessionStorage.getItem('resumeText');
            const jobDescription = sessionStorage.getItem('jobDescription') || 'General Role';

            // Fallback: Construct text from structuredData if raw text is missing
            if (!resumeText && structuredData) {
                resumeText = `
                    Name: ${structuredData.personalInfo.fullName}
                    Summary: ${structuredData.summary}
                    Experience: ${structuredData.experience.map(e => `${e.position} at ${e.company} (${e.description})`).join('\n')}
                    Skills: ${structuredData.skills.join(', ')}
                `;
            }

            if (!resumeText) {
                alert('No resume data found to generate interview questions.');
                setIsPrepLoading(false);
                return;
            }

            const res = await fetch('/api/interview-prep', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resumeText, jobDescription }),
            });

            if (res.ok) {
                const data = await res.json();
                setInterviewQuestions(data.questions);
            } else {
                const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
                throw new Error(errorData.error || 'API failed');
            }
        } catch (error) {
            console.error('Failed to generate interview prep', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Could not generate interview questions'}`);
        } finally {
            setIsPrepLoading(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            const analysisData = sessionStorage.getItem('resumeAnalysis');
            const resumeText = sessionStorage.getItem('resumeText');

            if (analysisData) {
                setAnalysis(JSON.parse(analysisData));
            }

            if (resumeText && !structuredData) {
                setIsStructuring(true);
                try {
                    const res = await fetch('/api/structure-resume', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ resumeText })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setStructuredData(data);
                    }
                } catch (e) {
                    console.error('Failed to structure resume, using client fallback', e);
                    // Client-side fallback if API fails completely
                    if (resumeText) {
                        setStructuredData({
                            personalInfo: { fullName: 'Candidate', email: '', phone: '', location: '' },
                            summary: resumeText.substring(0, 300) + '...',
                            experience: [{
                                company: 'Previous Role',
                                position: 'Role Title',
                                startDate: 'Date',
                                endDate: 'Date',
                                description: 'Details could not be optimized automatically. Please edit this section.',
                                location: ''
                            }],
                            education: [],
                            skills: ['Professional Skills'],
                            certifications: [],
                            projects: []
                        });
                    }
                } finally {
                    setIsStructuring(false);
                }
            }
            setLoading(false);
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-blue-900/20 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-300">Loading analysis...</p>
                </div>
            </div>
        );
    }

    if (!analysis) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-blue-900/20 flex items-center justify-center">
                <div className="text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Analysis Found</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">Please upload a resume first</p>
                    <a href="/" className="text-purple-600 hover:text-purple-700 font-medium">
                        Go back to home
                    </a>
                </div>
            </div>
        );
    }

    const scoreLevel = getScoreLevel(analysis.score);
    const scoreColor = getScoreColor(analysis.score);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-blue-900/20 py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <a href="/" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </a>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Resume Analysis Results</h1>
                </div>

                {/* Score Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 mb-8"
                >
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-shrink-0">
                            <div className="relative w-48 h-48">
                                <svg className="transform -rotate-90 w-48 h-48">
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="88"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        fill="none"
                                        className="text-slate-200 dark:text-slate-700"
                                    />
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="88"
                                        stroke={scoreColor}
                                        strokeWidth="12"
                                        fill="none"
                                        strokeDasharray={`${(analysis.score / 100) * 553} 553`}
                                        className="transition-all duration-1000"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-5xl font-bold" style={{ color: scoreColor }}>
                                        {analysis.score}
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wide">
                                        ATS Score
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-4">
                                {scoreLevel === 'excellent' && <CheckCircle className="w-6 h-6 text-green-500" />}
                                {scoreLevel === 'good' && <TrendingUp className="w-6 h-6 text-blue-500" />}
                                {scoreLevel === 'fair' && <AlertTriangle className="w-6 h-6 text-yellow-500" />}
                                {scoreLevel === 'poor' && <XCircle className="w-6 h-6 text-red-500" />}
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
                                    {scoreLevel} ATS Compatibility
                                </h2>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 mb-6">
                                {scoreLevel === 'excellent' && 'Your resume is highly optimized for ATS systems!'}
                                {scoreLevel === 'good' && 'Your resume has good ATS compatibility with room for improvement.'}
                                {scoreLevel === 'fair' && 'Your resume needs improvements to pass ATS systems effectively.'}
                                {scoreLevel === 'poor' && 'Your resume requires significant changes for ATS compatibility.'}
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <StatCard
                                    label="Keyword Matches"
                                    value={analysis.keywordMatches.length}
                                    icon={<Target className="w-5 h-5" />}
                                />
                                <StatCard
                                    label="Missing Keywords"
                                    value={analysis.missingKeywords.length}
                                    icon={<AlertTriangle className="w-5 h-5" />}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Potential Score Improvement (Before/After) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-8 mb-8 text-white relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-32 bg-white opacity-5 rounded-full transform translate-x-1/2 -translate-y-1/2 blur-3xl"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                                <h3 className="text-xl font-bold">Optimization Potential</h3>
                            </div>
                            <p className="text-indigo-100 max-w-lg">
                                By implementing the AI suggestions and fixing format issues, your resume score could increase significantly.
                            </p>
                        </div>

                        <div className="flex items-center gap-6 bg-white/10 p-6 rounded-xl backdrop-blur-sm">
                            <div className="text-center">
                                <div className="text-sm text-indigo-200 mb-1">Current Score</div>
                                <div className="text-3xl font-bold">{analysis.score}</div>
                            </div>
                            <ArrowRight className="w-6 h-6 text-indigo-300" />
                            <div className="text-center">
                                <div className="text-sm text-indigo-200 mb-1">Potential Score</div>
                                <div className="text-4xl font-bold text-green-300">
                                    {Math.min(100, analysis.score + (analysis.suggestions.length * 5) + (analysis.missingKeywords.length * 2))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Multi-ATS Simulation Results */}
                {analysis.atsSimulation && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                                <Server className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Multi-ATS Simulation</h3>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-6">
                            We simulated your resume against different types of Applicant Tracking Systems. Here is how it performed:
                        </p>
                        <div className="grid md:grid-cols-3 gap-6">
                            {analysis.atsSimulation.map((sim, idx) => (
                                <div key={idx} className={`p-6 rounded-xl border-2 ${sim.status === 'passed' ? 'border-green-100 bg-green-50/50 dark:bg-green-900/10 dark:border-green-900/30' :
                                    sim.status === 'warning' ? 'border-yellow-100 bg-yellow-50/50 dark:bg-yellow-900/10 dark:border-yellow-900/30' :
                                        'border-red-100 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/30'
                                    }`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="font-bold text-slate-900 dark:text-white">{sim.systemName}</h4>
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${sim.status === 'passed' ? 'bg-green-200 text-green-800' :
                                            sim.status === 'warning' ? 'bg-yellow-200 text-yellow-800' :
                                                'bg-red-200 text-red-800'
                                            }`}>
                                            {sim.status}
                                        </span>
                                    </div>
                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>Compatibility</span>
                                            <span className="font-bold">{sim.compatibilityScore}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${sim.compatibilityScore > 80 ? 'bg-green-500' :
                                                    sim.compatibilityScore > 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}
                                                style={{ width: `${sim.compatibilityScore}%` }}
                                            />
                                        </div>
                                    </div>
                                    {sim.issues.length > 0 ? (
                                        <ul className="text-sm space-y-1">
                                            {sim.issues.map((issue, i) => (
                                                <li key={i} className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                                                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                                    <span>{issue}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                            <ShieldCheck className="w-4 h-4" />
                                            <span>No issues detected</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Achievement Quantification (Impact Booster) */}
                {analysis.quantificationSuggestions && analysis.quantificationSuggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                                <Zap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Impact Booster</h3>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-6">
                            We detected some vague achievements. Here is how you can quantify them to increase your impact:
                        </p>
                        <div className="space-y-4">
                            {analysis.quantificationSuggestions.map((item, index) => (
                                <div key={index} className="grid md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="space-y-2">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Original</span>
                                        <p className="text-slate-600 dark:text-slate-400 italic">"{item.original}"</p>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" /> Suggested Improvement
                                        </span>
                                        <p className="text-slate-900 dark:text-slate-200 font-medium">"{item.suggestion}"</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Strengths */}
                {analysis.strengths.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Strengths</h3>
                        </div>
                        <ul className="space-y-3">
                            {analysis.strengths.map((strength, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-slate-700 dark:text-slate-300">{strength}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}

                {/* Missing Keywords (Skills Gap) */}
                {(analysis.missingKeywordsByCategory || analysis.missingKeywords.length > 0) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Skills Gap Analysis</h3>
                        </div>

                        {analysis.missingKeywordsByCategory ? (
                            <div className="space-y-6">
                                {/* Technical Skills */}
                                {analysis.missingKeywordsByCategory.technical.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Technical Skills</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.missingKeywordsByCategory.technical.map((keyword, index) => (
                                                <span key={index} className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium border border-red-100 dark:border-red-900/30">
                                                    {keyword}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* Tools */}
                                {analysis.missingKeywordsByCategory.tools.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Tools & Technologies</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.missingKeywordsByCategory.tools.map((keyword, index) => (
                                                <span key={index} className="px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg text-sm font-medium border border-orange-100 dark:border-orange-900/30">
                                                    {keyword}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* Soft Skills */}
                                {analysis.missingKeywordsByCategory.soft.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Soft Skills</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.missingKeywordsByCategory.soft.map((keyword, index) => (
                                                <span key={index} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium border border-blue-100 dark:border-blue-900/30">
                                                    {keyword}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {analysis.missingKeywords.map((keyword, index) => (
                                    <span
                                        key={index}
                                        className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg font-medium"
                                    >
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Suggestions */}
                {analysis.suggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">AI Suggestions</h3>
                        </div>
                        <ul className="space-y-4">
                            {analysis.suggestions.map((suggestion, index) => (
                                <li key={index} className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl">
                                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                        {index + 1}
                                    </span>
                                    <span className="text-slate-700 dark:text-slate-300">{suggestion}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}

                {/* Format Issues */}
                {analysis.formatIssues.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                                <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Format Issues</h3>
                        </div>
                        <div className="space-y-4">
                            {analysis.formatIssues.map((issue, index) => (
                                <div
                                    key={index}
                                    className={`p-4 rounded-xl border-l-4 ${issue.severity === 'critical'
                                        ? 'bg-red-50 dark:bg-red-900/10 border-red-500'
                                        : issue.severity === 'warning'
                                            ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-500'
                                            : 'bg-blue-50 dark:bg-blue-900/10 border-blue-500'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${issue.severity === 'critical'
                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                            : issue.severity === 'warning'
                                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                            }`}>
                                            {issue.severity}
                                        </span>
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-900 dark:text-white mb-1">{issue.message}</p>
                                            {issue.fix && (
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    <strong>Fix:</strong> {issue.fix}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Resume Builder Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                            <Layout className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Resume Builder & Preview</h3>
                    </div>

                    {!structuredData ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            {isStructuring ? (
                                <>
                                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                                    <p>Preparing reusable resume data...</p>
                                </>
                            ) : (
                                <p>Unable to load resume builder. Please try analyzing again.</p>
                            )}
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 space-y-6">
                                {/* Edit Mode Toggle */}
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${isEditing
                                        ? 'bg-green-100 text-green-700 border-2 border-green-500'
                                        : 'bg-white border-2 border-purple-200 text-purple-700 hover:border-purple-500'
                                        }`}
                                >
                                    {isEditing ? (
                                        <>
                                            <Save className="w-5 h-5" /> Done Editing
                                        </>
                                    ) : (
                                        <>
                                            <Edit2 className="w-5 h-5" /> Edit Content
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => {
                                        setIsStructuring(true);
                                        setStructuredData(null); // Clear old data
                                        const resumeText = sessionStorage.getItem('resumeText');
                                        if (resumeText) {
                                            fetch('/api/structure-resume', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ resumeText })
                                            })
                                                .then(res => res.json())
                                                .then(data => {
                                                    setStructuredData(data);
                                                    setIsStructuring(false);
                                                })
                                                .catch(e => {
                                                    console.error(e);
                                                    setIsStructuring(false);
                                                    alert("Optimization failed. Please check internet.");
                                                });
                                        }
                                    }}
                                    className="w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 bg-blue-50 text-blue-600 border-2 border-blue-200 hover:border-blue-500 transition-all"
                                >
                                    <Sparkles className="w-5 h-5" /> Retry AI Optimizer
                                </button>

                                {/* Power Features */}
                                <div className="space-y-3">
                                    <button
                                        onClick={generateCoverLetter}
                                        disabled={isGeneratingLetter}
                                        className="w-full py-3 px-4 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isGeneratingLetter ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                                                Writing...
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="w-4 h-4" /> Generate Cover Letter
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={generateInterviewPrep}
                                        disabled={isPrepLoading}
                                        className="w-full py-3 px-4 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isPrepLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                                Preparing...
                                            </>
                                        ) : (
                                            <>
                                                <Target className="w-4 h-4" /> Interview Prep
                                            </>
                                        )}
                                    </button>
                                </div>


                                {/* Industry Templates */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                        <Layout className="w-4 h-4" /> Industry Template
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { name: 'Standard', font: 'Arial', color: '#000000' },
                                            { name: 'Tech', font: 'Calibri', color: '#2563eb' },
                                            { name: 'Corporate', font: 'Times New Roman', color: '#1e293b' },
                                            { name: 'Creative', font: 'Helvetica', color: '#7c3aed' },
                                        ].map((template) => (
                                            <button
                                                key={template.name}
                                                onClick={() => setStyleOptions({
                                                    ...styleOptions,
                                                    font: template.font as any,
                                                    accentColor: template.color
                                                })}
                                                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-purple-500 dark:hover:border-purple-400 transition-all text-left"
                                            >
                                                <span className="block text-sm font-semibold text-slate-900 dark:text-white">{template.name}</span>
                                                <span className="text-xs text-slate-500">{template.font}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 dark:border-slate-700 my-4"></div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                        <Type className="w-4 h-4" /> Font Style
                                    </label>
                                    <select
                                        value={styleOptions.font}
                                        onChange={(e) => setStyleOptions({ ...styleOptions, font: e.target.value as any })}
                                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                                    >
                                        <option value="Arial">Arial (Standard)</option>
                                        <option value="Helvetica">Helvetica (Modern)</option>
                                        <option value="Times New Roman">Times New Roman (Classic)</option>
                                        <option value="Calibri">Calibri (Clean)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                        <Target className="w-4 h-4" /> Font Size
                                    </label>
                                    <div className="flex gap-2">
                                        {['small', 'medium', 'large'].map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setStyleOptions({ ...styleOptions, fontSize: size as any })}
                                                className={`flex-1 p-2 rounded-lg capitalize text-sm font-medium transition-colors ${styleOptions.fontSize === size
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                        <Palette className="w-4 h-4" /> Accent Color
                                    </label>
                                    <div className="flex flex-wrap gap-3">
                                        {['#000000', '#2563eb', '#7c3aed', '#db2777', '#059669', '#dc2626'].map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setStyleOptions({ ...styleOptions, accentColor: color })}
                                                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${styleOptions.accentColor === color ? 'border-slate-400 scale-110' : 'border-transparent'
                                                    }`}
                                                style={{ backgroundColor: color }}
                                                aria-label={`Select color ${color}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={async () => {
                                        try {
                                            const { generateResumeDOCX } = await import('@/lib/resume-generator');
                                            await generateResumeDOCX(structuredData, styleOptions);
                                        } catch (error) {
                                            console.error('Download failed', error);
                                            alert('Failed to generate resume');
                                        }
                                    }}
                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700
                                             text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02]
                                             flex items-center justify-center gap-2"
                                >
                                    <Download className="w-5 h-5" />
                                    Download Optimized DOCX
                                </button>

                                <div className="mt-4">
                                    <PDFDownloadLink
                                        document={<ResumePDF data={structuredData} styleOptions={styleOptions} />}
                                        fileName="ATS_Optimized_Resume.pdf"
                                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                                    >
                                        {/* @ts-ignore - render props signature issue in some versions */}
                                        {({ blob, url, loading, error }) => (
                                            <>
                                                <FileText className="w-5 h-5" />
                                                {loading ? 'Generating PDF...' : 'Download Optimized PDF'}
                                            </>
                                        )}
                                    </PDFDownloadLink>
                                </div>
                            </div >

                            {/* Live Preview */}
                            < div className="lg:col-span-2 bg-slate-100 dark:bg-slate-900 rounded-xl p-4 overflow-hidden" >
                                <div
                                    className="bg-white shadow-xl mx-auto p-12 min-h-[600px] transform scale-[0.8] origin-top md:transform-none md:scale-100 transition-all"
                                    style={{
                                        fontFamily: styleOptions.font,
                                        fontSize: styleOptions.fontSize === 'small' ? '0.875rem' : styleOptions.fontSize === 'large' ? '1.125rem' : '1rem',
                                        maxWidth: '210mm', // A4 width
                                    }}
                                >
                                    {/* Header Preview */}
                                    <div className="text-center mb-6 border-b pb-4" style={{ borderColor: styleOptions.accentColor === '#000000' ? '#e2e8f0' : styleOptions.accentColor }}>
                                        <h1 className="text-3xl font-bold mb-2" style={{ color: styleOptions.accentColor }}>{structuredData.personalInfo.fullName}</h1>
                                        <p className="text-slate-600 text-sm">
                                            {structuredData.personalInfo.email} | {structuredData.personalInfo.phone}
                                            {structuredData.personalInfo.linkedin && ` | ${structuredData.personalInfo.linkedin}`}
                                            {structuredData.personalInfo.location && ` | ${structuredData.personalInfo.location}`}
                                        </p>
                                    </div>

                                    {/* Summary Preview */}
                                    {structuredData.summary && (
                                        <div className="mb-6">
                                            <h2 className="text-lg font-bold border-b mb-2 uppercase" style={{ color: styleOptions.accentColor, borderColor: styleOptions.accentColor === '#000000' ? '#000' : styleOptions.accentColor }}>Professional Summary</h2>
                                            <p className="text-sm text-slate-800 leading-relaxed">{structuredData.summary}</p>
                                        </div>
                                    )}

                                    {/* Experience Preview */}
                                    <div className="mb-6">
                                        <h2 className="text-lg font-bold border-b mb-3, uppercase" style={{ color: styleOptions.accentColor, borderColor: styleOptions.accentColor === '#000000' ? '#000' : styleOptions.accentColor }}>Work Experience</h2>
                                        {structuredData.experience.slice(0, 2).map((exp, i) => (
                                            <div key={i} className="mb-4">
                                                {isEditing ? (
                                                    <div className="space-y-2 border-l-2 border-purple-200 pl-4 py-2">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <input
                                                                type="text"
                                                                value={exp.position}
                                                                onChange={(e) => {
                                                                    const newExp = [...structuredData.experience];
                                                                    newExp[i] = { ...newExp[i], position: e.target.value };
                                                                    setStructuredData({ ...structuredData, experience: newExp });
                                                                }}
                                                                className="font-bold text-slate-900 border-b border-dashed border-gray-300 bg-transparent w-full"
                                                                placeholder="Position"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={exp.company}
                                                                onChange={(e) => {
                                                                    const newExp = [...structuredData.experience];
                                                                    newExp[i] = { ...newExp[i], company: e.target.value };
                                                                    setStructuredData({ ...structuredData, experience: newExp });
                                                                }}
                                                                className="text-sm font-semibold text-slate-700 border-b border-dashed border-gray-300 bg-transparent w-full"
                                                                placeholder="Company"
                                                            />
                                                        </div>
                                                        <textarea
                                                            value={exp.description}
                                                            onChange={(e) => {
                                                                const newExp = [...structuredData.experience];
                                                                newExp[i] = { ...newExp[i], description: e.target.value };
                                                                setStructuredData({ ...structuredData, experience: newExp });
                                                            }}
                                                            className="w-full h-24 text-sm text-slate-800 border-2 border-dashed border-gray-300 p-2 rounded bg-transparent"
                                                            placeholder="Description"
                                                        />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex justify-between items-baseline mb-1">
                                                            <h3 className="font-bold text-slate-900">{exp.position}</h3>
                                                            <span className="text-sm text-slate-600">{exp.startDate} - {exp.endDate}</span>
                                                        </div>
                                                        <div className="text-sm font-semibold text-slate-700 mb-1">{exp.company} | {exp.location}</div>
                                                        <p className="text-sm text-slate-800">{exp.description}</p>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                        {structuredData.experience.length > 2 && (
                                            <p className="text-xs text-slate-400 italic text-center">...more items in download...</p>
                                        )}
                                    </div>

                                    {/* Education Preview - Partial */}
                                    {structuredData.education.length > 0 && (
                                        <div className="mb-6">
                                            <h2 className="text-lg font-bold border-b mb-3 uppercase" style={{ color: styleOptions.accentColor, borderColor: styleOptions.accentColor === '#000000' ? '#000' : styleOptions.accentColor }}>Education</h2>
                                            <div className="flex justify-between items-baseline">
                                                <h3 className="font-bold text-slate-900">{structuredData.education[0].school}</h3>
                                                <span className="text-sm text-slate-600">{structuredData.education[0].startDate} - {structuredData.education[0].endDate}</span>
                                            </div>
                                            <p className="text-sm text-slate-800">{structuredData.education[0].degree} in {structuredData.education[0].field}</p>
                                        </div>
                                    )}

                                    {/* Skills Preview */}
                                    <div>
                                        <h2 className="text-lg font-bold border-b mb-3 uppercase" style={{ color: styleOptions.accentColor, borderColor: styleOptions.accentColor === '#000000' ? '#000' : styleOptions.accentColor }}>Skills</h2>
                                        {isEditing ? (
                                            <textarea
                                                value={structuredData.skills.join(', ')}
                                                onChange={(e) => setStructuredData({ ...structuredData, skills: e.target.value.split(',').map(s => s.trim()) })}
                                                className="w-full h-20 text-sm text-slate-800 border-2 border-dashed border-gray-300 p-2 rounded bg-transparent"
                                                placeholder="Skills (comma separated)"
                                            />
                                        ) : (
                                            <p className="text-sm text-slate-800">{structuredData.skills.join(' • ')}</p>
                                        )}
                                    </div>
                                </div>
                            </div >
                        </div >
                    )
                    }
                </motion.div >

                {/* Interview Prep Modal */}
                {
                    interviewQuestions.length > 0 && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col">
                                <div className="p-6 border-b flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20 rounded-t-2xl">
                                    <div>
                                        <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100">Interview Preparation</h3>
                                        <p className="text-sm text-indigo-600 dark:text-indigo-300">Generated based on your resume & job gaps</p>
                                    </div>
                                    <button onClick={() => setInterviewQuestions([])} className="p-2 hover:bg-indigo-100 rounded-full">
                                        <XCircle className="w-6 h-6 text-indigo-400" />
                                    </button>
                                </div>
                                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                                    {interviewQuestions.map((q, idx) => (
                                        <div key={idx} className="bg-white border rounded-xl p-4 shadow-sm">
                                            <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex gap-2">
                                                <span className="text-indigo-500">Q{idx + 1}.</span> {q.question}
                                            </h4>
                                            <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border border-green-100 dark:border-green-900/30">
                                                <p className="text-sm text-green-800 dark:text-green-300">
                                                    <strong>💡 AI Tip:</strong> {q.answerTip}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-6 border-t flex justify-end">
                                    <button
                                        onClick={() => setInterviewQuestions([])}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                    >
                                        Finished Practicing
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Cover Letter Modal */}
                {
                    coverLetter && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                                <div className="p-6 border-b flex justify-between items-center">
                                    <h3 className="text-xl font-bold">Your AI Cover Letter</h3>
                                    <button onClick={() => setCoverLetter('')} className="p-2 hover:bg-slate-100 rounded-full">
                                        <XCircle className="w-6 h-6 text-slate-400" />
                                    </button>
                                </div>
                                <div className="p-6 overflow-y-auto flex-1">
                                    <pre className="whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300 leading-relaxed">
                                        {coverLetter}
                                    </pre>
                                </div>
                                <div className="p-6 border-t bg-slate-50 dark:bg-slate-900 rounded-b-2xl flex justify-end gap-3">
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(coverLetter); alert('Copied!'); }}
                                        className="px-4 py-2 text-slate-600 font-medium hover:text-purple-600"
                                    >
                                        Copy Text
                                    </button>
                                    <button
                                        onClick={() => setCoverLetter('')}
                                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Other Actions */}
                <div className="flex justify-center">
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 text-slate-600 hover:text-purple-600 font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Analyze Another Resume
                    </a>
                </div>
            </div >
        </div >
    );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
    return (
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2 text-slate-600 dark:text-slate-400">
                {icon}
                <span className="text-sm font-medium">{label}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
    );
}
