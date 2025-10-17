import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Package, Check, X, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Order, OrderItem, Product } from "@shared/schema";

interface OrderWithItems extends Order {
  items?: (OrderItem & { product?: Product })[];
  payment?: any;
}

export default function OrdersPage() {
  const { data: orders, isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Check className="h-4 w-4" />;
      case "cancelled":
        return <X className="h-4 w-4" />;
      case "processing":
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string): any => {
    switch (status) {
      case "completed":
        return "default";
      case "cancelled":
        return "destructive";
      case "processing":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2" data-testid="text-orders-title">
            My Orders
          </h1>
          <p className="text-muted-foreground">
            View and track your order history
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} data-testid={`card-order-${order.id}`}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                        <span data-testid={`text-order-id-${order.id}`}>
                          Order #{order.id.slice(0, 8)}
                        </span>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Placed on {new Date(order.createdAt).toLocaleDateString()} at{" "}
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2">
                      <Badge 
                        variant={getStatusVariant(order.status)} 
                        className="w-fit flex items-center gap-1"
                        data-testid={`badge-order-status-${order.id}`}
                      >
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                      <div className="text-2xl font-bold" data-testid={`text-order-total-${order.id}`}>
                        ${order.totalAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {order.items && order.items.length > 0 ? (
                    <Accordion type="single" collapsible>
                      <AccordionItem value="items">
                        <AccordionTrigger data-testid={`button-toggle-items-${order.id}`}>
                          View Items ({order.items.length})
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-2">
                            {order.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                data-testid={`card-order-item-${item.id}`}
                              >
                                <div className="flex items-center gap-3">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium">
                                      {item.product?.name || "Product"}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Quantity: {item.quantity}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold">
                                    ${item.priceAtPurchase.toFixed(2)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    per unit
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ) : (
                    <p className="text-sm text-muted-foreground">No items in this order</p>
                  )}

                  {order.payment && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Payment Status:</span>
                        <Badge variant={order.payment.status === "completed" ? "default" : "secondary"}>
                          {order.payment.status}
                        </Badge>
                      </div>
                      {order.payment.paymentMethod && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Payment Method:</span>
                          <span className="font-medium">{order.payment.paymentMethod}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ShoppingCart className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                When you place an order, it will appear here
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
