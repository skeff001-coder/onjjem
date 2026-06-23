import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Star, Quote, Bone, PawPrint, Heart, Zap, ChevronDown } from "lucide-react";
import heroImg from "@/assets/hero.png";
import shirt1Img from "@/assets/shirt1.png";
import hoodieImg from "@/assets/hoodie.png";
import mugImg from "@/assets/mug.png";
import aboutImg from "@/assets/about.png";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "wouter";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-4 mix-blend-difference text-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="font-display font-bold text-2xl tracking-tighter">
            WHAT'S UP DOG
          </div>
          <Button asChild variant="outline" className="rounded-full bg-white text-black border-none hover:bg-primary hover:text-white transition-colors duration-300 font-bold uppercase tracking-wide">
            <a href="/onjjem-website/">Shop Now</a>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[100dvh] flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImg} 
            alt="Mischievous golden retriever with a sock" 
            className="w-full h-full object-cover object-center opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 w-full flex flex-col items-center text-center mt-32">
          <motion.div
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.2 }}
            className="flex flex-col items-center"
          >
            <motion.h1 
              variants={fadeIn}
              className="text-7xl md:text-9xl lg:text-[12rem] font-display leading-[0.85] text-primary drop-shadow-sm mb-6 uppercase"
            >
              WE LET THE<br />DOGS OUT.
            </motion.h1>
            <motion.p 
              variants={fadeIn}
              className="text-xl md:text-2xl font-medium max-w-2xl text-foreground/90 mb-10"
            >
              Apparel for people who prefer their dog's company over most humans. Unapologetic, slightly shedding, and 100% good boy approved.
            </motion.p>
            <motion.div variants={fadeIn}>
              <Button asChild size="lg" className="rounded-full h-16 px-10 text-xl bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-all duration-300 transform hover:scale-105 shadow-xl">
                <a href="/onjjem-website/">
                  Fetch Some Gear <ArrowRight className="ml-2 h-6 w-6" />
                </a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Marquee */}
      <div className="bg-primary text-primary-foreground py-4 border-y-4 border-foreground overflow-hidden flex whitespace-nowrap">
        <div className="marquee-container w-full">
          <div className="marquee-content font-display font-bold text-2xl uppercase tracking-wider">
            <span>WARNING: MAY CAUSE UNEXPECTED BELLY RUBS</span>
            <span>•</span>
            <span>100% GOOD BOY APPROVED</span>
            <span>•</span>
            <span>DOG HAIR IS A LIFESTYLE CHOICE</span>
            <span>•</span>
            <span>SORRY I CAN'T, MY DOG IS SITTING ON ME</span>
            <span>•</span>
            <span>WARNING: MAY CAUSE UNEXPECTED BELLY RUBS</span>
            <span>•</span>
            <span>100% GOOD BOY APPROVED</span>
            <span>•</span>
            <span>DOG HAIR IS A LIFESTYLE CHOICE</span>
            <span>•</span>
            <span>SORRY I CAN'T, MY DOG IS SITTING ON ME</span>
            <span>•</span>
          </div>
        </div>
      </div>

      {/* Value Prop Section */}
      <section className="py-24 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: <Bone className="w-10 h-10 mb-4 text-primary" />, title: "Premium Quality", desc: "Softer than a puppy's ear. Our shirts are built to last through thousands of walks." },
              { icon: <PawPrint className="w-10 h-10 mb-4 text-secondary" />, title: "Dog Hair Resistant", desc: "Okay, nothing is truly resistant, but our colors hide it well." },
              { icon: <Heart className="w-10 h-10 mb-4 text-destructive" />, title: "Conversation Starters", desc: "Guaranteed to make strangers smile and nod knowingly." },
              { icon: <Zap className="w-10 h-10 mb-4 text-accent" />, title: "Fast Shipping", desc: "Because we know you have no patience when it comes to dog stuff." }
            ].map((prop, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-muted p-8 rounded-3xl text-center flex flex-col items-center hover:bg-muted/80 transition-colors"
              >
                {prop.icon}
                <h3 className="font-display text-2xl font-bold mb-2">{prop.title}</h3>
                <p className="text-foreground/70 font-medium">{prop.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bestsellers */}
      <section className="py-32 px-4 bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-5xl md:text-7xl font-display text-foreground mb-4">THE CHIEF<br />BARKING OFFICERS</h2>
              <p className="text-lg text-foreground/70 max-w-md">Our best-selling gear. Wear it to the dog park and assert dominance over the doodle owners.</p>
            </div>
            <Button asChild variant="outline" className="rounded-full border-2 border-foreground text-foreground hover:bg-foreground hover:text-background h-12 px-8 font-bold uppercase tracking-wider shrink-0">
              <a href="/onjjem-website/">View All Products</a>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { img: shirt1Img, title: "Ask Me About My Dog", price: "$35", category: "Heavyweight Tee", bg: "bg-accent" },
              { img: hoodieImg, title: "Introverted But Willing", price: "$65", category: "Oversized Hoodie", bg: "bg-secondary" },
              { img: mugImg, title: "Dog Hair Is Glitter", price: "$22", category: "Chunky Ceramic Mug", bg: "bg-background" }
            ].map((product, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                key={i} 
                className="group cursor-pointer"
              >
                <div className={`aspect-square ${product.bg} rounded-3xl mb-6 overflow-hidden relative p-8 flex items-center justify-center shadow-md transition-transform duration-500 group-hover:-translate-y-2`}>
                  <img src={product.img} alt={product.title} className="w-full h-full object-contain transform transition-transform duration-700 group-hover:scale-110 mix-blend-multiply" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button asChild className="rounded-full bg-white text-black hover:bg-primary hover:text-white font-bold uppercase tracking-wide">
                      <a href="/onjjem-website/">Quick Add <ShoppingBag className="ml-2 h-4 w-4" /></a>
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground/50 uppercase tracking-widest mb-1">{product.category}</p>
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-display font-bold text-foreground">{product.title}</h3>
                    <span className="text-xl font-bold text-primary">{product.price}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-32 px-4 bg-foreground text-background overflow-hidden relative">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2 relative"
          >
            <div className="aspect-[4/5] rounded-[3rem] overflow-hidden rotate-[-2deg] shadow-2xl relative z-10 border-8 border-background">
              <img src={aboutImg} alt="Pack of goofy dogs" className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-primary rounded-[3rem] rotate-[4deg] z-0 translate-x-4 translate-y-4"></div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2 space-y-8"
          >
            <h2 className="text-5xl md:text-7xl font-display text-primary">WE DON'T DO "LIVE LAUGH LOVE".</h2>
            <p className="text-xl md:text-2xl text-background/80 font-medium">
              We do "Sit, Stay, Stop eating that". We started What's Up Dog because we were tired of boring pet apparel that looked like it belonged in a vet's waiting room.
            </p>
            <p className="text-xl md:text-2xl text-background/80 font-medium">
              Our gear is for the obsessives. The ones who cancel plans because their dog is sleeping on their lap. The ones who have more photos of their pup than their significant other. 
            </p>
            <div className="pt-8 flex gap-4">
              <Button asChild size="lg" className="rounded-full h-16 px-10 text-xl bg-primary text-primary-foreground hover:bg-white hover:text-black transition-all duration-300 font-bold uppercase tracking-wide">
                <a href="/onjjem-website/">Join The Pack</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-32 px-4 bg-background border-t-8 border-primary">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-display text-foreground mb-6">REVIEWS FROM<br />THE EXPERTS</h2>
            <p className="text-xl text-foreground/70">Don't take our word for it. Listen to these completely real dogs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Buster, 4", breed: "Golden Retriever", quote: "My human wears this hoodie constantly. It smells like treats. 10/10 would chew on the drawstrings again." },
              { name: "Luna, 2", breed: "French Bulldog", quote: "The shirt is soft enough to sleep on when she throws it on the floor. Very considerate design." },
              { name: "Max, 7", breed: "Rescue Mutt", quote: "Since buying the mug, my human takes longer to leave for work. I consider this an absolute win." }
            ].map((review, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                key={i} 
                className="bg-muted p-10 rounded-3xl relative"
              >
                <Quote className="absolute top-8 right-8 h-12 w-12 text-primary/20" />
                <div className="flex gap-1 mb-6 text-accent">
                  {[...Array(5)].map((_, j) => <Star key={j} className="h-6 w-6 fill-current" />)}
                </div>
                <p className="text-xl font-medium text-foreground mb-8 relative z-10">"{review.quote}"</p>
                <div>
                  <p className="font-bold text-lg text-foreground">{review.name}</p>
                  <p className="text-foreground/60 uppercase tracking-wider text-sm font-bold">{review.breed}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-32 px-4 bg-muted border-t-8 border-background">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-7xl font-display text-foreground mb-6">FAQ</h2>
            <p className="text-xl text-foreground/70">You've got questions, we've got answers.</p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {[
              { q: "Do these shirts repel dog hair?", a: "Let's be real. Nothing repels dog hair. If anything, our dark shirts attract it like a magnet. Wear it proudly as a badge of honor." },
              { q: "How do your sizes run?", a: "True to size, with a slightly relaxed fit for maximum comfort during aggressive belly rub sessions." },
              { q: "Where do you ship?", a: "Everywhere the mail carrier is willing to go. (Sorry if your dog barks at them, they're just doing their job)." },
              { q: "What's the return policy?", a: "If you don't love it, return it within 30 days. Unwashed and unworn, please. We don't want your dog's hair back, we have enough of our own." }
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="bg-background rounded-2xl px-6 border-none shadow-sm data-[state=open]:bg-white data-[state=open]:shadow-md transition-all">
                <AccordionTrigger className="text-xl font-bold font-display hover:no-underline py-6">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-lg text-foreground/70 pb-6">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 px-4 bg-secondary text-secondary-foreground text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-6xl md:text-9xl font-display mb-8">TREAT YOURSELF.</h2>
          <p className="text-2xl md:text-3xl font-medium mb-12 max-w-2xl mx-auto">
            You buy your dog premium organic kibble. The least you can do is buy yourself a decent shirt.
          </p>
          <Button asChild size="lg" className="rounded-full h-20 px-16 text-2xl bg-white text-black hover:bg-foreground hover:text-white transition-all duration-300 transform hover:scale-105 shadow-2xl font-bold uppercase tracking-widest">
            <a href="/onjjem-website/">Shop The Collection</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-16 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="font-display font-bold text-3xl tracking-tighter text-primary">
            WHAT'S UP DOG
          </div>
          <div className="flex gap-8 font-bold uppercase tracking-wider text-sm">
            <a href="/onjjem-website/" className="hover:text-primary transition-colors">Shop</a>
            <a href="/onjjem-website/" className="hover:text-primary transition-colors">About</a>
            <a href="/onjjem-website/" className="hover:text-primary transition-colors">Contact</a>
          </div>
          <p className="text-background/50 text-sm font-medium">
            © {new Date().getFullYear()} What's Up Dog. No squirrels were harmed.
          </p>
        </div>
      </footer>
    </div>
  );
}
