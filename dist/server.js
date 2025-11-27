"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const path_1 = __importDefault(require("path"));
class Server {
    constructor() {
        this.activeSockets = [];
        this.DEFAULT_PORT = Number(process.env.PORT) || 5000;
        this.initialize();
        this.handleRoutes();
        this.handleSocketConnection();
    }
    initialize() {
        this.app = (0, express_1.default)();
        this.httpServer = (0, http_1.createServer)(this.app);
        //        this.io = new SocketIOServer(this.httpServer);
        // Adiciona configuração CORS
        this.io = new socket_io_1.Server(this.httpServer, {
            cors: {
                origin: "*", // Para testes - em produção restringe isto
                methods: ["GET", "POST"]
            }
        });
        this.configureApp();
        //        this.handleSocketConnection();
    }
    handleRoutes() {
        /*         this.app.get("/", (req, res) => {
                    res.send(`<h1>Hello World</h1>`)
                }); */
    }
    handleSocketConnection() {
        this.io.on("connection", socket => {
            console.log("Novo socket conectado:", socket.id);
            const existingSocket = this.activeSockets.find(existingSocket => existingSocket === socket.id);
            if (!existingSocket) {
                this.activeSockets.push(socket.id);
                console.log("Socket adicionado. Total ativos:", this.activeSockets.length);
                socket.emit("update-user-list", {
                    users: this.activeSockets.filter(existingSocket => existingSocket !== socket.id)
                });
                socket.broadcast.emit("update-user-list", {
                    users: [socket.id]
                });
            }
            else {
                console.log("Socket já existe");
            }
            socket.on("call-user", data => {
                socket.to(data.to).emit("call-made", {
                    offer: data.offer,
                    socket: socket.id
                });
            });
            socket.on("make-answer", data => {
                socket.to(data.to).emit("answer-made", {
                    socket: socket.id,
                    answer: data.answer
                });
            });
            socket.on("disconnect", (reason) => {
                this.activeSockets = this.activeSockets.filter(existingSocket => existingSocket !== socket.id);
                socket.broadcast.emit("remove-user", {
                    socketId: socket.id
                });
            });
        });
    }
    configureApp() {
        this.app.use(express_1.default.static(path_1.default.join(__dirname, "../public")));
    }
    listen(callback) {
        this.httpServer.listen(this.DEFAULT_PORT, () => callback(this.DEFAULT_PORT));
    }
}
exports.Server = Server;
