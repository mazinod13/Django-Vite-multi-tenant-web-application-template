import {
  Coffee,
  Croissant,
  Drumstick,
  EggFried,
  Hamburger,
  IceCreamBowl,
  Pizza,
  Popcorn,
  Sandwich,
} from 'lucide-react'

import Marquee from '@/components/ui/marquee'

export default function MenuSection() {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-heading">Menu</h2>
      <p className="text-muted-foreground">Menu section — coming soon.</p>

      <div className="fixed inset-x-0 -bottom-5">
        <Marquee
          items={[
            <Hamburger className="h-10 w-10" />,
            <Pizza className="h-10 w-10" />,
            <Croissant className="h-10 w-10" />,
            <Coffee className="h-10 w-10" />,
            <EggFried className="h-10 w-10" />,
            <Drumstick className="h-10 w-10" />,
            <Sandwich className="h-10 w-10" />,
            <IceCreamBowl className="h-10 w-10" />,
            <Popcorn className="h-10 w-10" />,
          ]}
        />
      </div>
    </div>
  )
}
