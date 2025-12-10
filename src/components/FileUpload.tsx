'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    selectedFile: File | null;
    onClear: () => void;
}

export default function FileUpload({ onFileSelect, selectedFile, onClear }: FileUploadProps) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onFileSelect(acceptedFiles[0]);
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/msword': ['.doc']
        },
        maxFiles: 1,
        multiple: false
    });

    if (selectedFile) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-900"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{selectedFile.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {(selectedFile.size / 1024).toFixed(2)} KB
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClear}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-red-500" />
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <div
            {...getRootProps()}
            className={`
        border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
        transition-all duration-300
        ${isDragActive
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-600'
                }
      `}
        >
            <input {...getInputProps()} />
            <motion.div
                animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                className="flex flex-col items-center gap-4"
            >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                    <Upload className="w-8 h-8 text-white" />
                </div>
                <div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Drag & drop or click to browse • PDF or DOCX • Max 10MB
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
