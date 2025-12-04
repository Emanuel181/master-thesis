'use client'

import React, { useState } from 'react'

export function useThemeTransition() {
  const startTransition = (callback) => {
    callback()
  }

  return { startTransition }
}

export function ThemeToggleButton({
  theme = 'light',
  onClick,
  variant = 'circle-blur',
  start = 'top-right',
  className = ''
}) {
  const [isAnimating, setIsAnimating] = useState(false)
  const isDark = theme === 'dark'

  const handleClick = async (e) => {
    if (isAnimating) return

    setIsAnimating(true)

    const rect = e.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2

    // Calculate position based on start parameter
    let startX = x, startY = y
    if (start === 'top-right') {
      startX = window.innerWidth
      startY = 0
    } else if (start === 'center') {
      startX = window.innerWidth / 2
      startY = window.innerHeight / 2
    }

    if (variant === 'circle-blur' || variant === 'circle') {
      const endRadius = Math.hypot(
        Math.max(startX, window.innerWidth - startX),
        Math.max(startY, window.innerHeight - startY)
      )

      // Create animation element
      const animationEl = document.createElement('div')
      animationEl.style.position = 'fixed'
      animationEl.style.top = `${startY}px`
      animationEl.style.left = `${startX}px`
      animationEl.style.width = '0'
      animationEl.style.height = '0'
      animationEl.style.borderRadius = '50%'
      animationEl.style.transform = 'translate(-50%, -50%)'
      animationEl.style.pointerEvents = 'none'
      animationEl.style.zIndex = '9999'
      animationEl.style.backgroundColor = isDark ? '#ffffff' : '#09090b'

      if (variant === 'circle-blur') {
        animationEl.style.filter = 'blur(40px)'
      }

      document.body.appendChild(animationEl)

      // Animate
      animationEl.animate([
        { width: '0px', height: '0px' },
        { width: `${endRadius * 2}px`, height: `${endRadius * 2}px` }
      ], {
        duration: 800,
        easing: 'ease-in-out',
        fill: 'forwards'
      })

      setTimeout(() => {
        onClick?.()
        setTimeout(() => {
          animationEl.remove()
          setIsAnimating(false)
        }, 100)
      }, 400)
    } else {
      onClick?.()
      setIsAnimating(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isAnimating}
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background hover:bg-accent transition-colors disabled:opacity-50 ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </button>
  )
}

