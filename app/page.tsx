'use client';

import { useEffect, useState } from 'react';

interface Post {
  id: number;
  title: string;
  content: string | null;
  createdAt: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setIsLoading(true);
    try {
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      setTitle('');
      setContent('');
      await fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8">
          Blog Posts
        </h1>
        
        <form onSubmit={handleSubmit} className="mb-12 bg-white dark:bg-zinc-800 p-6 rounded-lg shadow">
          <div className="mb-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title"
              className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div className="mb-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={3}
              className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Posting...' : 'Create Post'}
          </button>
        </form>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
            Recent Posts
          </h2>
          
          {posts.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400 italic">
              No posts yet. Be the first to post something!
            </p>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div 
                  key={post.id} 
                  className="p-6 bg-white dark:bg-zinc-800 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                    {post.title}
                  </h3>
                  {post.content && (
                    <p className="text-zinc-700 dark:text-zinc-300 mb-3 whitespace-pre-line">
                      {post.content}
                    </p>
                  )}
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Posted on {new Date(post.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
