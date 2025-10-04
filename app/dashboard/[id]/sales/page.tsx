"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  LineChart,
  Line,
} from "recharts"
import {
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Loader2,
  Users,
  Calendar,
  CreditCard,
  Target,
  Award,
  Clock,
  AlertCircle,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { formatCurrency } from "@/lib/utils"

interface SalesDashboardData {
  metrics: {
    totalSales: number
    totalRevenue: number
    avgOrderValue: number
    totalCustomers: number
    todaySales: number
    monthlyGrowth: number
    weeklyGrowth: number
    conversionRate: number
  }
  recentSales: Array<{
    id: string
    invoiceNo: string
    customerName: string
    grandTotal: number
    createdAt: string
    status: string
    itemsCount: number
    paymentMethod: string
  }>
  topCustomers: Array<{
    customerId: string
    name: string
    totalPurchases: number
    totalValue: number
  }>
  salesByMonth: Array<{
    month: string
    sales: number
    revenue: number
  }>
  salesByStatus: Array<{
    status: string
    count: number
    color: string
  }>
  dailySales: Array<{
    date: string
    sales: number
    revenue: number
  }>
  topProducts: Array<{
    productId: string
    name: string
    quantitySold: number
    revenue: number
  }>
  paymentMethods: Array<{
    method: string
    count: number
    value: number
    color: string
  }>
  hourlyAnalysis: Array<{
    hour: string
    sales: number
    revenue: number
  }>
}

export default function SalesDashboard() {
  const [data, setData] = useState<SalesDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const { data: session } = useSession()
  const dashboardId = params.id as string

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Mock data for comprehensive sales dashboard
        const mockData: SalesDashboardData = {
          metrics: {
            totalSales: 2847,
            totalRevenue: 284750.95,
            avgOrderValue: 100.09,
            totalCustomers: 456,
            todaySales: 28,
            monthlyGrowth: 15.8,
            weeklyGrowth: 8.2,
            conversionRate: 68.5
          },
          recentSales: [
            {
              id: "1",
              invoiceNo: "INV-2024-001",
              customerName: "John Smith",
              grandTotal: 450.00,
              createdAt: new Date().toISOString(),
              status: "Completed",
              itemsCount: 3,
              paymentMethod: "Credit Card"
            },
            {
              id: "2",
              invoiceNo: "INV-2024-002",
              customerName: "Sarah Johnson",
              grandTotal: 285.50,
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              status: "Completed",
              itemsCount: 2,
              paymentMethod: "Cash"
            },
            {
              id: "3",
              invoiceNo: "INV-2024-003",
              customerName: "Mike Davis",
              grandTotal: 720.75,
              createdAt: new Date(Date.now() - 7200000).toISOString(),
              status: "Pending",
              itemsCount: 5,
              paymentMethod: "Bank Transfer"
            },
            {
              id: "4",
              invoiceNo: "INV-2024-004",
              customerName: "Emily Wilson",
              grandTotal: 195.25,
              createdAt: new Date(Date.now() - 10800000).toISOString(),
              status: "Completed",
              itemsCount: 1,
              paymentMethod: "Digital Wallet"
            }
          ],
          topCustomers: [
            { customerId: "1", name: "Corporate Solutions Inc", totalPurchases: 45, totalValue: 18500 },
            { customerId: "2", name: "Healthcare Partners", totalPurchases: 38, totalValue: 15200 },
            { customerId: "3", name: "Tech Innovations Ltd", totalPurchases: 32, totalValue: 12800 },
            { customerId: "4", name: "Retail Chain Co", totalPurchases: 29, totalValue: 11600 },
            { customerId: "5", name: "Educational Institute", totalPurchases: 25, totalValue: 9800 }
          ],
          salesByMonth: [
            { month: "Jan", sales: 245, revenue: 24500 },
            { month: "Feb", sales: 268, revenue: 26800 },
            { month: "Mar", sales: 289, revenue: 28900 },
            { month: "Apr", sales: 312, revenue: 31200 },
            { month: "May", sales: 345, revenue: 34500 },
            { month: "Jun", sales: 378, revenue: 37800 }
          ],
          salesByStatus: [
            { status: "Completed", count: 2456, color: "#00C49F" },
            { status: "Pending", count: 234, color: "#FFBB28" },
            { status: "Processing", count: 89, color: "#0088FE" },
            { status: "Cancelled", count: 45, color: "#FF8042" },
            { status: "Refunded", count: 23, color: "#8884D8" }
          ],
          dailySales: [
            { date: "Mon", sales: 45, revenue: 4500 },
            { date: "Tue", sales: 52, revenue: 5200 },
            { date: "Wed", sales: 38, revenue: 3800 },
            { date: "Thu", sales: 61, revenue: 6100 },
            { date: "Fri", sales: 78, revenue: 7800 },
            { date: "Sat", sales: 34, revenue: 3400 },
            { date: "Sun", sales: 28, revenue: 2800 }
          ],
          topProducts: [
            { productId: "1", name: "Premium Service Package", quantitySold: 156, revenue: 15600 },
            { productId: "2", name: "Standard Consultation", quantitySold: 234, revenue: 11700 },
            { productId: "3", name: "Advanced Analytics Tool", quantitySold: 89, revenue: 8900 },
            { productId: "4", name: "Basic Support Plan", quantitySold: 345, revenue: 6900 },
            { productId: "5", name: "Custom Solution", quantitySold: 67, revenue: 6700 }
          ],
          paymentMethods: [
            { method: "Credit Card", count: 1245, value: 124500, color: "#00C49F" },
            { method: "Cash", count: 678, value: 67800, color: "#FFBB28" },
            { method: "Bank Transfer", count: 456, value: 45600, color: "#0088FE" },
            { method: "Digital Wallet", count: 234, value: 23400, color: "#FF8042" },
            { method: "Check", count: 123, value: 12300, color: "#8884D8" }
          ],
          hourlyAnalysis: [
            { hour: "9 AM", sales: 12, revenue: 1200 },
            { hour: "10 AM", sales: 18, revenue: 1800 },
            { hour: "11 AM", sales: 25, revenue: 2500 },
            { hour: "12 PM", sales: 32, revenue: 3200 },
            { hour: "1 PM", sales: 28, revenue: 2800 },
            { hour: "2 PM", sales: 35, revenue: 3500 },
            { hour: "3 PM", sales: 42, revenue: 4200 },
            { hour: "4 PM", sales: 38, revenue: 3800 },
            { hour: "5 PM", sales: 29, revenue: 2900 }
          ]
        }
        
        setData(mockData)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [dashboardId, session])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading sales dashboard...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertCircle className="h-8 w-8 text-yellow-500" />
        <span className="ml-2">Failed to load dashboard data</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Sales Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive sales analytics, customer insights, and performance metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              {data.metrics.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.metrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(data.metrics.avgOrderValue)} per order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {data.metrics.conversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.todaySales}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              {data.metrics.weeklyGrowth}% vs last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Sales Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales Performance</CardTitle>
            <CardDescription>Monthly sales volume and revenue trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={data.salesByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(Number(value)) : value,
                    name === 'revenue' ? 'Revenue' : 'Sales Count'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stackId="2" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Sales distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={data.salesByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.salesByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Activity and Payment Methods */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Weekly Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Performance</CardTitle>
            <CardDescription>Daily sales activity this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(Number(value)) : value,
                    name === 'revenue' ? 'Revenue' : 'Sales Count'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Sales"
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Revenue breakdown by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.paymentMethods}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="method" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Hourly Sales Analysis</CardTitle>
          <CardDescription>Sales performance throughout the day</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.hourlyAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(Number(value)) : value,
                  name === 'revenue' ? 'Revenue' : 'Sales Count'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </div>

      {/* Top Performers and Recent Sales */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
            <CardDescription>Customers by purchase volume and value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topCustomers.map((customer, index) => (
                <div key={customer.customerId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.totalPurchases} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(customer.totalValue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Best Selling Products</CardTitle>
            <CardDescription>Products by sales volume and revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topProducts.map((product, index) => (
                <div key={product.productId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.quantitySold} sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>Latest sales transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{sale.invoiceNo}</p>
                  <p className="text-xs text-muted-foreground">{sale.customerName}</p>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={
                        sale.status === "Completed" ? "default" : 
                        sale.status === "Pending" ? "secondary" : "destructive"
                      }
                      className={
                        sale.status === "Completed" ? "bg-green-600" : ""
                      }
                    >
                      {sale.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {sale.itemsCount} item{sale.itemsCount !== 1 ? 's' : ''}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {sale.paymentMethod}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(sale.grandTotal)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(sale.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}