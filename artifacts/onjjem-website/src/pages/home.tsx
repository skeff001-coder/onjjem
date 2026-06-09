import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { products } from "@/data/products";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, ChevronRight } from "lucide-react";

const CATEGORIES = [
  { key: "all",         label: "All" },
  { key: "wall-art",    label: "Wall Art" },
  { key: "frames",      label: "Frames" },
  { key: "prints",      label: "Prints" },
  { key: "gifts",       label: "Gifts" },
  { key: "pets",        label: "Pets" },
  { key: "kitchen",     label: "Kitchen" },
  { key: "magnets",     label: "Magnets" },
  { key: "tattoos",     label: "Tattoos" },
  { key: "phone-cases", label: "Phone Cases" },
  { key: "glow-posters", label: "Glow Posters" },
];

export default function Home() {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("all");

  const scrollToCollection = (category?: string) => {
    if (category) setActiveCategory(category);
    setTimeout(() => {
      document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  useEffect(() => {
    if (window.location.search.includes("order=success")) {
      toast({
        title: "Order Successful",
        description: "Thank you for your order! We'll begin crafting your memory right away.",
        variant: "default",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (window.location.pathname.endsWith("/shop")) {
      scrollToCollection();
    }
    // Sync category from URL query param on load
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    if (cat && CATEGORIES.some(c => c.key === cat)) {
      setActiveCategory(cat);
    }
  }, [toast]);

  const filtered = activeCategory === "all"
    ? products
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-background/90 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-serif text-3xl font-bold tracking-[0.2em] text-primary uppercase" data-testid="link-home">
            ONJJEM
          </Link>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <button onClick={() => scrollToCollection()} className="text-foreground hover:text-primary transition-colors" data-testid="link-nav-shop">Shop</button>
          <button onClick={() => scrollToCollection("gifts")} className="hover:text-primary transition-colors" data-testid="link-nav-gifts">Gifts</button>
          <span className="hover:text-primary transition-colors cursor-pointer" data-testid="link-nav-about">About</span>
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
              Memories made <br/><span className="text-primary italic">tangible.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              We turn your cherished photographs into heirloom objects. Beautifully crafted canvas, framed art, and personal gifts designed to last a lifetime.
            </p>
            <div className="pt-4 flex flex-wrap gap-3">
              <button
                onClick={() => scrollToCollection()}
                className="inline-flex items-center gap-3 bg-foreground text-background px-8 py-4 rounded-sm text-sm font-medium tracking-wide hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                data-testid="button-explore"
              >
                Explore Collection
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => scrollToCollection("gifts")}
                className="inline-flex items-center gap-3 border border-border text-foreground px-8 py-4 rounded-sm text-sm font-medium tracking-wide hover:border-primary hover:text-primary transition-all duration-300"
                data-testid="button-gifts"
              >
                Gift Ideas
              </button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="aspect-[4/5] bg-muted rounded-sm overflow-hidden relative shadow-2xl shadow-primary/5"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent z-10" />
            <img
              src="/products/framed-canvas.webp"
              alt="Framed canvas resting against a wall"
              className="w-full h-full object-cover object-center"
            />
          </motion.div>
        </div>
      </section>

      {/* Collection Grid */}
      <section id="collection" className="py-24 px-6 md:px-12 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif text-foreground">The Collection</h2>
              <p className="mt-2 text-muted-foreground">Every piece is crafted to order.</p>
            </div>
            <div className="hidden sm:block text-sm text-muted-foreground bg-foreground/5 px-4 py-2 rounded-sm border border-border/50 shrink-0">
              <span className="text-foreground font-medium">🎁 Free Playing Cards</span> on orders over £50
            </div>
          </div>

          {/* Category filter tabs */}
          <div className="flex flex-wrap gap-2 mb-10">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                data-testid={`filter-${cat.key}`}
                className={`px-4 py-2 rounded-sm text-sm font-medium transition-all duration-200 border ${
                  activeCategory === cat.key
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16"
            >
              {filtered.length === 0 ? (
                <p className="col-span-3 text-muted-foreground py-12 text-center">No products in this category yet.</p>
              ) : filtered.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
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
                      Personalise <ChevronRight size={14} className="ml-1" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* FAQ & Shipping */}
      <section id="faq" className="py-16 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <h2 className="text-3xl font-serif text-foreground mb-8">FAQ</h2>
        <div className="space-y-6 max-w-2xl">
          <div>
            <h3 className="font-medium text-foreground mb-1">How long does delivery take?</h3>
            <p className="text-muted-foreground text-sm">Most orders are delivered within 3-5 working days. Canvas and framed items may take 5-7 working days.</p>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-1">What if I am not happy with my order?</h3>
            <p className="text-muted-foreground text-sm">Contact us within 14 days and we will replace or refund any faulty or misprinted item. Each piece is checked for quality before it leaves.</p>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-1">Do you ship outside the UK?</h3>
            <p className="text-muted-foreground text-sm">Yes, we ship to most of Europe, the USA, Canada, and Australia. Delivery times and shipping costs vary by country.</p>
          </div>
        </div>
      </section>

      {/* Shipping & Returns */}
      <section id="shipping" className="py-16 px-6 md:px-12 bg-secondary/30 w-full">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-serif text-foreground mb-8">Shipping & Returns</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl">
            <div>
              <h3 className="font-medium text-foreground mb-2">Delivery</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                All UK orders ship free via Royal Mail or courier. Tracking is provided on all orders. International orders are shipped with tracking and insurance.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-2">Returns</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                If your item arrives damaged or is not as described, contact us within 14 days for a replacement or full refund. Personalised items are non-refundable unless faulty.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="py-16 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif text-foreground mb-2">Loved by Customers</h2>
          <div className="flex items-center justify-center gap-1 text-amber-500">
            <span className="text-lg">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
            <span className="text-sm text-muted-foreground ml-2">4.9 out of 5 from 200+ reviews</span>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-secondary/30 p-6 rounded-sm border border-border/50">
            <div className="text-amber-500 text-sm mb-3">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p className="text-sm text-foreground/80 leading-relaxed mb-4">
              "I sent them a blurry photo of my grandmother from the 1960s. The restoration was incredible — they brought back details I never knew were there. The canvas print now hangs in our hallway."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">SM</div>
              <div>
                <p className="text-sm font-medium text-foreground">Sarah M.</p>
                <p className="text-xs text-muted-foreground">Stretched Canvas</p>
              </div>
            </div>
          </div>
          <div className="bg-secondary/30 p-6 rounded-sm border border-border/50">
            <div className="text-amber-500 text-sm mb-3">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p className="text-sm text-foreground/80 leading-relaxed mb-4">
              "Ordered the jigsaw puzzle for my mum's birthday. She cried when she opened it — it was a photo of her wedding day. The quality is superb and the tin is beautiful."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">JC</div>
              <div>
                <p className="text-sm font-medium text-foreground">James C.</p>
                <p className="text-xs text-muted-foreground">500pc Jigsaw</p>
              </div>
            </div>
          </div>
          <div className="bg-secondary/30 p-6 rounded-sm border border-border/50">
            <div className="text-amber-500 text-sm mb-3">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p className="text-sm text-foreground/80 leading-relaxed mb-4">
              "I had a black and white photo of my parents from the 70s colourized. The colours look natural and warm — not fake at all. Ordered it as a box frame and it looks like a gallery piece."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">RP</div>
              <div>
                <p className="text-sm font-medium text-foreground">Rebecca P.</p>
                <p className="text-xs text-muted-foreground">Box Frame</p>
              </div>
            </div>
          </div>
          <div className="bg-secondary/30 p-6 rounded-sm border border-border/50">
            <div className="text-amber-500 text-sm mb-3">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p className="text-sm text-foreground/80 leading-relaxed mb-4">
              "Fast delivery, amazing quality. The tea towel with my dog's photo is now the most commented-on thing in our kitchen. Everyone asks where we got it done."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">LT</div>
              <div>
                <p className="text-sm font-medium text-foreground">Laura T.</p>
                <p className="text-xs text-muted-foreground">Tea Towel</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border/40 text-foreground py-16 px-6 md:px-12 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-serif text-3xl tracking-[0.2em] text-primary uppercase mb-4">ONJJEM</h4>
            <p className="text-muted-foreground max-w-sm">
              We believe photographs belong in your hands, not just on your phone. Dedicated to the craft of physical memories.
            </p>
          </div>
          <div>
            <h5 className="font-medium mb-4 text-sm tracking-widest uppercase text-muted-foreground">Shop</h5>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <button onClick={() => scrollToCollection("all")} className="hover:text-primary transition-colors text-left">All Products</button>
              </li>
              <li>
                <button onClick={() => scrollToCollection("wall-art")} className="hover:text-primary transition-colors text-left">Wall Art</button>
              </li>
              <li>
                <button onClick={() => scrollToCollection("frames")} className="hover:text-primary transition-colors text-left">Frames</button>
              </li>
              <li>
                <button onClick={() => scrollToCollection("gifts")} className="hover:text-primary transition-colors text-left">Gifts</button>
              </li>
              <li>
                <button onClick={() => scrollToCollection("kitchen")} className="hover:text-primary transition-colors text-left">Kitchen</button>
              </li>
              <li>
                <button onClick={() => scrollToCollection("pets")} className="hover:text-primary transition-colors text-left">Pets</button>
              </li>
              <li>
                <button onClick={() => scrollToCollection("tattoos")} className="hover:text-primary transition-colors text-left">Tattoos</button>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-4 text-sm tracking-widest uppercase text-muted-foreground">Support</h5>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
              </li>
              <li>
                <button onClick={() => document.getElementById("shipping")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-primary transition-colors text-left">Shipping & Returns</button>
              </li>
              <li>
                <button onClick={() => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-primary transition-colors text-left">FAQ</button>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-border/30 text-sm text-muted-foreground/60 flex justify-between items-center">
          <p>© {new Date().getFullYear()} ONJJEM Studio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
