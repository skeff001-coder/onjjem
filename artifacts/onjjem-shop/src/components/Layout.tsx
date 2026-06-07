import { Link } from "wouter";
import { Dog, Heart } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight transition-colors hover:text-primary/90">
            <Dog className="h-6 w-6" />
            onJJem Merch
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
              Shop All
            </Link>
            <Link href="/pets" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" /> Pets
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border/40 py-8 md:py-12 mt-auto">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-primary/80 font-semibold">
            <Dog className="h-5 w-5" />
            onJJem
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-left">
            For people completely obsessed with their dog.
          </p>
        </div>
      </footer>
    </div>
  );
}
