// src/components/common/ImageUpload.tsx
import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  label?: string;
  onChange: (file: File | null) => void;
  error?: string | null;
  currentImage?: string | null;
}

const ImageUpload = ({ 
  label, 
  onChange, 
  error, 
  currentImage = null 
}: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(currentImage);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        onChange(null);
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        onChange(null);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      onChange(file);
    }
  };

  const clearImage = () => {
    setPreview(null);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-secondary-700">
          {label}
        </label>
      )}

      <div className="flex items-start gap-4">
        {/* Preview */}
        {preview ? (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-secondary-200 bg-secondary-50">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 p-1 bg-error-500 text-white rounded-full hover:bg-error-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="w-32 h-32 rounded-lg border-2 border-dashed border-secondary-300 bg-secondary-50 flex items-center justify-center">
            <ImageIcon size={32} className="text-secondary-400" />
          </div>
        )}

        {/* Upload Button */}
        <div className="flex-1">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex items-center gap-2 px-4 py-3 border-2 border-secondary-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
              <Upload size={20} className="text-secondary-600" />
              <span className="text-sm text-secondary-700">
                {preview ? 'Change Image' : 'Upload Image'}
              </span>
            </div>
          </label>
          <p className="text-xs text-secondary-500 mt-2">
            PNG, JPG, GIF up to 2MB
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-error-500">{error}</p>
      )}
    </div>
  );
};

export default ImageUpload;