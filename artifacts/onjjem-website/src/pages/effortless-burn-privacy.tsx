import { Link } from "wouter";
import { ArrowLeft, Flame } from "lucide-react";

export default function EffortlessBurnPrivacy() {
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
          <h1 className="text-4xl md:text-5xl font-serif mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: July 2026</p>
        </div>

        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-serif text-foreground mb-2">The short version</h2>
            <p>
              effortless BURN does not collect, store, or share any personal data on our servers.
              Your activity is kept only on your own device. We don't require an account, and we
              don't run any analytics or tracking software inside the app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-foreground mb-2">What's stored on your device</h2>
            <p>
              Your logged activities, calorie totals, streaks, and history are saved locally on
              your phone using standard iOS app storage. This information never leaves your
              device and is not transmitted to us or to any third party. If you delete the app,
              this data is deleted with it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-foreground mb-2">In-app purchases</h2>
            <p>
              Level pack purchases are processed entirely by Apple through the App Store. We
              never see or store your payment details, card information, or Apple ID. Apple's own
              privacy policy governs that part of the transaction — you can review it at{" "}
              <a
                href="https://www.apple.com/legal/privacy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
              >
                apple.com/legal/privacy
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-foreground mb-2">Diagnostic data</h2>
            <p>
              If you choose to share analytics with app developers in your iPhone's Privacy
              settings, Apple may share anonymised crash and performance data with us to help fix
              bugs. This is controlled entirely by your device settings, not by the app itself,
              and contains no personal information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-foreground mb-2">Children</h2>
            <p>
              effortless BURN is not directed at children and does not knowingly collect any
              information from anyone, of any age, since the app doesn't collect personal data at
              all.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-foreground mb-2">Changes to this policy</h2>
            <p>
              If this policy ever changes — for example, if a future version of the app adds an
              account system or analytics — we'll update this page and the "Last updated" date
              above.
            </p>
          </section>

          <section className="pt-8 border-t border-border">
            <h2 className="text-xl font-serif text-foreground mb-2">Questions</h2>
            <p>
              Contact us at{" "}
              <a href="mailto:support@onjjem.com" className="text-foreground underline underline-offset-2 hover:text-primary transition-colors">
                support@onjjem.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
