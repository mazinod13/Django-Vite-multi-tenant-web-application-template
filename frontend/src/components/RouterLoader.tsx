import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import doodleLeft from '@/apps/public/doodle/doodle_left.png'
import doodleRight from '@/apps/public/doodle/doodle_right.png'

export default function RouteLoader() {
  const location = useLocation()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const timeout = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(timeout)
  }, [location.pathname])

  if (!loading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="relative h-[300px] w-[240px]" style={{ perspective: '600px' }}>
        <img
          src={doodleLeft}
          alt=""
          className="absolute right-1/2 top-0 h-full w-auto origin-right animate-door-left"
        />
        <img
          src={doodleRight}
          alt=""
          className="absolute left-1/2 top-0 h-full w-auto origin-right animate-door-right"
        />
      </div>
    </div>
  )
}