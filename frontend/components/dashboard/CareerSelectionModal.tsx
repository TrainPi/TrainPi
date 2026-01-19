'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, MessageSquare, Code2, BarChart2, Cpu, Shield, Check, X } from 'lucide-react'
import Image from 'next/image'

interface CareerSelectionModalProps {
    isOpen: boolean
    onClose: () => void // Optional if we want to force selection
    onSelect: (career: string) => void
    isLoading?: boolean
}

const CAREER_PATHS = [
    {
        id: 'Software Engineer',
        icon: Code2,
        color: 'bg-indigo-500',
        description: 'Learn coding and build applications',
        skills: ['React', 'Python', 'System Design']
    },
    {
        id: 'Data Analyst',
        icon: BarChart2,
        color: 'bg-blue-500',
        description: 'Master data analysis and visualization',
        skills: ['SQL', 'Tableau', 'Statistics']
    },
    {
        id: 'AI Engineer',
        icon: Cpu,
        color: 'bg-emerald-500',
        description: 'Specialize in AI and machine learning',
        skills: ['TensorFlow', 'NLP', 'Computer Vision']
    },
    {
        id: 'IT Specialist',
        icon: Shield,
        color: 'bg-slate-500',
        description: 'Develop skills in IT support & cybersecurity',
        skills: ['Networks', 'Security', 'Cloud']
    }
]

export default function CareerSelectionModal({ isOpen, onClose, onSelect, isLoading }: CareerSelectionModalProps) {
    const [selectedPath, setSelectedPath] = useState<string | null>(null)
    const [resumeFile, setResumeFile] = useState<File | null>(null)
    const [careerGoal, setCareerGoal] = useState('')

    if (!isOpen) return null

    const handleContinue = () => {
        if (selectedPath) {
            onSelect(selectedPath)
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                >
                    <div className="p-8">
                        {/* Header */}
                        <div className="relative mb-6 mt-2 flex flex-col md:flex-row items-center gap-6">
                            {/* Robot Image */}
                            <div className="relative w-24 h-24 md:w-32 md:h-32 shrink-0">
                                <Image src="/aa.png" alt="AI Mentor" fill className="object-contain" />
                            </div>

                            {/* Text Content */}
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Let's Tailor Your Career Path</h2>
                                <p className="text-gray-600">
                                    Upload your resume, tell us your career goals, or choose from <span className="font-semibold text-gray-900">popular paths</span> to get started.
                                    <br /><span className="text-sm text-gray-500">You can change this later.</span>
                                </p>
                            </div>

                            <button onClick={onClose} className="absolute -top-4 -right-4 p-2 text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Top Section: Resume & Goals */}
                        <div className="grid md:grid-cols-2 gap-6 mt-8 mb-8">
                            {/* Upload Resume */}
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 relative overflow-hidden group hover:border-indigo-300 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-indigo-500 rounded-lg text-white">
                                        <Upload size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">Upload Your Resume</h3>
                                        <p className="text-gray-600 text-sm mt-1 mb-4">
                                            We'll analyze it to suggest the best career paths for you.
                                        </p>
                                        <div className="flex gap-2">
                                            <button className="px-4 py-2 bg-white text-indigo-600 text-sm font-semibold rounded-lg border border-indigo-200 hover:bg-gray-50">
                                                Upload Resume
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Career Goals */}
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 hover:border-emerald-300 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-emerald-500 rounded-lg text-white">
                                        <MessageSquare size={24} />
                                    </div>
                                    <div className="w-full">
                                        <h3 className="font-bold text-gray-900 text-lg">Tell Us Your Career Goals</h3>
                                        <p className="text-gray-600 text-sm mt-1 mb-4">
                                            Describe your career goals to let us better tailor your path.
                                        </p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="I'm interested in..."
                                                className="flex-1 px-3 py-2 text-sm rounded-lg border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                            <button className="px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-600">
                                                Submit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="relative mb-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500 font-medium tracking-wider">OR CHOOSE A PATH:</span>
                            </div>
                        </div>

                        {/* Career Grid */}
                        <div className="grid md:grid-cols-2 gap-4 mb-8">
                            {CAREER_PATHS.map((career) => (
                                <button
                                    key={career.id}
                                    onClick={() => setSelectedPath(career.id)}
                                    className={`flex items-center p-4 rounded-xl border-2 transition-all text-left relative
                    ${selectedPath === career.id
                                            ? 'border-indigo-600 bg-indigo-50 shadow-md transform scale-[1.02]'
                                            : 'border-transparent bg-gray-50 hover:bg-gray-100 hover:border-gray-200'
                                        }`}
                                >
                                    <div className={`p-3 rounded-lg text-white mr-4 ${career.color}`}>
                                        <career.icon size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900">{career.id}</h3>
                                        <p className="text-sm text-gray-600">{career.description}</p>
                                    </div>
                                    {selectedPath === career.id && (
                                        <div className="absolute top-4 right-4 text-indigo-600">
                                            <div className="bg-indigo-600 text-white rounded-full p-1">
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                            <div className="text-sm text-gray-500 italic hidden md:block">
                                Not sure where to start? Our AI career mentor can suggest the best path based on your goals.
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                <button onClick={onClose} className="px-6 py-2.5 text-gray-600 font-medium hover:text-gray-900">
                                    Back
                                </button>
                                <button
                                    onClick={handleContinue}
                                    disabled={!selectedPath || isLoading}
                                    className={`px-8 py-2.5 rounded-xl font-bold text-white shadow-lg shadow-indigo-200 transition-all
                            ${!selectedPath || isLoading
                                            ? 'bg-gray-300 cursor-not-allowed shadow-none'
                                            : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95'
                                        }
                        `}
                                >
                                    {isLoading ? 'Setting up...' : 'Continue'}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
