import http from "node:http";
import express from "express";

async function main() {
 const app = express();
 const httpServer = http.createServer(app);
 const PORT = process.env.PORT ?? 8000;

 httpServer.listen(PORT, () => {
    console.log(`server is running on host machine http://localhost:${PORT}`);
 });

 app.get("/health", (req,res)=>{
    return res.json({healthy:true});
 });

}

main();