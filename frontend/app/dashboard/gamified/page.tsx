'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Zap, Users, Star, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { aiFeaturesAPI } from '@/lib/api'

interface Game {
    id: string
    title: string
    type: 'Quiz' | 'Challenge' | 'Puzzle'
    difficulty: 'Easy' | 'Medium' | 'Hard'
    plays: number
    rating: number
    description: string
    xpReward: number
}

const SAMPLE_GAMES: Game[] = [
    {
        id: '1',
        title: 'Python Basics Master',
        type: 'Quiz',
        difficulty: 'Easy',
        plays: 120,
        rating: 4.8,
        description: 'Test your knowledge of Python fundamentals.',
        xpReward: 100
    },
    {
        id: '2',
        title: 'Algorithm Arena',
        type: 'Challenge',
        difficulty: 'Hard',
        plays: 85,
        rating: 4.9,
        description: 'Solve complex algorithmic problems against the clock.',
        xpReward: 500
    },
    {
        id: '3',
        title: 'CSS Flexbox Froggy',
        type: 'Puzzle',
        difficulty: 'Medium',
        plays: 340,
        rating: 4.7,
        description: 'A fun puzzle game to master CSS layouts.',
        xpReward: 250
    }
]

export default function GamifiedLearningPage() {
    const [games, setGames] = useState<Game[]>(SAMPLE_GAMES)
    const [isCreating, setIsCreating] = useState(false)
    const [newGameTitle, setNewGameTitle] = useState('')
    const [userLevel, setUserLevel] = useState(5)
    const [userXP, setUserXP] = useState(2450)
    const [playingGame, setPlayingGame] = useState<Game | null>(null)

    const handleCompleteChallenge = (game: Game) => {
        setUserXP(prev => prev + game.xpReward)
        setPlayingGame(null)
        toast.success(`+${game.xpReward} XP earned!`)
    }

    const handleCreateGame = async (e: React.FormEvent) => {
        e.preventDefault()
        const topic = newGameTitle.trim()
        if (!topic) return

        toast.loading('AI is generating your challenge...')
        try {
            const res = await aiFeaturesAPI.generateGamified(topic)
            const newGame: Game = {
                id: Date.now().toString(),
                title: res.title || topic,
                type: (res.type as Game['type']) || 'Quiz',
                difficulty: (res.difficulty as Game['difficulty']) || 'Medium',
                plays: 0,
                rating: 5.0,
                description: res.description || 'AI-generated challenge.',
                xpReward: res.xpReward ?? 200
            }
            setGames([newGame, ...games])
            setIsCreating(false)
            setNewGameTitle('')
            toast.dismiss()
            toast.success('Challenge created!')
        } catch (e: any) {
            toast.dismiss()
            const msg = e.response?.data?.detail ?? e.message ?? 'Failed to generate challenge'
            toast.error(msg)
            if (msg.includes('credits') || msg.includes('quota')) {
                toast('Add your Gemini key or buy credits at Manage Credits.', { icon: '💳' })
            }
        }
    }

    return (
        <div className="space-y-8 animate-fade-in">

            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                            Gamified Learning
                        </span>
                        <span className="text-3xl">🎮</span>
                    </h1>
                    <p className="text-gray-600 text-lg">Create games, challenge peers, and master your skills.</p>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100 flex items-center gap-6">
                    <div className="text-center px-4 border-r border-gray-100">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Level</p>
                        <p className="text-3xl font-black text-indigo-600">{userLevel}</p>
                    </div>
                    <div className="text-center px-4">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">XP</p>
                        <p className="text-3xl font-black text-amber-500">{userXP}</p>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Available Challenges</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 hover:-translate-y-1"
                >
                    <Plus size={20} /> Create New Game
                </button>
            </div>

            {/* Create Game Modal / Area */}
            {isCreating && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-8 rounded-2xl shadow-xl border border-indigo-100 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="inline-block p-3 rounded-full bg-indigo-50 text-indigo-600 mb-4">
                            <Sparkles size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Design Your Challenge</h3>
                        <p className="text-gray-600 mb-2">Enter a topic or skill and our AI (Gemini) will generate a gamified challenge.</p>
                        <p className="text-xs text-gray-500 mb-6">Uses 3 credits or your Gemini key (Manage Credits).</p>

                        <form onSubmit={handleCreateGame} className="flex gap-2 relative">
                            <input
                                type="text"
                                value={newGameTitle}
                                onChange={(e) => setNewGameTitle(e.target.value)}
                                placeholder="What do you want to learn today?"
                                className="w-full px-6 py-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-lg outline-none transition-all placeholder:text-slate-400"
                                autoFocus
                            />
                            <button
                                type="submit"
                                className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-black transition-colors"
                            >
                                Generate
                            </button>
                        </form>
                        <button
                            onClick={() => setIsCreating(false)}
                            className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
                        >
                            Cancel
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Games Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map((game) => (
                    <div key={game.id} className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                            <ArrowIcon />
                        </div>

                        <div className="mb-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                        ${game.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                    game.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}
                       `}>
                                {game.difficulty}
                            </span>
                            <span className="ml-2 inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wide">
                                {game.type}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{game.title}</h3>
                        <p className="text-gray-500 text-sm mb-6 line-clamp-2">{game.description}</p>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><Users size={14} /> {game.plays}</span>
                                <span className="flex items-center gap-1"><Star size={14} className="text-amber-400 fill-amber-400" /> {game.rating}</span>
                            </div>
                            <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
                                <Zap size={14} className="fill-emerald-600" /> +{game.xpReward} XP
                            </div>
                        </div>

                        <button
                            onClick={() => setPlayingGame(game)}
                            className="w-full mt-6 bg-indigo-50 text-indigo-700 py-2.5 rounded-lg font-semibold hover:bg-indigo-600 hover:text-white transition-all"
                        >
                            Play Now
                        </button>
                    </div>
                ))}
            </div>

            {/* Play challenge modal */}
            {playingGame && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                    onClick={() => setPlayingGame(null)}
                >
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-2xl font-bold text-gray-900">{playingGame.title}</h3>
                            <button
                                onClick={() => setPlayingGame(null)}
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>
                        <p className="text-gray-600 mb-4">{playingGame.description}</p>
                        <div className="flex gap-2 mb-6">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                {playingGame.type}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                {playingGame.difficulty}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-bold text-emerald-600">
                                +{playingGame.xpReward} XP
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">
                            Complete this challenge in your own way (e.g. practice the topic, write code, or teach someone). When done, mark it complete to earn XP.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setPlayingGame(null)}
                                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => handleCompleteChallenge(playingGame)}
                                className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                            >
                                I completed this (+{playingGame.xpReward} XP)
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    )
}

function ArrowIcon() {
    return (
        <svg className="w-6 h-6 -rotate-45 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
    )
}
