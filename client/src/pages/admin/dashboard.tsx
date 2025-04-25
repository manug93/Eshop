import { useState } from "react";
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
import { AlertCircle, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

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

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

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

  // Fetching products
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/products?limit=100');
        return await response.json();
      } catch (error) {
        console.error('Error fetching products:', error);
        return [];
      }
    }
  });

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

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest('DELETE', `/api/admin/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
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

  // Handle order status update
  const handleUpdateOrderStatus = (orderId: number, newStatus: string) => {
    updateOrderStatusMutation.mutate({ orderId, status: newStatus });
  };

  // Handle product deletion
  const handleDeleteProduct = (productId: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(productId);
    }
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
        <TabsList className="grid grid-cols-4 max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
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
                      <TableHead>Stripe Reference</TableHead>
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
                          <div className="flex space-x-2">
                            <select 
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              disabled={updateOrderStatusMutation.isPending}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
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
              <div className="mb-4">
                <Button className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">
                  Add New Product
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
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>#{product.id}</TableCell>
                        <TableCell>{product.title}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>${product.price.toFixed(2)}</TableCell>
                        <TableCell>{product.category || 'Uncategorized'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              className="text-blue-600 hover:text-blue-800 p-1 h-auto"
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              className="text-red-600 hover:text-red-800 p-1 h-auto"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deleteProductMutation.isPending}
                            >
                              Delete
                            </Button>
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
    </div>
  );
}