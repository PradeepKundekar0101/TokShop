import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { queryClient } from "@/lib/queryClient";
import { Plus, Edit, Trash2, BookOpen, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { HelpArticle } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export default function AdminGeneralPage() {
  const { toast } = useToast();
  const { canManageSettings, isDemoMode } = usePermissions();
  const [, setLocation] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);

  const { data: articlesData, isLoading } = useQuery<any>({
    queryKey: ['/api/admin/articles'],
  });

  const articles: HelpArticle[] = articlesData?.data || [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete article');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/articles'] });
      toast({
        title: "Success",
        description: "Help article deleted successfully",
      });
      setDeleteDialogOpen(false);
      setArticleToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete article",
        variant: "destructive",
      });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      // First, fetch the current article data
      const getResponse = await fetch(`/api/admin/articles/${id}`, {
        credentials: 'include',
      });
      
      if (!getResponse.ok) {
        const error = await getResponse.json();
        throw new Error(error.error || 'Failed to fetch article');
      }
      
      const articleData = await getResponse.json();
      const article = articleData.data;
      
      // Then update with the full payload
      const response = await fetch(`/api/admin/articles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          content: article.content,
          category: article.category,
          published: published,
          order: article.order || 0,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update article');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/articles'] });
      toast({
        title: "Success",
        description: "Article visibility updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update article",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (isDemoMode || !canManageSettings) {
      toast({
        title: "Permission Denied",
        description: isDemoMode 
          ? "Cannot delete articles in demo mode" 
          : "You don't have permission to manage content",
        variant: "destructive",
      });
      return;
    }
    setArticleToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (articleToDelete) {
      deleteMutation.mutate(articleToDelete);
    }
  };

  const handleTogglePublish = (id: string, currentPublished: boolean) => {
    if (isDemoMode || !canManageSettings) {
      toast({
        title: "Permission Denied",
        description: isDemoMode 
          ? "Cannot modify articles in demo mode" 
          : "You don't have permission to manage content",
        variant: "destructive",
      });
      return;
    }
    togglePublishMutation.mutate({ id, published: !currentPublished });
  };

  const handleCreateNew = () => {
    if (isDemoMode || !canManageSettings) {
      toast({
        title: "Permission Denied",
        description: isDemoMode 
          ? "Cannot create articles in demo mode" 
          : "You don't have permission to manage content",
        variant: "destructive",
      });
      return;
    }
    setLocation('/admin/pages/general/new');
  };

  const handleEdit = (id: string) => {
    setLocation(`/admin/pages/general/${id}`);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              General Help Articles
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage help center articles for buyers and sellers
            </p>
          </div>
          <Button 
            onClick={handleCreateNew}
            data-testid="button-create-article"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Article
          </Button>
        </div>

        {isDemoMode && (
          <Alert data-testid="alert-demo-mode">
            <AlertDescription>
              Demo mode is enabled. Article management is read-only.
            </AlertDescription>
          </Alert>
        )}

        {/* Articles Grid */}
        {articles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No articles yet</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Create your first help article to provide support and guidance to your users
              </p>
              <Button onClick={handleCreateNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Create First Article
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article) => (
              <Card 
                key={article._id} 
                className="hover-elevate cursor-pointer transition-all"
                data-testid={`article-card-${article._id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-2">
                        {article.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant={article.published ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {article.published ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Published
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Draft
                            </>
                          )}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {article.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="line-clamp-3">
                    {article.excerpt}
                  </CardDescription>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(article._id!)}
                      className="flex-1 gap-2"
                      data-testid={`button-edit-${article._id}`}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant={article.published ? "secondary" : "default"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePublish(article._id!, article.published);
                      }}
                      className="gap-2"
                      data-testid={`button-toggle-publish-${article._id}`}
                    >
                      {article.published ? (
                        <>
                          <EyeOff className="h-4 w-4" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          Publish
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(article._id!);
                      }}
                      data-testid={`button-delete-${article._id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Article</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this help article? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
