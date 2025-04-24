import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from '@/hooks/use-translations';
import { Loader2 } from "lucide-react";

// CartItem interface
interface CartItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  thumbnail: string;
}

const Cart = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslations();
  const [promoCode, setPromoCode] = useState("");
  
  // Fetch cart items 
  const { data: cartItems = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/cart/items'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/cart/items');
        const data = await response.json();
        return data;
      } catch (error) {
        // Si l'API échoue, on revient à des données locales pour la démo
        return [
          {
            id: 1,
            title: "iPhone 9",
            price: 549,
            quantity: 1,
            thumbnail: "https://i.dummyjson.com/data/products/1/thumbnail.jpg"
          },
          {
            id: 2,
            title: "iPhone X",
            price: 899,
            quantity: 2,
            thumbnail: "https://i.dummyjson.com/data/products/2/thumbnail.jpg"
          },
          {
            id: 3,
            title: "Samsung Universe 9",
            price: 1249,
            quantity: 1,
            thumbnail: "https://i.dummyjson.com/data/products/3/thumbnail.jpg"
          }
        ];
      }
    }
  });

  // Mutation pour mettre à jour la quantité d'un article
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number, quantity: number }) => {
      const response = await apiRequest('PUT', `/api/cart/items/${id}`, { quantity });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart/items'] });
      toast({
        title: t.quantityUpdated,
        description: t.cartUpdatedSuccess,
      });
    },
    onError: (error) => {
      toast({
        title: t.error,
        description: t.errorUpdatingCart,
        variant: "destructive",
      });
      console.error('Error updating quantity:', error);
    }
  });

  // Mutation pour supprimer un article
  const removeItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/cart/items/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart/items'] });
      toast({
        title: t.itemRemoved,
        description: t.itemRemovedSuccess,
      });
    },
    onError: (error) => {
      toast({
        title: t.error,
        description: t.errorRemovingItem,
        variant: "destructive",
      });
      console.error('Error removing item:', error);
    }
  });

  // Mutation pour vider le panier
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/cart/items');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart/items'] });
      toast({
        title: t.cartCleared,
        description: t.cartClearedSuccess,
      });
    },
    onError: (error) => {
      toast({
        title: t.error,
        description: t.errorClearingCart,
        variant: "destructive",
      });
      console.error('Error clearing cart:', error);
    }
  });

  // Mutation pour appliquer un code promo
  const applyPromoCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest('POST', '/api/cart/promo', { code });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart/items'] });
      toast({
        title: t.promoApplied,
        description: t.promoAppliedSuccess,
      });
      setPromoCode("");
    },
    onError: (error) => {
      toast({
        title: t.error,
        description: t.invalidPromoCode,
        variant: "destructive",
      });
      console.error('Error applying promo code:', error);
    }
  });

  // Mutation pour le processus de commande
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/orders');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t.orderCreated,
        description: t.redirectingToCheckout,
      });
      // Rediriger l'utilisateur vers la page de paiement
      setTimeout(() => {
        setLocation('/checkout');
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: t.error,
        description: t.errorProcessingOrder,
        variant: "destructive",
      });
      console.error('Error processing order:', error);
    }
  });

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantityMutation.mutate({ id, quantity: newQuantity });
  };

  const removeItem = (id: number) => {
    removeItemMutation.mutate(id);
  };

  const clearCart = () => {
    clearCartMutation.mutate();
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

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    // Assuming 8% tax rate
    return calculateSubtotal() * 0.08;
  };

  const calculateShipping = () => {
    // Free shipping over $100, otherwise $10
    return calculateSubtotal() > 100 ? 0 : 10;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + calculateShipping();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
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
                    {cartItems.map((item) => (
                      <li key={item.id} className="cart-item py-6">
                        <div className="flex items-center">
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
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center border rounded-md">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="px-3 py-1 text-gray-600 hover:text-gray-800"
                                  disabled={updateQuantityMutation.isPending}
                                >
                                  -
                                </button>
                                <span className="px-3 py-1">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="px-3 py-1 text-gray-600 hover:text-gray-800"
                                  disabled={updateQuantityMutation.isPending}
                                >
                                  +
                                </button>
                              </div>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-sm text-red-600 hover:text-red-800"
                                disabled={removeItemMutation.isPending}
                              >
                                {t.remove}
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex justify-between">
                  <button
                    onClick={clearCart}
                    className="text-sm text-red-600 hover:text-red-800"
                    disabled={clearCartMutation.isPending}
                  >
                    {clearCartMutation.isPending ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t.clearing}
                      </span>
                    ) : (
                      t.clearCart
                    )}
                  </button>
                  <Button
                    onClick={() => setLocation('/products')}
                    variant="outline"
                  >
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
                      <dd className="text-sm font-medium text-gray-900">${calculateSubtotal().toFixed(2)}</dd>
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
                  disabled={checkoutMutation.isPending}
                >
                  {checkoutMutation.isPending ? (
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
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/2560px-Stripe_Logo%2C_revised_2016.svg.png" 
                    alt="Stripe"
                    className="h-6 mr-2"
                  />
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
                    disabled={applyPromoCodeMutation.isPending}
                  />
                  <Button
                    variant="secondary"
                    className="rounded-l-none"
                    onClick={applyPromoCode}
                    disabled={applyPromoCodeMutation.isPending}
                  >
                    {applyPromoCodeMutation.isPending ? (
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
};

export default Cart;