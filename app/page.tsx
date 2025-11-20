'use client';

import { Edit, Save, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import ImagePasteHandler from './components/ImagePasteHandler';

// Helper function to split array into chunks
const chunkArray = <T,>(array: T[], size: number): T[][] => {
  return array.length > 0 ? Array.from(
    { length: Math.ceil(array.length / size) },
    (_, index) => array.slice(index * size, (index + 1) * size)
  ) : [];
};

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
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchPosts = useCallback(async () => {
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
  }, []);

  const handleUpdatePost = async () => {
    if (!editingPost || !editDescription.trim()) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: editingPost.id,
          description: editDescription.trim()
        }),
      });
      
      if (response.ok) {
        await fetchPosts();
        setEditingPost(null);
        setEditDescription('');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      setError('Failed to update post. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts?id=${postId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchPosts();
        if (selectedPost?.id === postId) {
          setSelectedPost(null);
        }
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const startEditing = (post: Post) => {
    setEditingPost(post);
    setEditDescription(post.description);
  };

  const cancelEditing = () => {
    setEditingPost(null);
    setEditDescription('');
  };

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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

  const handlePasteAndShowPreview = async (file: File) => {
    await handleImagePaste(file);
  };

  return (
    <ImagePasteHandler onImagePaste={handlePasteAndShowPreview}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {imagePreview && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-2xl w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Add Description</h3>
                  <button 
                    onClick={() => setImagePreview(null)}
                    className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mb-6">
                  <div className="relative w-full h-64 md:h-96 mb-4 rounded-lg overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-contain bg-zinc-100 dark:bg-zinc-700"
                    />
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                        placeholder="Enter a description for your image..."
                        autoFocus
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setImagePreview(null)}
                        className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-700 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!description.trim() || isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Posting...' : 'Post Image'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-8"></div>
          
          {isFetching ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-64 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : error ? (
            <p className="text-red-500 dark:text-red-400">{error}</p>
          ) : !posts?.length ? (
            <div className="text-center py-12">
              <p className="text-zinc-500 dark:text-zinc-400 text-lg mb-4">
                Your library is empty
              </p>
              <p className="text-zinc-400 dark:text-zinc-500 text-sm">
                Paste an image or click the upload button to get started
              </p>
            </div>
          ) : (
            <div className="w-full px-2">
              <div className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 [direction:rtl] max-w-[2000px] mx-auto">
                {[...posts].reverse().map((post) => (
                  <div 
                    key={post.id} 
                    className="group relative overflow-hidden w-full cursor-pointer flex items-center justify-center"
                    onClick={() => setSelectedPost(post)}
                    style={{ minHeight: '200px' }}
                  >
                    <div className="relative w-full flex items-center justify-center">
                      <Image
                        src={post.imageUrl}
                        alt={post.description}
                        width={800}
                        height={600}
                        className="max-w-full max-h-full object-contain rounded-none"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      
                      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="w-full text-white text-sm text-center bg-black/50 px-2 py-1">
                          {post.description}
                        </div>
                      </div>
                    </div>
                    
                    
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Edit Post</h3>
              <button 
                onClick={cancelEditing}
                className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                disabled={isUpdating}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                disabled={isUpdating}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelEditing}
                disabled={isUpdating}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-700 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePost}
                disabled={isUpdating || !editDescription.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
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
              <div className="relative w-full h-[60vh] bg-black/5 dark:bg-black/30">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src={selectedPost.imageUrl}
                    alt={selectedPost.description}
                    width={1024}
                    height={1024}
                    className="max-w-full max-h-full object-contain"
                    priority
                    loading="eager"
                  />
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
                  {selectedPost.description}
                </p>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-4">
                  Posted on {new Date(selectedPost.createdAt).toLocaleString()}
                </p>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPost(null);
                      startEditing(selectedPost);
                    }}
                    className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-700 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePost(selectedPost.id);
                    }}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ImagePasteHandler>
  );
}