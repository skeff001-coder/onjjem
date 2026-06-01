import { useState, useRef } from "react";
import { Link, useParams, useLocation } from "wouter";
import { products } from "@/data/products";
import { ArrowLeft, Upload, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetail() {
  const { categoryId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const product = products.find(p => p.id === categoryId);
  
  const [selectedVariantSku, setSelectedVariantSku] = useState<string>(
    product?.variants[0]?.sku || ""
  );
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <h1 className="text-2xl font-serif mb-4">Product not found</h1>
        <Link href="/" className="text-primary hover:underline">Return to Shop</Link>
      </div>
    );
  }

  const selectedVariant = product.variants.find(v => v.sku === selectedVariantSku) || product.variants[0];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file (JPEG, PNG).",
        variant: "destructive",
      });
      return;
    }

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);

    // Convert to base64 for submission
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      // We want the raw base64 without the data URL prefix for the API
      const base64Data = result.split(',')[1];
      setPhotoBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleCheckout = async () => {
    if (!photoBase64) {
      toast({
        title: "Photo required",
        description: "Please upload a photo to customize your product.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const origin = window.location.origin;
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: selectedVariant.sku,
          name: `${product.name} — ${selectedVariant.label}`,
          amountPence: selectedVariant.pricePence,
          currency: "gbp",
          photoBase64: photoBase64,
          successUrl: `${origin}/onjjem-website/?order=success`,
          cancelUrl: `${origin}/onjjem-website/product/${product.id}`,
        }),
      });

      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to initiate checkout");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col font-sans bg-background">
      {/* Simple Header */}
      <header className="px-6 py-4 border-b border-border/50">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back">
          <ArrowLeft size={16} className="mr-2" /> Back to Shop
        </Link>
      </header>

      <main className="flex-grow flex flex-col md:flex-row">
        {/* Left Column: Product Image & Preview */}
        <div className="w-full md:w-1/2 p-6 md:p-12 lg:p-16 flex flex-col items-center justify-center bg-secondary/20 relative">
          <div className="w-full max-w-lg aspect-square relative rounded-md overflow-hidden bg-muted shadow-lg">
            {photoPreview ? (
              <div className="w-full h-full relative group">
                <img 
                  src={photoPreview} 
                  alt="Your custom photo preview" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-background text-foreground px-4 py-2 rounded-sm text-sm font-medium shadow-sm hover:scale-105 transition-transform"
                  >
                    Change Photo
                  </button>
                </div>
              </div>
            ) : (
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWRlOWUzIi8+PC9zdmc+';
                }}
              />
            )}
          </div>
          {photoPreview && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Your photo has been uploaded. Note: We will review and enhance quality before printing.
            </p>
          )}
        </div>

        {/* Right Column: Details & Configurator */}
        <div className="w-full md:w-1/2 p-6 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <h1 className="text-4xl font-serif text-foreground mb-2">{product.name}</h1>
            <p className="text-2xl text-foreground font-medium mb-6">
              £{(selectedVariant.pricePence / 100).toFixed(2)}
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              {product.description}
            </p>

            <div className="space-y-8">
              {/* Size / Variant Picker */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium uppercase tracking-wider text-foreground">Select Size</label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {product.variants.map((variant) => {
                    const isSelected = selectedVariantSku === variant.sku;
                    return (
                      <button
                        key={variant.sku}
                        onClick={() => setSelectedVariantSku(variant.sku)}
                        className={`py-3 px-4 rounded-sm border text-sm font-medium transition-all duration-200 text-left flex justify-between items-center ${
                          isSelected 
                            ? "border-primary bg-primary/5 text-primary" 
                            : "border-border hover:border-foreground/30 text-foreground"
                        }`}
                        data-testid={`btn-variant-${variant.sku}`}
                      >
                        <span>{variant.label}</span>
                        {isSelected && <Check size={16} />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="text-sm font-medium uppercase tracking-wider text-foreground block mb-3">Upload Your Photo</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  data-testid="input-photo"
                />
                
                {!photoPreview ? (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-border hover:border-primary/50 rounded-sm flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground transition-colors bg-secondary/10"
                    data-testid="btn-upload"
                  >
                    <Upload size={24} />
                    <span>Click to browse images</span>
                  </button>
                ) : (
                  <div className="w-full py-4 px-4 border border-primary/20 bg-primary/5 rounded-sm flex items-center justify-between text-sm text-foreground">
                    <span className="flex items-center gap-2"><Check size={16} className="text-primary"/> Image attached successfully</span>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary font-medium hover:underline"
                    >
                      Replace
                    </button>
                  </div>
                )}
              </div>

              {/* Checkout Button */}
              <div className="pt-4">
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing || !photoBase64}
                  className="w-full py-4 bg-foreground text-background font-medium tracking-wide rounded-sm hover:bg-primary hover:text-primary-foreground transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  data-testid="btn-checkout"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Processing...
                    </>
                  ) : (
                    "Order Now"
                  )}
                </button>
                {!photoBase64 && (
                  <p className="text-xs text-center text-muted-foreground mt-3">Please upload a photo to proceed with your order.</p>
                )}
              </div>
            </div>
            
            <div className="mt-12 pt-8 border-t border-border">
              <h4 className="text-sm font-medium text-foreground mb-4 uppercase tracking-wider">The ONJJEM Promise</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 text-primary" />
                  Every print is reviewed for quality and color accuracy before production.
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 text-primary" />
                  Premium, archival-quality materials designed to resist fading.
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 text-primary" />
                  Secure, automated shipping directly to your door.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
