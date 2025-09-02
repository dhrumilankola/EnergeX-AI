<?php

namespace Tests;

use Laravel\Lumen\Testing\DatabaseMigrations;

class AuthTest extends TestCase
{
    use DatabaseMigrations;  // Add this line

    public function test_register_and_login_graphql(): void
    {
        $registerMutation = [
            'query' => 'mutation Register($name: String!, $email: String!, $password: String!) { register(name: $name, email: $email, password: $password) { token user { id name email } } }',
            'variables' => [
                'name' => 'Test User',
                'email' => 'testuser@example.com',
                'password' => 'password123',
            ],
        ];

        $response = $this->post('/graphql', $registerMutation);
        
        // Debug if still failing
        if ($response->response->getStatusCode() !== 200) {
            dump($response->response->getContent());
        }
        
        $this->seeStatusCode(200);
        $this->seeJsonStructure(['data' => ['register' => ['token', 'user' => ['id', 'name', 'email']]]]);

        $loginMutation = [
            'query' => 'mutation Login($email: String!, $password: String!) { login(email: $email, password: $password) { token user { id name email } } }',
            'variables' => [
                'email' => 'testuser@example.com',
                'password' => 'password123',
            ],
        ];

        $this->post('/graphql', $loginMutation);
        $this->seeStatusCode(200);
        $this->seeJsonStructure(['data' => ['login' => ['token', 'user' => ['id', 'name', 'email']]]]);
    }
}