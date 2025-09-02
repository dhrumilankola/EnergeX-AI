<?php

namespace Tests;

use Laravel\Lumen\Testing\DatabaseMigrations;

class PostTest extends TestCase
{
    use DatabaseMigrations;

    public function test_create_post_requires_auth(): void
    {
        $mutation = [
            'query' => 'mutation CreatePost($title: String!, $content: String!) { createPost(title: $title, content: $content) { id title content } }',
            'variables' => [
                'title' => 'Test Post',
                'content' => 'Test Content',
            ],
        ];

        $response = $this->post('/graphql', $mutation);
        $response->seeStatusCode(200); // GraphQL returns 200 even for errors
        
        // Check that there's an error (not data)
        $response->seeJsonStructure(['errors']);
        
        // Check that the error message contains authentication requirement
        $content = json_decode($response->response->getContent(), true);
        $this->assertArrayHasKey('errors', $content);
        $this->assertStringContainsString(
            'logged in', 
            $content['errors'][0]['extensions']['debugMessage'] ?? $content['errors'][0]['message']
        );
    }

    public function test_create_and_delete_post_owner_flow(): void
    {
        // First, register a user and get token
        $registerMutation = [
            'query' => 'mutation Register($name: String!, $email: String!, $password: String!) { register(name: $name, email: $email, password: $password) { token user { id name email } } }',
            'variables' => [
                'name' => 'Post Author',
                'email' => 'author@example.com',
                'password' => 'password123',
            ],
        ];

        $response = $this->post('/graphql', $registerMutation);
        $response->seeStatusCode(200);
        $content = json_decode($response->response->getContent(), true);
        
        // Check for errors first
        if (isset($content['errors'])) {
            $this->fail('Registration failed: ' . json_encode($content['errors']));
        }
        
        $token = $content['data']['register']['token'];
        $userId = $content['data']['register']['user']['id'];

        // Create a post with authentication
        $createMutation = [
            'query' => 'mutation CreatePost($title: String!, $content: String!) { createPost(title: $title, content: $content) { id title content user { id } } }',
            'variables' => [
                'title' => 'My Test Post',
                'content' => 'My Test Content',
            ],
        ];

        $response = $this->post('/graphql', $createMutation, ['Authorization' => 'Bearer ' . $token]);
        $response->seeStatusCode(200);
        $content = json_decode($response->response->getContent(), true);
        
        // Check for errors first
        if (isset($content['errors'])) {
            $this->fail('Post creation failed: ' . json_encode($content['errors']));
        }
        
        $this->assertArrayHasKey('data', $content);
        $postId = $content['data']['createPost']['id'];

        // Delete the post
        $deleteMutation = [
            'query' => 'mutation DeletePost($id: ID!) { deletePost(id: $id) { success } }',
            'variables' => [
                'id' => $postId,
            ],
        ];

        $response = $this->post('/graphql', $deleteMutation, ['Authorization' => 'Bearer ' . $token]);
        $response->seeStatusCode(200);
        $response->seeJsonStructure(['data' => ['deletePost']]);
    }
}