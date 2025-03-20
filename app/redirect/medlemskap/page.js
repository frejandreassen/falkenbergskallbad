"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getPayment, updateMemberPayment } from "@/lib/actions";

function PaymentHandler() {
  const [status, setStatus] = useState("Kontrollerar betalning...");
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const paymentId = searchParams.get("paymentId");
    const memberId = searchParams.get("memberId");
    const uuid = searchParams.get("uuid");
    
    if (!paymentId || !memberId || !uuid) {
      setError("Saknade parametrar. Kunde inte verifiera betalning.");
      console.error("Missing parameters:", { 
        paymentId: paymentId || "missing", 
        memberId: memberId || "missing", 
        uuid: uuid || "missing"
      });
      
      // If we at least have the UUID, provide a link back
      if (uuid) {
        setTimeout(() => {
          router.push(`/medlemskap/${uuid}`);
        }, 5000);
        setStatus("Omdirigerar tillbaka till medlemssidan om 5 sekunder...");
      }
      return;
    }

    const checkPayment = async () => {
      try {
        let attempts = 0;
        const maxAttempts = 20;
        
        const pollPayment = async () => {
          if (attempts >= maxAttempts) {
            setStatus("Betalningen kunde inte verifieras inom rimlig tid.");
            return;
          }
          
          attempts++;
          setStatus(`Kontrollerar betalningsstatus... (${attempts})`);
          
          try {
            const payment = await getPayment(paymentId);
            
            if (payment.status === "PAID") {
              setStatus("Betalning godkänd! Uppdaterar medlemskap...");
              
              try {
                // Update membership payment status
                await updateMemberPayment(memberId, {
                  amount: 300, // Standard membership fee
                  message: `Medlemskap ${new Date().getFullYear()}`
                });
                
                setStatus("Medlemskap förnyat! Omdirigerar...");
                
                // Redirect to the membership page after successful processing
                setTimeout(() => {
                  router.push(`/medlemskap/${uuid}`);
                }, 2000);
                
                return; // Exit polling loop
              } catch (updateError) {
                console.error("Error updating membership:", updateError);
                setError("Betalningen lyckades men ett fel uppstod vid uppdateringen av medlemskapet. Vänligen kontakta oss.");
                return; // Exit polling loop
              }
            } else if (["DECLINED", "ERROR", "CANCELLED"].includes(payment.status)) {
              setStatus("Betalningen misslyckades.");
              setError(`Swish-betalningen kunde inte genomföras (${payment.status}).`);
              return; // Exit polling loop
            }
            
            // Continue polling if payment is still pending
            setTimeout(pollPayment, 2000);
          } catch (error) {
            console.error("Payment check error:", error);
            setError("Ett fel uppstod vid kontroll av betalningen.");
          }
        };
        
        // Start polling
        pollPayment();
      } catch (e) {
        console.error("Error:", e);
        setError("Ett tekniskt fel uppstod.");
      }
    };

    checkPayment();
  }, [searchParams, router]);

  return (
    <div className="bg-white p-8 max-w-md mx-auto mt-20 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Betalning med Swish</h1>
      
      <div className="text-center mb-6">
        <p className="mb-2">{status}</p>
        
        {error && (
          <div className="text-red-600 mt-4">
            <p>{error}</p>
            <p className="mt-2">
              <a 
                href={`/medlemskap/${searchParams.get("uuid")}`} 
                className="text-indigo-600 underline"
              >
                Gå tillbaka till medlemssidan
              </a>
            </p>
          </div>
        )}

        {!error && (
          <div className="mt-6 flex justify-center">
            <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function PaymentFallback() {
  return (
    <div className="bg-white p-8 max-w-md mx-auto mt-20 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Betalning med Swish</h1>
      <div className="text-center mb-6">
        <p className="mb-4">Laddar betalningsinformation...</p>
        <div className="mt-6 flex justify-center">
          <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function MembershipPaymentRedirect() {
  return (
    <Suspense fallback={<PaymentFallback />}>
      <PaymentHandler />
    </Suspense>
  );
}