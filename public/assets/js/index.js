// Custom Script for Demo WebRTC App

const { RTCPeerConnection, RTCSessionDescription } = window;

window.localStream = null;
window.peerConnection = new RTCPeerConnection({

    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302'
        }
    ]
});

let localStream;
window.isAlreadyCalling = false;

navigator.getUserMedia(
    {video: true, audio: true},
    stream => {
         window.localStream = stream;
        const localVideo = document.getElementById("local-video");
        if(localVideo) {
            localVideo.srcObject = stream;
        }

        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    },
    
    error => {
        console.warn(error.message);
    }
);

peerConnection.ontrack = function({ streams: [stream]}) {
    const remoteVideo = document.getElementById("remote-video");
    
    if(remoteVideo) {
        remoteVideo.srcObject = stream;
    }

};

/*
 * Conexão Socket
 */
const socket = io();

socket.on("connect", () => {
    console.log("Conectado ao servidor! Meu Socket ID:", socket.id);
});

socket.on("update-user-list", ({ users }) => {
    console.log("Lista de utilizadores disponíveis:", users);
    updateUserList(users);
});

socket.on("remove-user", ({ socketId }) => {
    const elToRemove = document.getElementById(socketId);
    console.log("Utilizador desconectado:", socketId);

    if (elToRemove) {
        elToRemove.remove()
    }
});

socket.on("connect_error", (error) => {
    console.error("Erro ao conectar:", error);
});

socket.on("call-made", async data => {
    try {
        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.offer)
        ); 

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

        socket.emit("make-answer", {
            answer,
            to: data.socket
        });
    } catch(error) {

        }
});

socket.on("answer-made", async data => {
    try {
        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.answer)
        );

        if (!isAlreadyCalling) {
            callUser(data.socket);
            isAlreadyCalling = true;
        }
    } catch (error) {

    }
});

function updateUserList(socketIds) {

    const activeUserContainer = document.getElementById("active-user-container");

    socketIds.forEach(socketId => {
        const alreadyExistingUser = document.getElementById(socketId);

        if (!alreadyExistingUser) {
            const userContainerEl = createUserItemContainer(socketId);
            activeUserContainer.appendChild(userContainerEl);
        }
    });
    console.log("Atualizar lista com:", socketIds);
}

function createUserItemContainer(socketId){

    const userContainerEl = document.createElement("div");
    const usernameEl = document.createElement("p");

    userContainerEl.setAttribute("class", "active-user");
    userContainerEl.setAttribute("id", socketId);
    usernameEl.setAttribute("class", "username");
    usernameEl.innerHTML = `Socket: ${socketId}`;

    userContainerEl.appendChild(usernameEl);

    userContainerEl.addEventListener("click", () => {
        unselectUsersFromList();
        userContainerEl.setAttribute("class", "active-user active-user--selected");
        const talkingWithInfo = document.getElementById("talking-with-info");
        talkingWithInfo.innerHTML = `Talking with: "Socket: ${socketId}"`;
        callUser(socketId);
    });
    
    return userContainerEl;
}

function unselectUsersFromList() {
    const alreadySelectedUser = document.querySelectorAll(".active-user--selected");
    alreadySelectedUser.forEach(userEl => {
        userEl.setAttribute("class", "active-user");
    });
}

async function callUser(socketId){
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(offer));

    socket.emit("call-user", {
        offer,
        to: socketId
    });

    console.log("A ligar para ", socketId);
};