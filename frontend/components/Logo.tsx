import Image from 'next/image'
import Link from 'next/link'
import trainpiLogo from '@/assets/image.png'

interface LogoProps {
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Logo({ showText = true, size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  }

  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <Image
        src={trainpiLogo}
        alt="TrainPi Logo"
        width={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
        height={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
        className={`${sizeClasses[size]} object-contain`}
        priority
      />
      {showText && (
        <span className={`font-bold gradient-text ${textSizes[size]}`}>
          TrainPi
        </span>
      )}
    </Link>
  )
}

