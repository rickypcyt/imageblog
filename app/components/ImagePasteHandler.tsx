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
