
import { Button } from '@/components/ui/button'
import Marquee from '@/components/ui/marquee'
import { Coffee, Croissant, Drumstick, EggFried, Hamburger, IceCreamBowl, Pizza, Popcorn, Sandwich } from 'lucide-react'
import { DualCalendar } from '@/components/ui/nepali-calendar'
import { useState } from 'react'
export default function MenuSection() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div className="space-y-4">
        <div className="fixed inset-x-0 -bottom-5 ">
            <Marquee items={[
                <><Hamburger className="w-10 h-10" /></>,
                <><Pizza className="w-10 h-10" /></>,
                <><Croissant className="w-10 h-10" /></>,
                <><Coffee  className="w-10 h-10" /></>,
                <><EggFried   className="w-10 h-10" /></>,
                <><Drumstick className="w-10 h-10"/></>,
                <><Sandwich  className="w-10 h-10"/></>,
                <><IceCreamBowl className="w-10 h-10" /></>,
                <><Popcorn className="w-10 h-10" /></>  
            ]}  />
        </div>
        <div className="flex items-right justify-between">
        <DualCalendar selected={date} onSelect={setDate} />
        </div>    
    </div>
  )
}
