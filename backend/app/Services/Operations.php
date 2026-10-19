<?php
namespace App\Services;
use App\Models\{User,Project};use Illuminate\Support\Facades\DB;use Illuminate\Support\Str;use Illuminate\Support\Facades\Mail;
class Operations {
 public static function log(?User $actor,string $action,string $type,?string $id,array $changes=[]):void{DB::table('activity_logs')->insert(['actor_id'=>$actor?->id,'action'=>$action,'target_type'=>$type,'target_id'=>$id,'changes'=>json_encode($changes,JSON_UNESCAPED_UNICODE),'created_at'=>now()]);}
 public static function notify(string $kind,string $type,string $id,?Project $project=null):void{foreach(User::where('status','active')->whereIn('role',['super_admin','admin','team_member'])->get() as $user){if(!$user->allows('notifications')||$project&&!$user->isManager()&&$project->assigned_to!==$user->id)continue;DB::table('admin_notifications')->insert(['id'=>(string)Str::uuid(),'user_id'=>$user->id,'event_key'=>Str::uuid()->toString(),'kind'=>$kind,'target_type'=>$type,'target_id'=>$id,'created_at'=>now()]);self::mail($user);}}
 public static function mail(User $user):void{if(config('northbyte.mail_notifications')&&($user->notification_preferences['email']??false))$user->notify((new \App\Notifications\WorkspaceUpdate)->locale($user->locale)->afterCommit());}
 public static function projectScope($query,User $user){return $user->role==='client'?$query->where('owner_id',$user->id):($user->isManager()?$query:$query->where('assigned_to',$user->id));}
 public static function setting(string $key,$default=null){$row=DB::table('admin_settings')->where('key',$key)->first();return $row?json_decode($row->value,true):$default;}
 public static function status(string $status):string{return ['Submitted'=>'New Request','Draft'=>'New Request','In Progress'=>'In Development','Need More Information'=>'Awaiting Client Information','Planning'=>'Approved'][$status]??$status;}
 public const STATUSES=['New Request','Under Review','Awaiting Client Information','Proposal Sent','Approved','In Development','Testing','Completed','Rejected','Cancelled'];
}
