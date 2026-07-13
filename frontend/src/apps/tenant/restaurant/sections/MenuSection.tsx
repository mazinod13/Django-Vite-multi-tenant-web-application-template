import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import Marquee from '@/components/ui/marquee'
import { Coffee, Croissant, Drumstick, EggFried, Hamburger, IceCreamBowl, Pizza, Popcorn, Sandwich } from 'lucide-react'

// Import images from assets folder
import restaurantImg from '@/assets/restaurant.jpg'
import menuImg from '@/assets/menu.jpg'

export default function MenuSection() {
  return (
    <div className="space-y-6">
      {/* Restaurant Hero Image Banner with Text Overlay */}
      <div className="relative overflow-hidden rounded-base border-2 border-border shadow-shadow h-[250px]">
        <img src={restaurantImg} alt="Restaurant banner" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/45 flex items-center p-6 md:p-8">
          <div className="text-white space-y-2">
            <h2 className="text-3xl font-heading md:text-4xl text-white">Culinary Menu</h2>
            <p className="text-xs md:text-sm font-heading max-w-md opacity-90">
              Browse, search, and manage delicious menu items for your restaurant. Create a top-tier dining experience.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-heading">Manage Menu</h2>
        <p className="text-muted-foreground">Add new dishes, set prices, toggle availability, and structure catalog categories.</p>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>View Full Menu</Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              {/* Menu Details Card Illustration */}
              <div className="w-full h-[180px] overflow-hidden rounded-base border-2 border-border shadow-sm mb-4">
                <img src={menuImg} alt="Menu Details visual" className="w-full h-full object-cover" />
              </div>
              <AlertDialogTitle className="text-xl font-heading">Explore Catalog</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                This will display your active culinary catalog. Verify item descriptions, calorie guides, and dietary tags before saving.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Spacer to prevent fixed footer overlap */}
      <div className="h-16" />

      {/* Marquee pinned to the absolute bottom */}
      <div className="fixed inset-x-0 bottom-0 z-50">
        <Marquee items={[
          <><Hamburger className="w-10 h-10" /></>,
          <><Pizza className="w-10 h-10" /></>,
          <><Croissant className="w-10 h-10" /></>,
          <><Coffee className="w-10 h-10" /></>,
          <><EggFried className="w-10 h-10" /></>,
          <><Drumstick className="w-10 h-10" /></>,
          <><Sandwich className="w-10 h-10" /></>,
          <><IceCreamBowl className="w-10 h-10" /></>,
          <><Popcorn className="w-10 h-10" /></>
        ]} />
      </div>
    </div>
  )
}
