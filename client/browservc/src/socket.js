import { io } from "socket.io-client";

const socket = io("ws://92.205.229.172:1200/", { transports: ["websocket"] });

export default socket;
