import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { apiRequest } from "@/lib/queryClient";

// Custom colors for charts
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f', '#ffbb28', '#ff8042', '#a4de6c', '#d0ed57'
];

// Interface for chart data
interface TopOrder {
  id: number;
  total: number;
  date: string;
  username: string;
}

interface MonthlySale {
  month: string;
  revenue: number;
  orderCount: number;
}

interface CategorySale {
  category: string;
  revenue: number;
  unitsSold: number;
}

interface TopBuyer {
  username: string;
  userId: number;
  orderCount: number;
  totalSpent: number;
}

interface TopProduct {
  productId: number;
  productName: string;
  unitsSold: number;
  revenue: number;
}

interface ExpensiveProduct {
  productId: number;
  productName: string;
  price: number;
  unitsSold: number;
}

interface ViewedProduct {
  productId: number;
  productName: string;
  rating: number;
  orderFrequency: number;
  estimatedViews: number;
}

const DashboardCharts = () => {
  const [activeTab, setActiveTab] = useState("orders");
  
  const [topOrders, setTopOrders] = useState<TopOrder[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySale[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySale[]>([]);
  const [topBuyers, setTopBuyers] = useState<TopBuyer[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [expensiveProducts, setExpensiveProducts] = useState<ExpensiveProduct[]>([]);
  const [viewedProducts, setViewedProducts] = useState<ViewedProduct[]>([]);
  
  const [loading, setLoading] = useState({
    orders: true,
    monthly: true,
    category: true,
    buyers: true,
    products: true,
    expensive: true,
    viewed: true
  });

  // Function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Load data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load top orders data
        if (activeTab === "orders" && topOrders.length === 0) {
          setLoading(prev => ({ ...prev, orders: true }));
          const response = await apiRequest('GET', '/api/admin/charts/top-orders');
          const data = await response.json();
          setTopOrders(data);
          setLoading(prev => ({ ...prev, orders: false }));
        }
        
        // Load monthly sales data
        if (activeTab === "monthly" && monthlySales.length === 0) {
          setLoading(prev => ({ ...prev, monthly: true }));
          const response = await apiRequest('GET', '/api/admin/charts/sales-by-month');
          const data = await response.json();
          setMonthlySales(data);
          setLoading(prev => ({ ...prev, monthly: false }));
        }
        
        // Load category sales data
        if (activeTab === "category" && categorySales.length === 0) {
          setLoading(prev => ({ ...prev, category: true }));
          const response = await apiRequest('GET', '/api/admin/charts/sales-by-category');
          const data = await response.json();
          setCategorySales(data);
          setLoading(prev => ({ ...prev, category: false }));
        }
        
        // Load top buyers data
        if (activeTab === "buyers" && topBuyers.length === 0) {
          setLoading(prev => ({ ...prev, buyers: true }));
          const response = await apiRequest('GET', '/api/admin/charts/top-buyers');
          const data = await response.json();
          setTopBuyers(data);
          setLoading(prev => ({ ...prev, buyers: false }));
        }
        
        // Load top products data
        if (activeTab === "products" && topProducts.length === 0) {
          setLoading(prev => ({ ...prev, products: true }));
          const response = await apiRequest('GET', '/api/admin/charts/top-products');
          const data = await response.json();
          setTopProducts(data);
          setLoading(prev => ({ ...prev, products: false }));
        }
        
        // Load expensive products data
        if (activeTab === "expensive" && expensiveProducts.length === 0) {
          setLoading(prev => ({ ...prev, expensive: true }));
          const response = await apiRequest('GET', '/api/admin/charts/expensive-products');
          const data = await response.json();
          setExpensiveProducts(data);
          setLoading(prev => ({ ...prev, expensive: false }));
        }
        
        // Load viewed products data
        if (activeTab === "viewed" && viewedProducts.length === 0) {
          setLoading(prev => ({ ...prev, viewed: true }));
          const response = await apiRequest('GET', '/api/admin/charts/most-viewed');
          const data = await response.json();
          setViewedProducts(data);
          setLoading(prev => ({ ...prev, viewed: false }));
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    };

    fetchData();
  }, [activeTab, topOrders.length, monthlySales.length, categorySales.length, 
      topBuyers.length, topProducts.length, expensiveProducts.length, viewedProducts.length]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tableaux de bord analytiques</CardTitle>
        <CardDescription>Visualisez les performances de votre boutique en temps réel</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 md:grid-cols-7 mb-8">
            <TabsTrigger value="orders">Top Commandes</TabsTrigger>
            <TabsTrigger value="monthly">Ventes Mensuelles</TabsTrigger>
            <TabsTrigger value="category">Ventes par Catégorie</TabsTrigger>
            <TabsTrigger value="buyers">Top Acheteurs</TabsTrigger>
            <TabsTrigger value="products">Top Produits</TabsTrigger>
            <TabsTrigger value="expensive">Produits Coûteux</TabsTrigger>
            <TabsTrigger value="viewed">Produits Populaires</TabsTrigger>
          </TabsList>
          
          {/* Top Orders Chart */}
          <TabsContent value="orders" className="pt-4">
            <h3 className="text-lg font-medium mb-4">Top 10 commandes par montant</h3>
            {loading.orders ? (
              <div className="flex justify-center items-center h-80">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={topOrders}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="id" 
                    label={{ value: 'Commande #', position: 'insideBottom', offset: -10 }}
                    tickFormatter={(value) => `#${value}`}
                  />
                  <YAxis label={{ value: 'Montant ($)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(value) => `Commande #${value} - ${topOrders.find(o => o.id === value)?.username}`}
                  />
                  <Legend />
                  <Bar dataKey="total" name="Montant" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </TabsContent>
          
          {/* Monthly Sales Chart */}
          <TabsContent value="monthly" className="pt-4">
            <h3 className="text-lg font-medium mb-4">Ventes mensuelles des 12 derniers mois</h3>
            {loading.monthly ? (
              <div className="flex justify-center items-center h-80">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart
                  data={monthlySales}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" orientation="left" label={{ value: 'Revenus ($)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Nombre de commandes', angle: 90, position: 'insideRight' }} />
                  <Tooltip formatter={(value: number, name: string) => {
                    if (name === "revenue") return formatCurrency(value);
                    return value;
                  }} />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenus" fill="#8884d8" stroke="#8884d8" />
                  <Area yAxisId="right" type="monotone" dataKey="orderCount" name="Commandes" fill="#82ca9d" stroke="#82ca9d" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </TabsContent>
          
          {/* Category Sales Chart */}
          <TabsContent value="category" className="pt-4">
            <h3 className="text-lg font-medium mb-4">Ventes par catégorie</h3>
            {loading.category ? (
              <div className="flex justify-center items-center h-80">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={categorySales}
                    dataKey="revenue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    fill="#8884d8"
                    label={(entry) => `${entry.category}: ${formatCurrency(entry.revenue)}`}
                  >
                    {categorySales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </TabsContent>
          
          {/* Top Buyers Chart */}
          <TabsContent value="buyers" className="pt-4">
            <h3 className="text-lg font-medium mb-4">Top 10 acheteurs</h3>
            {loading.buyers ? (
              <div className="flex justify-center items-center h-80">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={topBuyers}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" label={{ value: 'Dépenses ($)', position: 'insideBottom', offset: -10 }} />
                  <YAxis type="category" dataKey="username" width={100} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(value) => `Utilisateur: ${value}`}
                  />
                  <Legend />
                  <Bar dataKey="totalSpent" name="Dépenses totales" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </TabsContent>
          
          {/* Top Products Chart */}
          <TabsContent value="products" className="pt-4">
            <h3 className="text-lg font-medium mb-4">Top 10 produits par ventes</h3>
            {loading.products ? (
              <div className="flex justify-center items-center h-80">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={topProducts}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="productName"
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    height={100}
                  />
                  <YAxis label={{ value: 'Unités vendues', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === "revenue") return formatCurrency(value);
                      return value;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="unitsSold" name="Unités vendues" fill="#8884d8" />
                  <Bar dataKey="revenue" name="Revenus" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </TabsContent>
          
          {/* Expensive Products Chart */}
          <TabsContent value="expensive" className="pt-4">
            <h3 className="text-lg font-medium mb-4">10 produits les plus chers</h3>
            {loading.expensive ? (
              <div className="flex justify-center items-center h-80">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={expensiveProducts}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="productName"
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    height={100}
                  />
                  <YAxis yAxisId="left" orientation="left" label={{ value: 'Prix ($)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Unités vendues', angle: 90, position: 'insideRight' }} />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === "price") return formatCurrency(value);
                      return value;
                    }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="price" name="Prix" stroke="#8884d8" />
                  <Line yAxisId="right" type="monotone" dataKey="unitsSold" name="Unités vendues" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </TabsContent>
          
          {/* Most Viewed Products Chart */}
          <TabsContent value="viewed" className="pt-4">
            <h3 className="text-lg font-medium mb-4">Produits les plus populaires (estimation)</h3>
            {loading.viewed ? (
              <div className="flex justify-center items-center h-80">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={viewedProducts}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="productName"
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    height={100}
                  />
                  <YAxis label={{ value: 'Vues estimées', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="estimatedViews" name="Vues estimées" fill="#ffc658" />
                  <Bar dataKey="rating" name="Note" fill="#ff8042" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DashboardCharts;