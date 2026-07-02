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

export default function MenuSection() {
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
      <h2 className="text-2xl font-heading">Menu</h2>
      <p className="text-muted-foreground">Manage your menu items here.</p>
      <AlertDialog>
        <AlertDialogTrigger asChild><Button>View Menu</Button></AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Checking Menu?</AlertDialogTitle>
            <AlertDialogDescription>This will give you a list of Menu..</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
   
    </div>
  )
}
