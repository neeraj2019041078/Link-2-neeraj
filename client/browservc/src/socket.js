import { io } from "socket.io-client";

const socket = io("http://localhost:1200/", { transports: ["websocket"] });

export default socket;
