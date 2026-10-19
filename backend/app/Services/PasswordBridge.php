<?php
namespace App\Services;
use Symfony\Component\Process\Process;
class PasswordBridge {
 public static function check(string $password,string $encoded):bool{
  if(str_starts_with($encoded,'$2')||str_starts_with($encoded,'$argon'))return password_verify($password,$encoded);
  if(!preg_match('/^[a-f0-9]{32}:[a-f0-9]{128}$/',$encoded))return false;
  // Preserve Windows crypto initialization and use Node's own OpenSSL configuration.
  $process=new Process([config('northbyte.node_binary'),config('northbyte.root').'/messaging/verify-password.mjs'], null, ['SystemRoot'=>getenv('SystemRoot') ?: false,'OPENSSL_CONF'=>false,'OPENSSL_MODULES'=>false]);$process->setInput(json_encode(['password'=>$password,'encoded'=>$encoded]));$process->setTimeout(10);$process->run();return $process->isSuccessful()&&trim($process->getOutput())==='true';
 }
}
