import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslations } from "@/hooks/use-translations";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";

// Type définitions
interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  title: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: number;
  userId: number;
  status: string;
  total: number;
  shipping: number;
  tax: number;
  createdAt: string;
  updatedAt: string;
  paymentIntentId: string | null;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  } | null;
  items: OrderItem[];
}

export default function UserOrdersPage() {
  const { user } = useAuth();
  const t = useTranslations();

  // Fetch user orders
  const { data: orders, isLoading, error } = useQuery<Order[]>({
    queryKey: ["/api/user/orders"],
    enabled: !!user,
  });

  // Helper to format dates
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // If user is not logged in, show message
  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>{t.account?.loginRequired}</CardTitle>
            <CardDescription>{t.account?.loginToViewOrders}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/auth" className="text-primary hover:underline">
              {t.login}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">{t.common.error}</CardTitle>
            <CardDescription>{t.orders.errorFetching}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{(error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>{t.orders.myOrders}</CardTitle>
            <CardDescription>{t.orders.viewHistory}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">{t.orders.noOrders}</p>
            <Link to="/products" className="text-primary hover:underline">
              {t.products.browseProducts}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{t.orders.myOrders}</h1>
      <p className="text-muted-foreground mb-8">{t.orders.viewHistory}</p>

      <div className="space-y-8">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <CardTitle className="text-xl">
                    {t.orders.order} #{order.id}
                  </CardTitle>
                  <CardDescription>
                    {formatDate(order.createdAt)}
                  </CardDescription>
                </div>
                <div className="flex flex-col md:items-end gap-2">
                  <Badge className={getStatusColor(order.status)} variant="outline">
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                  <span className="font-semibold">${order.total.toFixed(2)}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.cart.product}</TableHead>
                    <TableHead className="text-center">{t.cart.quantity}</TableHead>
                    <TableHead className="text-right">{t.cart.price}</TableHead>
                    <TableHead className="text-right">{t.cart.subtotal}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.title}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${item.subtotal.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-6 bg-muted/30">
                <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:justify-between">
                  <div>
                    <p className="font-medium">{t.orders.paymentInfo}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.paymentIntentId ? 
                        `${t.orders.paymentId}: ${order.paymentIntentId.substring(0, 10)}...` : 
                        t.orders.noPaymentInfo
                      }
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between gap-8">
                      <span className="text-muted-foreground">{t.checkout.subtotal}:</span>
                      <span>${(order.total - order.tax - order.shipping).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="text-muted-foreground">{t.checkout.shipping}:</span>
                      <span>${order.shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="text-muted-foreground">{t.checkout.tax}:</span>
                      <span>${order.tax.toFixed(2)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between gap-8 font-bold">
                      <span>{t.checkout.total}:</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}