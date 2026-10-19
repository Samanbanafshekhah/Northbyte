<?php
$data=json_decode(stream_get_contents(STDIN,2048),true);
echo isset($data['password'],$data['encoded'])&&password_verify($data['password'],$data['encoded'])?'true':'false';
