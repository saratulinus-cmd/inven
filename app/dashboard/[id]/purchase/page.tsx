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
  Truck,
  DollarSign,
  AlertTriangle,
  Loader2,
  Package,
  Calendar,
  Building2,
  TrendingDown,
  TrendingUp,
  ShoppingCart,
  Users,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { formatCurrency } from "@/lib/utils"

interface PurchaseDashboardData {
  metrics: {
    totalPurchases: number
    totalPurchaseValue: number
    avgPurchaseValue: number
    totalSuppliers: number
    pendingOrders: number
    todayPurchases: number
    monthlyGrowth: number
    weeklyGrowth: number
  }
  recentPurchases: Array<{
    id: string
    orderNo: string
    supplierName: string
    grandTotal: number
    createdAt: string
    status: string
    itemsCount: number
  }>
  topSuppliers: Array<{
    supplierId: string
    name: string
    purchases: number
    totalValue: number
  }>
  purchasesByMonth: Array<{
    month: string
    purchases: number
    value: number
  }>
  purchasesByStatus: Array<{
    status: string
    count: number
    color: string
  }>
  dailyPurchases: Array<{
    date: string
    purchases: number
    value: number
  }>
  lowStockAlerts: Array<{
    productId: string
    name: string
    currentStock: number
    minStock: number
  }>
  categoryBreakdown: Array<{
    category: string
    value: number
    count: number
  }>
}

export default function PurchaseDashboard() {
  const [data, setData] = useState<PurchaseDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const { data: session } = useSession()
  const dashboardId = params.id as string

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Mock data for comprehensive purchase dashboard
        const mockData: PurchaseDashboardData = {
          metrics: {
            totalPurchases: 1245,
            totalPurchaseValue: 156750.85,
            avgPurchaseValue: 125.94,
            totalSuppliers: 67,
            pendingOrders: 18,
            todayPurchases: 12,
            monthlyGrowth: 8.5,
            weeklyGrowth: 12.3
          },
          recentPurchases: [
            {
              id: "1",
              orderNo: "PO-2024-001",
              supplierName: "Global Medical Supplies",
              grandTotal: 2850.00,
              createdAt: new Date().toISOString(),
              status: "Completed",
              itemsCount: 8
            },
            {
              id: "2", 
              orderNo: "PO-2024-002",
              supplierName: "TechCorp Solutions",
              grandTotal: 1690.50,
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              status: "Pending",
              itemsCount: 5
            },
            {
              id: "3",
              orderNo: "PO-2024-003", 
              supplierName: "Industrial Parts Ltd",
              grandTotal: 3200.75,
              createdAt: new Date(Date.now() - 172800000).toISOString(),
              status: "Processing",
              itemsCount: 12
            },
            {
              id: "4",
              orderNo: "PO-2024-004",
              supplierName: "Office Essentials Co",
              grandTotal: 890.25,
              createdAt: new Date(Date.now() - 259200000).toISOString(),
              status: "Completed",
              itemsCount: 6
            }
          ],
          topSuppliers: [
            { supplierId: "1", name: "Global Medical Supplies", purchases: 45, totalValue: 28500 },
            { supplierId: "2", name: "TechCorp Solutions", purchases: 32, totalValue: 22800 },
            { supplierId: "3", name: "Industrial Parts Ltd", purchases: 28, totalValue: 19600 },
            { supplierId: "4", name: "Office Essentials Co", purchases: 25, totalValue: 15200 },
            { supplierId: "5", name: "Healthcare Depot", purchases: 22, totalValue: 13800 }
          ],
          purchasesByMonth: [
            { month: "Jan", purchases: 145, value: 28000 },
            { month: "Feb", purchases: 132, value: 25500 },
            { month: "Mar", purchases: 158, value: 31200 },
            { month: "Apr", purchases: 167, value: 33800 },
            { month: "May", purchases: 189, value: 38200 },
            { month: "Jun", purchases: 201, value: 42100 }
          ],
          purchasesByStatus: [
            { status: "Completed", count: 892, color: "#00C49F" },
            { status: "Pending", count: 156, color: "#FFBB28" },
            { status: "Processing", count: 89, color: "#0088FE" },
            { status: "Cancelled", count: 45, color: "#FF8042" },
            { status: "Returned", count: 23, color: "#8884D8" }
          ],
          dailyPurchases: [
            { date: "Mon", purchases: 15, value: 3200 },
            { date: "Tue", purchases: 22, value: 4800 },
            { date: "Wed", purchases: 18, value: 3900 },
            { date: "Thu", purchases: 28, value: 6200 },
            { date: "Fri", purchases: 35, value: 7800 },
            { date: "Sat", purchases: 12, value: 2600 },
            { date: "Sun", purchases: 8, value: 1800 }
          ],
          lowStockAlerts: [
            { productId: "1", name: "Medical Gloves (Box)", currentStock: 15, minStock: 50 },
            { productId: "2", name: "Printer Paper A4", currentStock: 8, minStock: 25 },
            { productId: "3", name: "Surgical Masks", currentStock: 22, minStock: 100 },
            { productId: "4", name: "Hand Sanitizer 500ml", currentStock: 5, minStock: 30 }
          ],
          categoryBreakdown: [
            { category: "Medical Supplies", value: 45200, count: 234 },
            { category: "Office Supplies", value: 28900, count: 156 },
            { category: "Technology", value: 32100, count: 89 },
            { category: "Industrial", value: 25800, count: 112 },
            { category: "Maintenance", value: 18600, count: 78 }
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
        <span className="ml-2">Loading purchase dashboard...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertTriangle className="h-8 w-8 text-yellow-500" />
        <span className="ml-2">Failed to load dashboard data</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Purchase Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive overview of purchase operations, supplier management, and inventory insights
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.totalPurchases.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              {data.metrics.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchase Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.metrics.totalPurchaseValue)}</div>
            <p className="text-xs text-muted-foreground">
              Average: {formatCurrency(data.metrics.avgPurchaseValue)} per order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              {data.metrics.pendingOrders} pending orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.todayPurchases}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              {data.metrics.weeklyGrowth}% vs last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {data.lowStockAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Critical Stock Alerts
            </CardTitle>
            <CardDescription>Products requiring immediate restocking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {data.lowStockAlerts.map((item) => (
                <div key={item.productId} className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-orange-50">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Stock: {item.currentStock} | Min: {item.minStock}
                    </p>
                  </div>
                  <Badge variant="destructive">Urgent</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Purchase Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Purchase Trends</CardTitle>
            <CardDescription>Monthly purchase volume and value analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={data.purchasesByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'value' ? formatCurrency(Number(value)) : value,
                    name === 'value' ? 'Purchase Value' : 'Orders Count'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="purchases" 
                  stackId="2" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Purchase Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Distribution by order status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={data.purchasesByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.purchasesByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Activity and Category Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Weekly Purchases */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>Daily purchase activity this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.dailyPurchases}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'value' ? formatCurrency(Number(value)) : value,
                    name === 'value' ? 'Purchase Value' : 'Orders Count'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="purchases" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Orders"
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Value"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Category Analysis</CardTitle>
            <CardDescription>Purchase breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.categoryBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Suppliers and Recent Purchases */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Suppliers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Suppliers</CardTitle>
            <CardDescription>Suppliers by purchase volume and value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topSuppliers.map((supplier, index) => (
                <div key={supplier.supplierId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{supplier.name}</p>
                      <p className="text-xs text-muted-foreground">{supplier.purchases} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(supplier.totalValue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Purchases */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Purchase Orders</CardTitle>
            <CardDescription>Latest purchase transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentPurchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{purchase.orderNo}</p>
                    <p className="text-xs text-muted-foreground">{purchase.supplierName}</p>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={
                          purchase.status === "Completed" ? "default" : 
                          purchase.status === "Pending" ? "secondary" : 
                          purchase.status === "Processing" ? "outline" : "destructive"
                        }
                        className={
                          purchase.status === "Completed" ? "bg-green-600" : ""
                        }
                      >
                        {purchase.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {purchase.itemsCount} item{purchase.itemsCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(purchase.grandTotal)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(purchase.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}