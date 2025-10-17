import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Plus, Trash2, Sparkles, Check, AlertCircle } from "lucide-react";
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

  const parseNLPMutation = useMutation({
    mutationFn: async (text: string) => {
      return await apiRequest("POST", "/api/nlp/parse", { text, listId });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Items parsed!",
        description: `Added ${data.items?.length || 0} items from your text`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/lists", listId, "items"] });
      setNlpInput("");
    },
    onError: () => {
      toast({
        title: "Parsing error",
        description: "Could not parse your input. Try manual entry instead.",
        variant: "destructive",
      });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (item: any) => {
      return await apiRequest("POST", `/api/lists/${listId}/items`, item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists", listId, "items"] });
      toast({
        title: "Item added",
        description: "Item has been added to your list",
      });
      setManualItem({ name: "", quantity: 1, unit: "units" });
    },
  });

  const updateItemStatusMutation = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: string }) => {
      return await apiRequest("PATCH", `/api/lists/${listId}/items/${itemId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists", listId, "items"] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await apiRequest("DELETE", `/api/lists/${listId}/items/${itemId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists", listId, "items"] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your list",
      });
    },
  });

  const handleNLPParse = () => {
    if (nlpInput.trim()) {
      parseNLPMutation.mutate(nlpInput);
    }
  };

  const handleAddManualItem = () => {
    if (manualItem.name.trim()) {
      addItemMutation.mutate(manualItem);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: "secondary", icon: null, label: "Pending" },
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
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/lists")}
            className="mb-4"
            data-testid="button-back-to-lists"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lists
          </Button>
          <h1 className="text-4xl font-bold tracking-tight" data-testid="text-list-title">
            {list.title}
          </h1>
          <p className="text-muted-foreground mt-2">
            Created {new Date(list.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI-Powered Quick Add
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder='Try typing: "3 kg potatoes, 2 liters milk, 500g chicken breast"'
                  value={nlpInput}
                  onChange={(e) => setNlpInput(e.target.value)}
                  rows={3}
                  className="resize-none"
                  data-testid="input-nlp-text"
                />
                <p className="text-xs text-muted-foreground">
                  Our AI will automatically parse quantities and units from your natural language input
                </p>
              </div>
              <Button
                onClick={handleNLPParse}
                disabled={parseNLPMutation.isPending || !nlpInput.trim()}
                className="w-full"
                data-testid="button-parse-nlp"
              >
                {parseNLPMutation.isPending ? (
                  "Parsing..."
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Parse & Add Items
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manual Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Item name"
                value={manualItem.name}
                onChange={(e) => setManualItem({ ...manualItem, name: e.target.value })}
                data-testid="input-manual-item-name"
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Qty"
                  value={manualItem.quantity}
                  onChange={(e) => setManualItem({ ...manualItem, quantity: parseFloat(e.target.value) || 1 })}
                  className="w-20"
                  data-testid="input-manual-item-quantity"
                />
                <Select
                  value={manualItem.unit}
                  onValueChange={(value) => setManualItem({ ...manualItem, unit: value })}
                >
                  <SelectTrigger data-testid="select-manual-item-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="units">units</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="l">liters</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="pcs">pieces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddManualItem}
                disabled={addItemMutation.isPending || !manualItem.name.trim()}
                className="w-full"
                data-testid="button-add-manual-item"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {urgentItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  Urgent Items ({urgentItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {urgentItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                      data-testid={`card-item-${item.id}`}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantity} {item.unit}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(item.status)}
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

          <Card>
            <CardHeader>
              <CardTitle>Pending Items ({pendingItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {itemsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : pendingItems.length > 0 ? (
                <div className="space-y-2">
                  {pendingItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                      data-testid={`card-item-${item.id}`}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantity} {item.unit}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
                          data-testid={`button-delete-item-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No pending items. Add items using AI or manual entry above.
                </p>
              )}
            </CardContent>
          </Card>

          {purchasedItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-5 w-5" />
                  Purchased ({purchasedItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {purchasedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border opacity-60"
                      data-testid={`card-item-${item.id}`}
                    >
                      <div className="flex-1 line-through">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantity} {item.unit}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItemMutation.mutate(item.id)}
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
