<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;use Illuminate\Validation\Rule;use App\Services\Operations;
class ProjectRequest extends FormRequest {
 public function authorize():bool{return $this->user()&&($this->user()->role==='client'||$this->user()->allows('projects'));}
 protected function prepareForValidation():void{if($this->has('project')&&is_string($this->input('project'))){$data=json_decode($this->input('project'),true);if(is_array($data))$this->merge($data);}if($this->has('targetUsers')&&!$this->has('target_users'))$this->merge(['target_users'=>$this->input('targetUsers')]);}
 public function rules():array{$create=$this->isMethod('post');return ['title'=>($create?'required':'sometimes|required').'|string|max:140','owner_id'=>($this->user()?->role!=='client'&&$create?'required':'sometimes').'|exists:users,id','description'=>($create?'required':'sometimes|required').'|string|max:10000','status'=>['sometimes',Rule::in(Operations::STATUSES)],'assigned_to'=>'nullable|exists:users,id','types'=>'nullable|array|max:12','types.*'=>'string|max:80','budget'=>'nullable|string|max:100','timeline'=>'nullable|string|max:100','goal'=>'nullable|string|max:3000','target_users'=>'nullable|string|max:3000','notes'=>'nullable|string|max:5000','features'=>'nullable|array|max:80','features.*'=>'string|max:120','customFeatures'=>'nullable|array|max:40','customFeatures.*'=>'string|max:120','version'=>$create?'sometimes|integer|min:1':'required|integer|min:1','files'=>'nullable|array|max:6'];}
}
