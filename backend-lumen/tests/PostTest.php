<?php

namespace Tests;

class PostTest extends TestCase
{
    private function graphql(string $query, array $variables = [], array $headers = [])
    {
        return $this->post('/graphql', [
            'query' => $query,
            'variables' => $variables,
        ], $headers);
    }

    public function test_create_post_requires_auth(): void
    {
        $mutation = 'mutation Create($title: String!, $content: String!) { createPost(title: $title, content: $content) { id title content user { id } } }';
        $this->graphql($mutation, ['title' => 'A', 'content' => 'B']);
        $this->seeStatusCode(200);
        $this->seeJsonContains(['message' => 'You must be logged in to create a post.']);
    }

    public function test_create_and_delete_post_owner_flow(): void
    {
        // Register and obtain token
        $register = [
            'query' => 'mutation Register($name: String!, $email: String!, $password: String!) { register(name: $name, email: $email, password: $password) { token user { id name email } } }',
            'variables' => [
                'name' => 'Owner',
                'email' => 'owner@example.com',
                'password' => 'password123',
            ],
        ];
        $this->post('/graphql', $register);
        $this->seeStatusCode(200);
        $token = json_decode($this->response->getContent(), true)['data']['register']['token'];

        // Create post
        $createMutation = 'mutation Create($title: String!, $content: String!) { createPost(title: $title, content: $content) { id title content user { id } } }';
        $this->post('/graphql', [
            'query' => $createMutation,
            'variables' => ['title' => 'Title', 'content' => 'Body'],
        ], [
            'Authorization' => 'Bearer '.$token,
        ]);
        $this->seeStatusCode(200);
        $post = json_decode($this->response->getContent(), true)['data']['createPost'];

        // Delete post as owner
        $deleteMutation = 'mutation Delete($id: ID!) { deletePost(id: $id) { id title } }';
        $this->post('/graphql', [
            'query' => $deleteMutation,
            'variables' => ['id' => $post['id']],
        ], [
            'Authorization' => 'Bearer '.$token,
        ]);
        $this->seeStatusCode(200);
        $this->seeJsonStructure(['data' => ['deletePost' => ['id', 'title']]]);
    }
}
