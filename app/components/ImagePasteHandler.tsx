'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface ImagePasteHandlerProps {
  onImagePaste: (file: File) => Promise<void>;
  children: React.ReactNode;
}

export default function ImagePasteHandler({ onImagePaste, children }: ImagePasteHandlerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  const handlePaste = useCallback(async (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          event.preventDefault();
          await onImagePaste(file);
          break;
        }
      }
    }
  }, [onImagePaste]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    // Check if the drag contains an image element from our UI
    const isImageFromUI = e.dataTransfer.types.includes('text/html') && 
                         e.dataTransfer.getData('text/html').includes('<img');
    
    if (isImageFromUI) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // Check if the drop contains an image element from our UI
    const isImageFromUI = e.dataTransfer.types.includes('text/html') && 
                         e.dataTransfer.getData('text/html').includes('<img');
    
    if (isImageFromUI) {
      return; // Ignore drops of images from our own UI
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        await onImagePaste(file);
      }
    }
  }, [onImagePaste]);

  useEffect(() => {
    const pasteHandler = (e: Event) => handlePaste(e as ClipboardEvent);
    document.addEventListener('paste', pasteHandler);
    return () => {
      document.removeEventListener('paste', pasteHandler);
    };
  }, [handlePaste]);

  return (
    <div
      ref={dropAreaRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={isDragging ? 'opacity-75' : ''}
    >
      {children}
    </div>
  );
}
