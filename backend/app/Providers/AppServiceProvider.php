<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Project::class,\App\Policies\ProjectPolicy::class);
        \Illuminate\Support\Facades\RateLimiter::for('admin-login',fn($r)=>[\Illuminate\Cache\RateLimiting\Limit::perMinute(30)->by($r->ip()),\Illuminate\Cache\RateLimiting\Limit::perMinute(5)->by(strtolower((string)$r->input('email')))]);
        \Illuminate\Auth\Notifications\ResetPassword::createUrlUsing(fn($user,$token)=>config('app.url').'/admin/login?reset_token='.urlencode($token).'&email='.urlencode($user->email));
    }
}
