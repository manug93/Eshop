import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/hooks/use-translations";

export interface CartItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  thumbnail: string;
}

type CartContextType = {
  cartItems: CartItem[];
  isLoading: boolean;
  totalItems: number;
  subtotal: number;
  addToCart: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { t } = useTranslations();
  const [localCartItems, setLocalCartItems] = useState<CartItem[]>([]);

  // Fetch cart items
  const { data: apiCartItems = [], isLoading } = useQuery({
    queryKey: ['/api/cart/items'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/cart/items');
        return response.data;
      } catch (error) {
        // If the API fails, return an empty array
        return [];
      }
    }
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (item: CartItem & { description?: string, brand?: string, category?: string }) => {
      const response = await apiRequest('POST', '/api/cart/items', {
        body: item,
        headers: {
          "Content-Type": "application/json"
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart/items'] });
      toast({
        title: t.itemAdded,
        description: t.itemAddedSuccess,
      });
    },
    onError: (error) => {
      toast({
        title: t.error,
        description: t.errorAddingItem,
        variant: "destructive",
      });
      console.error('Error adding item:', error);
    }
  });

  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number, quantity: number }) => {
      const response = await apiRequest('PUT', `/api/cart/items/${id}`, {
        body:{ quantity },
        headers:{
          "Content-Type":"application/json"
        }
      });
      return response.data;
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

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/cart/items/${id}`);
      return response.data;
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

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/cart/items');
      return response.data;
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

  // Update local cart items when API data changes
  useEffect(() => {
    if (apiCartItems && apiCartItems.length > 0) {
      setLocalCartItems(apiCartItems);
    }
  }, [apiCartItems]);

  const addToCart = (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    const newItem = {
      ...item,
      quantity: item.quantity || 1
    };

    // Optimistic update
    const existingItemIndex = localCartItems.findIndex(i => i.id === newItem.id);
    
    if (existingItemIndex !== -1) {
      // If item already exists, update quantity
      const updatedItems = [...localCartItems];
      updatedItems[existingItemIndex].quantity += newItem.quantity;
      setLocalCartItems(updatedItems);
    } else {
      // If it's a new item, add it
      setLocalCartItems(prev => [...prev, newItem as CartItem]);
    }
    
    // Send to server
    addToCartMutation.mutate(newItem as CartItem);
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) return;
    
    // Optimistic update
    setLocalCartItems(prev => 
      prev.map(item => item.id === id ? {...item, quantity} : item)
    );
    
    // Send to server
    updateQuantityMutation.mutate({ id, quantity });
  };

  const removeFromCart = (id: number) => {
    // Optimistic update
    setLocalCartItems(prev => prev.filter(item => item.id !== id));
    
    // Send to server
    removeItemMutation.mutate(id);
  };

  const clearCart = () => {
    // Optimistic update
    setLocalCartItems([]);
    
    // Send to server
    clearCartMutation.mutate();
  };

  // Calculate totals
  const totalItems = localCartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = localCartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider
      value={{
        cartItems: localCartItems,
        isLoading,
        totalItems,
        subtotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}