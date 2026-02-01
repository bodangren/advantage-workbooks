'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  projectId: string;
  currentUrl?: string;
  onUploadSuccess: (url: string) => void;
  label?: string;
}

export function ImageUpload({ projectId, currentUrl, onUploadSuccess, label = 'Image' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset error
    setError(null);

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.');
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size exceeds 5MB limit.');
      return;
    }

    // Upload the file
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/images`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload image');
      }

      const data = await response.json();
      onUploadSuccess(data.url);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    onUploadSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`image-upload-${label}`}>{label}</Label>

      <div className="flex items-center gap-2">
        <Input
          ref={fileInputRef}
          id={`image-upload-${label}`}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          disabled={uploading}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          size="sm"
          variant="outline"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </>
          )}
        </Button>
        {currentUrl && (
          <Button
            type="button"
            onClick={handleClear}
            size="sm"
            variant="ghost"
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {currentUrl && (
        <div className="mt-2">
          <p className="text-sm text-muted-foreground">Current: {currentUrl}</p>
          {/* Preview image if it's a relative path */}
          {!currentUrl.startsWith('http') && (
            <img
              src={`/${currentUrl}`}
              alt="Preview"
              className="mt-2 max-w-xs rounded border"
              style={{ maxHeight: '200px' }}
            />
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <p className="text-xs text-muted-foreground">
        Accepted formats: JPG, PNG, GIF, WebP (max 5MB)
      </p>
    </div>
  );
}
