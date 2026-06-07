import { useState, useRef } from "react";
import { useRoute } from "wouter";
import { 
  useGetShopProduct, 
  getGetShopProductQueryKey,
  useCreateShopCheckout
} from "@workspace/api-client-react";
import { formatPrice, getProductImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, Image as ImageIcon, X, Loader2, CheckCircle2, ChevronDown } from "lucide-react";

const PHONE_MODELS = [
  "iPhone 16 Pro Max",
  "iPhone 16",
  "iPhone 15 Pro Max",
  "iPhone 15",
  "iPhone 14 Pro Max",
  "iPhone 14",
  "iPhone 13 Pro Max",
  "iPhone 13 Pro",
  "iPhone 13 Mini",
  "iPhone 13",
  "iPhone 12",
  "iPhone 11",
  "Google Pixel 9",
  "Google Pixel 8 Pro",
  "Google Pixel 8",
  "Google Pixel 7",
];

export default function ProductDetail() {
  const [, params] = useRoute("/products/:productId");
  const productId = params?.productId || "";
  const { toast } = useToast();

  const { data: product, isLoading } = useGetShopProduct(productId, {
    query: {
      enabled: !!productId,
      queryKey: getGetShopProductQueryKey(productId)
    }
  });

  const createCheckout = useCreateShopCheckout();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [phoneModel, setPhoneModel] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPhoneCase = product?.metadata?.prodigi_product_type === "phone_case";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file.",
          variant: "destructive"
        });
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!droppedFile.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file.",
          variant: "destructive"
        });
        return;
      }
      setFile(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
    }
  };

  const clearFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const canCheckout = !!file && !!email && (!isPhoneCase || !!phoneModel);

  const handleBuy = async () => {
    if (!canCheckout || !product?.price) return;

    setIsProcessing(true);
    try {
      // 1. Upload photo via our server (avoids browser→GCS CORS issues)
      const uploadRes = await fetch("/api/storage/uploads", {
        method: "POST",
        headers: { "Content-Type": file!.type },
        body: file,
      });

      if (!uploadRes.ok) {
        const body = await uploadRes.json().catch(() => ({}));
        throw new Error((body as any).error ?? "Failed to upload photo");
      }

      const { objectPath } = await uploadRes.json() as { objectPath: string };

      // 2. Create Checkout Session
      const { url } = await createCheckout.mutateAsync({
        data: {
          productId: product.id,
          priceId: product.price.id,
          photoObjectPath: objectPath,
          customerEmail: email,
          ...(isPhoneCase && phoneModel ? { phoneModel } : {})
        }
      });

      // 3. Redirect to Stripe
      window.location.href = url;

    } catch (err) {
      toast({
        title: "Checkout failed",
        description: err instanceof Error ? err.message : "There was a problem starting your checkout. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-24 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
          <Skeleton className="aspect-square rounded-2xl w-full" />
          <div className="flex flex-col gap-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full rounded-xl mt-8" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Product not found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-24 max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-muted/20 border border-border/50">
          {(product.images?.[0] || getProductImageUrl(product.name)) ? (
            <img
              src={product.images?.[0] || getProductImageUrl(product.name)}
              alt={product.name}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 opacity-50" />
            </div>
          )}
        </div>

        {/* Product Info & Uploader */}
        <div className="flex flex-col">
          <h1 className="text-4xl font-bold tracking-tight mb-4">{product.name}</h1>
          
          {product.price && (
            <p className="text-2xl text-primary font-medium mb-6">
              {formatPrice(product.price.unitAmount, product.price.currency)}
            </p>
          )}

          {product.description && (
            <p className="text-muted-foreground leading-relaxed mb-12 text-lg">
              {product.description}
            </p>
          )}

          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              Customize your merch
            </h2>

            {/* Phone Model Selector — only for phone cases */}
            {isPhoneCase && (
              <div className="mb-8">
                <Label htmlFor="phone-model" className="text-base mb-3 block">
                  Select your phone model
                </Label>
                <div className="relative">
                  <select
                    id="phone-model"
                    value={phoneModel}
                    onChange={(e) => setPhoneModel(e.target.value)}
                    data-testid="select-phone-model"
                    className="w-full h-12 pl-4 pr-10 text-base rounded-md border border-input bg-background text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">Choose your phone model...</option>
                    <optgroup label="Apple iPhone">
                      {PHONE_MODELS.filter(m => m.startsWith("iPhone")).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Google Pixel">
                      {PHONE_MODELS.filter(m => m.startsWith("Google")).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </optgroup>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            )}

            {/* Photo Uploader */}
            <div className="mb-8">
              <Label className="text-base mb-3 block">Upload your dog's photo</Label>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleFileSelect}
              />
              
              {!previewUrl ? (
                <div 
                  className="border-2 border-dashed border-primary/30 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-primary/5 transition-colors bg-muted/10 group"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  data-testid="zone-upload"
                >
                  <div className="bg-primary/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-medium text-lg mb-1">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground">High quality photos work best</p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-border bg-black aspect-video flex items-center justify-center">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-w-full max-h-full object-contain"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-3 right-3 h-8 w-8 rounded-full shadow-lg"
                    onClick={clearFile}
                    data-testid="button-clear-photo"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Email Input */}
            <div className="mb-8">
              <Label htmlFor="email" className="text-base mb-3 block">Your email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Where should we send updates?"
                className="h-12 text-base bg-background"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-email"
              />
            </div>

            <Button
              size="lg"
              className="w-full h-14 text-lg font-bold shadow-lg"
              disabled={!canCheckout || isProcessing}
              onClick={handleBuy}
              data-testid="button-buy"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Preparing your order...
                </>
              ) : (
                "Proceed to Checkout"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
