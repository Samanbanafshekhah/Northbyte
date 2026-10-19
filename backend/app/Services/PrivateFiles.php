<?php
namespace App\Services;
use App\Models\{Project,ProjectAttachment,User};use Illuminate\Http\UploadedFile;use Illuminate\Support\Facades\Storage;use Illuminate\Validation\ValidationException;use ZipArchive;
class PrivateFiles {
 public function store(UploadedFile $file,Project $project,User $user,bool $visible=true):ProjectAttachment{
  $limit=min((int)Operations::setting('attachment_mb',config('northbyte.attachment_mb')),config('northbyte.max_attachment_mb'))*1024*1024;
  $fail=fn()=>throw ValidationException::withMessages(['file'=>'Choose a valid PDF, PNG, JPG, WEBP or DOCX file within the configured size limit.']);
  if(!$file->isValid()||$file->getSize()<1||$file->getSize()>$limit)$fail();
  $ext=strtolower($file->getClientOriginalExtension());$mime=$file->getMimeType();$path=$file->getRealPath();
  $allowed=['pdf'=>['application/pdf'],'png'=>['image/png'],'jpg'=>['image/jpeg'],'jpeg'=>['image/jpeg'],'webp'=>['image/webp'],'docx'=>['application/zip','application/vnd.openxmlformats-officedocument.wordprocessingml.document']];
  if(config('northbyte.zip_uploads'))$allowed['zip']=['application/zip','application/x-zip-compressed'];
  if(!isset($allowed[$ext])||!in_array($mime,$allowed[$ext],true))$fail();
  if(in_array($ext,['png','jpg','jpeg','webp'])&&!@getimagesize($path))$fail();
  if($ext==='pdf'&&file_get_contents($path,false,null,0,5)!=='%PDF-')$fail();
  if(in_array($ext,['docx','zip'])){$zip=new ZipArchive();if($zip->open($path)!==true)$fail();$bad=$zip->numFiles>2000;$total=0;for($i=0;$i<$zip->numFiles;$i++){$entry=$zip->statIndex($i);$name=$entry['name'];$total+=$entry['size'];if(preg_match('~(^[/\\\\]|(^|[/\\\\])\.\.([/\\\\]|$)|\.(exe|dll|js|php|html|bat|cmd|ps1|vbs|lnk)$|vbaProject|oleObject)~i',$name)||$entry['size']>max(1048576,$entry['comp_size']*100))$bad=true;}if($total>104857600)$bad=true;if($ext==='docx'&&($zip->locateName('[Content_Types].xml')===false||$zip->locateName('word/document.xml')===false))$bad=true;$zip->close();if($bad)$fail();}
  $name=mb_substr(preg_replace('~[\x00-\x1f/\\\\]~u','_', $file->getClientOriginalName()),0,120);
  $stored=$file->store('projects/'.hash('sha256',$project->id),'local');
  try{$attachment=ProjectAttachment::create(['project_id'=>$project->id,'uploader_id'=>$user->id,'name'=>$name,'path'=>$stored,'mime_type'=>$ext==='docx'?'application/vnd.openxmlformats-officedocument.wordprocessingml.document':$mime,'size'=>$file->getSize(),'client_visible'=>$visible]);Operations::log($user,'file.uploaded','project',$project->id,['file_id'=>$attachment->id,'size'=>$attachment->size]);return $attachment;}catch(\Throwable $error){Storage::disk('local')->delete($stored);throw $error;}
 }
}
