'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Logo from '@/components/Logo'

const INTEREST_OPTIONS = [
  'Technology', 'Design', 'Marketing', 'Data Analysis',
  'Project Management', 'Engineering', 'Graphic Design',
  'Customer Support', 'Cybersecurity', 'Software Development'
]

const SKILL_OPTIONS = [
  'Programming', 'UI/UX', 'SEO', 'Data Analysis',
  'Web Development', 'Cloud Computing', 'Network Security'
]

export default function CareerPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [interests, setInterests] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [customInterest, setCustomInterest] = useState('')
  const [customSkill, setCustomSkill] = useState('')
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const toggleSkill = (skill: string) => {
    setSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  const addCustomInterest = () => {
    if (customInterest.trim() && !interests.includes(customInterest.trim())) {
      setInterests([...interests, customInterest.trim()])
      setCustomInterest('')
    }
  }

  const addCustomSkill = () => {
    if (customSkill.trim() && !skills.includes(customSkill.trim())) {
      setSkills([...skills, customSkill.trim()])
      setCustomSkill('')
    }
  }

  const handleDiscover = async () => {
    if (interests.length === 0 || skills.length === 0) {
      toast.error('Please select at least one interest and one skill')
      return
    }

    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock career matches
    const mockMatches = [
      {
        career_path: 'Full Stack Developer',
        match_score: 85,
        salary_range: '$75,000 - $120,000',
        growth_outlook: '+22%',
        required_skills: ['JavaScript', 'React', 'Node.js', 'SQL']
      },
      {
        career_path: 'Data Scientist',
        match_score: 78,
        salary_range: '$90,000 - $140,000',
        growth_outlook: '+31%',
        required_skills: ['Python', 'SQL', 'Machine Learning', 'Statistics']
      },
      {
        career_path: 'UI/UX Designer',
        match_score: 72,
        salary_range: '$65,000 - $110,000',
        growth_outlook: '+15%',
        required_skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems']
      }
    ]
    
    setMatches(mockMatches)
    setShowResults(true)
    toast.success('Career matches found!')
    setLoading(false)
  }

  const handleSelectCareer = async (careerPath: string) => {
    // Save to localStorage
    const userData = localStorage.getItem(`trainpi-user-${useAuthStore.getState().user?.id}`)
    const data = userData ? JSON.parse(userData) : {}
    data.career_path = careerPath
    data.stats = {
      ...data.stats,
      career_path: careerPath,
      roadmap_completion: 0
    }
    localStorage.setItem(`trainpi-user-${useAuthStore.getState().user?.id}`, JSON.stringify(data))
    
    toast.success(`Career path ${careerPath} selected!`)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600 transition">Dashboard</Link>
              <Link href="/learn" className="text-gray-700 hover:text-indigo-600 transition">Learn</Link>
              <Link href="/career" className="text-indigo-600 font-semibold">Career</Link>
              <Link href="/mentor" className="text-gray-700 hover:text-indigo-600 transition">Mentor</Link>
              <Link href="/profile" className="text-gray-700 hover:text-indigo-600 transition">Profile</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card-modern p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Career Planning</h1>
          <p className="text-lg text-gray-600 mb-8">Define your career goals to get started with TrainPi</p>

          {!showResults ? (
            <>
              {/* Interests Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">What are your interests?</h2>
                <div className="flex flex-wrap gap-3 mb-4">
                  {INTEREST_OPTIONS.map(interest => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-xl border-2 transition ${
                        interests.includes(interest)
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                          : 'border-gray-200 hover:border-indigo-300 text-gray-700'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomInterest()}
                    placeholder="Enter a custom interest"
                    className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  <button
                    onClick={addCustomInterest}
                    className="btn-secondary"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Skills Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">What skills do you have?</h2>
                <div className="flex flex-wrap gap-3 mb-4">
                  {SKILL_OPTIONS.map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-4 py-2 rounded-xl border-2 transition ${
                        skills.includes(skill)
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                          : 'border-gray-200 hover:border-indigo-300 text-gray-700'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomSkill()}
                    placeholder="Enter a custom skill"
                    className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  <button
                    onClick={addCustomSkill}
                    className="btn-secondary"
                  >
                    Add
                  </button>
                </div>
              </div>

              <button
                onClick={handleDiscover}
                disabled={loading || interests.length === 0 || skills.length === 0}
                className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Discovering Careers...' : 'Discover Career Paths →'}
              </button>
            </>
          ) : (
            <div>
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">Career Matches</h2>
              <div className="space-y-4">
                {matches.map((match, index) => (
                  <div key={index} className="card-modern p-6 border-2 border-indigo-100">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-bold text-gray-900">{match.career_path}</h3>
                      <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full font-semibold">
                        {match.match_score?.toFixed(0) || 'N/A'}% Match
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Salary Range</p>
                        <p className="font-semibold text-gray-900">{match.salary_range || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Growth Outlook</p>
                        <p className="font-semibold text-green-600">{match.growth_outlook || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Required Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {(match.required_skills || []).map((skill: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelectCareer(match.career_path)}
                      className="w-full btn-primary"
                    >
                      View Learning Path →
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowResults(false)}
                className="mt-6 btn-secondary"
              >
                ← Back to Selection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
