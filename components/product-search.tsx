"use client"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, ChevronLeft, ChevronRight, Package } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Product {
  id: string;
  name: string;
  barcode: string;
  quantity: number;
  unit: string;
  cost: number;
  wholeSalePrice: number;
  retailPrice: number;
  stockStatus?: {
    status: string;
    color: string;
    bg: string;
    level: string;
  };
}

interface ProductSearchProps {
  products: Product[];
  onProductSelect?: (product: Product) => void;
  showActions?: boolean;
  itemsPerPage?: number;
  className?: string;
}

export function ProductSearch({ 
  products, 
  onProductSelect, 
  showActions = false, 
  itemsPerPage = 20,
  className = ""
}: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [stockFilter, setStockFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1) // Reset to first page on search
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      // Search filter
      const matchesSearch = !debouncedSearch || 
        product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        product.barcode.toLowerCase().includes(debouncedSearch.toLowerCase())

      // Stock filter
      const matchesStock = stockFilter === "all" || 
        (stockFilter === "low" && product.quantity <= 10 && product.quantity > 0) ||
        (stockFilter === "out" && product.quantity === 0) ||
        (stockFilter === "good" && product.quantity > 10)

      return matchesSearch && matchesStock
    })

    // Sort products
    filtered.sort((a: any, b: any) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [products, debouncedSearch, stockFilter, sortBy, sortOrder])

  // Paginate products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredProducts, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return {
        status: 'Out of Stock',
        color: 'text-red-600',
        bg: 'bg-red-100',
        level: 'critical'
      };
    } else if (quantity <= 10) {
      return {
        status: 'Low Stock',
        color: 'text-yellow-600',
        bg: 'bg-yellow-100',
        level: 'warning'
      };
    } else {
      return {
        status: 'In Stock',
        color: 'text-green-600',
        bg: 'bg-green-100',
        level: 'good'
      };
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products by name or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={stockFilter} onValueChange={(value) => {
            setStockFilter(value)
            setCurrentPage(1)
          }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Stock Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="good">In Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>

          <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
            const [field, order] = value.split('-')
            setSortBy(field)
            setSortOrder(order)
          }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
              <SelectItem value="quantity-asc">Stock Low-High</SelectItem>
              <SelectItem value="quantity-desc">Stock High-Low</SelectItem>
              <SelectItem value="retailPrice-asc">Price Low-High</SelectItem>
              <SelectItem value="retailPrice-desc">Price High-Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
          {debouncedSearch && ` for "${debouncedSearch}"`}
        </span>
        {totalPages > 1 && (
          <span>
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      {/* Products Table */}
      {filteredProducts.length > 0 ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Stock Status</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Retail Price</TableHead>
                {showActions && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map((product) => {
                const stockStatus = product.stockStatus || getStockStatus(product.quantity)
                return (
                  <TableRow 
                    key={product.id}
                    className={onProductSelect ? "cursor-pointer hover:bg-muted/50" : ""}
                    onClick={() => onProductSelect?.(product)}
                  >
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="font-mono text-sm">{product.barcode}</TableCell>
                    <TableCell>
                      <Badge className={`${stockStatus.bg} ${stockStatus.color}`}>
                        {stockStatus.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={product.quantity <= 10 ? "text-red-500 font-medium" : "text-green-500"}>
                        {product.quantity}
                      </span>
                    </TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell>{formatCurrency(product.retailPrice)}</TableCell>
                    {showActions && (
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onProductSelect?.(product)
                          }}
                        >
                          Select
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No Products Found</h3>
          <p className="text-muted-foreground">
            {debouncedSearch || stockFilter !== 'all' 
              ? "No products match your current filters. Try adjusting your search or filter criteria."
              : "No products available."
            }
          </p>
          {(debouncedSearch || stockFilter !== 'all') && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchTerm("")
                setStockFilter("all")
                setCurrentPage(1)
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
}