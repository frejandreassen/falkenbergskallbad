import { bookUsingSwish } from "@/lib/actions";

export async function POST(request) {
  try {
    // Parse the request body
    const { order, id } = await request.json();
    
    if (!order || !id) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Call the bookUsingSwish function
    const booking = await bookUsingSwish(order, id);
    
    // Return the booking result
    return Response.json({ booking });
    
  } catch (error) {
    console.error("Error processing Swish booking:", error);
    return Response.json(
      { error: "Failed to process booking" },
      { status: 500 }
    );
  }
}