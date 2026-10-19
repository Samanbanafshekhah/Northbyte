<?php
namespace App\Http\Middleware;
use Closure;use Illuminate\Http\Request;
class AdminAccess {
 public function handle(Request $request,Closure $next,?string $capability=null){$user=$request->user();abort_unless($user&&$user->status==='active'&&$user->role!=='client',403,'Administrative access required.');if($capability)abort_unless($user->allows($capability),403,'Permission denied.');if($hash=$request->session()->get('node_token_hash'))\Illuminate\Support\Facades\DB::table('sessions')->where('token',$hash)->where('user_id',$user->id)->update(['expires'=>(int)(microtime(true)*1000)+config('session.lifetime')*60000]);app()->setLocale($request->header('Accept-Language')==='fa'?'fa':'en');return $next($request);}
}
