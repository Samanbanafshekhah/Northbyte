<?php
namespace App\Notifications;
use Illuminate\Bus\Queueable;use Illuminate\Contracts\Queue\ShouldQueue;use Illuminate\Notifications\Notification;use Illuminate\Notifications\Messages\MailMessage;
class WorkspaceUpdate extends Notification implements ShouldQueue {
 use Queueable;
 public function via(object $notifiable):array{return $notifiable->status==='active'&&$notifiable->allows('notifications')?['mail']:[];}
 public function toMail(object $notifiable):MailMessage{$fa=$notifiable->locale==='fa';return (new MailMessage)->subject($fa?'به‌روزرسانی فضای کاری نورث‌بایت':'NorthByte workspace update')->line($fa?'رویداد جدیدی در فضای کاری شما ثبت شده است. برای بررسی وارد شوید.':'A workspace update is ready. Sign in to review it.')->action($fa?'نمایش فضای کاری':'Open workspace',config('app.url').'/admin/dashboard');}
}
