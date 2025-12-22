## Demonstração de Video Chat com WebRTC
Uma aplicação simples de video chat ponto a ponto (peer-to-peer) construída com WebRTC, demonstrando capacidades de comunicação em tempo real para fins de investigação académica.

Objetivo: Esta aplicação foi desenvolvida no âmbito de um projeto académico para a unidade curricular de Redes e Serviços de Comunicação Multimédia para:

- Demonstrar a implementação de WebRTC na prática;
- Analisar o desempenho em diferentes condições de rede;
- Comparar uma implementação básica de WebRTC com soluções comerciais;
- Compreender a arquitetura e os compromissos (trade-offs) da comunicação ponto a ponto.

### Arquitetura Visão Geral do Sistema
```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│    Client A     │◄───────►│  Signaling       │◄───────►│    Client B     │
│                 │         │  Server          │         │                 │
│ • getUserMedia  │         │  (Socket.IO)     │         │ • getUserMedia  │
│ • PeerConnection│         │                  │         │ • PeerConnection│
│ • UI Controls   │         └──────────────────┘         │ • UI Controls   │
└────────┬────────┘                                      └────────┬────────┘
         │                                                        │
         │              ┌──────────────────┐                      │
         └─────────────►│  STUN Server     │◄─────────────────────┘
                        │  (Google)        │
                        └──────────────────┘
         
         ═══════════════════════════════════════════════════════════
                    P2P Media Stream (after connection)
```
### Diagrama de Sequência do Fluxo de Ligação 
![Diagrama da sequência do fluxo de ligação](/public/assets/img/demoApp_mermaidSequenceDiagram_transparent.png)

### Tecnologias Utilizadas (Stack Tecnológica)

#### Backend (Servidor de Sinalização):
- Node.js + Express
- Socket.IO para sinalização via WebSocket
- TypeScript para segurança de tipos (type safety)
#### Frontend (Cliente):
- JavaScript puro (Vanilla JavaScript)

### APIs WebRTC:

- getUserMedia – Captura de média
- RTCPeerConnection – Ligação P2P
- RTCSessionDescription – Gestão de SDP
- Cliente Socket.IO para sinalização

### Infraestrutura:

- Servidor STUN: stun.l.google.com:19302
- Servidor TURN: openrelay.metered.ca (fallback para travessia de NAT)

Funcionalidades 
- [x] Video chat 1-para-1 
- [x] Controlos para ativar/desativar áudio e vídeo 
- [x] Funcionalidade de terminar chamada 
- [x] Deteção de presença de utilizadores em tempo real 
- [x] Débito adaptativo (adaptive bitrate) automático 
- [x] Fallback STUN/TURN para travessia de NAT

### Pré-requisitos

- Node.js >= 18.0.0
- npm ou yarn
- Navegador moderno (Chrome 90+, Firefox 88+, Safari 15+)
