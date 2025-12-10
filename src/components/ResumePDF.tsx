import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Link } from '@react-pdf/renderer';
import { ResumeData, ResumeStyleOptions } from '@/types';

// Register standard fonts
Font.register({
    family: 'Arial',
    src: 'https://fonts.gstatic.com/s/arial/v1/Arial.ttf' // Fallback or local if possible. 
    // Note: react-pdf needs actual font files or URLs. Using standard ones can be tricky without assets.
    // For simplicity in this env, we might rely on default or a specific Google Font URL that allows CORS.
    // Let's try to use standard Helvetica which is built-in for PDF, effectively.
    // Actually, react-pdf supports standard 14 fonts like Helvetica, Times-Roman out of the box if no family is registered?
    // Let's try relying on default fonts or mapping user selection to standard PDF fonts.
});

// Styles will need to be dynamic based on options, so we create a function or use inline styles mostly.
const createStyles = (options: ResumeStyleOptions) => StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: options.font === 'Times New Roman' ? 'Times-Roman' : 'Helvetica',
        fontSize: options.fontSize === 'small' ? 10 : options.fontSize === 'large' ? 12 : 11,
        lineHeight: 1.5,
    },
    section: {
        marginBottom: 10,
    },
    header: {
        marginBottom: 20,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: options.accentColor === '#000000' ? '#000' : options.accentColor,
        paddingBottom: 10,
    },
    name: {
        fontSize: options.fontSize === 'small' ? 18 : options.fontSize === 'large' ? 24 : 20,
        fontWeight: 'bold',
        color: options.accentColor === '#000000' ? '#000' : options.accentColor,
        marginBottom: 5,
    },
    contact: {
        fontSize: options.fontSize === 'small' ? 9 : options.fontSize === 'large' ? 11 : 10,
        color: '#333',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 5,
    },
    heading: {
        fontSize: options.fontSize === 'small' ? 12 : options.fontSize === 'large' ? 16 : 14,
        fontWeight: 'bold',
        color: options.accentColor === '#000000' ? '#000' : options.accentColor,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        marginBottom: 8,
        marginTop: 10,
        textTransform: 'uppercase',
    },
    subHeading: {
        fontSize: options.fontSize === 'small' ? 11 : options.fontSize === 'large' ? 13 : 12,
        fontWeight: 'bold',
        color: '#222',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    date: {
        fontSize: options.fontSize === 'small' ? 9 : options.fontSize === 'large' ? 11 : 10,
        color: '#666',
    },
    text: {
        marginBottom: 5,
        textAlign: 'justify',
    },
    bulletPoint: {
        paddingLeft: 10,
    }
});

interface ResumePDFProps {
    data: ResumeData;
    styleOptions: ResumeStyleOptions;
}

export const ResumePDF: React.FC<ResumePDFProps> = ({ data, styleOptions }) => {
    const styles = createStyles(styleOptions);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.name}>{data.personalInfo.fullName}</Text>
                    <View style={styles.contact}>
                        <Text>{data.personalInfo.email} | {data.personalInfo.phone}</Text>
                        {data.personalInfo.linkedin && <Text> | {data.personalInfo.linkedin}</Text>}
                        {data.personalInfo.location && <Text> | {data.personalInfo.location}</Text>}
                    </View>
                </View>

                {/* Summary */}
                {data.summary && (
                    <View style={styles.section}>
                        <Text style={styles.heading}>Professional Summary</Text>
                        <Text style={styles.text}>{data.summary}</Text>
                    </View>
                )}

                {/* Experience */}
                {data.experience.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.heading}>Work Experience</Text>
                        {data.experience.map((exp, index) => (
                            <View key={index} style={{ marginBottom: 10 }}>
                                <View style={styles.row}>
                                    <Text style={styles.subHeading}>{exp.position}</Text>
                                    <Text style={styles.date}>{exp.startDate} - {exp.endDate}</Text>
                                </View>
                                <Text style={{ fontWeight: 'bold', fontSize: styles.page.fontSize }}>{exp.company} | {exp.location}</Text>
                                <Text style={styles.text}>{exp.description}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Education */}
                {data.education.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.heading}>Education</Text>
                        {data.education.map((edu, index) => (
                            <View key={index} style={{ marginBottom: 5 }}>
                                <View style={styles.row}>
                                    <Text style={styles.subHeading}>{edu.school}</Text>
                                    <Text style={styles.date}>{edu.startDate} - {edu.endDate}</Text>
                                </View>
                                <Text>{edu.degree} in {edu.field}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Skills */}
                {data.skills.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.heading}>Skills</Text>
                        <Text style={styles.text}>{data.skills.join(' • ')}</Text>
                    </View>
                )}
            </Page>
        </Document>
    );
};
