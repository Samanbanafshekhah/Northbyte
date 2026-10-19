<?php
namespace App\Models;
use Illuminate\Foundation\Auth\User as Authenticatable;use Illuminate\Notifications\Notifiable;use Laravel\Sanctum\HasApiTokens;use Illuminate\Database\Eloquent\Concerns\HasUuids;
class User extends Authenticatable {
 use HasApiTokens,Notifiable,HasUuids;public const UPDATED_AT=null;protected $guarded=[];protected $hidden=['password','remember_token'];
 protected function casts():array{return ['permissions'=>'array','notification_preferences'=>'array','created_at'=>'datetime','last_login_at'=>'datetime'];}
 public function capabilities():array{$base=match($this->role){'super_admin'=>['dashboard','clients','projects','messages','files','team','content','notifications','activity','settings'],'admin'=>['dashboard','clients','projects','messages','files','content','notifications','activity'],'team_member'=>['dashboard','projects','messages','files','notifications'],default=>[]};return $this->role==='super_admin'||$this->permissions===null?$base:array_values(array_intersect($base,$this->permissions));}
 public function allows(string $capability):bool{return $this->status==='active'&&in_array($capability,$this->capabilities(),true);}
 public function isManager():bool{return in_array($this->role,['super_admin','admin'],true);}
 public function projects(){return $this->hasMany(Project::class,'owner_id');}
 public function setEmailAttribute($value):void{$this->attributes['email']=strtolower(trim($value));}
}
