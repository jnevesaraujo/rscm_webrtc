import express, {Application} from "express";
import socketIO, { Server as SocketIOServer } from "socket.io";
import { createServer, Server as HTTPServer } from "http";
import path from 'path';

// Servidor de Sinalização responsável pela descoberta 
// de pares e encaminhamento de mensagens SDP
export class Server {
    private httpServer!: HTTPServer;
    private app!: Application;
    private io!: SocketIOServer;
    private activeSockets: string[] = [];
    
    private readonly DEFAULT_PORT = Number(process.env.PORT) || 5000;

    constructor() {
        
        this.initialize();
        this.handleRoutes();
        this.handleSocketConnection();

    }

    private initialize(): void {

        this.app = express();
        this.httpServer = createServer(this.app);
//        this.io = new SocketIOServer(this.httpServer);

        // Configuração do WebSocket (Socket.IO) para criar o canal de controlo bidirecional
        this.io = new SocketIOServer(this.httpServer, {
            cors: {
                origin: "*", // Para testes
                methods: ["GET", "POST"]
            }
        });
        this.configureApp();
//        this.handleSocketConnection();
    
    }

    private handleRoutes(): void {

/*         this.app.get("/", (req, res) => {
            res.send(`<h1>Hello World</h1>`)
        }); */

    }

    private handleSocketConnection(): void {

        // Gestão de eventos WebSocket: 
        // Deteta conexões para manter o estado de presença (quem está online)
        this.io.on("connection", socket => {
            console.log("Novo socket conectado:", socket.id);
            const existingSocket = this.activeSockets.find(
                existingSocket => existingSocket === socket.id
            );

            if(!existingSocket){
                this.activeSockets.push(socket.id);
                console.log("Socket adicionado. Total ativos:", this.activeSockets.length);

                // Notificação de Presença: Informa o novo utilizador 
                // e a rede sobre a lista atualizada de pares
                socket.emit("update-user-list", {
                    users: this.activeSockets.filter(
                        existingSocket => existingSocket !== socket.id
                    )
                });

                socket.broadcast.emit("update-user-list", {
                    users: [socket.id] 
                });
            } else {
                console.log("Socket já existe");
            }

            // Encaminhamento de Oferta (Signaling): 
            // Recebe o SDP Offer de A e reenvia para B
            socket.on("call-user", data => {
                socket.to(data.to).emit("call-made", {
                    offer: data.offer,
                    socket: socket.id
                });
            });
            
            // Encaminhamento de Resposta (Signaling): 
            // Recebe o SDP Answer de B e devolve para A, fechando a negociação
            socket.on("make-answer", data => {
                socket.to(data.to).emit("answer-made", {
                    socket: socket.id,
                    answer: data.answer
                });
            });

            // Gestão de Desconexão: Remove o utilizador 
            // da lista ativa e notifica os restantes
            socket.on("disconnect", (reason) => {
            this.activeSockets = this.activeSockets.filter(
                existingSocket => existingSocket !== socket.id
            );
            socket.broadcast.emit("remove-user", {
                socketId: socket.id
            });
            
        });

    });
}

    private configureApp(): void {

        // Servidor de Conteúdos Estáticos: 
        // Disponibiliza a aplicação cliente (HTML/JS)
        const publicPath = path.join(process.cwd(), "public");
        console.log("📁 Servindo pasta public de:", publicPath);
        this.app.use(express.static(publicPath));

    }

    public listen(callback: (port: number) => void): void {
        
        // Inicialização do Servidor: Coloca o servidor HTTP à escuta 
        // na porta definida para aceitar conexões de entrada
        this.httpServer.listen(this.DEFAULT_PORT, () =>
            callback(this.DEFAULT_PORT)
        );

    }

}