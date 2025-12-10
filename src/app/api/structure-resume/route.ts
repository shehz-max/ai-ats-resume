import { NextRequest, NextResponse } from 'next/server';
import { parseResumeToStructure } from '@/lib/gemini';

export async function POST(request: NextRequest) {
    try {
        const { resumeText } = await request.json();

        if (!resumeText) {
            return NextResponse.json(
                { error: 'Resume text is required' },
                { status: 400 }
            );
        }

        const structuredData = await parseResumeToStructure(resumeText);
        return NextResponse.json(structuredData);
    } catch (error) {
        console.error('Error structuring resume:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to structure resume' },
            { status: 500 }
        );
    }
}
