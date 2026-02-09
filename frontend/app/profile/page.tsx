'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { authAPI, resumeAPI } from '../../lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { Camera, Save, User as UserIcon, MapPin, Globe, Github, Linkedin, Briefcase } from 'lucide-react'

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    headline: '',
    bio: '',
    location: '',
    website: '',
    linkedin_url: '',
    github_url: '',
    profile_image: ''
  })

  // Initialize form with user data
  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user) {
      setFormData({
        full_name: user.full_name || '',
        headline: user.headline || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        linkedin_url: user.linkedin_url || '',
        github_url: user.github_url || '',
        profile_image: user.profile_image || ''
      })
    }
  }, [user, isAuthenticated, router])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const toastId = toast.loading('Uploading image...')
    try {
      const res = await authAPI.uploadAvatar(file)
      // Update local state immediately
      setFormData(prev => ({ ...prev, profile_image: res.url }))

      // Update backend profile with new image URL immediately
      await authAPI.updateProfile({ profile_image: res.url })

      // Refresh user in store logic would go here if store had update method
      // For now relying on local state update which is visible

      toast.success('Profile picture updated!', { id: toastId })
    } catch (error) {
      console.error(error)
      toast.error('Failed to upload image', { id: toastId })
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await authAPI.updateProfile(formData)
      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error(error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600 transition">Dashboard</Link>
              <Link href="/learn" className="text-gray-700 hover:text-indigo-600 transition">Learn</Link>
              <Link href="/career" className="text-gray-700 hover:text-indigo-600 transition">Career</Link>
              <Link href="/profile" className="text-indigo-600 font-semibold border-b-2 border-indigo-600">Profile</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
          <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12 mb-6">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-100 overflow-hidden shadow-lg relative flex items-center justify-center">
                  {formData.profile_image ? (
                    <img
                      src={formData.profile_image.startsWith('http') ? formData.profile_image : `http://127.0.0.1:8000${formData.profile_image}`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon size={48} className="text-gray-400" />
                  )}

                  {/* Upload Overlay */}
                  <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="text-white" size={24} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-secondary flex items-center gap-2"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="btn-primary flex items-center gap-2"
                  >
                    {loading ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                  </button>
                </div>
              )}
            </div>

            {/* Profile Info Display / Edit */}
            <div>
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                      <input
                        type="text"
                        value={formData.headline}
                        onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. Senior Software Engineer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. San Francisco, CA"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input
                        type="text"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="https://"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                      <input
                        type="text"
                        value={formData.linkedin_url}
                        onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
                      <input
                        type="text"
                        value={formData.github_url}
                        onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Experience Summary</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-32"
                      placeholder="Tell us about your professional background..."
                    ></textarea>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{formData.full_name || 'My Profile'}</h1>
                    <p className="text-xl text-gray-600">{formData.headline || 'No headline set'}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-gray-600">
                    {formData.location && (
                      <div className="flex items-center gap-1">
                        <MapPin size={16} /> {formData.location}
                      </div>
                    )}
                    {formData.website && (
                      <a href={formData.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-indigo-600">
                        <Globe size={16} /> Website
                      </a>
                    )}
                    {formData.github_url && (
                      <a href={formData.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-indigo-600">
                        <Github size={16} /> GitHub
                      </a>
                    )}
                    {formData.linkedin_url && (
                      <a href={formData.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-indigo-600">
                        <Linkedin size={16} /> LinkedIn
                      </a>
                    )}
                  </div>

                  <div className="pt-6 border-t">
                    <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <Briefcase size={20} className="text-indigo-600" />
                      About & Experience
                    </h2>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {formData.bio || 'No bio added yet. Click Edit Profile to add a summary of your experience.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
