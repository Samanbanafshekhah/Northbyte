<?php
namespace App\Policies;
use App\Models\{User,Project};
class ProjectPolicy {
 public function view(User $user,Project $project):bool{return $user->status==='active'&&($user->role==='client'?$project->owner_id===$user->id:($user->allows('projects')||$user->allows('files'))&&($user->isManager()||$project->assigned_to===$user->id));}
 public function update(User $user,Project $project):bool{return $user->allows('projects')&&($user->isManager()||$project->assigned_to===$user->id);}
}
