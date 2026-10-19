<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;use Illuminate\Database\Eloquent\Concerns\HasUuids;
class Project extends Model {use HasUuids;protected $guarded=[];protected function casts():array{return ['types'=>'array','details'=>'array','version'=>'integer','created_at'=>'datetime','updated_at'=>'datetime'];}public function owner(){return $this->belongsTo(User::class,'owner_id');}public function assignee(){return $this->belongsTo(User::class,'assigned_to');}}
