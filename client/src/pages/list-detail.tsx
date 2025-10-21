import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  AlertCircle, 
  ShoppingCart,
  Clock,
  CheckCircle2,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { List, ListItem } from "@shared/schema";

export default function ListDetail() {
  const [, params] = useRoute("/lists/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const listId = params?.id;

  const [nlpInput, setNlpInput] = useState("");
  const [manualItem, setManualItem] = useState({ name: "", quantity: 1, unit: "units" });

  const { data: list, isLoading: listLoading } = useQuery<List>({
    queryKey: ["/api/lists", listId],
    enabled: !!listId,
  });

  const { data: items, isLoading: itemsLoading } = useQuery<ListItem[]>({
    queryKey: ["/api/lists", listId, "items"],
    enabled: !!listId,
  });

  // ====== AI Quick Add Mutation ======
  const parseQuickAddMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", `/api/lists/${listId}/quick-add`, {
        inputText: text,
        threshold: 60,
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      const addedCount = data.items?.length || 0;
      
      // Only show notification if no items were added
      if (addedCount === 0) {
        toast({
          title: "No items added",
          description: "We couldn't find any matching products. Try being more specific or check your spelling.",
          variant: "destructive",
        });
      } else {
        // Optional: Show success message if you want
        // toast({
        //   title: "Items added!",
        //   description: `Added ${addedCount} item${addedCount > 1 ? 's' : ''} to your list`,
        // });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/lists", listId, "items"] });
      setNlpInput("");
    },
    onError: (error: any) => {
      toast({
        title: "Quick Add error",
        description: error?.message || "Could not parse your input. Try manual entry instead.",
        variant: "destructive",
      });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (item: any) => apiRequest("POST", `/api/lists/${listId}/items`, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists", listId, "items"] });
      setManualItem({ name: "", quantity: 1, unit: "units" });
    },
  });

  const updateItemStatusMutation = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: string }) =>
      apiRequest("PATCH", `/api/lists/${listId}/items/${itemId}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/lists", listId, "items"] }),
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => apiRequest("DELETE", `/api/lists/${listId}/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists", listId, "items"] });
    },
  });

  const handleQuickAdd = () => {
    if (nlpInput.trim()) parseQuickAddMutation.mutate(nlpInput);
  };

  const handleAddManualItem = () => {
    if (manualItem.name.trim()) addItemMutation.mutate(manualItem);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: "secondary", icon: Clock, label: "Pending" },
      urgent: { variant: "destructive", icon: AlertCircle, label: "Urgent" },
      purchased: { variant: "default", icon: Check, label: "Purchased" },
    };
    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        {config.icon && <config.icon className="h-3 w-3" />}
        {config.label}
      </Badge>
    );
  };

  const pendingItems = items?.filter((i) => i.status === "pending") || [];
  const urgentItems = items?.filter((i) => i.status === "urgent") || [];
  const purchasedItems = items?.filter((i) => i.status === "purchased") || [];
  const totalItems = items?.length || 0;

  if (listLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Skeleton className="h-10 w-64 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">List not found</h2>
          <Button onClick={() => navigate("/lists")}>Back to Lists</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Stats */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/lists")}
            className="mb-6 hover:bg-accent"
            data-testid="button-back-to-lists"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lists
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight" data-testid="text-list-title">
                {list.title}
              </h1>
              <p className="text-muted-foreground mt-2">
                Created {new Date(list.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-3 bg-muted/50 px-4 py-3 rounded-lg">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{totalItems}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-yellow-50 px-4 py-3 rounded-lg border border-yellow-200">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{pendingItems.length}</div>
                  <div className="text-sm text-yellow-700">Pending</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-red-50 px-4 py-3 rounded-lg border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{urgentItems.length}</div>
                  <div className="text-sm text-red-700">Urgent</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-green-50 px-4 py-3 rounded-lg border border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{purchasedItems.length}</div>
                  <div className="text-sm text-green-700">Purchased</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* AI Quick Add */}
          <Card className="lg:col-span-2 border-l-4 border-l-primary">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-xl">AI-Powered Quick Add</div>
                  <div className="text-sm font-normal text-muted-foreground">
                    Smart parsing with natural language
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Textarea
                  placeholder='Try: "2kg potatoes, 1L milk, chicken breast, breakfast items"'
                  value={nlpInput}
                  onChange={(e) => setNlpInput(e.target.value)}
                  rows={3}
                  className="resize-none border-2 focus:border-primary transition-colors"
                  data-testid="input-nlp-text"
                />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  <span>Supports categories like "meat", "vegetables", "breakfast"</span>
                </div>
              </div>
              <Button
                onClick={handleQuickAdd}
                disabled={parseQuickAddMutation.isPending || !nlpInput.trim()}
                className="w-full bg-primary hover:bg-primary/90 font-semibold transition-all hover:scale-[1.02]"
                data-testid="button-parse-nlp"
              >
                {parseQuickAddMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Processing...
                  </div>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Parse & Add Items
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Manual Entry */}
          <Card className="border-l-4 border-l-secondary">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Plus className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div className="text-xl">Manual Entry</div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Item name"
                value={manualItem.name}
                onChange={(e) => setManualItem({ ...manualItem, name: e.target.value })}
                className="border-2 focus:border-primary transition-colors"
                data-testid="input-manual-item-name"
                onKeyPress={(e) => e.key === 'Enter' && handleAddManualItem()}
              />
              <div className="flex gap-3">
                <Input
                  type="number"
                  placeholder="Qty"
                  min="1"
                  value={manualItem.quantity}
                  onChange={(e) => setManualItem({ ...manualItem, quantity: parseFloat(e.target.value) || 1 })}
                  className="w-20 border-2 focus:border-primary transition-colors"
                  data-testid="input-manual-item-quantity"
                />
                <Select
                  value={manualItem.unit}
                  onValueChange={(value) => setManualItem({ ...manualItem, unit: value })}
                >
                  <SelectTrigger className="border-2 focus:border-primary transition-colors" data-testid="select-manual-item-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="units">units</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="l">liters</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="pcs">pieces</SelectItem>
                    <SelectItem value="lbs">lbs</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAddManualItem}
                  disabled={addItemMutation.isPending || !manualItem.name.trim()}
                  className="flex-1 bg-secondary hover:bg-secondary/90 font-semibold"
                  data-testid="button-add-manual-item"
                >
                  {addItemMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Item Lists */}
        <div className="space-y-6">
          {/* Urgent Items */}
          {urgentItems.length > 0 && (
            <Card className="border-2 border-destructive/20 bg-destructive/5">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-destructive">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-3">
                    Urgent Items
                    <Badge variant="destructive" className="text-sm px-2 py-1">
                      {urgentItems.length} item{urgentItems.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {urgentItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-background shadow-sm transition-all hover:shadow-md"
                      data-testid={`card-item-${item.id}`}
                    >
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2">
                          {item.name}
                          <Badge variant="destructive" className="text-xs">
                            Urgent
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {item.quantity} {item.unit}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Select
                          value={item.status}
                          onValueChange={(status) => updateItemStatusMutation.mutate({ itemId: item.id, status })}
                        >
                          <SelectTrigger className="w-32" data-testid={`select-status-${item.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="purchased">Purchased</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteItemMutation.mutate(item.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          data-testid={`button-delete-item-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Items */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-center gap-3">
                  Pending Items
                  <Badge variant="secondary" className="text-sm px-2 py-1">
                    {pendingItems.length} item{pendingItems.length > 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {itemsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : pendingItems.length > 0 ? (
                <div className="space-y-3">
                  {pendingItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-background transition-all hover:shadow-md hover:border-primary/50"
                      data-testid={`card-item-${item.id}`}
                    >
                      <div className="flex-1">
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {item.quantity} {item.unit}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Select
                          value={item.status}
                          onValueChange={(status) => updateItemStatusMutation.mutate({ itemId: item.id, status })}
                        >
                          <SelectTrigger className="w-32" data-testid={`select-status-${item.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="purchased">Purchased</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteItemMutation.mutate(item.id)}
                          className="text-muted-foreground hover:text-destructive"
                          data-testid={`button-delete-item-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">No pending items</h3>
                  <p className="text-muted-foreground">
                    Add items using AI Quick Add or Manual Entry above
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purchased Items */}
          {purchasedItems.length > 0 && (
            <Card className="bg-muted/30">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-muted-foreground">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex items-center gap-3">
                    Purchased Items
                    <Badge variant="outline" className="text-sm px-2 py-1 bg-green-50 text-green-700">
                      {purchasedItems.length} item{purchasedItems.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {purchasedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-green-200 bg-green-50/30 opacity-75"
                      data-testid={`card-item-${item.id}`}
                    >
                      <div className="flex-1 line-through text-green-700">
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-sm text-green-600 mt-1">
                          {item.quantity} {item.unit}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItemMutation.mutate(item.id)}
                        className="text-green-600 hover:text-destructive hover:bg-destructive/10"
                        data-testid={`button-delete-item-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}