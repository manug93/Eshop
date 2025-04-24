import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { LanguageProvider } from "@/hooks/use-language";
import { useTranslations } from "@/hooks/use-translations";
import { CartProvider, useCart } from "@/hooks/use-cart";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ProtectedRoute, AdminRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import CheckoutSuccess from "@/pages/checkout-success";
import AuthPage from "@/pages/auth-page";
import UserOrders from "@/pages/user-orders";
import AdminDashboard from "@/pages/admin/dashboard";

// Layout component with navigation
function Layout({ children }: { children: React.ReactNode }) {
  const { user, logoutMutation } = useAuth();
  const { t } = useTranslations();
  const { totalItems = 0 } = useCart();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <a href="/" className="text-2xl font-bold text-primary">E-Shop</a>
            </div>
            <nav className="flex items-center space-x-4">
              <a href="/" className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium">{t.home}</a>
              <a href="/products" className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium">{t.products}</a>
              <a href="/cart" className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium relative">
                {t.cart}
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {totalItems}
                  </span>
                )}
              </a>
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">
                    {user.firstName ? `${t.hello}, ${user.firstName}` : `${t.hello}, ${user.username}`}
                  </span>
                  <a href="/user/orders" className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium">
                    {t.myOrders}
                  </a>
                  {user.isAdmin && (
                    <a href="/admin/dashboard" className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium">
                      {t.admin}
                    </a>
                  )}
                  <button 
                    onClick={() => logoutMutation.mutate()}
                    className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium"
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? t.loggingOut : t.logout}
                  </button>
                </div>
              ) : (
                <a href="/auth" className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium">
                  {t.login}
                </a>
              )}
              <LanguageSwitcher />
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-grow">
        {children}
      </main>
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-medium mb-4">{t.shop}</h3>
              <ul className="space-y-2">
                <li><a href="/products" className="text-gray-300 hover:text-white">{t.newArrivals}</a></li>
                <li><a href="/products?bestsellers=true" className="text-gray-300 hover:text-white">{t.bestSellers}</a></li>
                <li><a href="/products?deals=true" className="text-gray-300 hover:text-white">{t.dealsAndPromotions}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">{t.customerService}</h3>
              <ul className="space-y-2">
                <li><a href="/contact" className="text-gray-300 hover:text-white">{t.contactUs}</a></li>
                <li><a href="/shipping" className="text-gray-300 hover:text-white">{t.shippingAndReturns}</a></li>
                <li><a href="/faq" className="text-gray-300 hover:text-white">{t.faqs}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">{t.about}</h3>
              <ul className="space-y-2">
                <li><a href="/about" className="text-gray-300 hover:text-white">{t.ourStory}</a></li>
                <li><a href="/careers" className="text-gray-300 hover:text-white">{t.careers}</a></li>
                <li><a href="/sustainability" className="text-gray-300 hover:text-white">{t.sustainability}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">{t.stayConnected}</h3>
              <p className="text-gray-400 mb-4">{t.subscribeText}</p>
              <form className="flex">
                <input 
                  type="email" 
                  placeholder={t.yourEmail} 
                  className="px-4 py-2 w-full rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button 
                  type="submit"
                  className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-r-md"
                >
                  {t.subscribe}
                </button>
              </form>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© 2023 E-Shop. {t.allRightsReserved}</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="/privacy" className="text-gray-400 hover:text-white">{t.privacyPolicy}</a>
              <a href="/terms" className="text-gray-400 hover:text-white">{t.termsOfService}</a>
              <a href="/cookies" className="text-gray-400 hover:text-white">{t.cookies}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => (
          <Layout>
            <Home />
          </Layout>
        )}
      </Route>
      <Route path="/products">
        {() => (
          <Layout>
            <Products />
          </Layout>
        )}
      </Route>
      <Route path="/products/:id">
        {(params) => (
          <Layout>
            <ProductDetail />
          </Layout>
        )}
      </Route>
      <Route path="/cart">
        {() => (
          <Layout>
            <Cart />
          </Layout>
        )}
      </Route>
      <ProtectedRoute path="/checkout">
        <Layout>
          <Checkout />
        </Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/checkout-success">
        <Layout>
          <CheckoutSuccess />
        </Layout>
      </ProtectedRoute>
      <AdminRoute path="/admin/dashboard">
        <Layout>
          <AdminDashboard />
        </Layout>
      </AdminRoute>
      <ProtectedRoute path="/user/orders">
        <Layout>
          <UserOrders />
        </Layout>
      </ProtectedRoute>
      <Route path="/auth">
        {() => <AuthPage />}
      </Route>
      {/* Fallback to 404 */}
      <Route>
        {() => (
          <Layout>
            <NotFound />
          </Layout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </CartProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
