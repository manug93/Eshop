import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, Loader2, PlusCircle, Download, Trash2, X, Edit, RefreshCw, Layers } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Interfaces for API responses
interface AdminStats {
  usersCount: number;
  ordersCount: number;
  revenue: number;
  productsCount: number;
  recentOrders: Order[];
}

interface Order {
  id: number;
  userId: number;
  status: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  paymentIntentId?: string;
  stripeChargeId?: string;
  stripeRefNumber?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  user?: {
    username: string;
    email: string;
  };
}

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  stock: number;
  brand: string;
  categoryId: number | null;
  category?: string;
  thumbnail: string;
  active: boolean;
}

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
  preferredLanguage: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for category
interface Category {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for product form data
interface ProductFormData {
  id?: number;
  title: string;
  description: string;
  price: number;
  stock: number;
  brand: string; 
  categoryId: number | null;
  thumbnail: string;
  active: boolean; // Make active a required field instead of optional
}

// Interface for category form data
interface CategoryFormData {
  id?: number;
  name: string;
  slug: string;
}

// Mapping interface for external to internal category
interface CategoryMapping {
  externalCategory: string;
  internalCategoryId: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Product dialog state
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Import dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importCategory, setImportCategory] = useState<string>("all");
  const [importCount, setImportCount] = useState<number>(5);
  const [importSkip, setImportSkip] = useState<number>(0);
  const [importCheckDuplicates, setImportCheckDuplicates] = useState<boolean>(true);
  
  // Zero stock deletion state
  const [zeroStockConfirmOpen, setZeroStockConfirmOpen] = useState(false);
  
  // Product deletion state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  
  // Order refund state
  const [refundConfirmOpen, setRefundConfirmOpen] = useState(false);
  const [orderToRefund, setOrderToRefund] = useState<{orderId: number; paymentIntentId: string} | null>(null);
  
  // Category management state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryFormData | null>(null);
  const [categoryFormError, setCategoryFormError] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [deleteCategoryConfirmOpen, setDeleteCategoryConfirmOpen] = useState(false);
  const [categoryMappingDialogOpen, setCategoryMappingDialogOpen] = useState(false);
  const [categoryMappings, setCategoryMappings] = useState<CategoryMapping[]>([]);
  const [loadingCategoryMappings, setLoadingCategoryMappings] = useState(false);
  const [loadingExternalCategories, setLoadingExternalCategories] = useState(false);
  


  // Fetching admin statistics
  const { data: adminStats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/stats');
        return await response.json();
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        return {
          usersCount: 0,
          ordersCount: 0,
          revenue: 0,
          productsCount: 0,
          recentOrders: []
        };
      }
    }
  });

  // Fetching orders
  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/orders');
        return await response.json();
      } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
      }
    }
  });

  // Fetching products including inactive ones (admin-only)
  const { data: productsData, isLoading: productsLoading } = useQuery<{ products: Product[], total: number }>({
    queryKey: ['/api/products'],
    queryFn: async () => {
      try {
        // Include inactive products for admin view with the includeInactive parameter
        const response = await apiRequest('GET', '/api/products?limit=100&includeInactive=true');
        return await response.json();
      } catch (error) {
        console.error('Error fetching products:', error);
        return { products: [], total: 0 };
      }
    }
  });
  
  // Extract products array from the response
  const products = productsData?.products || [];

  // Fetching users
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/users');
        return await response.json();
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    }
  });
  
  // Fetching categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/categories');
        return await response.json();
      } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
    }
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/orders/${orderId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Order status updated",
        description: "The order status has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating order status",
        description: error.message || "An error occurred while updating the order status.",
        variant: "destructive",
      });
    }
  });
  
  // Refund order mutation
  const refundOrderMutation = useMutation({
    mutationFn: async ({ orderId, paymentIntentId }: { orderId: number; paymentIntentId: string }) => {
      const response = await apiRequest('POST', `/api/admin/orders/${orderId}/refund`, { paymentIntentId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Order refunded",
        description: "The order has been successfully refunded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error refunding order",
        description: error.message || "An error occurred while processing the refund.",
        variant: "destructive",
      });
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      console.log("Delete mutation called with product ID:", productId);
      const response = await apiRequest('DELETE', `/api/admin/products/${productId}`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      
      // Display appropriate toast based on whether the product was fully deleted or just marked inactive
      toast({
        title: data.fullDelete ? "Product deleted" : "Product marked as inactive",
        description: data.message,
        // Only 'default' and 'destructive' are allowed variants
        variant: data.fullDelete ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting product",
        description: error.message || "An error occurred while deleting the product.",
        variant: "destructive",
      });
    }
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number; isAdmin: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${userId}`, { isAdmin });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User role updated",
        description: "The user role has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating user role",
        description: error.message || "An error occurred while updating the user role.",
        variant: "destructive",
      });
    }
  });
  
  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: ProductFormData) => {
      const response = await apiRequest('POST', '/api/admin/products', productData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setProductDialogOpen(false);
      setEditingProduct(null);
      toast({
        title: "Product created",
        description: "The product has been successfully created.",
      });
    },
    onError: (error: any) => {
      setFormError(error.message || "An error occurred while creating the product.");
      toast({
        title: "Error creating product",
        description: error.message || "An error occurred while creating the product.",
        variant: "destructive",
      });
    }
  });
  
  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (productData: ProductFormData) => {
      const { id, ...data } = productData;
      console.log("Sending PATCH request to server with data:", data);
      const response = await apiRequest('PATCH', `/api/admin/products/${id}`, data);
      const responseData = await response.json();
      console.log("Server response:", responseData);
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setProductDialogOpen(false);
      setEditingProduct(null);
      toast({
        title: "Product updated",
        description: "The product has been successfully updated.",
      });
    },
    onError: (error: any) => {
      setFormError(error.message || "An error occurred while updating the product.");
      toast({
        title: "Error updating product",
        description: error.message || "An error occurred while updating the product.",
        variant: "destructive",
      });
    }
  });
  
  // Reactivate product mutation
  const reactivateProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest('POST', `/api/admin/products/${productId}/reactivate`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      
      toast({
        title: "Product reactivated",
        description: "The product has been successfully reactivated and is now available for purchase.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error reactivating product",
        description: error.message || "An error occurred while reactivating the product.",
        variant: "destructive",
      });
    }
  });
  

  
  // Delete all zero stock products mutation
  const deleteZeroStockMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/admin/products/zerostock');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setZeroStockConfirmOpen(false);
      
      toast({
        title: "Zero stock products processed",
        description: data.message || "Zero stock products have been processed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error processing zero stock products",
        description: error.message || "An error occurred while processing zero stock products.",
        variant: "destructive",
      });
    }
  });
  
  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: CategoryFormData) => {
      const response = await apiRequest('POST', '/api/admin/categories', categoryData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      toast({
        title: "Category created",
        description: "The category has been successfully created.",
      });
    },
    onError: (error: any) => {
      setCategoryFormError(error.message || "An error occurred while creating the category.");
      toast({
        title: "Error creating category",
        description: error.message || "An error occurred while creating the category.",
        variant: "destructive",
      });
    }
  });
  
  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (categoryData: CategoryFormData) => {
      const { id, ...data } = categoryData;
      const response = await apiRequest('PATCH', `/api/admin/categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      toast({
        title: "Category updated",
        description: "The category has been successfully updated.",
      });
    },
    onError: (error: any) => {
      setCategoryFormError(error.message || "An error occurred while updating the category.");
      toast({
        title: "Error updating category",
        description: error.message || "An error occurred while updating the category.",
        variant: "destructive",
      });
    }
  });
  
  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      const response = await apiRequest('DELETE', `/api/admin/categories/${categoryId}`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: "Category deleted",
        description: data.message || "The category has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting category",
        description: error.message || "An error occurred while deleting the category. It may be in use by products.",
        variant: "destructive",
      });
    }
  });
  
  // Save category mappings mutation
  const saveCategoryMappingsMutation = useMutation({
    mutationFn: async (mappings: CategoryMapping[]) => {
      const response = await apiRequest('POST', '/api/admin/category-mappings', { mappings });
      return response.json();
    },
    onSuccess: () => {
      setCategoryMappingDialogOpen(false);
      toast({
        title: "Category mappings saved",
        description: "The category mappings have been successfully saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving category mappings",
        description: error.message || "An error occurred while saving category mappings.",
        variant: "destructive",
      });
    }
  });
  
  // Save category mappings mutation

  // Import products from DummyJSON API with category mappings
  const importProductsMutation = useMutation({
    mutationFn: async ({ 
      category, 
      limit,
      skip,
      checkDuplicates 
    }: { 
      category: string; 
      limit: number;
      skip: number;
      checkDuplicates: boolean;
    }) => {
      const response = await apiRequest('POST', `/api/admin/products/import`, { 
        category, 
        limit,
        skip,
        checkDuplicates,
        categoryMappings: categoryMappings.length > 0 ? categoryMappings : undefined
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setImportDialogOpen(false);
      
      let description = `${data.count} products have been successfully imported.`;
      if (data.skipped && data.skipped > 0) {
        description += ` (${data.skipped} duplicate products were skipped)`;
      }
      
      toast({
        title: "Products imported",
        description,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error importing products",
        description: error.message || "An error occurred while importing products.",
        variant: "destructive",
      });
    }
  });

  // Handle order status update
  const handleUpdateOrderStatus = (orderId: number, newStatus: string) => {
    updateOrderStatusMutation.mutate({ orderId, status: newStatus });
  };

  // Handle product deletion confirmation dialog
  const handleDeleteProductConfirm = (productId: number) => {
    console.log("Opening delete confirmation dialog for product ID:", productId);
    setProductToDelete(productId);
    setDeleteConfirmOpen(true);
  };
  
  // Execute actual product deletion
  const executeProductDeletion = () => {
    if (productToDelete) {
      console.log("Executing product deletion for ID:", productToDelete);
      deleteProductMutation.mutate(productToDelete);
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
    } else {
      console.error("Product ID is not set for deletion");
    }
  };
  
  // Handle order refund confirmation dialog
  const handleRefundOrderConfirm = (orderId: number, paymentIntentId: string) => {
    setOrderToRefund({ orderId, paymentIntentId });
    setRefundConfirmOpen(true);
  };
  
  // Execute actual order refund
  const executeOrderRefund = () => {
    if (orderToRefund) {
      refundOrderMutation.mutate(orderToRefund);
      setRefundConfirmOpen(false);
      setOrderToRefund(null);
    }
  };
  
  // Handle opening the product dialog for creating a new product
  const handleAddProduct = () => {
    setEditingProduct({
      title: "",
      description: "",
      price: 0,
      stock: 0,
      brand: "",
      categoryId: null,
      thumbnail: "",
      active: true // Default to active for new products
    });
    setFormError(null);
    setProductDialogOpen(true);
  };
  
  // Handle opening the product dialog for editing an existing product
  const handleEditProduct = (product: Product) => {
    setEditingProduct({
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      stock: product.stock,
      brand: product.brand,
      categoryId: product.categoryId,
      thumbnail: product.thumbnail,
      active: product.active
    });
    setFormError(null);
    setProductDialogOpen(true);
  };
  
  // Handle form submission for creating or updating a product
  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingProduct) return;
    
    // Validate form data
    if (!editingProduct.title) {
      setFormError("Title is required");
      return;
    }
    
    if (!editingProduct.description) {
      setFormError("Description is required");
      return;
    }
    
    if (!editingProduct.price || editingProduct.price <= 0) {
      setFormError("Price must be greater than 0");
      return;
    }
    
    if (!editingProduct.thumbnail) {
      setFormError("Thumbnail URL is required");
      return;
    }
    
    console.log("Submitting product data:", editingProduct);
    
    // Submit form data
    if (editingProduct.id) {
      // For update operations, explicitly ensure active state is included
      const dataToUpdate = {
        ...editingProduct,
        active: editingProduct.active !== false // Ensure active is a boolean
      };
      console.log("Updating product with:", dataToUpdate);
      updateProductMutation.mutate(dataToUpdate);
    } else {
      createProductMutation.mutate(editingProduct);
    }
  };
  
  // Handle form submission for importing products
  const handleImportProducts = (e: React.FormEvent) => {
    e.preventDefault();
    importProductsMutation.mutate({
      category: importCategory,
      limit: importCount,
      skip: importSkip,
      checkDuplicates: importCheckDuplicates
    });
  };
  
  // Open confirmation dialog to delete zero stock products
  const handleDeleteZeroStockProducts = () => {
    // Count zero stock products
    const zeroStockCount = products.filter(product => product.stock === 0).length;
    
    if (zeroStockCount === 0) {
      toast({
        title: "No zero stock products",
        description: "There are no products with zero stock to remove.",
      });
      return;
    }
    
    setZeroStockConfirmOpen(true);
  };
  
  // Execute zero stock product deletion
  const executeZeroStockDeletion = () => {
    deleteZeroStockMutation.mutate();
  };
  
  // Handle product reactivation
  const handleReactivateProduct = (productId: number) => {
    reactivateProductMutation.mutate(productId);
  };
  
  // Category handlers
  const handleAddCategory = () => {
    setEditingCategory({
      name: "",
      slug: "",
    });
    setCategoryFormError(null);
    setCategoryDialogOpen(true);
  };
  
  const handleEditCategory = (category: {id: number; name: string; slug: string; createdAt?: string; updatedAt?: string}) => {
    setEditingCategory({
      id: category.id,
      name: category.name,
      slug: category.slug,
    });
    setCategoryFormError(null);
    setCategoryDialogOpen(true);
  };
  
  const handleDeleteCategoryConfirm = (categoryId: number) => {
    setCategoryToDelete(categoryId);
    setDeleteCategoryConfirmOpen(true);
  };
  
  const executeDeleteCategory = () => {
    if (categoryToDelete) {
      deleteCategoryMutation.mutate(categoryToDelete);
      setDeleteCategoryConfirmOpen(false);
      setCategoryToDelete(null);
    }
  };
  
  const handleSubmitCategory = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCategory) return;
    
    // Validate form data
    if (!editingCategory.name) {
      setCategoryFormError("Name is required");
      return;
    }
    
    if (!editingCategory.slug) {
      // Auto-generate slug from name if empty
      const generatedSlug = editingCategory.name.toLowerCase()
        .replace(/[^\w\s-]/g, '')  // Remove special chars
        .replace(/\s+/g, '-')      // Replace spaces with -
        .replace(/--+/g, '-');     // Replace multiple - with single -
      
      setEditingCategory({
        ...editingCategory,
        slug: generatedSlug
      });
      
      // Use the updated object directly
      if (editingCategory.id) {
        updateCategoryMutation.mutate({
          ...editingCategory,
          slug: generatedSlug
        });
      } else {
        createCategoryMutation.mutate({
          ...editingCategory,
          slug: generatedSlug
        });
      }
      return;
    }
    
    // Submit form data
    if (editingCategory.id) {
      updateCategoryMutation.mutate(editingCategory);
    } else {
      createCategoryMutation.mutate(editingCategory);
    }
  };
  
  // Open category mapping dialog for DummyJSON categories
  const handleOpenCategoryMapping = async () => {
    setLoadingCategoryMappings(true);
    
    try {
      // Fetch existing mappings from the server
      const response = await apiRequest('GET', '/api/admin/category-mappings');
      const existingMappings = await response.json();
      
      console.log("Loaded existing mappings:", existingMappings);
      
      if (existingMappings && existingMappings.length > 0) {
        // Use existing mappings if available
        setCategoryMappings(existingMappings);
      } else {
        // Initialize with default mappings if none exist
        const externalCategories = [
          "smartphones", "laptops", "fragrances", "skincare", "groceries", 
          "home-decoration", "furniture", "tops", "womens-dresses", 
          "womens-shoes", "mens-shirts", "mens-shoes", "mens-watches", 
          "womens-watches", "womens-bags", "womens-jewellery", "sunglasses", 
          "automotive", "motorcycle", "lighting"
        ];
        
        setCategoryMappings(
          externalCategories.map(cat => ({
            externalCategory: cat,
            internalCategoryId: categories && categories.length > 0 ? categories[0].id : 1
          }))
        );
      }
    } catch (error) {
      console.error("Error loading category mappings:", error);
      toast({
        title: "Error loading mappings",
        description: "Could not load existing category mappings. Using default values.",
        variant: "destructive",
      });
      
      // Fall back to default mappings in case of error
      const externalCategories = [
        "smartphones", "laptops", "fragrances", "skincare", "groceries", 
        "home-decoration", "furniture", "tops", "womens-dresses", 
        "womens-shoes", "mens-shirts", "mens-shoes", "mens-watches", 
        "womens-watches", "womens-bags", "womens-jewellery", "sunglasses", 
        "automotive", "motorcycle", "lighting"
      ];
      
      setCategoryMappings(
        externalCategories.map(cat => ({
          externalCategory: cat,
          internalCategoryId: categories && categories.length > 0 ? categories[0].id : 1
        }))
      );
    } finally {
      setLoadingCategoryMappings(false);
      setCategoryMappingDialogOpen(true);
    }
  };
  
  // Import categories from DummyJSON API
  const handleImportExternalCategories = async () => {
    setLoadingExternalCategories(true);
    
    try {
      // First, load existing category mappings to compare and avoid duplications
      const existingMappingsResponse = await apiRequest('GET', '/api/admin/category-mappings');
      const existingMappings = await existingMappingsResponse.json();
      
      // Extract existing external categories
      const existingExternalCategories = existingMappings.map(
        (mapping: CategoryMapping) => mapping.externalCategory
      );
      
      // Fetch external categories from DummyJSON API
      const response = await apiRequest('GET', '/api/admin/import-external-categories');
      
      if (!response.ok) {
        throw new Error(`Error importing categories: ${response.status} ${response.statusText}`);
      }
      
      const externalCategories: string[] = await response.json();
      
      // Default category ID to use for new mappings
      const defaultCategoryId = categories && categories.length > 0 ? categories[0].id : 1;
      
      // Create new mappings array, merging existing and new ones
      let mergedMappings: CategoryMapping[] = [...existingMappings];
      
      // Add only categories that don't already exist in mappings
      let newCategoriesCount = 0;
      
      externalCategories.forEach(cat => {
        if (!existingExternalCategories.includes(cat)) {
          mergedMappings.push({
            externalCategory: cat,
            internalCategoryId: defaultCategoryId
          });
          newCategoriesCount++;
        }
      });
      
      setCategoryMappings(mergedMappings);
      
      toast({
        title: newCategoriesCount > 0 ? "Categories imported" : "No new categories found",
        description: newCategoriesCount > 0 
          ? `Successfully imported ${newCategoriesCount} new categories from DummyJSON.`
          : "All DummyJSON categories are already mapped. You can modify existing mappings.",
      });
      
      // Open the category mapping dialog to let user choose mappings
      setCategoryMappingDialogOpen(true);
    } catch (error) {
      console.error("Error importing external categories:", error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import categories from DummyJSON.",
        variant: "destructive",
      });
    } finally {
      setLoadingExternalCategories(false);
    }
  };

  // Save category mappings
  const handleSaveCategoryMappings = () => {
    saveCategoryMappingsMutation.mutate(categoryMappings);
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // If user is not admin, show access denied
  if (!user?.isAdmin) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access the admin dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show loading state
  if (statsLoading || ordersLoading || productsLoading || usersLoading) {
    return (
      <div className="container mx-auto py-10 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 max-w-3xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${adminStats?.revenue?.toFixed(2) || '0.00'}</div>
                <p className="text-xs text-muted-foreground">From all completed orders</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats?.ordersCount || 0}</div>
                <p className="text-xs text-muted-foreground">Orders placed on the platform</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats?.productsCount || 0}</div>
                <p className="text-xs text-muted-foreground">Products in inventory</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats?.usersCount || 0}</div>
                <p className="text-xs text-muted-foreground">Registered users</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest 5 orders from the store</CardDescription>
              </CardHeader>
              <CardContent>
                {adminStats?.recentOrders && adminStats.recentOrders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminStats.recentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>#{order.id}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              order.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                              order.status === 'shipped' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">${order.total?.toFixed(2) || '0.00'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6 text-gray-500">No recent orders to display</div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Product Statistics</CardTitle>
                <CardDescription>Most popular product categories</CardDescription>
              </CardHeader>
              <CardContent>
                {products && products.length > 0 ? (
                  <div className="space-y-4">
                    {/* Group products by category and show counts */}
                    {Object.entries(
                      products.reduce((acc, product) => {
                        const category = product.category || 'other';
                        acc[category] = (acc[category] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([category, count], index) => {
                      const percentage = Math.round((count / products.length) * 100);
                      const colors = [
                        'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
                        'bg-purple-500', 'bg-red-500'
                      ];
                      return (
                        <div key={category}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                            <span className="text-sm font-medium">{count} products</span>
                          </div>
                          <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div className={`${colors[index % colors.length]} h-full rounded-full`} style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">No product statistics to display</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>View and manage all orders</CardDescription>
            </CardHeader>
            <CardContent>
              {orders && orders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Payment Intent ID</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>#{order.id}</TableCell>
                        <TableCell>#{order.userId}</TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            order.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                            order.status === 'shipped' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">${order.total?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          {order.paymentIntentId ? (
                            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded" title={order.paymentIntentId}>
                              {order.paymentIntentId.substring(0, 14)}...
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <select 
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              disabled={updateOrderStatusMutation.isPending || order.status === 'refunded'}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="refunded">Refunded</option>
                            </select>
                            {order.status === 'completed' && order.paymentIntentId && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200 flex items-center gap-1"
                                onClick={() => handleRefundOrderConfirm(order.id, order.paymentIntentId || '')}
                                disabled={refundOrderMutation.isPending}
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span>Refund</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-gray-500">No orders to display</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
              <CardDescription>View and manage your product inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2">
                <Button 
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                  onClick={handleAddProduct}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Product
                </Button>
                <Button 
                  variant="outline"
                  className="px-4 py-2 rounded"
                  onClick={() => setImportDialogOpen(true)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Import from DummyJSON
                </Button>
                <Button 
                  variant="outline" 
                  className="px-4 py-2 rounded text-red-600 border-red-300 hover:bg-red-50"
                  onClick={handleDeleteZeroStockProducts}
                  disabled={deleteZeroStockMutation.isPending}
                >
                  {deleteZeroStockMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove Zero Stock Products
                    </>
                  )}
                </Button>
              </div>
              {products && products.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>In Stock</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id} className={product.active ? "" : "opacity-70 bg-gray-50"}>
                        <TableCell>#{product.id}</TableCell>
                        <TableCell>{product.title}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>${product.price.toFixed(2)}</TableCell>
                        <TableCell>{product.category || 'Uncategorized'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            product.active 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {product.active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200 flex items-center gap-1"
                              onClick={() => handleEditProduct(product)}
                              disabled={updateProductMutation.isPending}
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </Button>
                            {product.active ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200 flex items-center gap-1"
                                onClick={() => handleDeleteProductConfirm(product.id)}
                                disabled={deleteProductMutation.isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete</span>
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200 flex items-center gap-1"
                                onClick={() => handleReactivateProduct(product.id)}
                                disabled={reactivateProductMutation.isPending}
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span>Reactivate</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-gray-500">No products to display</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Category Management</CardTitle>
                <CardDescription>Create and manage product categories</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleOpenCategoryMapping}
                  className="px-4 py-2 rounded"
                >
                  <Layers className="mr-2 h-4 w-4" />
                  Category Mappings
                </Button>
                <Button 
                  variant="secondary"
                  onClick={handleImportExternalCategories}
                  className="px-4 py-2 rounded"
                  disabled={loadingExternalCategories}
                >
                  {loadingExternalCategories ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Import DummyJSON Categories
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="text-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-gray-500">Loading categories...</p>
                </div>
              ) : categories && categories.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>#{category.id}</TableCell>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>
                          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                            {category.slug}
                          </span>
                        </TableCell>
                        <TableCell>{category.createdAt ? formatDate(category.createdAt) : 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditCategory(category)}
                              className="h-8 px-2 text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              <span>Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCategoryConfirm(category.id)}
                              className="h-8 px-2 text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
                              disabled={category.id === 1} // Protect default category
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              <span>Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-gray-500">No categories to display</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              {users && users.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>#{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.isAdmin ? "Admin" : "User"}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <select 
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                              value={user.isAdmin ? "admin" : "user"}
                              onChange={(e) => updateUserRoleMutation.mutate({ 
                                userId: user.id, 
                                isAdmin: e.target.value === "admin" 
                              })}
                              disabled={updateUserRoleMutation.isPending}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-gray-500">No users to display</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct?.id ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct?.id 
                ? 'Edit the details of the existing product.' 
                : 'Fill in the details of the new product you want to add.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitProduct} className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded p-3">
                {formError}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Product Title</Label>
                <Input 
                  id="title" 
                  value={editingProduct?.title || ''} 
                  onChange={(e) => setEditingProduct(prev => prev ? {...prev, title: e.target.value} : null)}
                  placeholder="Product title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input 
                  id="brand" 
                  value={editingProduct?.brand || ''} 
                  onChange={(e) => setEditingProduct(prev => prev ? {...prev, brand: e.target.value} : null)}
                  placeholder="Brand name"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={editingProduct?.description || ''} 
                onChange={(e) => setEditingProduct(prev => prev ? {...prev, description: e.target.value} : null)}
                placeholder="Product description"
                rows={4}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input 
                  id="price" 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  value={editingProduct?.price || ''} 
                  onChange={(e) => setEditingProduct(prev => 
                    prev ? {...prev, price: parseFloat(e.target.value) || 0} : null
                  )}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input 
                  id="stock" 
                  type="number" 
                  min="0" 
                  value={editingProduct?.stock || ''} 
                  onChange={(e) => setEditingProduct(prev => 
                    prev ? {...prev, stock: parseInt(e.target.value) || 0} : null
                  )}
                  placeholder="0"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input 
                  id="thumbnail" 
                  value={editingProduct?.thumbnail || ''} 
                  onChange={(e) => setEditingProduct(prev => prev ? {...prev, thumbnail: e.target.value} : null)}
                  placeholder="https://example.com/image.jpg"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <Select 
                  value={editingProduct?.categoryId?.toString() || "null"}
                  onValueChange={(value) => setEditingProduct(prev => 
                    prev ? {...prev, categoryId: value && value !== "null" ? parseInt(value) : null} : null
                  )}
                >
                  <SelectTrigger id="categoryId">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">None</SelectItem>
                    {categories && categories.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {editingProduct?.id && (
              <div className="flex items-center space-x-2 mt-4">
                <Checkbox 
                  id="active" 
                  checked={editingProduct?.active !== false}
                  onCheckedChange={(checked: boolean) => {
                    console.log("Active checkbox changed to:", checked);
                    setEditingProduct(prev => {
                      if (!prev) return null;
                      const updated = {...prev, active: checked};
                      console.log("Updated editingProduct:", updated);
                      return updated;
                    });
                  }}
                />
                <label
                  htmlFor="active"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Active (shown to customers)
                </label>
              </div>
            )}
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)}>Cancel</Button>
              <Button 
                type="submit" 
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
              >
                {createProductMutation.isPending || updateProductMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Product'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Import Products from DummyJSON</DialogTitle>
            <DialogDescription>
              Import products from DummyJSON API. You can specify a category and the number of products to import.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleImportProducts} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category (optional)</Label>
              <Select 
                value={importCategory} 
                onValueChange={setImportCategory}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="smartphones">Smartphones</SelectItem>
                  <SelectItem value="laptops">Laptops</SelectItem>
                  <SelectItem value="fragrances">Fragrances</SelectItem>
                  <SelectItem value="skincare">Skincare</SelectItem>
                  <SelectItem value="groceries">Groceries</SelectItem>
                  <SelectItem value="home-decoration">Home Decoration</SelectItem>
                  <SelectItem value="furniture">Furniture</SelectItem>
                  <SelectItem value="tops">Tops</SelectItem>
                  <SelectItem value="womens-dresses">Women's Dresses</SelectItem>
                  <SelectItem value="womens-shoes">Women's Shoes</SelectItem>
                  <SelectItem value="mens-shirts">Men's Shirts</SelectItem>
                  <SelectItem value="mens-shoes">Men's Shoes</SelectItem>
                  <SelectItem value="mens-watches">Men's Watches</SelectItem>
                  <SelectItem value="womens-watches">Women's Watches</SelectItem>
                  <SelectItem value="womens-bags">Women's Bags</SelectItem>
                  <SelectItem value="womens-jewellery">Women's Jewellery</SelectItem>
                  <SelectItem value="sunglasses">Sunglasses</SelectItem>
                  <SelectItem value="automotive">Automotive</SelectItem>
                  <SelectItem value="motorcycle">Motorcycle</SelectItem>
                  <SelectItem value="lighting">Lighting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="limit">Number of Products</Label>
              <Input 
                id="limit" 
                type="number" 
                min="1" 
                max="30" 
                value={importCount} 
                onChange={(e) => setImportCount(parseInt(e.target.value) || 5)}
                required
              />
              <p className="text-sm text-gray-500">Maximum: 30 products</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="skip">Skip First N Products</Label>
              <Input 
                id="skip" 
                type="number" 
                min="0"
                value={importSkip} 
                onChange={(e) => setImportSkip(parseInt(e.target.value) || 0)}
              />
              <p className="text-sm text-gray-500">Use this for pagination to avoid duplicate imports</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="checkDuplicates"
                checked={importCheckDuplicates}
                onChange={(e) => setImportCheckDuplicates(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="checkDuplicates" className="text-sm font-normal">
                Check for duplicate product titles
              </Label>
            </div>
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setImportDialogOpen(false)}>Cancel</Button>
              <Button 
                type="submit" 
                disabled={importProductsMutation.isPending}
              >
                {importProductsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Products'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Product Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              and remove all related data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                console.log("Delete confirmation clicked");
                executeProductDeletion();
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteProductMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Product'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Zero Stock Products Confirmation Dialog */}
      <AlertDialog open={zeroStockConfirmOpen} onOpenChange={setZeroStockConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove All Zero Stock Products?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all products
              with zero stock from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeZeroStockDeletion}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteZeroStockMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Delete Zero Stock Products'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Order Refund Confirmation Dialog */}
      <AlertDialog open={refundConfirmOpen} onOpenChange={setRefundConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refund This Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will process a full refund to the customer 
              for this order. The refund will be processed through Stripe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeOrderRefund}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {refundOrderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Refund...
                </>
              ) : (
                'Process Refund'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCategory?.id ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            <DialogDescription>
              {editingCategory?.id 
                ? 'Edit the details of the existing category.' 
                : 'Create a new category for products.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitCategory} className="space-y-4">
            {categoryFormError && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded p-3">
                {categoryFormError}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input 
                id="name" 
                value={editingCategory?.name || ''} 
                onChange={(e) => setEditingCategory(prev => prev ? {...prev, name: e.target.value} : null)}
                placeholder="Category name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug 
                <span className="text-gray-500 text-xs ml-2">(Leave empty to auto-generate from name)</span>
              </Label>
              <Input 
                id="slug" 
                value={editingCategory?.slug || ''} 
                onChange={(e) => setEditingCategory(prev => prev ? {...prev, slug: e.target.value} : null)}
                placeholder="category-slug"
              />
            </div>
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
              <Button 
                type="submit" 
                disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending || updateCategoryMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Category'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Category Confirmation Dialog */}
      <AlertDialog open={deleteCategoryConfirmOpen} onOpenChange={setDeleteCategoryConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete This Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category.
              Products associated with this category will be moved to the default category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeDeleteCategory}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteCategoryMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Category'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Category Mapping Dialog */}
      <Dialog open={categoryMappingDialogOpen} onOpenChange={setCategoryMappingDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Category Mappings for Import</DialogTitle>
            <DialogDescription>
              Map external DummyJSON categories to your internal categories to ensure products 
              are assigned correctly during import.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="border rounded-lg p-4 mb-4 bg-blue-50 text-blue-600">
              <h3 className="font-medium mb-2">About Category Mappings</h3>
              <p className="text-sm">
                These mappings determine how external categories from DummyJSON are assigned to your internal 
                categories during product import. This ensures imported products are organized according to your 
                category structure.
              </p>
            </div>
            
            {loadingCategoryMappings ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading category mappings...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-5 gap-4 text-sm font-medium border-b pb-2">
                  <div className="col-span-2">External Category</div>
                  <div className="col-span-3">Internal Category</div>
                </div>
                
                {categoryMappings.map((mapping, index) => (
                  <div key={mapping.externalCategory} className="grid grid-cols-5 gap-4 items-center py-2 border-b border-gray-100">
                    <div className="col-span-2">
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                        {mapping.externalCategory.replace(/-/g, ' ')}
                      </span>
                    </div>
                    <div className="col-span-3">
                      <Select 
                        value={mapping.internalCategoryId.toString()}
                        onValueChange={(value) => {
                          const newMappings = [...categoryMappings];
                          newMappings[index] = {
                            ...newMappings[index],
                            internalCategoryId: parseInt(value)
                          };
                          setCategoryMappings(newMappings);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories && categories.map(category => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCategoryMappingDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveCategoryMappings}
              disabled={saveCategoryMappingsMutation.isPending}
            >
              {saveCategoryMappingsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Mappings'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
