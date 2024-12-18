require("dotenv").config();

const cors = require("cors");
const http = require("http");
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { ExpressPeerServer } = require("peer");


const app = express();
const server = http.createServer(app);

const options = {
    cors: {
        origin: [process.env.BASE_URL],
        methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"], // Allow WebSocket transport
};
const io = require("socket.io")(server, options);

const peerServer = ExpressPeerServer(server, { debug: true });

app.use(cors());
app.set("view engine", "ejs");
app.use("/peerjs", peerServer);
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.redirect(`/${uuidv4()}`);
});

app.get("/:roomId", (req, res) => {
    const { roomId } = req.params ?? {};
    res.render("room", { roomId, baseUrl: process.env.BASE_URL});
});


io.on("connection", (socket) => {
    console.log('user connected...!');

    socket.on("join-room", (roomId, peerId) => {
        socket.join(roomId);
        socket.broadcast.to(roomId).emit("user-connected", peerId);

        socket.on('disconnect', () => {
            socket.broadcast.to(roomId).emit('user-disconnected');
        });
    });
});

server.listen(process.env.PORT, () => {
    console.log('Server started at port  ', process.env.PORT);
});