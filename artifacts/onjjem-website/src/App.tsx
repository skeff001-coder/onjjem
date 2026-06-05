import { Switch, Route, Router as WouterRouter } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import ProductDetail from "@/pages/product";
import ContactPage from "@/pages/contact";

const queryClient = new QueryClient();

function LandingRedirect() {
  useEffect(() => {
    window.location.replace("/onjjem-landing.html");
  }, []);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingRedirect} />
      <Route path="/shop" component={Home} />
      <Route path="/product/:categoryId" component={ProductDetail} />
      <Route path="/contact" component={ContactPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
