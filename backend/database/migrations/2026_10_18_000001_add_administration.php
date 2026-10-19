<?php
use Illuminate\Database\Migrations\Migration;use Illuminate\Database\Schema\Blueprint;use Illuminate\Support\Facades\{Schema,DB};
return new class extends Migration {
 public function up():void{
  $sqlite=DB::getDriverName()==='sqlite';
  $add=function(string $table,string $column,callable $definition){if(!Schema::hasColumn($table,$column))Schema::table($table,$definition);};
  $add('users','status',fn(Blueprint $t)=>$t->string('status',20)->default('active'));
  foreach(['company','phone'] as $column)$add('users',$column,fn(Blueprint $t)=>$t->string($column)->nullable());
  foreach(['permissions','notification_preferences'] as $column)$add('users',$column,fn(Blueprint $t)=>$t->json($column)->nullable());
  $add('users','locale',fn(Blueprint $t)=>$t->string('locale',2)->default('en'));
  $add('users','last_login_at',fn(Blueprint $t)=>$t->timestamp('last_login_at')->nullable());$add('users','remember_token',fn(Blueprint $t)=>$t->rememberToken());
  foreach(['types','details'] as $column)$add('projects',$column,fn(Blueprint $t)=>$t->json($column)->nullable());
  foreach(['budget','timeline'] as $column)$add('projects',$column,fn(Blueprint $t)=>$t->string($column)->nullable());
  foreach(['goal','target_users','notes'] as $column)$add('projects',$column,fn(Blueprint $t)=>$t->text($column)->nullable());
  $add('projects','updated_at',fn(Blueprint $t)=>$t->timestamp('updated_at')->nullable());$add('projects','version',fn(Blueprint $t)=>$t->unsignedInteger('version')->default(1));
  foreach(['users','projects'] as $table){if($sqlite){$hasReference=collect(DB::select('PRAGMA foreign_key_list('.$table.')'))->contains(fn($row)=>$row->from==='assigned_to');if(Schema::hasColumn($table,'assigned_to')&&!$hasReference){DB::statement('ALTER TABLE '.$table.' RENAME COLUMN assigned_to TO assigned_to_legacy');}if(!Schema::hasColumn($table,'assigned_to'))DB::statement('ALTER TABLE '.$table.' ADD COLUMN assigned_to VARCHAR(80) REFERENCES users(id)');if(Schema::hasColumn($table,'assigned_to_legacy'))DB::statement('UPDATE '.$table.' SET assigned_to=assigned_to_legacy WHERE assigned_to IS NULL AND assigned_to_legacy IS NOT NULL');}else{$add($table,'assigned_to',function(Blueprint $t){$t->string('assigned_to',80)->nullable();$t->foreign('assigned_to')->references('id')->on('users');});}}
  foreach([['users','users_status_index',['status']],['projects','projects_owner_id_status_index',['owner_id','status']],['projects','projects_assigned_to_index',['assigned_to']]] as [$table,$index,$columns])if(!Schema::hasIndex($table,$index))Schema::table($table,fn(Blueprint $t)=>$t->index($columns,$index));
  Schema::create('project_milestones',function(Blueprint $t){$t->uuid('id')->primary();$t->string('project_id',80);$t->string('title',180);$t->date('due_date')->nullable();$t->boolean('completed')->default(false);$t->boolean('client_visible')->default(true);$t->timestamps();$t->foreign('project_id')->references('id')->on('projects');});
  Schema::create('project_attachments',function(Blueprint $t){$t->uuid('id')->primary();$t->string('project_id',80);$t->string('uploader_id',80);$t->string('name');$t->string('path')->unique();$t->string('mime_type');$t->unsignedBigInteger('size');$t->boolean('client_visible')->default(true);$t->timestamps();$t->softDeletes();$t->foreign('project_id')->references('id')->on('projects');$t->foreign('uploader_id')->references('id')->on('users');});
  Schema::create('admin_notes',function(Blueprint $t){$t->uuid('id')->primary();$t->string('resource_type',20);$t->string('resource_id',80);$t->string('author_id',80);$t->text('body');$t->timestamps();$t->index(['resource_type','resource_id']);$t->foreign('author_id')->references('id')->on('users');});
  Schema::create('activity_logs',function(Blueprint $t){$t->id();$t->string('actor_id',80)->nullable();$t->string('action',100)->index();$t->string('target_type',40);$t->string('target_id',80)->nullable();$t->json('changes')->nullable();$t->timestamp('created_at')->index();$t->foreign('actor_id')->references('id')->on('users');$t->index(['target_type','target_id']);});
  Schema::create('admin_notifications',function(Blueprint $t){$t->uuid('id')->primary();$t->string('user_id',80);$t->string('event_key',150);$t->string('kind',40);$t->string('target_type',40);$t->string('target_id',80);$t->timestamp('read_at')->nullable();$t->timestamp('created_at');$t->unique(['user_id','event_key']);$t->index(['user_id','read_at']);$t->foreign('user_id')->references('id')->on('users');});
  Schema::create('site_contents',function(Blueprint $t){$t->string('key',80)->primary();$t->json('draft');$t->json('published')->nullable();$t->unsignedInteger('version')->default(1);$t->timestamp('published_at')->nullable();$t->string('updated_by',80)->nullable();$t->timestamps();});
  Schema::create('admin_settings',function(Blueprint $t){$t->string('key',80)->primary();$t->json('value');$t->timestamps();});
 }
 public function down():void{/* No destructive rollback against shared data. */}
};
