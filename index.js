import http from "node:http";
import path from "node:path";

import express from "express";
import {Server} from "socket.io";

import {publisher, subscriber, redis} from "./redis-connection.js";
import Redis from "ioredis";

const CHECKBOX_SIZE = 100;
const CHECKBOX_STATE_KEY = "checkbox-state";

async function main() {
 const app = express();
 const httpServer = http.createServer(app);
 const io = new Server();
 io.attach(httpServer); 
 
 const PORT = process.env.PORT ?? 8000;

 await subscriber.subscribe("internal-server:checkbox:change");
 subscriber.on("message", (channel, message)=>{
   if(channel == "internal-server:checkbox:change"){
      const {index, checked} = JSON.parse(message);
      io.emit("server:checkbox:change", {index, checked});
   }
 });

 //Socket IO handler
 io.on("connection",(socket)=>{
   console.log("Socket connected", {id: socket.id});

   socket.on("client:checkbox:change",async (data)=>{
   console.log(`[Socket: ${socket.id}]: client:checkbox:change`,data);
   
   const existingState = await redis.get(CHECKBOX_STATE_KEY);
   
   if(existingState){
    const remoteData = JSON.parse(existingState);
    remoteData[data.index] = data.checked;
    await redis.set(CHECKBOX_STATE_KEY, JSON.stringify(remoteData));
   }
   else{  //for the first time
     await redis.set(CHECKBOX_STATE_KEY, JSON.stringify(new Array(CHECKBOX_SIZE).fill(false)) );
   }

   await publisher.publish("internal-server:checkbox:change", JSON.stringify(data) );
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
 
 app.get("/checkboxes", async (req,res)=>{
   const existingState = await redis.get(CHECKBOX_STATE_KEY);
   if(existingState){
       const remoteData = JSON.parse(existingState);
       return res.json({checkboxes: remoteData});
   }
   return res.json({checkboxes: new Array(CHECKBOX_SIZE).fill(false)});
 })
}

main();