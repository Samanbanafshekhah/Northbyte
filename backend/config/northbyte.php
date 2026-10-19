<?php
return ['root'=>dirname(base_path()),'node_binary'=>env('NODE_BINARY','node'),'origin'=>env('APP_URL','http://127.0.0.1:4173'),'mail_notifications'=>env('ADMIN_MAIL_NOTIFICATIONS',false),'zip_uploads'=>env('ALLOW_ZIP_UPLOADS',false),'attachment_mb'=>(int)env('ATTACHMENT_MAX_MB',20),'max_attachment_mb'=>(int)env('ATTACHMENT_HARD_MAX_MB',50)];
