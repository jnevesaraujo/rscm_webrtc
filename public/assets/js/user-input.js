// ====== CONTROLOS DE MEDIA ======

let isVideoEnabled = true;
let isAudioEnabled = true;

// BotãoToggleVídeo
const toggleVideoBtn = document.getElementById("toggle-video");
if (toggleVideoBtn) {
    toggleVideoBtn.addEventListener("click", () => {
        if (window.localStream) {
            const videoTrack = window.localStream.getVideoTracks()[0];
            if (videoTrack) {
                isVideoEnabled = !isVideoEnabled;
                videoTrack.enabled = isVideoEnabled;
                
                // Atualizar UI do botão
                if (isVideoEnabled) {
                    toggleVideoBtn.textContent = "Camera ON";
                    toggleVideoBtn.classList.remove("off");
                    console.log("Câmera ativada");
                } else {
                    toggleVideoBtn.textContent = "Câmera OFF";
                    toggleVideoBtn.classList.add("off");
                    console.log("Câmera desativada");
                }
            }
        } else {
            console.warn("Stream local não disponível");
        }
    });
}

// Botão Toggle Áudio
const toggleAudioBtn = document.getElementById("toggle-audio");
if (toggleAudioBtn) {
    toggleAudioBtn.addEventListener("click", () => {
        if (window.localStream) {
            const audioTrack = window.localStream.getAudioTracks()[0];
            if (audioTrack) {
                isAudioEnabled = !isAudioEnabled;
                audioTrack.enabled = isAudioEnabled;
                
                // Atualizar UI do botão
                if (isAudioEnabled) {
                    toggleAudioBtn.textContent = "Microfone ON";
                    toggleAudioBtn.classList.remove("off");
                    console.log("Microfone ativado");
                } else {
                    toggleAudioBtn.textContent = "Microfone OFF";
                    toggleAudioBtn.classList.add("off");
                    console.log("Microfone desativado");
                }
            }
        } else {
            console.warn("Stream local não disponível");
        }
    });
}

// Botão Desligar Chamada
const hangupBtn = document.getElementById("hangup");
if (hangupBtn) {
    hangupBtn.addEventListener("click", () => {
        hangupCall();
    });
}

function hangupCall() {
    console.log("A desligar chamada...");
    
    // Parar todos os tracks
    if (localStream) {
        localStream.getTracks().forEach(track => {
            track.stop();
            console.log("Track parado:", track.kind);
        });
    }
    
    // Fechar peer connection
    if (peerConnection) {
        peerConnection.close();
        console.log("Peer connection fechada");
    }
    
    // Limpar vídeos
    const localVideo = document.getElementById("local-video");
    const remoteVideo = document.getElementById("remote-video");
    
    if (localVideo) {
        localVideo.srcObject = null;
    }
    if (remoteVideo) {
        remoteVideo.srcObject = null;
    }
    
    // Atualizar UI
    const talkingWithInfo = document.getElementById("talking-with-info");
    if (talkingWithInfo) {
        talkingWithInfo.innerHTML = "Não está em chamada";
    }
    
    // Notificar servidor (opcional)
    socket.emit("call-ended");
    
    // Resetar estados
    isAlreadyCalling = false;
    isVideoEnabled = true;
    isAudioEnabled = true;
    
    // Resetar botões
    if (toggleVideoBtn) {
        toggleVideoBtn.textContent = "Câmera ON";
        toggleVideoBtn.classList.remove("off");
    }
    if (toggleAudioBtn) {
        toggleAudioBtn.textContent = "Microfone ON";
        toggleAudioBtn.classList.remove("off");
    }
    
    console.log("Chamada terminada");
    
    reinitializeStream();
}

function reinitializeStream() {
    navigator.getUserMedia(
        { video: true, audio: true },
        stream => {
            localStream = stream;
            const localVideo = document.getElementById("local-video");
            if (localVideo) {
                localVideo.srcObject = stream;
                console.log("Stream local reiniciado");
            }
        },
        error => {
            console.error("Erro ao reiniciar stream:", error);
        }
    );
}