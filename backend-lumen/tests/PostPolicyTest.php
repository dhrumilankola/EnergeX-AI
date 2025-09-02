<?php

namespace Tests;

use Laravel\Lumen\Testing\DatabaseMigrations;

class PostPolicyTest extends TestCase
{
    use DatabaseMigrations;

    public function test_owner_can_delete_their_post_and_non_owner_cannot(): void
    {
        // Register owner
        $ownerRegister = [
            'query' => 'mutation Register($name: String!, $email: String!, $password: String!) { register(name: $name, email: $email, password: $password) { token user { id } } }',
            'variables' => ['name' => 'Owner', 'email' => 'owner@example.com', 'password' => 'password123'],
        ];

        $response = $this->post('/graphql', $ownerRegister);
        $response->seeStatusCode(200);
        $content = json_decode($response->response->getContent(), true);
        
        // Check for errors first
        if (isset($content['errors'])) {
            $this->fail('Owner registration failed: ' . json_encode($content['errors']));
        }
        
        $ownerToken = $content['data']['register']['token'];

        // Register another user
        $otherRegister = [
            'query' => 'mutation Register($name: String!, $email: String!, $password: String!) { register(name: $name, email: $email, password: $password) { token user { id } } }',
            'variables' => ['name' => 'Other', 'email' => 'other@example.com', 'password' => 'password123'],
        ];

        $response = $this->post('/graphql', $otherRegister);
        $response->seeStatusCode(200);
        $content = json_decode($response->response->getContent(), true);
        
        if (isset($content['errors'])) {
            $this->fail('Other user registration failed: ' . json_encode($content['errors']));
        }
        
        $otherToken = $content['data']['register']['token'];

        // Owner creates a post
        $createMutation = [
            'query' => 'mutation CreatePost($title: String!, $content: String!) { createPost(title: $title, content: $content) { id } }',
            'variables' => ['title' => 'Owner Post', 'content' => 'Owner Content'],
        ];

        $response = $this->post('/graphql', $createMutation, ['Authorization' => 'Bearer ' . $ownerToken]);
        $response->seeStatusCode(200);
        $content = json_decode($response->response->getContent(), true);
        
        if (isset($content['errors'])) {
            $this->fail('Post creation failed: ' . json_encode($content['errors']));
        }
        
        $postId = $content['data']['createPost']['id'];

        // Non-owner tries to delete (should fail)
        $deleteMutation = [
            'query' => 'mutation DeletePost($id: ID!) { deletePost(id: $id) { success } }',
            'variables' => ['id' => $postId],
        ];

        $response = $this->post('/graphql', $deleteMutation, ['Authorization' => 'Bearer ' . $otherToken]);
        $response->seeStatusCode(200);
        $content = json_decode($response->response->getContent(), true);
        
        // Should have an error
        $this->assertArrayHasKey('errors', $content);

        // Owner deletes (should succeed)
        $response = $this->post('/graphql', $deleteMutation, ['Authorization' => 'Bearer ' . $ownerToken]);
        $response->seeStatusCode(200);
        $content = json_decode($response->response->getContent(), true);
        
        // Should not have errors
        $this->assertArrayNotHasKey('errors', $content);
        $this->assertArrayHasKey('data', $content);
    }
}