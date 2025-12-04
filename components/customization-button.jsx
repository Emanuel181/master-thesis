'use client'

import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

export function CustomizationButton({ className = "" }) {
  const router = useRouter()

  const handleClick = useCallback(() => {
    router.push('/customization')
  }, [router])

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleClick}
      className={className}
      aria-label="Open theme customization"
    >
      <Settings className="h-5 w-5" />
    </Button>
  )
}

