<?php

require_once __DIR__.'/../vendor/autoload.php';

(new Laravel\Lumen\Bootstrap\LoadEnvironmentVariables(
    dirname(__DIR__)
))->bootstrap();

date_default_timezone_set(env('APP_TIMEZONE', 'UTC'));

/*
|--------------------------------------------------------------------------
| Create The Application
|--------------------------------------------------------------------------
|
| Here we will load the environment and create the application instance
| that serves as the central piece of this framework. We'll use this
| application as an aesthetic and powerful way to deliver apps.
|
*/

$app = new Laravel\Lumen\Application(
    dirname(__DIR__)
);

$app->withFacades();
$app->withEloquent();

/*
|--------------------------------------------------------------------------
| Register Container Bindings
|--------------------------------------------------------------------------
|
| Now we will register a few bindings in the service container. We will
| register the exception handler and the console kernel. You may add
| your own bindings here if you like or you can make another file.
|
*/

$app->singleton(
    Illuminate\Contracts\Debug\ExceptionHandler::class,
    App\Exceptions\Handler::class
);

$app->singleton(
    Illuminate\Contracts\Console\Kernel::class,
    App\Console\Kernel::class
);

// Bind the ErrorHandler interface to a concrete implementation
$app->singleton(
    \Nuwave\Lighthouse\Execution\ErrorHandler::class,
    \Nuwave\Lighthouse\Execution\ReportingErrorHandler::class
);

/*
|--------------------------------------------------------------------------
| Register Config Files
|--------------------------------------------------------------------------
|
| Now we will register the config files for the application. Note that
| this array of configs is never loaded automatically.
|
*/

$app->configure('app');
$app->configure('database');
$app->configure('lighthouse');
$app->configure('jwt');
$app->configure('auth');


/*
|--------------------------------------------------------------------------
| Register Middleware
|--------------------------------------------------------------------------
|
| Next, we will register the middleware with the application. These can
| be global middleware that run before and after every request into a
| route or middleware that'll be assigned to some specific routes.
|
*/

$app->middleware([
    App\Http\Middleware\CorsMiddleware::class,
]);


/*
|--------------------------------------------------------------------------
| Register Service Providers
|--------------------------------------------------------------------------
|
| Here we will register all of the application's service providers which
| are used to bind services into the container. Service providers are
| totally optional, so you are not required to uncomment this line.
|
*/

$app->register(App\Providers\AppServiceProvider::class);
$app->register(App\Providers\AuthServiceProvider::class);
$app->register(Illuminate\Redis\RedisServiceProvider::class);
$app->register(Tymon\JWTAuth\Providers\LumenServiceProvider::class);

// Lighthouse Service Provider - MUST be registered!
$app->register(Nuwave\Lighthouse\LighthouseServiceProvider::class);
$app->register(Nuwave\Lighthouse\Auth\AuthServiceProvider::class);
$app->register(Nuwave\Lighthouse\Validation\ValidationServiceProvider::class);
$app->register(Nuwave\Lighthouse\GlobalId\GlobalIdServiceProvider::class);


/*
|--------------------------------------------------------------------------
| Load The Application Routes
|--------------------------------------------------------------------------
*/

// GraphQL routes - Lighthouse v6 uses a different namespace
$app->router->addRoute(['GET', 'POST', 'OPTIONS'], 'graphql', '\Nuwave\Lighthouse\Http\GraphQLController');

// Your application routes
$app->router->group([
    'namespace' => 'App\Http\Controllers',
], function ($router) {
    require __DIR__.'/../routes/web.php';
});

return $app;