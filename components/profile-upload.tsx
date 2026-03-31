'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Upload, X } from 'lucide-react';
import Image from 'next/image';

interface ProfileUploadProps {
  onProfileUpdate: (imageUrl: string, base64: string) => void;
  currentImage?: string;
}

export function ProfileUpload({ onProfileUpdate, currentImage }: ProfileUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
        onProfileUpdate(result, result);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process image');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onProfileUpdate('', '');
  };

  return (
    <Card className="charity-glow-card p-6">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Profile Picture</h3>

      {error && (
        <div className="flex gap-3 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {preview ? (
        <div className="space-y-4">
          <div className="relative w-40 h-40 mx-auto">
            <img
              src={preview}
              alt="Profile"
              className="w-full h-full object-cover rounded-lg border-2 border-cyan-400/50"
            />
          </div>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="charity-btn-secondary"
            >
              Change Photo
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <X className="w-4 h-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-cyan-500/30 rounded-lg p-8 text-center cursor-pointer hover:border-cyan-400/50 transition"
        >
          <Upload className="w-12 h-12 text-cyan-400 mx-auto mb-3 opacity-50" />
          <p className="text-foreground font-medium mb-1">Click to upload</p>
          <p className="text-sm text-muted-foreground">PNG, JPG or WebP (max 5MB)</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={loading}
        className="hidden"
      />
    </Card>
  );
}
