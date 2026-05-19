'use client';

import { Edit, Save, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import ImagePasteHandler from './components/ImagePasteHandler';
import WavyBackground from './components/WavyBackground';

interface Post {
  id: number;
  description: string;
  imageUrl: string;
  createdAt: string;
}

interface PendingImage {
  file: File;
  preview: string;
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function CloseButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200" aria-label="Close">
      <X className="h-5 w-5" />
    </button>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function ImagePreviewModal({
  preview, description, isLoading,
  onDescriptionChange, onSubmit, onClose
}: {
  preview: string;
  description: string;
  isLoading: boolean;
  onDescriptionChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <div className="bg-white dark:bg-zinc-800 rounded-xl w-full max-w-4xl mx-2 sm:mx-4 p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add Description</h2>
          <CloseButton onClick={onClose} />
        </div>
        <div className="w-full mb-6">
          <div className="relative w-full aspect-square max-h-[60vh] rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-contain p-2"
            />
          </div>
        </div>
        <form onSubmit={onSubmit} className="w-full">
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="w-full p-3 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
              placeholder="Enter a description for your image..."
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-700 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!description.trim() || isLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {isLoading ? <><Spinner /> Posting...</> : 'Post Image'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function EditModal({ description, isUpdating, onDescriptionChange, onSave, onClose }: {
  description: string; isUpdating: boolean; onDescriptionChange: (val: string) => void; onSave: () => void; onClose: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Edit Post</h3>
          <CloseButton onClick={onClose} disabled={isUpdating} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
          <textarea value={description} onChange={(e) => onDescriptionChange(e.target.value)} className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]" disabled={isUpdating} />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={isUpdating} className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-700 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors disabled:opacity-50">Cancel</button>
          <button onClick={onSave} disabled={isUpdating || !description.trim()} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {isUpdating ? <><Spinner /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function PostDetailModal({ post, isDeleting, onEdit, onDelete, onClose }: {
  post: Post; isDeleting: boolean; onEdit: () => void; onDelete: () => void; onClose: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-700">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white">Post Details</h3>
          <CloseButton onClick={onClose} />
        </div>
        <div className="flex-1 overflow-auto">
          <div className="relative w-full h-[60vh] bg-black/5 dark:bg-black/30 flex items-center justify-center">
            <Image src={post.imageUrl} alt={post.description} width={1024} height={1024} className="max-w-full max-h-full object-contain" priority />
          </div>
          <div className="p-6">
            <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-line">{post.description}</p>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-4">Posted on {new Date(post.createdAt).toLocaleString()}</p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={onEdit} className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-700 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors flex items-center gap-2">
                <Edit className="w-4 h-4" /> Edit
              </button>
              <button onClick={onDelete} disabled={isDeleting} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                <Trash2 className="w-4 h-4" /> {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function PostCard({ post, onClick }: { post: Post; onClick: () => void }) {
  return (
    <div className="group relative overflow-hidden w-full cursor-pointer flex items-center justify-center" onClick={onClick} style={{ minHeight: '200px' }}>
      <div className="relative w-full flex items-center justify-center">
        <Image src={post.imageUrl} alt={post.description} width={800} height={600} className="max-w-full max-h-full object-contain rounded-none" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-full text-white text-sm text-center bg-black/50 px-2 py-1">{post.description}</div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-64 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded-lg" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <p className="text-zinc-500 dark:text-zinc-400 text-lg mb-4">Your library is empty</p>
      <p className="text-zinc-400 dark:text-zinc-500 text-sm">Paste an image to get started</p>
    </div>
  );
}

function PostsGrid({ posts, onPostClick }: { posts: Post[]; onPostClick: (post: Post) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 max-w-[2000px] mx-auto">
      {[...posts].reverse().map((post) => (
        <PostCard key={post.id} post={post} onClick={() => onPostClick(post)} />
      ))}
    </div>
  );
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Store pending image in a ref to avoid re-renders and cleanup issues
  const pendingImageRef = useRef<PendingImage | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/posts');
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again.');
      setPosts([]);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const clearPendingImage = useCallback(() => {
    if (pendingImageRef.current) {
      URL.revokeObjectURL(pendingImageRef.current.preview);
      pendingImageRef.current = null;
    }
    setDescription('');
    setShowModal(false);
  }, []);

  const handleImagePaste = useCallback((file: File) => {
    // Clear any existing pending image
    if (pendingImageRef.current) {
      URL.revokeObjectURL(pendingImageRef.current.preview);
    }
    
    // Create new blob URL and store
    const preview = URL.createObjectURL(file);
    pendingImageRef.current = { file, preview };
    
    // Show modal
    setShowModal(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pending = pendingImageRef.current;
    if (!description.trim() || !pending) return;

    setIsLoading(true);
    try {
      // Upload the image
      const formData = new FormData();
      formData.append('image', pending.file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      
      if (!uploadRes.ok) throw new Error('Failed to upload image');
      const { url } = await uploadRes.json();

      // Create the post
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim(), imageUrl: url }),
      });

      if (!res.ok) throw new Error('Failed to create post');

      // Success - clear form and refresh
      clearPendingImage();
      await fetchPosts();
    } catch (err) {
      console.error('Error creating post:', err);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPost || !editDescription.trim()) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingPost.id, description: editDescription.trim() }),
      });
      if (res.ok) {
        await fetchPosts();
        setEditingPost(null);
        setEditDescription('');
      }
    } catch (err) {
      console.error('Error updating post:', err);
      setError('Failed to update post. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts?id=${postId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchPosts();
        if (selectedPost?.id === postId) setSelectedPost(null);
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const startEditing = (post: Post) => {
    setEditingPost(post);
    setEditDescription(post.description);
  };

  return (
    <div className="min-h-screen">
      <ImagePasteHandler onImagePaste={handleImagePaste}>
        <main className="min-h-screen relative">
          <WavyBackground />
          <div className="bg-zinc-50 dark:bg-zinc-900">
            <div className="mx-auto">
              <div className="mb-8" />
              {isFetching ? <LoadingSkeleton /> : error ? (
                <p className="text-red-500 dark:text-red-400">{error}</p>
              ) : !posts.length ? <EmptyState /> : (
                <PostsGrid posts={posts} onPostClick={setSelectedPost} />
              )}
            </div>
          </div>
        </main>
      </ImagePasteHandler>

      {showModal && pendingImageRef.current && (
        <ImagePreviewModal
          preview={pendingImageRef.current.preview}
          description={description}
          isLoading={isLoading}
          onDescriptionChange={setDescription}
          onSubmit={handleSubmit}
          onClose={clearPendingImage}
        />
      )}

      {editingPost && (
        <EditModal
          description={editDescription}
          isUpdating={isUpdating}
          onDescriptionChange={setEditDescription}
          onSave={handleUpdatePost}
          onClose={() => { setEditingPost(null); setEditDescription(''); }}
        />
      )}

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          isDeleting={isDeleting}
          onEdit={() => { setSelectedPost(null); startEditing(selectedPost); }}
          onDelete={() => handleDeletePost(selectedPost.id)}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
}