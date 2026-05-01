import http from "node:http";
import path from "node:path";

import express from "express";
import {Server} from "socket.io";

async function main() {
 const app = express();
 const httpServer = http.createServer(app);
 const io = new Server();
 io.attach(httpServer); 
 
 const PORT = process.env.PORT ?? 8000;

 //Socket IO handler
 io.on("connection",(socket)=>{
   console.log("Socket connected", {id: socket.id});

   socket.on("client:checkbox:change",(data)=>{
   console.log(`[Socket: ${socket.id}]: client:checkbox:change`,data);
   io.emit("server:checkbox:change", data);
 });
 
 });
 

//Express handler
 app.use(express.static(path.resolve("./public")) );

 httpServer.listen(PORT, () => {
    console.log(`server is running on host machine http://localhost:${PORT}`);
 });

 app.get("/health", (req,res)=>{
    return res.json({healthy:true});
 });

}

main();