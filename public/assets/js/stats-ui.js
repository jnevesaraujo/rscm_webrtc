// ====== STATS UI CONTROLS ======

let statsMonitor = null;
let statsDisplayVisible = false;

// Iniciar monitoring quando conexão P2P estabelecer
if (window.peerConnection) {
    window.peerConnection.oniceconnectionstatechange = () => {
        console.log("ICE State:", window.peerConnection.iceConnectionState);
        
        if (window.peerConnection.iceConnectionState === 'connected') {
            console.log("A iniciar monitorização");
            
            if (!statsMonitor) {
                statsMonitor = new StatsMonitor(window.peerConnection);
                statsMonitor.start(1000);
                
                // Atualizar display a cada segundo
                setInterval(updateStatsDisplay, 1000);
            }
        }
        
        if (window.peerConnection.iceConnectionState === 'disconnected' || 
            window.peerConnection.iceConnectionState === 'failed') {
            if (statsMonitor) {
                statsMonitor.stop();
            }
        }
    };
}

// Toggle stats display
const toggleStatsBtn = document.getElementById('toggle-stats');
if (toggleStatsBtn) {
    toggleStatsBtn.addEventListener('click', () => {
        const statsDisplay = document.getElementById('stats-display');
        statsDisplayVisible = !statsDisplayVisible;
        
        if (statsDisplayVisible) {
            statsDisplay.classList.add('active');
            toggleStatsBtn.innerHTML = '<span class="icon-call"><i class="fas fa-chart-bar"></i></span> Ocultar Stats';
        } else {
            statsDisplay.classList.remove('active');
            toggleStatsBtn.innerHTML = '<span class="icon-call"><i class="fas fa-chart-bar"></i></span> Mostrar Stats';
        }
    });
}

// Export stats to CSV
const exportStatsBtn = document.getElementById('export-stats');
if (exportStatsBtn) {
    exportStatsBtn.addEventListener('click', () => {
        if (statsMonitor) {
            statsMonitor.exportToCSV();
            alert('Stats exportados! Verifica os downloads.');
        } else {
            alert('Nenhuma estatística disponível. Inicia uma chamada primeiro.');
        }
    });
}

// Atualizar display de stats
function updateStatsDisplay() {
    if (!statsMonitor || !statsDisplayVisible) return;
    
    const summary = statsMonitor.getSummary();
    const statsContent = document.getElementById('stats-content');
    
    if (summary.message) {
        statsContent.innerHTML = `<div class="stat-line">${summary.message}</div>`;
        return;
    }
    
    statsContent.innerHTML = `
        <div class="stat-line"><span class="icon-call"><i class="fas fa-desktop"></i></span> Resolução: ${summary.resolution}</div>
        <div class="stat-line"><span class="icon-call"><i class="fas fa-film"></i></span> FPS: ${summary.fps}</div>
        <div class="stat-line"><span class="icon-call"><i class="fas fa-chart-area"></i></span> Packet Loss: ${summary.avgPacketLoss}</div>
        <div class="stat-line"><span class="icon-call"><i class="fas fa-clock"></i></span> Jitter: ${summary.avgJitter}</div>
        <div class="stat-line"><span class="icon-call"><i class="fas fa-undo"></i></span> 🔄 RTT: ${summary.avgRTT}</div>
        <div class="stat-line"><span class="icon-call"><i class="fas fa-chart-bar"></i></span> Amostras: ${summary.sampleCount}</div>
    `;
}

// Mostrar sumário final ao desligar
window.addEventListener('beforeunload', () => {
    if (statsMonitor) {
        const summary = statsMonitor.getSummary();
        console.log("SUMÁRIO FINAL DA CHAMADA:", summary);
    }
});