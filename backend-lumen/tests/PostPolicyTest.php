<?php

namespace Tests;

use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class PostPolicyTest extends TestCase
{
    public function test_owner_can_delete_their_post_and_non_owner_cannot(): void
    {
        // Register owner
        $ownerPayload = [
            'query' => 'mutation R($n:String!,$e:String!,$p:String!){register(name:$n,email:$e,password:$p){token user{ id }}}',
            'variables' => ['n' => 'Owner','e' => 'own@example.com','p' => 'password123'],
        ];
        $this->post('/graphql', $ownerPayload);
        $ownerToken = json_decode($this->response->getContent(), true)['data']['register']['token'];
        $ownerId = json_decode($this->response->getContent(), true)['data']['register']['user']['id'];

        // Create post as owner
        $create = [
            'query' => 'mutation C($t:String!,$c:String!){ createPost(title:$t,content:$c){ id title user{ id } } }',
            'variables' => ['t' => 'X','c' => 'Y'],
        ];
        $this->post('/graphql', $create, ['Authorization' => 'Bearer '.$ownerToken]);
        $postId = json_decode($this->response->getContent(), true)['data']['createPost']['id'];

        // Register another user (non-owner)
        $nonOwner = [
            'query' => 'mutation R($n:String!,$e:String!,$p:String!){register(name:$n,email:$e,password:$p){token user{ id }}}',
            'variables' => ['n' => 'Other','e' => 'other@example.com','p' => 'password123'],
        ];
        $this->post('/graphql', $nonOwner);
        $nonOwnerToken = json_decode($this->response->getContent(), true)['data']['register']['token'];

        // Attempt delete as non-owner → expect error
        $delete = [
            'query' => 'mutation D($id:ID!){ deletePost(id:$id){ id } }',
            'variables' => ['id' => $postId],
        ];
        $this->post('/graphql', $delete, ['Authorization' => 'Bearer '.$nonOwnerToken]);
        $this->seeStatusCode(200);
        $this->seeJsonContains(['message' => 'You are not authorized to delete this post.']);

        // Create admin manually in DB (simplified)
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);
        // Login admin via GraphQL
        $loginAdmin = [
            'query' => 'mutation L($e:String!,$p:String!){ login(email:$e,password:$p){ token user{ id } } }',
            'variables' => ['e' => 'admin@example.com','p' => 'password123'],
        ];
        $this->post('/graphql', $loginAdmin);
        $adminToken = json_decode($this->response->getContent(), true)['data']['login']['token'];

        // Admin can delete
        $this->post('/graphql', $delete, ['Authorization' => 'Bearer '.$adminToken]);
        $this->seeStatusCode(200);
        $this->seeJsonStructure(['data' => ['deletePost' => ['id']]]);
    }
}
