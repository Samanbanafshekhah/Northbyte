<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();
        $middleware->alias(['admin'=>\App\Http\Middleware\AdminAccess::class,'client.session'=>\App\Http\Middleware\ClientSession::class,'admin.session'=>\Laravel\Sanctum\Http\Middleware\AuthenticateSession::class]);
        $middleware->redirectGuestsTo('/admin/login');
        $middleware->encryptCookies(except:['nb_session']);
        $middleware->web(append:[\App\Http\Middleware\AdminHeaders::class]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(fn($request,$e)=>$request->is('api/*')||$request->expectsJson());
    })->create();
