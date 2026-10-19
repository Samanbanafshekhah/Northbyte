<?php
namespace App\Services;
use App\Models\User;use Illuminate\Support\Facades\DB;use Illuminate\Http\Request;
class SessionBridge {
 public static function issue(Request $request,User $user):array{
  if($old=$request->session()->get('node_token_hash'))DB::table('sessions')->where('token',$old)->delete();
  $token=bin2hex(random_bytes(32));$csrf=bin2hex(random_bytes(32));$hash=hash('sha256',$token);
  DB::table('sessions')->insert(['token'=>$hash,'user_id'=>$user->id,'csrf'=>$csrf,'expires'=>(int)(microtime(true)*1000)+config('session.lifetime')*60000]);$request->session()->put('node_token_hash',$hash);
  return ['csrf'=>$csrf,'cookie'=>cookie('nb_session',$token,0,'/',null,config('session.secure'),true,false,'strict')];
 }
 public static function clear(Request $request):void{if($token=$request->session()->get('node_token_hash'))DB::table('sessions')->where('token',$token)->delete();}
}
