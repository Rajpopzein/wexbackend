import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import "./dbconnection.js";
import userRouter from "./router/userRoute.js";
import postRouter from "./router/postRoute.js";

const PORT = 8000;

const app = express();

app.use(cors());

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const users = [];

app.use("/api/users", userRouter);
app.use("/api/posts", postRouter);

io.on("connection", (socket) => {
  console.log("user connected");
  users.push(socket?.id);

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("chat message", (msg) => {
    console.log("message: " + msg);
    users.forEach((element) => {
      if (element !== socket.id) {
        io.to(element).emit("chat message", msg);
      }
    });
    // io.emit("chat message", msg);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
