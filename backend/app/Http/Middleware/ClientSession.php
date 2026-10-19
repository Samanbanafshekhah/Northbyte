<?php
namespace App\Http\Middleware;
use Closure;use Illuminate\Http\Request;use Illuminate\Support\Facades\{DB,Auth};use App\Models\User;
class ClientSession {
 public function handle(Request $r,Closure $next){$token=$r->cookie('nb_session');abort_unless(is_string($token)&&preg_match('/^[a-f0-9]{64}$/',$token),401);$session=DB::table('sessions')->where('token',hash('sha256',$token))->where('expires','>',(int)(microtime(true)*1000))->first();abort_unless($session,401);$user=User::find($session->user_id);abort_unless($user&&$user->status==='active'&&$user->role==='client',403);if(!in_array($r->method(),['GET','HEAD'])){abort_unless($r->header('Origin')===config('northbyte.origin')&&hash_equals($session->csrf,(string)$r->header('X-CSRF-Token')),403);}
  Auth::setUser($user);return $next($r);}
}
