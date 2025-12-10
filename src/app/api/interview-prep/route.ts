import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';

export async function POST(request: NextRequest) {
    try {
        const { resumeText, jobDescription } = await request.json();

        console.log('Interview Prep Request received');

        if (!resumeText || !jobDescription) {
            return NextResponse.json(
                { error: 'Resume text and job description are required' },
                { status: 400 }
            );
        }

        const prompt = `
            Based on the candidate's resume and the job description, generate 5 likely interview questions.
            For each question, provide a "STAR Method" tip on how to answer it.
            
            RESUME:
            ${resumeText.substring(0, 3000)}
            
            JOB DESCRIPTION:
            ${jobDescription.substring(0, 3000)}
            
            Return ONLY a JSON array in this format:
            [
              {
                "question": "The interview question",
                "answerTip": "Tip on how to answer using STAR method"
              }
            ]
        `;

        const text = await generateContent(prompt);
        const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
        const questions = JSON.parse(cleanedText);

        return NextResponse.json({ questions });
    } catch (error) {
        console.error('Error generating interview questions:', error);
        return NextResponse.json(
            { error: 'Failed to generate interview prep' },
            { status: 500 }
        );
    }
}
