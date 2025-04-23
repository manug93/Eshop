import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// CartItem interface
interface CartItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  thumbnail: string;
}

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // This would normally fetch cart items from local storage or an API
    // For demonstration, we'll use sample data
    const fetchCartItems = () => {
      setIsLoading(true);
      
      // Sample cart data
      const sampleCartItems: CartItem[] = [
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
      
      setCartItems(sampleCartItems);
      setIsLoading(false);
    };

    fetchCartItems();
  }, []);

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
    
    toast({
      title: "Item Removed",
      description: "The item has been removed from your cart",
    });
  };

  const clearCart = () => {
    setCartItems([]);
    
    toast({
      title: "Cart Cleared",
      description: "All items have been removed from your cart",
    });
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
            <h2 className="text-2xl font-bold mb-2">Your Cart is Empty</h2>
            <p className="text-gray-600 mb-6">Looks like you haven't added any products to your cart yet.</p>
            <Button onClick={() => setLocation('/products')}>
              Browse Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>
        
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
                            <p className="mt-1 text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center border rounded-md">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="px-3 py-1 text-gray-600 hover:text-gray-800"
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
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-sm text-red-600 hover:text-red-800"
                              >
                                Remove
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
                  >
                    Clear Cart
                  </button>
                  <Button
                    onClick={() => setLocation('/products')}
                    variant="outline"
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
                <div className="flow-root">
                  <dl className="-my-4 divide-y divide-gray-200">
                    <div className="py-4 flex items-center justify-between">
                      <dt className="text-sm text-gray-600">Subtotal</dt>
                      <dd className="text-sm font-medium text-gray-900">${calculateSubtotal().toFixed(2)}</dd>
                    </div>
                    <div className="py-4 flex items-center justify-between">
                      <dt className="text-sm text-gray-600">Shipping</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {calculateShipping() === 0 ? (
                          <span className="text-green-600">Free</span>
                        ) : (
                          `$${calculateShipping().toFixed(2)}`
                        )}
                      </dd>
                    </div>
                    <div className="py-4 flex items-center justify-between">
                      <dt className="text-sm text-gray-600">Tax</dt>
                      <dd className="text-sm font-medium text-gray-900">${calculateTax().toFixed(2)}</dd>
                    </div>
                    <div className="py-4 flex items-center justify-between">
                      <dt className="text-base font-medium text-gray-900">Order Total</dt>
                      <dd className="text-base font-medium text-gray-900">${calculateTotal().toFixed(2)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <div className="border-t border-gray-200 px-6 py-4">
                <Button
                  onClick={() => setLocation('/checkout')}
                  className="w-full py-3"
                >
                  Proceed to Checkout
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
                    Secure payment processing by Stripe
                  </span>
                </div>
              </div>
            </div>
            
            {/* Promo Code */}
            <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Promo Code</h2>
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Enter code"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  <Button
                    variant="secondary"
                    className="rounded-l-none"
                  >
                    Apply
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