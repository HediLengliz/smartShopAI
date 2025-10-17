import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ShoppingCart, Package, ListChecks, MessageSquare, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { List, Order } from "@shared/schema";

export default function Dashboard() {
  const { data: lists, isLoading: listsLoading } = useQuery<List[]>({
    queryKey: ["/api/lists"],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const stats = [
    {
      title: "Active Lists",
      value: lists?.length || 0,
      icon: ListChecks,
      color: "text-chart-1",
      link: "/lists",
    },
    {
      title: "Total Orders",
      value: orders?.length || 0,
      icon: ShoppingCart,
      color: "text-chart-2",
      link: "/orders",
    },
    {
      title: "Products",
      value: "Browse",
      icon: Package,
      color: "text-chart-3",
      link: "/products",
    },
    {
      title: "AI Insights",
      value: "Get Help",
      icon: TrendingUp,
      color: "text-chart-4",
      link: "/support",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" data-testid="text-dashboard-title">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Welcome to your smart shopping assistant
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Card 
                key={stat.title} 
                className="hover-elevate cursor-pointer transition-all"
                data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Link href={stat.link}>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    {listsLoading || ordersLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <div className="text-3xl font-bold" data-testid={`text-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        {stat.value}
                      </div>
                    )}
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/lists/new">
                  <Button className="w-full justify-start" data-testid="button-create-list">
                    <ListChecks className="mr-2 h-4 w-4" />
                    Create New Shopping List
                  </Button>
                </Link>
                <Link href="/products">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-browse-products">
                    <Package className="mr-2 h-4 w-4" />
                    Browse Products
                  </Button>
                </Link>
                <Link href="/orders">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-view-orders">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    View My Orders
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  AI Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Natural Language Input</h3>
                  <p className="text-sm text-muted-foreground">
                    Type "3 kg potatoes" and let AI parse it automatically
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Smart Recommendations</h3>
                  <p className="text-sm text-muted-foreground">
                    Get personalized product suggestions based on your history
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Chatbot Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Ask questions and get instant help
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Lists</CardTitle>
            </CardHeader>
            <CardContent>
              {listsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : lists && lists.length > 0 ? (
                <div className="space-y-2">
                  {lists.slice(0, 5).map((list) => (
                    <Link key={list.id} href={`/lists/${list.id}`}>
                      <div 
                        className="p-4 rounded-lg border hover-elevate active-elevate-2 cursor-pointer"
                        data-testid={`card-list-${list.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold" data-testid={`text-list-title-${list.id}`}>
                              {list.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Created {new Date(list.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <ListChecks className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ListChecks className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">No lists yet</p>
                  <Link href="/lists/new">
                    <Button data-testid="button-create-first-list">Create Your First List</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
