<?php

namespace App\GraphQL\Mutations;

use App\Models\User;
use GraphQL\Type\Definition\ResolveInfo;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;
use GraphQL\Error\Error;

class AuthMutator
{
    public function register(mixed $root, array $args, GraphQLContext $context, ResolveInfo $resolveInfo): array
    {
        $user = User::create([
            'name' => $args['name'],
            'email' => $args['email'],
            'password' => Hash::make($args['password']),
            'role' => 'user', // Set default role
        ]);

        $token = Auth::login($user);

        return [
            'token' => $token,
            'user' => $user,
        ];
    }

    public function login(mixed $root, array $args, GraphQLContext $context, ResolveInfo $resolveInfo): array
    {
        $credentials = [
            'email' => $args['email'],
            'password' => $args['password'],
        ];

        if (! $token = Auth::attempt($credentials)) {
            throw new Error('Invalid credentials.');
        }

        return [
            'token' => $token,
            'user' => Auth::user(),
        ];
    }
}