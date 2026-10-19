<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;use Illuminate\Database\Eloquent\Concerns\HasUuids;use Illuminate\Database\Eloquent\SoftDeletes;
class ProjectAttachment extends Model {use HasUuids,SoftDeletes;protected $guarded=[];protected $hidden=['path'];protected function casts():array{return ['client_visible'=>'boolean'];}public function project(){return $this->belongsTo(Project::class);}}
