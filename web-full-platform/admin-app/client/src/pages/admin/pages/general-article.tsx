import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { queryClient } from "@/lib/queryClient";
import { Save, ArrowLeft, BookOpen } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createHelpArticleSchema, type CreateHelpArticle } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const DEFAULT_ARTICLE: CreateHelpArticle = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: 'general',
  published: true,
  order: 0,
};

export default function AdminGeneralArticlePage() {
  const { toast } = useToast();
  const { canManageSettings, isDemoMode } = usePermissions();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const isNew = params.id === 'new';

  const { data: articleData, isLoading } = useQuery<any>({
    queryKey: ['/api/admin/articles', params.id],
    enabled: !isNew,
  });

  const form = useForm<CreateHelpArticle>({
    resolver: zodResolver(createHelpArticleSchema),
    defaultValues: DEFAULT_ARTICLE,
  });

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    form.setValue('title', title);
    if (isNew) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      form.setValue('slug', slug);
    }
  };

  useEffect(() => {
    if (articleData?.data && !isNew) {
      form.reset({
        title: articleData.data.title || '',
        slug: articleData.data.slug || '',
        excerpt: articleData.data.excerpt || '',
        content: articleData.data.content || '',
        category: articleData.data.category || 'general',
        published: articleData.data.published ?? true,
        order: articleData.data.order || 0,
      });
    }
  }, [articleData, form, isNew]);

  const saveMutation = useMutation({
    mutationFn: async (data: CreateHelpArticle) => {
      const url = isNew 
        ? '/api/admin/articles'
        : `/api/admin/articles/${params.id}`;
      
      const method = isNew ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${isNew ? 'create' : 'update'} article`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/articles'] });
      toast({
        title: "Success",
        description: `Help article ${isNew ? 'created' : 'updated'} successfully`,
      });
      setLocation('/admin/pages/general');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isNew ? 'create' : 'update'} article`,
        variant: "destructive",
      });
    },
  });

  const handleSave = form.handleSubmit((data) => {
    if (isDemoMode || !canManageSettings) {
      toast({
        title: "Permission Denied",
        description: isDemoMode 
          ? `Cannot ${isNew ? 'create' : 'update'} articles in demo mode` 
          : "You don't have permission to manage content",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(data);
  });

  const handleBack = () => {
    setLocation('/admin/pages/general');
  };

  if (isLoading && !isNew) {
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
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleBack}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <BookOpen className="h-8 w-8" />
                {isNew ? 'Create Help Article' : 'Edit Help Article'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isNew ? 'Add a new article to the help center' : 'Update article content and settings'}
              </p>
            </div>
          </div>
          <Button 
            onClick={handleSave}
            disabled={saveMutation.isPending}
            data-testid="button-save-article"
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Article'}
          </Button>
        </div>

        {isDemoMode && (
          <Alert data-testid="alert-demo-mode">
            <AlertDescription>
              Demo mode is enabled. Article management is read-only.
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Article Details</CardTitle>
              <CardDescription>
                Basic information about this help article
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., How do I create an account?"
                  {...form.register('title')}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  data-testid="input-title"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">
                  URL Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  placeholder="how-do-i-create-an-account"
                  {...form.register('slug')}
                  data-testid="input-slug"
                />
                {form.formState.errors.slug && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.slug.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Auto-generated from title. You can customize it if needed.
                </p>
              </div>

              {/* Excerpt */}
              <div className="space-y-2">
                <Label htmlFor="excerpt">
                  Short Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="excerpt"
                  placeholder="Brief summary that appears on the article card..."
                  rows={3}
                  {...form.register('excerpt')}
                  data-testid="input-excerpt"
                />
                {form.formState.errors.excerpt && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.excerpt.message}
                  </p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={form.watch('category')}
                  onValueChange={(value: any) => form.setValue('category', value)}
                >
                  <SelectTrigger id="category" data-testid="select-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="seller">Seller</SelectItem>
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="payments">Payments</SelectItem>
                    <SelectItem value="shipping">Shipping</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Order */}
              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...form.register('order', { valueAsNumber: true })}
                  data-testid="input-order"
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first
                </p>
              </div>

              {/* Published */}
              <div className="flex items-center justify-between space-y-2">
                <div className="space-y-0.5">
                  <Label htmlFor="published">Published</Label>
                  <p className="text-xs text-muted-foreground">
                    Make this article visible to users
                  </p>
                </div>
                <Switch
                  id="published"
                  checked={form.watch('published')}
                  onCheckedChange={(checked) => form.setValue('published', checked)}
                  data-testid="switch-published"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Article Content</CardTitle>
              <CardDescription>
                Full article content (supports Markdown)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  id="content"
                  placeholder="Write your full article content here. You can use Markdown formatting..."
                  rows={20}
                  className="font-mono text-sm"
                  {...form.register('content')}
                  data-testid="input-content"
                />
                {form.formState.errors.content && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.content.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Use Markdown for formatting: **bold**, *italic*, # Heading, - List items, etc.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button (Bottom) */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={handleBack}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saveMutation.isPending}
              data-testid="button-save-bottom"
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? 'Saving...' : 'Save Article'}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
