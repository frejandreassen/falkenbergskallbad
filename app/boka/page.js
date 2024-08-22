import { getSlots } from '@/lib/actions'
import Booking from '@/components/Booking'



export default async function Page() {
// const [checkoutOpen, setCheckoutOpen] = useState(false)
const slots = await getSlots()

  return (
    <div className="bg-white py-24 px-4 max-w-5xl mx-auto">
    
    <h1 className="font-bodoni-moda text-3xl my-10">Denna sida är under uppbyggnad</h1>
    <Booking slots={slots}/>
    
    </div>
  )
}
