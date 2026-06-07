import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft } from "lucide-react";

export default function Cancel() {
  return (
    <div className="container mx-auto px-4 py-24 flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="bg-muted p-6 rounded-full border border-border">
            <XCircle className="h-16 w-16 text-muted-foreground" />
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Payment Cancelled</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Your checkout was cancelled. No charges were made to your account. Your dog's photo is still waiting!
          </p>
        </div>

        <div className="pt-8">
          <Link href="/">
            <Button size="lg" variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to Store
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
