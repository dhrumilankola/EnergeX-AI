<?php

namespace App\GraphQL\Mutations;

use App\Models\Post;
use GraphQL\Type\Definition\ResolveInfo;
use Illuminate\Support\Facades\Auth;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

class PostMutator
{
    public function create(mixed $root, array $args, GraphQLContext $context, ResolveInfo $resolveInfo): Post
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            throw new \Exception('You must be logged in to create a post.');
        }
        
        $user = Auth::user();
        
        // Create the post and associate it with the authenticated user
        $post = Post::create([
            'title' => $args['title'],
            'content' => $args['content'],
            'user_id' => $user->id,
        ]);

        return $post;
    }

    public function delete(mixed $root, array $args, GraphQLContext $context, ResolveInfo $resolveInfo): Post
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            throw new \Exception('You must be logged in to delete a post.');
        }
        
        $user = Auth::user();
        
        // Find the post
        $post = Post::findOrFail($args['id']);
        
        // Check if the user can delete this post (owner or admin)
        if ($post->user_id !== $user->id && $user->role !== 'admin') {
            throw new \Exception('You are not authorized to delete this post.');
        }
        
        // Delete the post
        $post->delete();
        
        return $post;
    }
}
