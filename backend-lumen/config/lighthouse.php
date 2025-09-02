<?php

return [
    'route' => [
        'uri' => 'graphql',
        'middleware' => [
            \Nuwave\Lighthouse\Http\Middleware\AcceptJson::class,
        ],
    ],
    'schema' => [
        'register' => base_path('graphql/schema.graphql'),
    ],
    'namespaces' => [
        'models' => 'App\\Models',
        'queries' => 'App\\GraphQL\\Queries',
        'mutations' => 'App\\GraphQL\\Mutations',
        'subscriptions' => 'App\\GraphQL\\Subscriptions',
        'interfaces' => 'App\\GraphQL\\Interfaces',
        'unions' => 'App\\GraphQL\\Unions',
        'scalars' => 'App\\GraphQL\\Scalars',
        'directives' => 'App\\GraphQL\\Directives',
    ],
    'guards' => ['api'],
    'error_handlers' => [
        \Nuwave\Lighthouse\Execution\ErrorHandler::class,
    ],
    'cache' => [
        'enable' => env('LIGHTHOUSE_CACHE_ENABLE', false),
        'ttl' => env('LIGHTHOUSE_CACHE_TTL', null),
    ],
    'debug' => env('APP_DEBUG', false),
    'security' => [
        'max_query_complexity' => 0,
        'max_query_depth' => 0,
        'disable_introspection' => env('LIGHTHOUSE_DISABLE_INTROSPECTION', 0),
    ],
];