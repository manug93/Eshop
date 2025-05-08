import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from '@/hooks/use-translations';
import { useCart, CartItem } from '@/hooks/use-cart';
import { Loader2, Trash2, ShoppingCart } from "lucide-react";

export default function Cart() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { t } = useTranslations();
  const [promoCode, setPromoCode] = useState("");
  
  // Utiliser le hook centralisé pour le panier
  const { 
    cartItems, 
    isLoading: isCartLoading, 
    subtotal,
    updateQuantity, 
    removeFromCart, 
    clearCart 
  } = useCart();
  
  // États pour suivre les opérations en cours
  const [clearingCart, setClearingCart] = useState(false);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  
  // Mutation pour appliquer un code promo
  const applyPromoCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      setApplyingPromo(true);
      try {
        const response = await apiRequest('POST', '/api/apply-promo', {
          body: { code }
        });
        return response.data;
      } finally {
        setApplyingPromo(false);
      }
    },
    onSuccess: () => {
      toast({
        title: t.promoApplied,
        description: t.promoAppliedSuccess,
      });
      setPromoCode("");
    },
    onError: () => {
      toast({
        title: t.error,
        description: t.invalidPromoCode,
        variant: "destructive",
      });
    }
  });

  // Mutation pour le processus de commande
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      setCheckingOut(true);
      try {
        const response = await apiRequest('POST', '/api/create-payment-intent', {
          body: { items: cartItems, amount: calculateTotal() }
        });
        return response.data;
      } finally {
        setCheckingOut(false);
      }
    },
    onSuccess: () => {
      toast({
        title: t.orderCreated,
        description: t.redirectingToCheckout,
      });
      // Rediriger l'utilisateur vers la page de paiement
      setTimeout(() => {
        setLocation('/checkout');
      }, 1000);
    },
    onError: () => {
      toast({
        title: t.error,
        description: t.errorProcessingOrder,
        variant: "destructive",
      });
    }
  });
  
  const handleClearCart = () => {
    setClearingCart(true);
    clearCart();
    setTimeout(() => setClearingCart(false), 500);
  };
  
  const applyPromoCode = () => {
    if (promoCode.trim()) {
      applyPromoCodeMutation.mutate(promoCode);
    } else {
      toast({
        title: t.error,
        description: t.enterPromoCode,
        variant: "destructive",
      });
    }
  };
  
  const proceedToCheckout = () => {
    if (!user) {
      toast({
        title: t.loginRequired,
        description: t.loginToCheckout,
        variant: "destructive",
      });
      // Rediriger vers la page de connexion avec un paramètre de retour
      setLocation(`/auth?redirect=${encodeURIComponent('/checkout')}`);
      return;
    }
    
    checkoutMutation.mutate();
  };

  const calculateTax = () => {
    // Supposer un taux de taxe de 8%
    return subtotal * 0.08;
  };

  const calculateShipping = () => {
    // Livraison gratuite au-dessus de 100$, sinon 10$
    return subtotal > 100 ? 0 : 10;
  };

  const calculateTotal = () => {
    return subtotal + calculateTax() + calculateShipping();
  };

  // Afficher le loader pendant le chargement de l'authentification ou du panier
  if (isAuthLoading || isCartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-2xl font-bold mb-2">{t.emptyCart}</h2>
            <p className="text-gray-600 mb-6">{t.emptyCartText}</p>
            <Button onClick={() => setLocation('/products')}>
              {t.browseProducts}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">{t.shoppingCart}</h1>
        
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="p-6">
                <div className="flow-root">
                  <ul className="-my-6 divide-y divide-gray-200">
                    {cartItems.map((item: CartItem) => (
                      <li key={item.id} className="cart-item py-6">
                        <div className="flex items-center relative">
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="h-20 w-20 object-cover rounded-md"
                          />
                          <div className="ml-4 flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                              <p className="text-lg font-medium text-gray-900">
                                ${(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">${item.price.toFixed(2)} {t.each}</p>
                            <div className="flex items-center mt-4">
                              <div className="flex items-center border rounded-md">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="px-3 py-1 text-gray-600 hover:text-gray-800"
                                  disabled={item.quantity <= 1}
                                >
                                  -
                                </button>
                                <span className="px-3 py-1">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="px-3 py-1 text-gray-600 hover:text-gray-800"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="absolute top-0 right-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-red-600 hover:bg-red-100 hover:text-red-800 transition-colors duration-200 shadow-sm"
                            aria-label={t.remove}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex justify-between">
                  <Button 
                    onClick={handleClearCart}
                    variant="outline"
                    className="flex items-center text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                    size="sm"
                    disabled={clearingCart}
                  >
                    {clearingCart ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    {t.clearCart}
                  </Button>
                  <Button
                    onClick={() => setLocation('/products')}
                    variant="outline"
                    className="flex items-center"
                    size="sm"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {t.continueShopping}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">{t.orderSummary}</h2>
                <div className="flow-root">
                  <dl className="-my-4 divide-y divide-gray-200">
                    <div className="py-4 flex items-center justify-between">
                      <dt className="text-sm text-gray-600">{t.subtotal}</dt>
                      <dd className="text-sm font-medium text-gray-900">${subtotal.toFixed(2)}</dd>
                    </div>
                    <div className="py-4 flex items-center justify-between">
                      <dt className="text-sm text-gray-600">{t.shipping}</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {calculateShipping() === 0 ? (
                          <span className="text-green-600">{t.free}</span>
                        ) : (
                          `$${calculateShipping().toFixed(2)}`
                        )}
                      </dd>
                    </div>
                    <div className="py-4 flex items-center justify-between">
                      <dt className="text-sm text-gray-600">{t.tax}</dt>
                      <dd className="text-sm font-medium text-gray-900">${calculateTax().toFixed(2)}</dd>
                    </div>
                    <div className="py-4 flex items-center justify-between">
                      <dt className="text-base font-medium text-gray-900">{t.orderTotal}</dt>
                      <dd className="text-base font-medium text-gray-900">${calculateTotal().toFixed(2)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <div className="border-t border-gray-200 px-6 py-4">
                <Button
                  onClick={proceedToCheckout}
                  className="w-full py-3"
                  disabled={checkingOut}
                >
                  {checkingOut ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.processing}
                    </span>
                  ) : (
                    t.proceedToCheckout
                  )}
                </Button>
              </div>
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex items-center">
                  <div className="text-lg font-medium text-gray-400 mr-2">
                    Stripe
                  </div>
                  <span className="text-xs text-gray-500">
                    {t.securePayment}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Promo Code */}
            <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">{t.promoCode}</h2>
                <div className="flex">
                  <input
                    type="text"
                    placeholder={t.enterCode}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    disabled={applyingPromo}
                  />
                  <Button
                    variant="secondary"
                    className="rounded-l-none"
                    onClick={applyPromoCode}
                    disabled={applyingPromo}
                  >
                    {applyingPromo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t.apply
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}