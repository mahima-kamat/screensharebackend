import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

// Health check endpoint
app.get("/health", (req, res) => {
  res.send({ status: "healthy", timestamp: new Date() });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // User joins a signaling room
  socket.on("join-room", (roomId) => {
    if (!roomId) return;
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);
  });

  // Relay WebRTC Offer
  socket.on("offer", ({ roomId, offer }) => {
    if (!roomId || !offer) return;
    console.log(`Relaying offer from ${socket.id} to room: ${roomId}`);
    socket.to(roomId).emit("offer", offer);
  });

  // Relay WebRTC Answer
  socket.on("answer", ({ roomId, answer }) => {
    if (!roomId || !answer) return;
    console.log(`Relaying answer from ${socket.id} to room: ${roomId}`);
    socket.to(roomId).emit("answer", answer);
  });

  // Relay ICE Candidates
  socket.on("ice-candidate", ({ roomId, candidate }) => {
    if (!roomId || !candidate) return;
    socket.to(roomId).emit("ice-candidate", candidate);
  });

  // Notify other room members that screen share has stopped
  socket.on("screen-share-stopped", ({ roomId }) => {
    if (!roomId) return;
    console.log(`Screen share stopped notification from ${socket.id} in room: ${roomId}`);
    socket.to(roomId).emit("screen-share-stopped");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Signaling server is running on http://localhost:${PORT}`);
});
