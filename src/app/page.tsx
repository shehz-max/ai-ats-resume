'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle, Zap, Target, ArrowRight, FileText } from 'lucide-react';
import FileUpload from '@/components/FileUpload';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!selectedFile || !jobDescription.trim()) {
      alert('Please upload a resume and enter a job description');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Parse resume
      const formData = new FormData();
      formData.append('file', selectedFile);

      const parseResponse = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      });

      if (!parseResponse.ok) throw new Error('Failed to parse resume');

      const { text: resumeText } = await parseResponse.json();

      // Analyze with AI
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription }),
      });

      if (!analyzeResponse.ok) throw new Error('Failed to analyze resume');

      const analysis = await analyzeResponse.json();

      // Store in sessionStorage and navigate
      sessionStorage.setItem('resumeAnalysis', JSON.stringify(analysis));
      sessionStorage.setItem('resumeText', resumeText);
      sessionStorage.setItem('jobDescription', jobDescription);

      window.location.href = '/analyze';
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
              AI-Powered Resume Optimization
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Beat the <span className="gradient-text">ATS System</span>
            <br />Get More Interviews
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8">
            75% of resumes never reach human eyes. Our AI analyzes your resume against job descriptions
            and optimizes it for Applicant Tracking Systems.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>100% Free</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Instant Results</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>AI-Powered</span>
            </div>
          </div>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 md:p-12">
            <div className="space-y-8">
              {/* File Upload */}
              <div>
                <label className="block text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  1. Upload Your Resume
                </label>
                <FileUpload
                  onFileSelect={setSelectedFile}
                  selectedFile={selectedFile}
                  onClear={() => setSelectedFile(null)}
                />
              </div>

              {/* Job Description */}
              <div>
                <label className="block text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  2. Paste Job Description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="w-full h-48 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 
                           bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                           focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none
                           resize-none transition-colors"
                />
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={!selectedFile || !jobDescription.trim() || isAnalyzing}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700
                         text-white font-semibold py-4 px-8 rounded-xl
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-300 transform hover:scale-[1.02]
                         flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Analyze Resume
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-24 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          <FeatureCard
            icon={<Target className="w-8 h-8" />}
            title="ATS Compatibility Score"
            description="Get an instant score showing how well your resume will perform in ATS systems"
          />
          <FeatureCard
            icon={<Sparkles className="w-8 h-8" />}
            title="AI-Powered Analysis"
            description="Advanced AI identifies missing keywords and suggests improvements"
          />
          <FeatureCard
            icon={<FileText className="w-8 h-8" />}
            title="Optimized Resume"
            description="Download an ATS-optimized version with proper formatting and keywords"
          />
        </motion.div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4 text-white">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}
