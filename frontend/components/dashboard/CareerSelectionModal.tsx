'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, MessageSquare, Code2, BarChart2, Cpu, Shield, Check, X, Loader2, Sparkles, BookOpen, Clock, Target } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { resumeAPI, aiFeaturesAPI } from '@/lib/api'

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

interface CareerGuidance {
    roadmap_id?: number
    steps: Array<{
        step_number: number
        title: string
        description: string
        estimated_time: string
        resources: any[]
    }>
    estimated_timeline: string
    key_skills: string[]
    next_action: string
}

export default function CareerSelectionModal({ isOpen, onClose, onSelect, isLoading }: CareerSelectionModalProps) {
    const router = useRouter()
    const [selectedPath, setSelectedPath] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isGettingGuidance, setIsGettingGuidance] = useState(false)
    const [resumeAnalysis, setResumeAnalysis] = useState<{ recommended_career: string; skills_found: string[]; match_score: number; summary?: string } | null>(null)
    const [careerGuidance, setCareerGuidance] = useState<CareerGuidance | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [careerGoal, setCareerGoal] = useState('')

    React.useEffect(() => {
        if (!isOpen) {
            setCareerGuidance(null)
            setResumeAnalysis(null)
            setCareerGoal('')
            setSelectedPath(null)
        }
    }, [isOpen])

    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const toastId = toast.loading('Analyzing resume with AI...')

        try {
            const result = await resumeAPI.uploadResume(file)
            if (result.success && result.analysis) {
                const recommended = result.analysis.recommended_career
                setSelectedPath(recommended)
                setResumeAnalysis(result.analysis)
                toast.success(`Resume analyzed! We recommend: ${recommended}`, { id: toastId })
            } else {
                toast.error('Could not analyze resume', { id: toastId })
            }
        } catch (error: any) {
            if (error.response?.status === 402 || error.message === 'INSUFFICIENT_CREDITS') {
                toast.error('Insufficient credits. Please add credits or use your own Gemini API key.', { id: toastId })
            } else {
                toast.error(error.response?.data?.detail || 'Failed to analyze resume', { id: toastId })
            }
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleCareerGoalSubmit = async () => {
        if (!careerGoal.trim()) {
            toast.error('Please enter your career goal')
            return
        }

        setIsGettingGuidance(true)
        const toastId = toast.loading('Generating your personal course preview...')

        try {
            const guidance = await aiFeaturesAPI.careerGoalsGuidance(careerGoal)
            setCareerGuidance(guidance)
            toast.success('Course preview generated! Review below to add to your path.', { id: toastId })
        } catch (error: any) {
            if (error.response?.status === 402 || error.message === 'INSUFFICIENT_CREDITS') {
                toast.error('Insufficient credits. Please add credits or use your own Gemini API key.', { id: toastId })
            } else {
                toast.error(error.response?.data?.detail || 'Failed to generate guidance', { id: toastId })
            }
        } finally {
            setIsGettingGuidance(false)
        }
    }

    const [isSaving, setIsSaving] = useState(false)
    const handleAddCourse = async () => {
        if (!careerGuidance) return
        setIsSaving(true)
        const toastId = toast.loading('Adding course to your learning path...')
        try {
            const result = await aiFeaturesAPI.saveCourse({
                goal: careerGoal || 'My Custom Path',
                steps: careerGuidance.steps,
                estimated_timeline: careerGuidance.estimated_timeline,
                key_skills: careerGuidance.key_skills,
                next_action: careerGuidance.next_action
            })
            toast.success('Course added successfully!', { id: toastId })
            // Remain on dashboard as requested, just close and refresh
            onClose()
            window.location.reload() // Or use an onSelect callback to refresh stats
        } catch (error) {
            toast.error('Failed to save course', { id: toastId })
        } finally {
            setIsSaving(false)
        }
    }

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
                            {/* Close button - always visible in top-right of card */}
                            <button
                                onClick={onClose}
                                className="absolute top-0 right-0 p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors z-10"
                                aria-label="Close"
                            >
                                <X size={24} />
                            </button>
                            {/* Robot Image */}
                            <div className="relative w-24 h-24 md:w-32 md:h-32 shrink-0">
                                <Image src="/aa.png" alt="AI Mentor" fill className="object-contain" />
                            </div>

                            {/* Text Content */}
                            <div className="flex-1 text-center md:text-left pr-10">
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Let's Tailor Your Career Path</h2>
                                <p className="text-gray-600">
                                    Upload your resume, tell us your career goals, or choose from <span className="font-semibold text-gray-900">popular paths</span> to get started.
                                    <br /><span className="text-sm text-gray-500">You can change this later.</span>
                                </p>
                            </div>
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
                                        <div className="flex gap-2 flex-wrap">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept=".pdf,.doc,.docx"
                                                onChange={handleFileChange}
                                            />
                                            <button
                                                onClick={handleUploadClick}
                                                disabled={isUploading}
                                                className="px-4 py-2 bg-white text-indigo-600 text-sm font-semibold rounded-lg border border-indigo-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin" />
                                                        Analyzing...
                                                    </>
                                                ) : (
                                                    'Upload Resume'
                                                )}
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
                                        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                                            <input
                                                type="text"
                                                value={careerGoal}
                                                onChange={(e) => setCareerGoal(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleCareerGoalSubmit()}
                                                placeholder="I want to learn Python..."
                                                className="flex-1 min-w-[200px] px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                            <button
                                                onClick={handleCareerGoalSubmit}
                                                disabled={isGettingGuidance}
                                                className="px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap min-w-[100px] justify-center"
                                            >
                                                {isGettingGuidance ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin" />
                                                        Analyzing...
                                                    </>
                                                ) : (
                                                    'Submit'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Resume Analysis Results */}
                        {resumeAnalysis && (
                            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <Sparkles className="text-indigo-600 mt-0.5" size={20} />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-900 mb-1">Resume Analysis Complete</h4>
                                        <p className="text-sm text-gray-700 mb-2">{resumeAnalysis.summary || `We found ${resumeAnalysis.skills_found.length} skills and recommend: ${resumeAnalysis.recommended_career}`}</p>
                                        {resumeAnalysis.skills_found.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {resumeAnalysis.skills_found.slice(0, 8).map((skill, i) => (
                                                    <span key={i} className="px-2 py-1 bg-white text-xs font-medium text-indigo-700 rounded border border-indigo-200">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Career Guidance Results */}
                        {careerGuidance && (
                            <div className="mb-6 p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
                                <div className="flex items-start gap-3 mb-4">
                                    <Target className="text-emerald-600 mt-0.5" size={20} />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-900 mb-1">Your Step-by-Step Learning Path</h4>
                                        <p className="text-sm text-gray-600 mb-3">{careerGuidance.next_action}</p>
                                        <div className="space-y-3">
                                            {careerGuidance.steps.map((step) => (
                                                <div key={step.step_number} className="bg-white p-3 rounded-lg border border-emerald-100">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                            {step.step_number}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h5 className="font-semibold text-gray-900 mb-1">{step.title}</h5>
                                                            <p className="text-sm text-gray-700 mb-2">{step.description}</p>
                                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                                <span className="flex items-center gap-1">
                                                                    <Clock size={12} /> {step.estimated_time}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-emerald-200">
                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                <BookOpen size={16} className="text-emerald-600" />
                                                <span className="font-medium">Estimated Timeline:</span>
                                                <span>{careerGuidance.estimated_timeline}</span>
                                            </div>
                                            {careerGuidance.key_skills.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {careerGuidance.key_skills.map((skill, i) => (
                                                        <span key={i} className="px-2 py-1 bg-white text-xs font-medium text-emerald-700 rounded border border-emerald-200">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Add to Courses Prompt */}
                                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between p-5 bg-white rounded-xl border-2 border-emerald-500 shadow-lg shadow-emerald-50/50 animate-fade-in gap-4">
                                            <div className="text-center sm:text-left">
                                                <p className="font-bold text-gray-900 flex items-center gap-2 justify-center sm:justify-start">
                                                    <Sparkles className="text-emerald-500" size={18} /> Add this plan to your courses?
                                                </p>
                                                <p className="text-sm text-gray-600">You'll unlock all resources and start tracking progress.</p>
                                            </div>
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <button
                                                    onClick={() => setCareerGuidance(null)}
                                                    className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                                                >
                                                    Discard
                                                </button>
                                                <button
                                                    onClick={handleAddCourse}
                                                    disabled={isSaving}
                                                    className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 hover:scale-[1.02] shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {isSaving ? (
                                                        <>
                                                            <Loader2 size={16} className="animate-spin" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        'Yes, Add Course'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}


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
