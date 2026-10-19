<?php
namespace App\Http\Middleware;
use Closure;use Illuminate\Http\Request;
class AdminHeaders {
 public function handle(Request $request,Closure $next){$response=$next($request);$response->headers->set('X-Content-Type-Options','nosniff');$response->headers->set('Referrer-Policy','same-origin');$response->headers->set('X-Frame-Options','DENY');if(!$request->is('api/public/content'))$response->headers->set('Cache-Control','private, no-store');if($request->is('admin*'))$response->headers->set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' blob: data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");return $response;}
}
