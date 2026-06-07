import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Apple, Camera, Sparkles, BrainCircuit, Heart, Printer, Shield, Dna, Calculator, Star, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const APP_STORE_LINK = "https://apps.apple.com/app/id6771118261";
const PLAY_STORE_LINK = "https://play.google.com/store/apps/details?id=com.onjjem.canineencyclopedia";
const ONJJEM_LINK = "https://canine-encyclopedia.replit.app/shop/pets";

function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.18 23.76c.3.17.64.24.99.2l13.24-11.95L13.9 8.6 3.18 23.76zm16.63-9.79-3.56-2.02-3.08 2.78 3.08 2.78 3.6-2.04c1.03-.58 1.03-2.04-.04-2.5zM3.06.25a1.3 1.3 0 0 0-.88 1.23v20.97c0 .55.3 1.02.79 1.26L14.1 12 3.06.25zm9.47 11.11L3.21.33c.3-.22.67-.3 1.03-.2l13.2 11.98-4.91-.75z"/>
    </svg>
  );
}

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/30">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-2xl bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
            What's Up Dog!
          </Link>
          <nav className="hidden md:flex items-center gap-8 font-semibold text-sm">
            <a href="#how-it-works" className="hover:text-primary transition-colors">How it works</a>
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
            <a href="#print" className="hover:text-primary transition-colors">Print</a>
          </nav>
          <a href={APP_STORE_LINK} target="_blank" rel="noopener noreferrer">
            <Button className="rounded-full font-bold px-6 bg-gradient-to-r from-primary to-secondary hover:scale-105 transition-transform shadow-lg shadow-primary/20 border-0">
              Get Scanning
            </Button>
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-background to-primary/5 -z-10" />
          <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 mb-6 px-4 py-1.5 rounded-full uppercase tracking-widest text-xs font-bold">
                Now on iOS & Android · Free
              </Badge>
              <h1 className="text-5xl lg:text-7xl leading-[1.1] mb-6 tracking-tight text-foreground">
                Know <span className="bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">every dog</span><br/> you meet.
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground mb-8 leading-relaxed font-medium">
                Point your camera, get instant breed identification and full profiles. It's like having a wildly smart friend who happens to know everything about dogs.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href={APP_STORE_LINK} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="rounded-full h-14 px-8 text-base font-bold bg-gradient-to-r from-primary to-secondary hover:scale-105 transition-transform shadow-xl shadow-primary/20 border-0 gap-2">
                    <Apple className="w-5 h-5" />
                    App Store
                  </Button>
                </a>
                <a href={PLAY_STORE_LINK} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="rounded-full h-14 px-8 text-base font-bold bg-foreground hover:bg-foreground/90 hover:scale-105 transition-transform shadow-xl border-0 gap-2 text-white">
                    <GooglePlayIcon className="w-5 h-5" />
                    Google Play
                  </Button>
                </a>
                <a href="#how-it-works">
                  <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-base font-bold border-2 hover:border-primary hover:text-primary transition-colors">
                    See how it works
                  </Button>
                </a>
              </div>
              <div className="mt-8 flex items-center gap-3 text-sm font-semibold text-muted-foreground">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs">🐶</div>
                  ))}
                </div>
                <p>Over 500+ breeds recognized instantly</p>
              </div>
            </div>
            
            <div className="relative mx-auto w-full max-w-[320px] lg:max-w-md aspect-[1/2] rounded-[3rem] border-[8px] border-foreground bg-background shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="absolute top-0 inset-x-0 h-6 bg-foreground rounded-b-3xl w-1/2 mx-auto z-20" />
              <div className="absolute inset-0 bg-gradient-to-b from-accent/20 to-background flex flex-col items-center justify-center p-6 text-center">
                <div className="w-full flex-1 border-2 border-dashed border-primary/30 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden bg-white/50 backdrop-blur">
                  <Camera className="w-12 h-12 text-primary animate-pulse" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/20 to-transparent h-[150%] animate-[scan_3s_ease-in-out_infinite]" />
                </div>
                <Card className="w-full bg-white/90 backdrop-blur shadow-xl border-primary/20">
                  <CardContent className="p-4 text-left">
                    <h3 className="font-display text-xl text-primary">Golden Retriever</h3>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">Intelligent, Friendly, Devoted</p>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="bg-secondary/10 text-secondary hover:bg-secondary/20">Sporting Group</Badge>
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">High Energy</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="py-24 bg-white">
          <div className="container mx-auto px-4 text-center">
            <p className="text-primary font-bold tracking-widest uppercase text-sm mb-4">The Magic</p>
            <h2 className="text-4xl lg:text-5xl mb-16">Three steps to <span className="text-secondary">dog mastery</span></h2>
            
            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto relative">
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-1 bg-gradient-to-r from-accent via-primary to-secondary rounded-full opacity-20" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-4xl shadow-xl shadow-accent/20 mb-6 font-display text-white">1</div>
                <h3 className="text-xl font-bold mb-3">Snap a Photo</h3>
                <p className="text-muted-foreground leading-relaxed">Point your camera at any dog you see out in the wild. Our AI is ready.</p>
              </div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl shadow-xl shadow-primary/20 mb-6 font-display text-white">2</div>
                <h3 className="text-xl font-bold mb-3">Instant Match</h3>
                <p className="text-muted-foreground leading-relaxed">Within seconds, we search over 500 breeds to find the exact match.</p>
                <Badge className="mt-3 bg-green-500 hover:bg-green-600 text-white border-0">100% FREE</Badge>
              </div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#7C3AED] to-blue-500 flex items-center justify-center text-4xl shadow-xl shadow-purple-500/20 mb-6 font-display text-white">3</div>
                <h3 className="text-xl font-bold mb-3">Dive Deeper</h3>
                <p className="text-muted-foreground leading-relaxed">Read the full breed profile, history, and temperament. Become an instant expert.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 bg-gradient-to-b from-background to-accent/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl mb-6">Everything a <span className="text-primary">dog lover</span> needs</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">From instant identification to custom merch, we've packed What's Up Dog! with features to fuel your obsession.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                { icon: BrainCircuit, color: "from-yellow-400 to-orange-500", title: "AI Breed Identification", desc: "Identify over 500+ breeds instantly using Gemini vision technology. Always free.", free: true },
                { icon: Heart, color: "from-pink-400 to-rose-500", title: "Full Breed Profiles", desc: "Deep dive into history, temperament, and care guides for every breed you scan.", free: true },
                { icon: Shield, color: "from-emerald-400 to-green-500", title: "Private & Ad-Free", desc: "No data selling. Photos stay on your device. We respect your privacy.", free: true },
                { icon: Dna, color: "from-blue-400 to-indigo-500", title: "Mixed Breed DNA", desc: "Break down a mixed dog's ancestry percentages across breeds.", premium: true },
                { icon: Calculator, color: "from-purple-400 to-fuchsia-500", title: "Age Calculator", desc: "Estimate a dog's age just by looking at a photo scan.", premium: true },
                { icon: Star, color: "from-orange-400 to-red-500", title: "Personality Matcher", desc: "Uncover hidden instincts, traits, and what makes your dog tick.", premium: true },
              ].map((f, i) => (
                <Card key={i} className="group hover:-translate-y-2 transition-transform duration-300 border-2 hover:border-transparent hover:shadow-2xl overflow-hidden relative">
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${f.color}`} />
                  <CardContent className="p-8">
                    <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center bg-gradient-to-br ${f.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      <f.icon className="w-7 h-7" />
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-display text-xl">{f.title}</h3>
                      {f.free && <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-0">Free</Badge>}
                      {f.premium && <Badge className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-0">99p</Badge>}
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 bg-white relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl mb-6">Simple, honest <span className="text-[#7C3AED]">pricing</span></h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">No subscriptions. No sneaky bundles. The core app is completely free, forever. Unlock specific superpowers for just 99p each when you need them.</p>
            </div>

            <div className="grid lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {/* Free Tier */}
              <Card className="border-2 border-border relative overflow-hidden flex flex-col">
                <div className="p-8 flex-1">
                  <div className="text-4xl mb-4">🐕</div>
                  <div className="font-display text-4xl text-foreground mb-2">Free</div>
                  <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-6">Forever</div>
                  <h3 className="font-display text-xl mb-4">Core App</h3>
                  <ul className="space-y-4 mb-8">
                    <li className="flex gap-3 text-muted-foreground"><Sparkles className="w-5 h-5 text-accent shrink-0" /> Unlimited breed scans</li>
                    <li className="flex gap-3 text-muted-foreground"><Sparkles className="w-5 h-5 text-accent shrink-0" /> Full breed profiles</li>
                    <li className="flex gap-3 text-muted-foreground"><Sparkles className="w-5 h-5 text-accent shrink-0" /> 500+ breed database</li>
                    <li className="flex gap-3 text-muted-foreground"><Sparkles className="w-5 h-5 text-accent shrink-0" /> ONJJEM print access</li>
                  </ul>
                </div>
                <div className="p-6 pt-0 mt-auto">
                  <a href={APP_STORE_LINK} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full rounded-full py-6 font-bold bg-foreground hover:bg-foreground/90">Get Started Free</Button>
                  </a>
                </div>
              </Card>

              {/* Scanners */}
              {[
                { title: "Mixed Breed DNA", emoji: "🧬", color: "border-primary", text: "text-primary", bg: "bg-primary/5", desc: "Break down ancestry percentages" },
                { title: "Age Calculator", emoji: "🎂", color: "border-secondary", text: "text-secondary", bg: "bg-secondary/5", desc: "Estimate age from a photo" },
                { title: "Personality Matcher", emoji: "🌟", color: "border-[#7C3AED]", text: "text-[#7C3AED]", bg: "bg-[#7C3AED]/5", desc: "Deep dive into instincts & traits" },
              ].map((tier, i) => (
                <Card key={i} className={`border-2 ${tier.color} relative overflow-hidden flex flex-col hover:-translate-y-2 transition-transform duration-300`}>
                  <div className={`absolute inset-0 ${tier.bg} pointer-events-none`} />
                  <div className="p-8 flex-1 relative z-10">
                    <div className="text-4xl mb-4">{tier.emoji}</div>
                    <div className={`font-display text-4xl ${tier.text} mb-2`}>99p</div>
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-6">One-time unlock</div>
                    <h3 className="font-display text-xl mb-4">{tier.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{tier.desc}</p>
                  </div>
                  <div className="p-6 pt-0 mt-auto relative z-10">
                    <Badge variant="outline" className={`w-full justify-center py-2 text-sm border-2 ${tier.color} ${tier.text} bg-white`}>Scanner Add-on</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ONJJEM Print Section */}
        <section id="print" className="py-24 bg-[#1a1a2e] text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(124,58,237,0.2)_0%,transparent_60%),radial-gradient(ellipse_at_70%_50%,rgba(255,107,53,0.15)_0%,transparent_60%)]" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <p className="text-accent font-bold tracking-widest uppercase text-sm mb-4">Official Partner</p>
              <h2 className="text-4xl lg:text-6xl mb-6">Turn your scan into <span className="text-accent">art</span></h2>
              <p className="text-lg text-white/70 max-w-2xl mx-auto mb-12">
                Every product is printed with your dog's photo. Upload, pay, and we handle the rest — printed & shipped to your door.
              </p>
              <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-500/20">
                <img src="/thatsmydog-site/print-hero.png" alt="Personalized dog merchandise — canvas, mug, jigsaw, coaster, cushion and framed print" className="w-full h-auto object-cover" loading="eager" />

              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
              {[
                { name: "Stretched Canvas", price: "£49.99", desc: "Premium hand-stretched canvas. 38mm deep, 400gsm artist-grade.", tag: "BESTSELLER", slug: "canvas" },
                { name: "Eco Canvas", price: "£39.99", desc: "Sustainable satin canvas. Recycled plastic bottles frame.", tag: "NEW", slug: "eco_canvas" },
                { name: "Classic Framed Print", price: "£44.99", desc: "A4 in satin-laminated frame. 5 paper types, 8 frame colours.", tag: "", slug: "framed" },
                { name: "Photo Mug", price: "£17.99", desc: "11 oz ceramic. Vibrant wrap-around portrait. Dishwasher safe.", tag: "", slug: "mug" },
                { name: "Canvas Cushion", price: "£32.99", desc: "Handmade faux-canvas throw cushion. Zippered polyester cover.", tag: "NEW", slug: "cushion" },
                { name: "Photo Jigsaw Puzzle", price: "£28.99", desc: "252 or 500 pieces. Full-colour puzzle from your dog's photo.", tag: "", slug: "jigsaw" },
                { name: "Wooden Coasters", price: "£24.99", desc: "4 cork-backed coasters. Gloss finish, high-gloss surface.", tag: "", slug: "coaster" },
              ].map((product, i) => (
                <a
                  key={i}
                  href={`${ONJJEM_LINK}?product=${product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 hover:border-accent/40 hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  {product.tag && (
                    <span className="absolute -top-3 left-4 bg-accent text-[#1a1a2e] text-xs font-bold px-3 py-1 rounded-full">
                      {product.tag}
                    </span>
                  )}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C3AED] to-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Printer className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-display text-xl mb-2 text-white group-hover:text-accent transition-colors">{product.name}</h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-4 flex-1">{product.desc}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-2xl font-bold text-accent">{product.price}</span>
                    <span className="text-sm font-semibold text-white/40 group-hover:text-accent transition-colors flex items-center gap-1">
                      Shop now <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </a>
              ))}
            </div>

            <div className="text-center">
              <a href={`${ONJJEM_LINK}`} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="rounded-full h-16 px-10 text-xl font-display bg-gradient-to-r from-[#7C3AED] to-purple-600 hover:scale-105 transition-transform shadow-[0_8px_35px_rgba(124,58,237,0.4)] border-0">
                  Visit ONJJEM.com
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 bg-gradient-to-br from-green-500 to-emerald-600 text-white text-center">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-4xl lg:text-5xl mb-6">Ready to meet your new best friend?</h2>
            <p className="text-lg text-white/90 mb-10 max-w-xl mx-auto">Download What's Up Dog! today. It's completely free to start scanning and discovering breeds. Available on iOS and Android.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href={APP_STORE_LINK} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="rounded-full h-16 px-10 text-lg font-bold bg-white text-green-600 hover:bg-white/90 hover:scale-105 transition-transform shadow-xl border-0 gap-2">
                  <Apple className="w-6 h-6" />
                  App Store
                </Button>
              </a>
              <a href={PLAY_STORE_LINK} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="rounded-full h-16 px-10 text-lg font-bold bg-white/10 hover:bg-white/20 hover:scale-105 transition-transform shadow-xl border border-white/40 text-white gap-2">
                  <GooglePlayIcon className="w-6 h-6" />
                  Google Play
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-foreground text-white/50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12 border-b border-white/10 pb-12">
            <div className="md:col-span-2">
              <div className="font-display text-2xl bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent mb-4">
                What's Up Dog!
              </div>
              <p className="max-w-xs text-sm">
                The smart friend who happens to know everything about dogs. Scan, discover, and print.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-wider text-sm mb-6">App</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href={APP_STORE_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Download — App Store</a></li>
                <li><a href={PLAY_STORE_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Download — Google Play</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-wider text-sm mb-6">Legal</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href={ONJJEM_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">ONJJEM Prints</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p>© 2026 What's Up Dog. Available on App Store & Google Play.</p>
            <p>By ONJJEM / Skeff.</p>
          </div>
        </div>
      </footer>

      {/* Custom Keyframes for animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { transform: translateY(-100%); }
          50% { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
        }
      `}} />
    </div>
  );
}
