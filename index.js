import http from "node:http";
import path from "node:path";

import express from "express";
import {Server} from "socket.io";

import {publisher, subscriber} from "./redis-connection.js";

const CHECKBOX_SIZE = 100;

const state = {
   checkboxes: new Array(CHECKBOX_SIZE).fill(false),
}

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
      state.checkboxes[index] = checked; 
      io.emit("server:checkbox:change", {index, checked});
   }
 });

 //Socket IO handler
 io.on("connection",(socket)=>{
   console.log("Socket connected", {id: socket.id});

   socket.on("client:checkbox:change",async (data)=>{
   console.log(`[Socket: ${socket.id}]: client:checkbox:change`,data);
   //io.emit("server:checkbox:change", data);
   //state.checkboxes[data.index] = data.checked;    //data have {index,checked} values
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
 
 app.get("/checkboxes", (req,res)=>{
   return res.json({checkboxes: state.checkboxes});
 })
}

main();