import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Package, Plus, Search, TrendingUp } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

export default function ProductsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedList, setSelectedList] = useState("");

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: recommendations } = useQuery<any>({
    queryKey: ["/api/recommendations"],
  });

  const { data: lists } = useQuery<any[]>({
    queryKey: ["/api/lists"],
  });

  const addToListMutation = useMutation({
    mutationFn: async ({ listId, productId }: { listId: string; productId: string }) => {
      return await apiRequest("POST", `/api/lists/${listId}/items/from-product`, { productId });
    },
    onSuccess: () => {
      toast({
        title: "Added to list",
        description: "Product has been added to your shopping list",
      });
      setSelectedList("");
    },
  });

  const filteredProducts = products?.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products?.map((p) => p.category).filter(Boolean))) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2" data-testid="text-products-title">
            Product Catalog
          </h1>
          <p className="text-muted-foreground">
            Browse our selection and add items to your shopping lists
          </p>
        </div>

        {recommendations && recommendations.products && recommendations.products.length > 0 && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                AI Recommendations For You
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {recommendations.products.slice(0, 4).map((rec: any) => (
                  <div
                    key={rec.productId}
                    className="p-4 rounded-lg border bg-card hover-elevate"
                    data-testid={`card-recommendation-${rec.productId}`}
                  >
                    <div className="font-semibold mb-1">{rec.productName}</div>
                    <p className="text-xs text-muted-foreground mb-2">{rec.reason}</p>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(rec.confidence * 100)}% match
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-products"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-category-filter">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat as string}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : filteredProducts && filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className="flex flex-col hover-elevate transition-all"
                data-testid={`card-product-${product.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-tight" data-testid={`text-product-name-${product.id}`}>
                      {product.name}
                    </CardTitle>
                    <Package className="h-5 w-5 text-primary flex-shrink-0" />
                  </div>
                  {product.category && (
                    <Badge variant="secondary" className="w-fit mt-2">
                      {product.category}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold" data-testid={`text-product-price-${product.id}`}>
                      ${product.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={product.stock > product.stockAlertThreshold ? "default" : "destructive"}
                      data-testid={`badge-product-stock-${product.id}`}
                    >
                      {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full" 
                        disabled={product.stock === 0}
                        data-testid={`button-add-to-list-${product.id}`}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add to List
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add {product.name} to a list</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <Select value={selectedList} onValueChange={setSelectedList}>
                          <SelectTrigger data-testid="select-target-list">
                            <SelectValue placeholder="Select a list" />
                          </SelectTrigger>
                          <SelectContent>
                            {lists?.map((list) => (
                              <SelectItem key={list.id} value={list.id}>
                                {list.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => {
                            if (selectedList) {
                              addToListMutation.mutate({ listId: selectedList, productId: product.id });
                            }
                          }}
                          disabled={!selectedList || addToListMutation.isPending}
                          className="w-full"
                          data-testid="button-confirm-add-to-list"
                        >
                          {addToListMutation.isPending ? "Adding..." : "Add to List"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">
                {searchQuery || categoryFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Products will appear here"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
