import { Link } from "wouter";
import { ArrowLeft, Mail, Flame } from "lucide-react";

export default function EffortlessBurnSupport() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-background/80 backdrop-blur-md border-b border-border/50">
        <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-foreground">
          ONJJEM
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shop
        </Link>
      </nav>

      <div className="pt-32 pb-20 px-6 md:px-12 max-w-2xl mx-auto">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Flame className="w-4 h-4" />
            effortless BURN
          </div>
          <h1 className="text-4xl md:text-5xl font-serif mb-4">Support</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Questions, feedback, or something not working right in effortless BURN? We reply to every message within 24 hours.
          </p>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-serif mb-2">Common questions</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <div>
                <p className="font-medium text-foreground">How do I unlock a level pack?</p>
                <p>Hit your current level's daily calorie target, then tap the prompt to unlock the next pack from the Levels tab.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">I bought a pack but it's not showing as unlocked.</p>
                <p>Open the More tab and tap "Restore purchases" — this re-checks your Apple account for anything already bought.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Does the app track my location or share my data?</p>
                <p>No. Your activity is stored only on your device. See our <Link href="/effortless-burn/privacy" className="text-foreground underline underline-offset-2 hover:text-primary transition-colors">Privacy Policy</Link> for details.</p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Mail className="w-5 h-5" />
              <span>
                Still need help? Email{" "}
                <a href="mailto:support@onjjem.com" className="text-foreground hover:text-primary transition-colors underline underline-offset-2">
                  support@onjjem.com
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
