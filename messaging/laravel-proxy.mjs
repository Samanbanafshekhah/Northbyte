import http from 'node:http';
export function laravelRoute(path){return path==='/admin'||path.startsWith('/admin/')||path.startsWith('/api/admin/')||path.startsWith('/api/client/')||path==='/api/public/content'||path.startsWith('/sanctum/');}
export function proxyLaravel(req,res){
 const upstream=http.request({hostname:'127.0.0.1',port:Number(process.env.LARAVEL_PORT||8001),path:req.url,method:req.method,headers:{...req.headers,connection:'close'}},response=>{res.writeHead(response.statusCode,response.headers);response.pipe(res);});
 upstream.on('error',()=>{if(!res.headersSent)res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({message:'The administration service is unavailable. Start the Laravel backend.'}));});
 req.on('aborted',()=>upstream.destroy());req.pipe(upstream);
}
