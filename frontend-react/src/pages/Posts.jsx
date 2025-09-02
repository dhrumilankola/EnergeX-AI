import React, { useState, useEffect } from 'react';
import { useApi } from '../lib/ApiContext';
import { hybridApi } from '../lib/hybridApi';
import socket from '../lib/socket';

function PostsPage() {
  const { user } = useApi();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [creatingPost, setCreatingPost] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    socket.connect();
    socket.on('new_post', (newPost) => {
      console.log('New post received via WebSocket:', newPost);
      fetchPosts();
    });

    return () => {
      socket.off('new_post');
      socket.disconnect();
    };
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await hybridApi.getPosts();
      setPosts(response.posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setCreatingPost(true);
      const response = await hybridApi.createPost(title, content, user.id);
      setTitle('');
      setContent('');
      await fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error.message);
    } finally {
      setCreatingPost(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await hybridApi.deletePost(postId, user.id);
      await fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      setError(error.message);
    }
  };

  if (loading) return <p>Loading posts...</p>;
  if (error) return <p>Error fetching posts: {error}</p>;

  return (
    <div className="posts-page">
      <div className="create-post-section">
        <h1>Create a New Post</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
          <button type="submit" disabled={creatingPost}>
            {creatingPost ? 'Creating...' : 'Create Post'}
          </button>
        </form>
      </div>

      <div className="posts-container">
        <h1>Recent Posts</h1>
        {posts.length === 0 ? (
          <p>No posts found.</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="post">
              <h2>{post.title}</h2>
              <p>{post.content}</p>
              <p className="post-meta">
                By {post.user?.name || 'Unknown User'} on {new Date(post.created_at).toLocaleDateString()}
                {post.user_id === user.id && <span className="own-post"> (Your post)</span>}
              </p>
              {post.user_id === user.id && (
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="delete-post-btn"
                >
                  Delete
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default PostsPage;