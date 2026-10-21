import "dotenv/config";
import app from "./src/app.js";
import http from "http";
import connectDB from "./src/config/database.js";
import { initSocket } from "./src/sockets/server.socket.js";

const PORT = process.env.PORT || 3000;


const httpServer = http.createServer(app);

initSocket(httpServer);

try {
    await connectDB();
    httpServer.listen(PORT, () => console.log('Server running on port ' + PORT));
} catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
}
