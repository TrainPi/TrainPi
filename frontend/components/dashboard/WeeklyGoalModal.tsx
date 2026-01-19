'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Rocket, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Logo from '../Logo'

interface WeeklyGoalModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (goal: number) => void
}

export default function WeeklyGoalModal({ isOpen, onClose, onConfirm }: WeeklyGoalModalProps) {
    const [selectedGoal, setSelectedGoal] = useState<number>(3)

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
                    />
                    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-lg pointer-events-auto"
                        >
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-2">
                                        <Logo showText={false} size="md" />
                                        <h2 className="text-xl font-bold text-gray-900">TrainPi</h2>
                                    </div>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                        <X size={24} />
                                    </button>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-2">Set Your Weekly Goal</h3>
                                <p className="text-gray-600 mb-6">How many lessons do you want to complete each week?</p>

                                {/* Goal Selection Options */}
                                <div className="flex gap-3 mb-6">
                                    {[2, 3, 5].map((count) => (
                                        <button
                                            key={count}
                                            onClick={() => setSelectedGoal(count)}
                                            className={`flex-1 py-3 px-2 rounded-xl text-sm font-semibold border transition-all ${selectedGoal === count
                                                ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500'
                                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            {count} Lessons
                                            {count === 3 && <span className="block text-xs font-normal opacity-75">(Recommended)</span>}
                                        </button>
                                    ))}
                                </div>

                                {/* Progress Bar Visualization (Static for setup) */}
                                <div className="mb-6">
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-teal-500 to-purple-500 w-[10%]" />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 text-right">0/{selectedGoal} completed this week</p>
                                </div>

                                {/* Insight */}
                                <div className="flex items-start gap-3 bg-indigo-50 p-4 rounded-xl mb-6">
                                    <Rocket className="text-indigo-500 mt-1" size={20} />
                                    <p className="text-sm text-indigo-900">
                                        Most learners complete 1 to 3 lessons per week.
                                    </p>
                                </div>

                                {/* Related Questions / Actions */}
                                <div className="space-y-2 mb-8">
                                    {[
                                        "Create a 4-week plan for my career path",
                                        "What skills should I focus on first?",
                                        "What jobs does this path lead to?"
                                    ].map((text, idx) => (
                                        <button key={idx} className="w-full text-left p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm flex items-center justify-between group transition-colors">
                                            <span className="flex items-center gap-2">
                                                <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600" />
                                                {text}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Footer Actions */}
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-2.5 text-gray-600 font-medium hover:text-gray-900 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => onConfirm(selectedGoal)}
                                        className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
                                    >
                                        Confirm Goal
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}
