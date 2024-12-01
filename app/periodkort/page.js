import Checkout from "@/components/Periodkort/Checkout";
import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default async function Page() {

  // return (
  //   <div className="bg-white mt-10 py-24 px-4 max-w-xl mx-auto">
  //   <h1 className="text-3xl font-bold text-center mb-6">
  //     Köp årskort och klippkort
  //   </h1>
    
  //   <Alert variant="destructive" className="mt-6">
  //     <AlertCircle className="h-4 w-4" />
  //     <AlertTitle>Tillfälligt stängt för underhåll</AlertTitle>
  //     <AlertDescription className="mt-2">
  //       Vi utför just nu underhåll på vårt betalsystem. Vänligen försök igen om en stund.
  //     </AlertDescription>
  //   </Alert>
  // </div>
  // )
  return (
    <div className="bg-white mt-10 py-24 px-4 max-w-xl mx-auto">
      <Checkout />
    </div>
  );
}
