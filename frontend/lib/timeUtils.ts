/**
 * Convert seconds to formatted time string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
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

/**
 * Convert seconds to hours (decimal)
 */
export function secondsToHours(seconds: number): number {
  return seconds / 3600
}

/**
 * Convert seconds to minutes (decimal)
 */
export function secondsToMinutes(seconds: number): number {
  return seconds / 60
}

/**
 * Convert minutes to seconds
 */
export function minutesToSeconds(minutes: number): number {
  return minutes * 60
}

/**
 * Convert hours to seconds
 */
export function hoursToSeconds(hours: number): number {
  return hours * 3600
}

/**
 * Parse time string (e.g., "39s", "5m", "2h") to seconds
 */
export function parseTimeToSeconds(timeString: string): number {
  const trimmed = timeString.trim().toLowerCase()
  
  // Handle seconds
  if (trimmed.endsWith('s') || trimmed.endsWith('sec') || trimmed.endsWith('second')) {
    const num = parseFloat(trimmed.replace(/[^0-9.]/g, ''))
    return Math.floor(num)
  }
  
  // Handle minutes
  if (trimmed.endsWith('m') || trimmed.endsWith('min') || trimmed.endsWith('minute')) {
    const num = parseFloat(trimmed.replace(/[^0-9.]/g, ''))
    return Math.floor(num * 60)
  }
  
  // Handle hours
  if (trimmed.endsWith('h') || trimmed.endsWith('hr') || trimmed.endsWith('hour')) {
    const num = parseFloat(trimmed.replace(/[^0-9.]/g, ''))
    return Math.floor(num * 3600)
  }
  
  // If no unit, assume seconds
  const num = parseFloat(trimmed)
  return isNaN(num) ? 0 : Math.floor(num)
}

