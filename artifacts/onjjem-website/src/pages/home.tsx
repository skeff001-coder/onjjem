import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { products } from "@/data/products";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, ChevronRight, Check } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  
  useEffect(() => {
    // Check if URL has ?order=success
    if (window.location.search.includes("order=success")) {
      toast({
        title: "Order Successful",
        description: "Thank you for your order! We'll begin crafting your memory right away.",
        variant: "default",
      });
      // Clean up URL without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-foreground" data-testid="link-home">
            ONJJEM
          </Link>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link href="/" className="text-foreground hover:text-primary transition-colors" data-testid="link-nav-shop">Shop</Link>
          <span className="hover:text-primary transition-colors cursor-pointer" data-testid="link-nav-about">About</span>
          <span className="hover:text-primary transition-colors cursor-pointer" data-testid="link-nav-journal">Journal</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col gap-6"
          >
            <span className="text-sm font-medium uppercase tracking-widest text-primary">Photo Restoration & Print Studio</span>
            <h1 className="text-5xl md:text-7xl font-serif text-foreground leading-[1.1]">
              Memories made <br/><span className="text-muted-foreground italic">tangible.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              We turn your cherished photographs into heirloom objects. Beautifully crafted canvas, framed art, and personal gifts designed to last a lifetime.
            </p>
            <div className="pt-4">
              <button 
                onClick={() => {
                  document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-3 bg-foreground text-background px-8 py-4 rounded-sm text-sm font-medium tracking-wide hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                data-testid="button-explore"
              >
                Explore Collection
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="aspect-[4/5] bg-muted rounded-sm overflow-hidden relative shadow-2xl shadow-primary/5"
          >
            {/* Fallback styling since we don't have a hero image in assets, we use a product image */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent z-10" />
            <img 
              src="/onjjem-website/products/framed-canvas.webp" 
              alt="Framed canvas resting against a wall" 
              className="w-full h-full object-cover object-center"
            />
          </motion.div>
        </div>
      </section>

      {/* Collection Grid */}
      <section id="collection" className="py-24 px-6 md:px-12 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif text-foreground">The Collection</h2>
              <p className="mt-2 text-muted-foreground">Every piece is crafted to order.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {products.map((product, i) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group flex flex-col"
              >
                <Link href={`/product/${product.id}`} className="block relative aspect-square mb-6 overflow-hidden rounded-sm bg-muted" data-testid={`link-product-${product.id}`}>
                  <div className="absolute inset-0 bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWRlOWUzIi8+PC9zdmc+';
                    }}
                  />
                </Link>
                <div className="flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-serif text-xl text-foreground group-hover:text-primary transition-colors">
                      <Link href={`/product/${product.id}`}>{product.name}</Link>
                    </h3>
                    <span className="text-sm font-medium text-muted-foreground">
                      from £{(Math.min(...product.variants.map(v => v.pricePence)) / 100).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-grow">
                    {product.description}
                  </p>
                  <Link 
                    href={`/product/${product.id}`} 
                    className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors mt-auto"
                    data-testid={`link-personalize-${product.id}`}
                  >
                    Personalize <ChevronRight size={14} className="ml-1" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-16 px-6 md:px-12 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-serif text-2xl mb-4">ONJJEM</h4>
            <p className="text-background/70 max-w-sm">
              We believe photographs belong in your hands, not just on your phone. Dedicated to the craft of physical memories.
            </p>
          </div>
          <div>
            <h5 className="font-medium mb-4 text-sm tracking-widest uppercase text-background/50">Shop</h5>
            <ul className="space-y-2 text-background/80">
              <li><Link href="/" className="hover:text-primary-foreground transition-colors">All Products</Link></li>
              <li><span className="hover:text-primary-foreground transition-colors cursor-pointer">Wall Art</span></li>
              <li><span className="hover:text-primary-foreground transition-colors cursor-pointer">Gifts</span></li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-4 text-sm tracking-widest uppercase text-background/50">Support</h5>
            <ul className="space-y-2 text-background/80">
              <li><span className="hover:text-primary-foreground transition-colors cursor-pointer">Contact Us</span></li>
              <li><span className="hover:text-primary-foreground transition-colors cursor-pointer">Shipping & Returns</span></li>
              <li><span className="hover:text-primary-foreground transition-colors cursor-pointer">FAQ</span></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-background/10 text-sm text-background/40 flex justify-between items-center">
          <p>© {new Date().getFullYear()} ONJJEM Studio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
