import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { X, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { useApiConfig, getImageUrl } from "@/lib/use-api-config";

interface SingleImageUploadProps {
  value: string;
  onChange: (imageUrl: string) => void;
  resourceKey: string;
  label?: string;
  maxFileSize?: number;
  disabled?: boolean;
  aspectRatio?: string;
}

export function SingleImageUpload({
  value = "",
  onChange,
  resourceKey,
  label = "Upload Image",
  maxFileSize = 5 * 1024 * 1024,
  disabled = false,
  aspectRatio = "aspect-video",
}: SingleImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { externalApiUrl } = useApiConfig();

  const handleFileUpload = async (file: File) => {
    if (disabled || uploading) return;

    if (!file.type.startsWith('image/')) {
      console.warn(`File ${file.name} is not an image`);
      return;
    }
    if (file.size > maxFileSize) {
      console.warn(`File ${file.name} exceeds size limit`);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('key', resourceKey);
      formData.append('file', file);

      // Get auth tokens from localStorage
      const adminToken = localStorage.getItem('adminAccessToken');
      const userToken = localStorage.getItem('accessToken');
      const userData = localStorage.getItem('user');
      
      const headers: Record<string, string> = {};
      if (adminToken) headers['x-admin-token'] = adminToken;
      if (userToken) headers['x-access-token'] = userToken;
      if (userData) headers['x-user-data'] = btoa(unescape(encodeURIComponent(userData)));

      const response = await fetch('/api/themes/upload-resource', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      if (result.success && result.url) {
        onChange(result.url);
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    
    if (disabled || uploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = () => {
    if (disabled || uploading) return;
    onChange("");
  };

  const displayUrl = getImageUrl(value, externalApiUrl);

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative group">
          <div className={`${aspectRatio} rounded-lg overflow-hidden border bg-muted`}>
            <img
              src={displayUrl}
              alt={label}
              className="w-full h-full object-cover"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={removeImage}
            disabled={disabled || uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Card className={`border-2 border-dashed transition-colors ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}>
          <CardContent 
            className="p-4"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="text-center space-y-3">
              <div className="mx-auto w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">
                  Drag & drop or click to upload
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Select File'}
              </Button>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInputChange}
                disabled={disabled || uploading}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
