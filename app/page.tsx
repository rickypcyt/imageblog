'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import ImagePasteHandler from './components/ImagePasteHandler';
import { X } from 'lucide-react';

interface Post {
  id: number;
  description: string;
  imageUrl: string;
  createdAt: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const fetchPosts = async () => {
    try {
      setError(null);
      const response = await fetch('/api/posts');
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = await response.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts. Please try again.');
      setPosts([]);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !imagePreview) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description,
          imageUrl: imagePreview
        }),
      });
      
      if (response.ok) {
        setDescription('');
        setImagePreview(null);
        await fetchPosts();
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePaste = useCallback(async (file: File) => {
    if (isUploading) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      setImagePreview(data.url);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      URL.revokeObjectURL(objectUrl);
      setImagePreview(null);
    } finally {
      setIsUploading(false);
    }
  }, [isUploading]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  return (
    <ImagePasteHandler onImagePaste={handleImagePaste}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8">
            Image Blog
          </h1>
          
          <form onSubmit={handleSubmit} className="mb-12 bg-white dark:bg-zinc-800 p-6 rounded-lg shadow">
            <div className="mb-4">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Image description"
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div className="mb-4">
              {imagePreview ? (
                <div className="mb-4">
                  <div className="relative w-full h-64">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="mt-2 text-sm text-red-500 hover:text-red-700"
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-md p-8 text-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <p className="text-zinc-500 dark:text-zinc-400">
                    Click to upload or paste an image
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImagePaste(file);
                    }}
                  />
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isLoading || isUploading || !imagePreview}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full"
            >
              {isUploading ? 'Uploading...' : isLoading ? 'Posting...' : 'Create Post'}
            </button>
          </form>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
              Recent Posts
            </h2>
            
            {isFetching ? (
              <p className="text-zinc-500 dark:text-zinc-400 italic">Loading posts...</p>
            ) : error ? (
              <p className="text-red-500 dark:text-red-400">{error}</p>
            ) : !posts?.length ? (
              <p className="text-zinc-500 dark:text-zinc-400 italic">
                No posts yet. Be the first to post something!
              </p>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <div 
                    key={post.id} 
                    className="bg-white dark:bg-zinc-800 rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedPost(post)}
                  >
                    {post.imageUrl && (
                      <div className="relative w-full h-64">
                        <Image
                          src={post.imageUrl}
                          alt={post.description}
                          fill
                          className="object-cover hover:opacity-90 transition-opacity"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <p className="text-zinc-600 dark:text-zinc-300 line-clamp-2">
                        {post.description}
                      </p>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2">
                        Posted on {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedPost && (
        <div 
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div 
            className="bg-white dark:bg-zinc-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-700">
              <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
                Post Details
              </h3>
              <button 
                onClick={() => setSelectedPost(null)}
                className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto">
              <div className="relative w-full h-[60vh] bg-black">
                <Image
                  src={selectedPost.imageUrl}
                  alt={selectedPost.description}
                  fill
                  className="object-contain"
                />
              </div>
              
              <div className="p-6">
                <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
                  {selectedPost.description}
                </p>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-4">
                  Posted on {new Date(selectedPost.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </ImagePasteHandler>
  );
}