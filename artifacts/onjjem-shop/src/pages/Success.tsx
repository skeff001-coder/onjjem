import { useEffect } from "react";
import { Link, useSearch } from "wouter";
import { useGetShopOrderBySession, getGetShopOrderBySessionQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";

export default function Success() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const sessionId = searchParams.get("session_id");

  const { data: order, isLoading } = useGetShopOrderBySession(sessionId || "", {
    query: {
      enabled: !!sessionId,
      queryKey: getGetShopOrderBySessionQueryKey(sessionId || ""),
      refetchInterval: (query) => {
        // Stop polling if we have the order
        if (query.state.data) return false;
        return 2000; // Poll every 2s until order is synced
      }
    }
  });

  if (!sessionId) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-lg">
        <h1 className="text-2xl font-bold mb-4">No session found</h1>
        <Link href="/">
          <Button>Return to Store</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24 flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          {isLoading || !order ? (
            <div className="bg-primary/10 p-6 rounded-full">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            </div>
          ) : (
            <div className="bg-green-500/10 p-6 rounded-full">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
          )}
        </div>

        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            {isLoading || !order ? "Confirming Order..." : "Order Confirmed!"}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {isLoading || !order 
              ? "Please wait while we sync your order details. Don't close this page." 
              : "Thank you for your purchase. Your dog's face is about to become a masterpiece. We've sent a receipt to your email."}
          </p>
        </div>

        {order && (
          <div className="bg-card border border-border rounded-xl p-6 text-left shadow-sm">
            <h3 className="font-semibold mb-4 text-lg border-b border-border pb-4">Order Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="capitalize font-medium text-primary">{order.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{order.customerEmail}</span>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4">
          <Link href="/">
            <Button size="lg" className="w-full" disabled={isLoading || !order}>
              Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
