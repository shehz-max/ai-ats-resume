import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export async function parseResume(file: File): Promise<string> {
  const fileType = file.type;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (fileType === 'application/pdf') {
    return parsePDF(buffer);
  } else if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileType === 'application/msword'
  ) {
    return parseDOCX(buffer);
  } else {
    throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
  }
}

async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
  }
}

async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new Error('Failed to parse DOCX file');
  }
}

export function extractSections(resumeText: string) {
  const sections = {
    contact: '',
    summary: '',
    experience: '',
    education: '',
    skills: '',
    certifications: '',
    projects: ''
  };

  // Simple section extraction based on common headers
  const lines = resumeText.split('\n');
  let currentSection = '';

  for (const line of lines) {
    const lowerLine = line.toLowerCase().trim();
    
    if (lowerLine.includes('experience') || lowerLine.includes('work history')) {
      currentSection = 'experience';
    } else if (lowerLine.includes('education')) {
      currentSection = 'education';
    } else if (lowerLine.includes('skill')) {
      currentSection = 'skills';
    } else if (lowerLine.includes('certification') || lowerLine.includes('license')) {
      currentSection = 'certifications';
    } else if (lowerLine.includes('project')) {
      currentSection = 'projects';
    } else if (lowerLine.includes('summary') || lowerLine.includes('objective')) {
      currentSection = 'summary';
    } else if (currentSection) {
      sections[currentSection as keyof typeof sections] += line + '\n';
    } else {
      sections.contact += line + '\n';
    }
  }

  return sections;
}

export function extractKeywords(text: string): string[] {
  // Remove common words and extract meaningful keywords
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word));

  // Count frequency
  const frequency: { [key: string]: number } = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Return top keywords
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word]) => word);
}
