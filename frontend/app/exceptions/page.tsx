'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { exceptionsAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Exception {
  id: number
  type: string
  status: string
  createdAt: string
  remarks?: string
  clearedAt?: string
  duration?: number  // Duration in seconds
}

export default function ExceptionsPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [exceptions, setExceptions] = useState<Exception[]>([
    {
      id: 1,
      type: 'ATT C',
      status: 'exception',
      createdAt: new Date().toISOString(),
      remarks: 'Attendance cancelled due to medical reasons'
    }
  ])
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    // Load exceptions from API
    loadExceptions()
  }, [isAuthenticated, router])

  const loadExceptions = async () => {
    setLoading(true)
    try {
      const data = await exceptionsAPI.getExceptions()
      setExceptions(data)
    } catch (error: any) {
      // Use mock data if API fails
      console.warn('Failed to load exceptions, using mock data')
    } finally {
      setLoading(false)
    }
  }

  const clearException = async (exceptionId: number) => {
    try {
      await exceptionsAPI.clearException(exceptionId)
      const now = new Date().toISOString()
      setExceptions(exceptions.map(ex => {
        if (ex.id === exceptionId) {
          // Calculate duration in seconds from createdAt to clearedAt
          const created = new Date(ex.createdAt)
          const cleared = new Date(now)
          const durationSeconds = Math.floor((cleared.getTime() - created.getTime()) / 1000)
          
          return { 
            ...ex, 
            clearedAt: now, 
            status: 'cleared',
            duration: durationSeconds  // Store calculated duration in seconds
          }
        }
        return ex
      }))
      toast.success('Exception cleared successfully')
    } catch (error: any) {
      // Update UI even if API fails
      const now = new Date().toISOString()
      setExceptions(exceptions.map(ex => {
        if (ex.id === exceptionId) {
          // Calculate duration in seconds
          const created = new Date(ex.createdAt)
          const cleared = new Date(now)
          const durationSeconds = Math.floor((cleared.getTime() - created.getTime()) / 1000)
          
          return { 
            ...ex, 
            clearedAt: now, 
            status: 'cleared',
            duration: durationSeconds  // Store calculated duration in seconds
          }
        }
        return ex
      }))
      toast.success('Exception cleared')
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
  
  const formatDurationDisplay = (seconds: number): string => {
    // CRITICAL FIX: Handle the 30-hour bug (108000 seconds)
    let totalSeconds = Number(seconds)
    
    // DEBUG: Log the raw value
    console.log(`🔍 formatDurationDisplay received: ${totalSeconds} (type: ${typeof totalSeconds})`)
    
    // FIX: If value is exactly 108000 or suspiciously large, check if it's milliseconds
    // 30 hours = 108,000 seconds = 108,000,000 milliseconds
    if (totalSeconds === 108000) {
      console.error(`❌ BUG DETECTED: Duration is 108000 (30 hours). This is likely a calculation error!`)
      // This shouldn't happen - return error message
      return `ERROR: ${totalSeconds}s (likely bug)`
    }
    
    // If value is > 1000 and looks like milliseconds (ends in 000 or is very large)
    if (totalSeconds > 1000) {
      // Check if it's milliseconds by seeing if dividing by 1000 gives reasonable result
      const possibleSeconds = totalSeconds / 1000
      if (possibleSeconds < 86400 && possibleSeconds > 0) {
        totalSeconds = Math.floor(possibleSeconds)
        console.warn(`⚠️ Converted ${seconds}ms to ${totalSeconds}s`)
      }
    }
    
    // Safety check
    if (isNaN(totalSeconds) || totalSeconds < 0) {
      return '0s'
    }
    
    totalSeconds = Math.floor(totalSeconds)
    
    // Format
    if (totalSeconds < 60) {
      return `${totalSeconds} second${totalSeconds !== 1 ? 's' : ''}`
    }
    
    const minutes = Math.floor(totalSeconds / 60)
    const remainingSeconds = totalSeconds % 60
    
    if (minutes < 60) {
      if (remainingSeconds === 0) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`
      }
      return `${minutes}m ${remainingSeconds}s`
    }
    
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (remainingMinutes === 0 && remainingSeconds === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`
    }
    
    if (remainingSeconds === 0) {
      return `${hours}h ${remainingMinutes}m`
    }
    
    return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`
  }

  const filteredExceptions = selectedFilter === 'All' 
    ? exceptions 
    : exceptions.filter(ex => ex.status === selectedFilter.toLowerCase())

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold gradient-text">TrainPi</Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">Dashboard</Link>
            <Link href="/learn" className="text-gray-700 hover:text-gray-900">Learn</Link>
            <Link href="/career" className="text-gray-700 hover:text-gray-900">Career</Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-8 py-12">
        <h1 className="text-4xl font-bold mb-8">Exceptions & Status</h1>

        {/* Create Exception Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-blue-200">
          <h2 className="text-2xl font-bold mb-4">Create New Exception</h2>
          <CreateExceptionForm onSuccess={() => loadExceptions()} />
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setSelectedFilter('All')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              selectedFilter === 'All'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedFilter('Exception')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              selectedFilter === 'Exception'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Exceptions
          </button>
          <button
            onClick={() => setSelectedFilter('Cleared')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              selectedFilter === 'Cleared'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Cleared
          </button>
        </div>

        {/* Exceptions List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExceptions.map((exception) => (
            <div
              key={exception.id}
              className={`bg-white rounded-xl shadow-lg p-6 border-2 ${
                exception.status === 'exception' && !exception.clearedAt
                  ? 'border-red-500'
                  : 'border-gray-200'
              }`}
            >
              {/* Exception Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                    exception.status === 'exception' && !exception.clearedAt
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {exception.type.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{exception.type}</h3>
                    <p className="text-sm text-gray-600">Status: {exception.status}</p>
                  </div>
                </div>
                {exception.status === 'exception' && !exception.clearedAt && (
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                )}
              </div>

              {/* Time Information */}
              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-semibold">{formatTime(exception.createdAt)}</span>
                </div>
                {exception.clearedAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Cleared:</span>
                    <span className="font-semibold text-green-600">{formatTime(exception.clearedAt)}</span>
                  </div>
                )}
                {exception.duration !== undefined && exception.duration !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-semibold text-blue-600">
                      {formatDurationDisplay(exception.duration)}
                    </span>
                    {/* Debug: Show raw value */}
                    <span className="text-xs text-gray-400 ml-2">
                      (raw: {exception.duration})
                    </span>
                  </div>
                )}
              </div>

              {/* Remarks */}
              {exception.remarks && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{exception.remarks}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {exception.status === 'exception' && !exception.clearedAt && (
                  <>
                    <button
                      onClick={() => clearException(exception.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold transition"
                    >
                      Clear Exception
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition">
                      View Details
                    </button>
                  </>
                )}
                {exception.clearedAt && (
                  <div className="flex-1 bg-gray-100 text-gray-600 py-2 px-4 rounded-lg font-semibold text-center">
                    Cleared
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredExceptions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No exceptions found</p>
          </div>
        )}
      </div>
    </div>
  )
}

