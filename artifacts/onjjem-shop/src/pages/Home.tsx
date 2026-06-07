import { Link, useSearch } from "wouter";
import { useListShopProducts, getListShopProductsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, getProductImageUrl } from "@/lib/utils";
import { AlertCircle, ArrowRight, Heart, Dog } from "lucide-react";

export default function Home() {
  const { data: products, isLoading, isError } = useListShopProducts({
    query: { queryKey: getListShopProductsQueryKey() }
  });

  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const isFromApp = searchParams.get("source") === "wud";
  const dogName = searchParams.get("dogName");
  const breed = searchParams.get("breed");
  const productHint = searchParams.get("product");

  const filterProducts = () => {
    if (!productHint || !products) return products;
    const hintMap: Record<string, string[]> = {
      canvas: ["Canvas", "Stretched", "Eco"],
      framed: ["Framed"],
      mug: ["Mug"],
      cushion: ["Cushion"],
      jigsaw: ["Jigsaw", "Puzzle"],
      coaster: ["Coaster"],
    };
    const hints = hintMap[productHint] ?? [productHint];
    const matched = products.filter((p: any) =>
      hints.some((h) => p.name.toLowerCase().includes(h.toLowerCase()))
    );
    return matched.length ? [...matched, ...products.filter((p: any) => !matched.includes(p))] : products;
  };

  const displayProducts = isLoading ? [] : filterProducts();

  return (
    <div className="container mx-auto px-4 py-12 md:py-24 max-w-6xl">
      {/* Personalised welcome from K9 app */}
      {isFromApp && (
        <div className="mb-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-full shrink-0">
              <Dog className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary mb-1">
                Welcome from K9 What's Up Dog!
              </p>
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                {dogName
                  ? `Print ${dogName}${breed ? ` — your ${breed}` : ""} on merch`
                  : "Print your dog on merch"}
              </h2>
              <p className="text-muted-foreground mt-2">
                Pick a product, upload your dog's photo, and we print & ship straight to your door.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mb-16">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-foreground">
          Wear your heart on your <span className="text-primary">sleeve</span>. Or your tote.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
          Upload a photo of your dog. We will print it on premium quality merch and ship it straight to your door. No fuss, just dog love.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col gap-4">
              <Skeleton className="aspect-square rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-5 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-destructive/20 bg-destructive/5">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load products</h3>
          <p className="text-muted-foreground mb-6">There was a problem fetching the store catalog.</p>
        </div>
      ) : !products?.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-border/50 bg-muted/20">
          <h3 className="text-lg font-semibold mb-2">Store is empty</h3>
          <p className="text-muted-foreground">Check back soon for new merch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {displayProducts?.map((product: any) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group flex flex-col gap-4 focus:outline-none"
              data-testid={`card-product-${product.id}`}
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted/30 border border-border/50">
                {(product.images?.[0] || getProductImageUrl(product.name)) ? (
                  <img
                    src={product.images?.[0] || getProductImageUrl(product.name)}
                    alt={product.name}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105 group-focus-visible:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Dog className="h-12 w-12 opacity-40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    Customize <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">{product.name}</h3>
                {product.price && (
                  <p className="text-muted-foreground font-medium mt-1">
                    {formatPrice(product.price.unitAmount, product.price.currency)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
