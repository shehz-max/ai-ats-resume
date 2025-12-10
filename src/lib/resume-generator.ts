import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
    Table,
    TableRow,
    TableCell,
    WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import { ResumeData, ResumeStyleOptions } from '@/types';

// ATS-friendly styles configuration
const FONT_MAP = {
    'Arial': 'Arial',
    'Times New Roman': 'Times New Roman',
    'Calibri': 'Calibri',
    'Helvetica': 'Helvetica'
};

const SIZE_MAP = {
    small: { body: 20, heading: 24, title: 28 }, // 10pt, 12pt, 14pt
    medium: { body: 22, heading: 26, title: 32 }, // 11pt, 13pt, 16pt
    large: { body: 24, heading: 28, title: 36 }   // 12pt, 14pt, 18pt
};

export async function generateResumeDOCX(data: ResumeData, options: ResumeStyleOptions = {
    font: 'Arial',
    fontSize: 'medium',
    accentColor: '000000'
}) {
    const sizes = SIZE_MAP[options.fontSize];
    const font = FONT_MAP[options.font];

    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: 720,
                            right: 720,
                            bottom: 720,
                            left: 720,
                        },
                    },
                },
                children: [
                    // Header (Name & Contact)
                    new Paragraph({
                        text: data.personalInfo.fullName,
                        heading: HeadingLevel.TITLE,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100 },
                        run: {
                            font: font,
                            size: sizes.title,
                            bold: true,
                            color: options.accentColor === '000000' ? '000000' : options.accentColor,
                        }
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: `${data.personalInfo.email} | ${data.personalInfo.phone}`,
                                font: font,
                                size: sizes.body,
                            }),
                            ...(data.personalInfo.linkedin
                                ? [
                                    new TextRun({
                                        text: ` | ${data.personalInfo.linkedin}`,
                                        font: font,
                                        size: sizes.body,
                                    }),
                                ]
                                : []),
                            ...(data.personalInfo.location
                                ? [
                                    new TextRun({
                                        text: ` | ${data.personalInfo.location}`,
                                        font: font,
                                        size: sizes.body,
                                    }),
                                ]
                                : []),
                        ],
                        spacing: { after: 400 },
                        border: {
                            bottom: {
                                style: BorderStyle.SINGLE,
                                size: 1,
                                color: options.accentColor === '000000' ? '000000' : options.accentColor,
                            },
                        },
                    }),

                    // Professional Summary
                    ...(data.summary
                        ? [
                            new Paragraph({
                                text: 'PROFESSIONAL SUMMARY',
                                heading: HeadingLevel.HEADING_1,
                                spacing: { before: 200, after: 100 },
                                run: {
                                    font: font,
                                    size: sizes.heading,
                                    bold: true,
                                    color: options.accentColor === '000000' ? '000000' : options.accentColor,
                                }
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: data.summary,
                                        font: font,
                                        size: sizes.body,
                                    })
                                ],
                                spacing: { after: 300 },
                            }),
                        ]
                        : []),

                    // Experience
                    new Paragraph({
                        text: 'WORK EXPERIENCE',
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 200, after: 200 },
                        border: {
                            bottom: {
                                style: BorderStyle.SINGLE,
                                size: 1,
                                color: options.accentColor === '000000' ? '000000' : options.accentColor,
                            },
                        },
                        run: {
                            font: font,
                            size: sizes.heading,
                            bold: true,
                            color: options.accentColor === '000000' ? '000000' : options.accentColor,
                        }
                    }),
                    ...data.experience.flatMap((exp) => [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: exp.position,
                                    bold: true,
                                    size: sizes.body + 2,
                                    font: font,
                                }),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `${exp.company} | ${exp.location || ''}`,
                                    bold: true,
                                    size: sizes.body,
                                    font: font,
                                }),
                                new TextRun({
                                    text: `\t${exp.startDate} - ${exp.endDate}`,
                                    bold: false,
                                    size: sizes.body,
                                    font: font,
                                }),
                            ],
                            tabStops: [
                                {
                                    type: 'right',
                                    position: 9000,
                                },
                            ],
                            spacing: { after: 100 },
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: exp.description,
                                    font: font,
                                    size: sizes.body,
                                })
                            ],
                            spacing: { after: 200 },
                        }),
                    ]),

                    // Education
                    new Paragraph({
                        text: 'EDUCATION',
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 200, after: 200 },
                        border: {
                            bottom: {
                                style: BorderStyle.SINGLE,
                                size: 1,
                                color: options.accentColor === '000000' ? '000000' : options.accentColor,
                            },
                        },
                        run: {
                            font: font,
                            size: sizes.heading,
                            bold: true,
                            color: options.accentColor === '000000' ? '000000' : options.accentColor,
                        }
                    }),
                    ...data.education.flatMap((edu) => [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: edu.school,
                                    bold: true,
                                    size: sizes.body + 2,
                                    font: font,
                                }),
                                new TextRun({
                                    text: `\t${edu.startDate} - ${edu.endDate}`,
                                    size: sizes.body,
                                    font: font,
                                }),
                            ],
                            tabStops: [
                                {
                                    type: 'right',
                                    position: 9000,
                                },
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `${edu.degree} ${edu.field ? `in ${edu.field}` : ''}`,
                                    font: font,
                                    size: sizes.body,
                                })
                            ],
                            spacing: { after: 200 },
                        }),
                    ]),

                    // Skills
                    new Paragraph({
                        text: 'SKILLS',
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 200, after: 200 },
                        border: {
                            bottom: {
                                style: BorderStyle.SINGLE,
                                size: 1,
                                color: options.accentColor === '000000' ? '000000' : options.accentColor,
                            },
                        },
                        run: {
                            font: font,
                            size: sizes.heading,
                            bold: true,
                            color: options.accentColor === '000000' ? '000000' : options.accentColor,
                        }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: data.skills.join(' • '),
                                font: font,
                                size: sizes.body,
                            })
                        ],
                    }),
                ],
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'ATS_Optimized_Resume.docx');
}
