import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Plus, ListChecks, Trash2, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { List } from "@shared/schema";

export default function ListsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [newListTitle, setNewListTitle] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: lists, isLoading } = useQuery<List[]>({
    queryKey: ["/api/lists"],
  });

  const createListMutation = useMutation({
    mutationFn: async (title: string) => {
      return await apiRequest("POST", "/api/lists", { title });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
      toast({
        title: "List created",
        description: "Your shopping list has been created successfully",
      });
      setNewListTitle("");
      setDialogOpen(false);
      navigate(`/lists/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create list",
        variant: "destructive",
      });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/lists/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
      toast({
        title: "List deleted",
        description: "Your shopping list has been deleted",
      });
    },
  });

  const handleCreateList = () => {
    if (newListTitle.trim()) {
      createListMutation.mutate(newListTitle);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" data-testid="text-lists-title">
              Shopping Lists
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your shopping lists
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-list-dialog">
                <Plus className="mr-2 h-4 w-4" />
                New List
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Shopping List</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Input
                    placeholder="List title (e.g., Weekly Groceries)"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
                    data-testid="input-list-title"
                  />
                </div>
                <Button
                  onClick={handleCreateList}
                  disabled={createListMutation.isPending || !newListTitle.trim()}
                  className="w-full"
                  data-testid="button-submit-create-list"
                >
                  {createListMutation.isPending ? "Creating..." : "Create List"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : lists && lists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list) => (
              <Card 
                key={list.id} 
                className="hover-elevate transition-all"
                data-testid={`card-list-${list.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-xl" data-testid={`text-list-title-${list.id}`}>
                      {list.title}
                    </CardTitle>
                    <ListChecks className="h-5 w-5 text-primary flex-shrink-0" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(list.createdAt).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Link href={`/lists/${list.id}`} className="flex-1">
                      <Button variant="default" className="w-full" data-testid={`button-view-list-${list.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        View & Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Are you sure you want to delete this list?")) {
                          deleteListMutation.mutate(list.id);
                        }
                      }}
                      disabled={deleteListMutation.isPending}
                      data-testid={`button-delete-list-${list.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ListChecks className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No lists yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Create your first shopping list to get started with smart grocery management
              </p>
              <Button onClick={() => setDialogOpen(true)} data-testid="button-create-first-list">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First List
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
