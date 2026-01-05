
import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Clipboard, X, Image as ImageIcon } from 'lucide-react';

interface ImagePasteProps {
  onImagesChange: (images: string[]) => void;
  images: string[];
  loading: boolean;
}

const ImagePaste: React.FC<ImagePasteProps> = ({ onImagesChange, images, loading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleImages = (newImages: string[]) => {
    onImagesChange([...images, ...newImages]);
  };

  const removeImage = (index: number) => {
    const nextImages = [...images];
    nextImages.splice(index, 1);
    onImagesChange(nextImages);
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const newImages: string[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              handleImages([event.target.result as string]);
            }
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  }, [images, onImagesChange]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Fix: Explicitly cast the Array.from result to File[] to avoid 'unknown' type errors when accessing 'type' and passing to readAsDataURL
    const files = Array.from(e.dataTransfer.files) as File[];
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleImages([event.target.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="space-y-4">
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${
          isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-900/50'
        } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-500'}`}
      >
        <div className="p-3 bg-blue-500/10 rounded-full mb-3">
          <Clipboard className="w-6 h-6 text-blue-500" />
        </div>
        <p className="text-sm font-semibold text-gray-200">여러 장의 스크린샷 붙여넣기 (Ctrl+V)</p>
        <p className="text-xs text-gray-500 mt-1">인벤토리 각 페이지를 차례대로 캡처해서 붙여넣으세요</p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-4">
          {images.map((img, idx) => (
            <div key={idx} className="relative aspect-video group rounded-lg overflow-hidden border border-slate-700">
              <img src={img} className="w-full h-full object-cover" alt={`Preview ${idx}`} />
              <button 
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 p-1 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 px-2 text-[10px] text-gray-300">
                Page {idx + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImagePaste;
