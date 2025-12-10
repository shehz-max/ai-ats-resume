import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/lib/groq';

export async function POST(request: NextRequest) {
    try {
        const { resumeText, jobDescription } = await request.json();

        console.log('Cover Letter Request received');
        console.log('Resume text length:', resumeText?.length);
        console.log('Job description length:', jobDescription?.length);

        if (!resumeText || !jobDescription) {
            console.error('Missing required fields');
            return NextResponse.json(
                { error: 'Resume text and job description are required' },
                { status: 400 }
            );
        }

        const prompt = `
            You are an expert career coach and professional copywriter.
            Write a compelling, professional cover letter based on the following resume and job description.
            
            RESUME:
            ${resumeText.substring(0, 5000)}
            
            JOB DESCRIPTION:
            ${jobDescription.substring(0, 2000)}
            
            Guidelines:
            1. Use a professional yet engaging tone.
            2. Highlight key achievements from the resume that match the job requirements.
            3. Address the specific company (if found in JD) or use "Hiring Manager".
            4. Keep it concise (3-4 paragraphs).
            5. Do not include placeholders like "[Your Name]" -> use the name from the resume or leave generic signature if name not found.
            
            Output ONLY the body of the cover letter (no subject line or header blocks unless essential).
        `;

        const coverLetter = await generateContent(prompt);

        return NextResponse.json({ coverLetter });
    } catch (error) {
        console.error('Error generating cover letter:', error);
        return NextResponse.json(
            { error: 'Failed to generate cover letter' },
            { status: 500 }
        );
    }
}
