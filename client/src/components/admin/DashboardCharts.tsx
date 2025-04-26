import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

// Reusable chart card component
const ChartCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <Card className="mb-8">
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);

// Loading component
const ChartLoading = () => (
  <div className="flex justify-center items-center h-80">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const DashboardCharts = () => {
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

  // Load all data at once
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load top orders data
        try {
          setLoading(prev => ({ ...prev, orders: true }));
          const response = await apiRequest('GET', '/api/admin/charts/top-orders');
          const data = await response.json();
          setTopOrders(data);
          setLoading(prev => ({ ...prev, orders: false }));
        } catch (error) {
          console.error("Error fetching top orders:", error);
          setLoading(prev => ({ ...prev, orders: false }));
        }
        
        // Load monthly sales data
        try {
          setLoading(prev => ({ ...prev, monthly: true }));
          const response = await apiRequest('GET', '/api/admin/charts/sales-by-month');
          const data = await response.json();
          setMonthlySales(data);
          setLoading(prev => ({ ...prev, monthly: false }));
        } catch (error) {
          console.error("Error fetching monthly sales:", error);
          setLoading(prev => ({ ...prev, monthly: false }));
        }
        
        // Load category sales data
        try {
          setLoading(prev => ({ ...prev, category: true }));
          const response = await apiRequest('GET', '/api/admin/charts/sales-by-category');
          const data = await response.json();
          setCategorySales(data);
          setLoading(prev => ({ ...prev, category: false }));
        } catch (error) {
          console.error("Error fetching category sales:", error);
          setLoading(prev => ({ ...prev, category: false }));
        }
        
        // Load top buyers data
        try {
          setLoading(prev => ({ ...prev, buyers: true }));
          const response = await apiRequest('GET', '/api/admin/charts/top-buyers');
          const data = await response.json();
          setTopBuyers(data);
          setLoading(prev => ({ ...prev, buyers: false }));
        } catch (error) {
          console.error("Error fetching top buyers:", error);
          setLoading(prev => ({ ...prev, buyers: false }));
        }
        
        // Load top products data
        try {
          setLoading(prev => ({ ...prev, products: true }));
          const response = await apiRequest('GET', '/api/admin/charts/top-products');
          const data = await response.json();
          setTopProducts(data);
          setLoading(prev => ({ ...prev, products: false }));
        } catch (error) {
          console.error("Error fetching top products:", error);
          setLoading(prev => ({ ...prev, products: false }));
        }
        
        // Load expensive products data
        try {
          setLoading(prev => ({ ...prev, expensive: true }));
          const response = await apiRequest('GET', '/api/admin/charts/expensive-products');
          const data = await response.json();
          setExpensiveProducts(data);
          setLoading(prev => ({ ...prev, expensive: false }));
        } catch (error) {
          console.error("Error fetching expensive products:", error);
          setLoading(prev => ({ ...prev, expensive: false }));
        }
        
        // Load viewed products data
        try {
          setLoading(prev => ({ ...prev, viewed: true }));
          const response = await apiRequest('GET', '/api/admin/charts/most-viewed');
          const data = await response.json();
          setViewedProducts(data);
          setLoading(prev => ({ ...prev, viewed: false }));
        } catch (error) {
          console.error("Error fetching viewed products:", error);
          setLoading(prev => ({ ...prev, viewed: false }));
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Tableaux de bord analytiques</h2>
        <p className="text-muted-foreground">Visualisez les performances de votre boutique en temps réel</p>
      </div>
      
      {/* Top Orders Chart */}
      <ChartCard title="Top 10 commandes par montant">
        {loading.orders ? (
          <ChartLoading />
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={topOrders}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number"
                label={{ value: 'Montant ($)', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                type="category"
                dataKey="id" 
                tickFormatter={(value) => `#${value} - ${topOrders.find(o => o.id === value)?.username}`}
                width={150}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(value) => `Commande #${value} - ${topOrders.find(o => o.id === value)?.username}`}
              />
              <Legend />
              <Bar dataKey="total" name="Montant" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
      
      {/* Monthly Sales Chart */}
      <ChartCard title="Ventes mensuelles des 12 derniers mois">
        {loading.monthly ? (
          <ChartLoading />
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
      </ChartCard>
      
      {/* Category Sales Chart */}
      <ChartCard title="Ventes par catégorie">
        {loading.category ? (
          <ChartLoading />
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
      </ChartCard>
      
      {/* Top Buyers Chart */}
      <ChartCard title="Top 10 acheteurs">
        {loading.buyers ? (
          <ChartLoading />
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
      </ChartCard>
      
      {/* Top Products Chart */}
      <ChartCard title="Top 10 produits par ventes">
        {loading.products ? (
          <ChartLoading />
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={topProducts}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                type="category"
                dataKey="productName"
                width={150}
              />
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
      </ChartCard>
      
      {/* Expensive Products Chart */}
      <ChartCard title="10 produits les plus chers">
        {loading.expensive ? (
          <ChartLoading />
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
      </ChartCard>
      
      {/* Most Viewed Products Chart */}
      <ChartCard title="Produits les plus populaires (estimation)">
        {loading.viewed ? (
          <ChartLoading />
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
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
              <YAxis yAxisId="left" orientation="left" label={{ value: 'Vues estimées', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Note', angle: 90, position: 'insideRight' }} domain={[0, 5]} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="estimatedViews" name="Vues estimées" stroke="#ffc658" strokeWidth={2} dot={{ r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="rating" name="Note" stroke="#ff8042" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
};

export default DashboardCharts;