// ====== WEBRTC STATS MONITORING ======

class StatsMonitor {
    constructor(peerConnection) {
        this.peerConnection = peerConnection;
        this.statsInterval = null;
        this.statsHistory = {
            video: [],
            audio: [],
            connection: []
        };
        this.isMonitoring = false;
    }

    // Iniciar monitorização
    start(intervalMs = 1000) {
        if (this.isMonitoring) return;
        
        console.log("Stats monitoring iniciado");
        this.isMonitoring = true;
        
        this.statsInterval = setInterval(async () => {
            await this.collectStats();
        }, intervalMs);
    }

    // Parar monitorização
    stop() {
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
            this.isMonitoring = false;
            console.log("Stats monitoring parado");
        }
    }

    // Coletar estatísticas
    async collectStats() {
        if (!this.peerConnection) return;

        try {
            const stats = await this.peerConnection.getStats();
            const timestamp = Date.now();
            
            stats.forEach(report => {
                // Vídeo Inbound (o que recebes)
                if (report.type === 'inbound-rtp' && report.kind === 'video') {
                    const videoStats = {
                        timestamp,
                        packetsLost: report.packetsLost || 0,
                        packetsReceived: report.packetsReceived || 0,
                        bytesReceived: report.bytesReceived || 0,
                        jitter: parseFloat(report.jitter) || 0,
                        framesPerSecond: report.framesPerSecond || 0,
                        frameWidth: report.frameWidth || 0,
                        frameHeight: report.frameHeight || 0
                    };
                    console.log(report.jitter);
                    
                    this.statsHistory.video.push(videoStats);
                    this.displayVideoStats(videoStats);
                }
                
                // Áudio Inbound
                if (report.type === 'inbound-rtp' && report.kind === 'audio') {
                    const audioStats = {
                        timestamp,
                        packetsLost: report.packetsLost || 0,
                        packetsReceived: report.packetsReceived || 0,
                        bytesReceived: report.bytesReceived || 0,
                        jitter: report.jitter || 0
                    };
                    
                    this.statsHistory.audio.push(audioStats);
                }
                
                // Connection stats
                if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                    const connectionStats = {
                        timestamp,
                        currentRoundTripTime: report.currentRoundTripTime || 0,
                        availableOutgoingBitrate: report.availableOutgoingBitrate || 0,
                        bytesReceived: report.bytesReceived || 0,
                        bytesSent: report.bytesSent || 0
                    };
                    
                    this.statsHistory.connection.push(connectionStats);
                    this.displayConnectionStats(connectionStats);
                }
            });
            
            // Limitar histórico (últimos 60 segundos)
            this.limitHistory(60);
            
        } catch (error) {
            console.error("Erro ao coletar stats:", error);
        }
    }

    // Mostrar stats de vídeo na console
    displayVideoStats(stats) {
        const packetLossRate = stats.packetsReceived > 0 
            ? ((stats.packetsLost / (stats.packetsLost + stats.packetsReceived)) * 100).toFixed(2)
            : 0;
        
        const bitrateKbps = this.calculateBitrate(stats.bytesReceived);
        
        console.log(`Vídeo | Resolução: ${stats.frameWidth}x${stats.frameHeight} | ` +
                    `FPS: ${stats.framesPerSecond} | Bitrate: ${bitrateKbps} kbps | ` +
                    `Packet Loss: ${packetLossRate}% | Jitter: ${(stats.jitter * 1000).toFixed(2)}ms`);
    }

    // Mostrar stats de conexão
    displayConnectionStats(stats) {
        const rttMs = (stats.currentRoundTripTime * 1000).toFixed(2);
        const bitrateKbps = (stats.availableOutgoingBitrate / 1000).toFixed(0);
        
        console.log(`Conexão | RTT: ${rttMs}ms | Bitrate disponível: ${bitrateKbps} kbps`);
    }

    // Calcular bitrate (bytes/s -> kbps)
    calculateBitrate(bytesReceived) {
        if (this.statsHistory.video.length < 2) return 0;
        
        const previous = this.statsHistory.video[this.statsHistory.video.length - 2];
        const current = this.statsHistory.video[this.statsHistory.video.length - 1];
        
        const bytesDiff = current.bytesReceived - previous.bytesReceived;
        const timeDiff = (current.timestamp - previous.timestamp) / 1000; // segundos
        
        if (timeDiff === 0) return 0;
        
        const bytesPerSecond = bytesDiff / timeDiff;
        const kbps = (bytesPerSecond * 8 / 1000).toFixed(0);
        
        return kbps;
    }

    // Limitar tamanho do histórico
    limitHistory(maxSeconds) {
        const maxEntries = maxSeconds;
        
        if (this.statsHistory.video.length > maxEntries) {
            this.statsHistory.video = this.statsHistory.video.slice(-maxEntries);
        }
        if (this.statsHistory.audio.length > maxEntries) {
            this.statsHistory.audio = this.statsHistory.audio.slice(-maxEntries);
        }
        if (this.statsHistory.connection.length > maxEntries) {
            this.statsHistory.connection = this.statsHistory.connection.slice(-maxEntries);
        }
    }

    // Obter sumário de estatísticas
    getSummary() {
        const videoStats = this.statsHistory.video;
        const connectionStats = this.statsHistory.connection;
        
        if (videoStats.length === 0) {
            return { message: "Sem dados disponíveis" };
        }

        // Calcular médias
        const avgPacketLoss = this.calculateAverage(videoStats.map(s => {
            const total = s.packetsLost + s.packetsReceived;
            return total > 0 ? (s.packetsLost / total) * 100 : 0;
        }));

        const avgJitter = this.calculateAverage(videoStats.map(s => s.jitter * 1000));
        
        const avgRTT = connectionStats.length > 0
            ? this.calculateAverage(connectionStats.map(s => s.currentRoundTripTime * 1000))
            : 0;

        const lastVideo = videoStats[videoStats.length - 1];
        
        return {
            resolution: `${lastVideo.frameWidth}x${lastVideo.frameHeight}`,
            fps: lastVideo.framesPerSecond,
            avgPacketLoss: avgPacketLoss.toFixed(2) + '%',
            avgJitter: avgJitter.toFixed(2) + 'ms',
            avgRTT: avgRTT.toFixed(2) + 'ms',
            sampleCount: videoStats.length
        };
    }

    // Calcular média
    calculateAverage(arr) {
        if (arr.length === 0) return 0;
        const sum = arr.reduce((a, b) => a + b, 0);
        return sum / arr.length;
    }

    // Exportar dados para CSV
    exportToCSV() {
        const csv = this.generateCSV();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `webrtc-stats-${Date.now()}.csv`;
        a.click();
        
        console.log("Stats exportados para CSV");
    }

    // Gerar CSV
    generateCSV() {
        let csv = 'Timestamp,PacketsLost,PacketsReceived,PacketLoss%,Jitter(ms),RTT(ms),Bitrate(kbps),Resolution,FPS,AudioPacketsLost,AudioJitter(ms)\n';

        this.statsHistory.video.forEach((stats, index) => {
            const total = stats.packetsLost + stats.packetsReceived;
            const lossRate = total > 0 ? ((stats.packetsLost / total) * 100).toFixed(2) : 0;
            const bitrate = this.calculateBitrate(stats.bytesReceived);
            
            const connectionStat = this.statsHistory.connection.find(c => 
                Math.abs(c.timestamp - stats.timestamp) < 1000
            );
            const rtt = connectionStat ? connectionStat.currentRoundTripTime.toFixed(4) : 'N/A';

            const audioStat = this.statsHistory.audio.find(a => 
                Math.abs(a.timestamp - stats.timestamp) < 1000
            );

            const audioPacketsLost = audioStat ? audioStat.packetsLost : 'N/A';
            const audioJitter = audioStat ? parseFloat(audioStat.jitter).toFixed(4) : 'N/A';

            csv += `${stats.timestamp},${stats.packetsLost},${stats.packetsReceived},${lossRate},` +
                `${parseFloat(stats.jitter).toFixed(4)},${rtt},${bitrate},` +
                `${stats.frameWidth}x${stats.frameHeight},${stats.framesPerSecond},` +
                `${audioPacketsLost},${audioJitter}\n`;
                    });
        
        return csv;
    }
}

// Tornar disponível globalmente
window.StatsMonitor = StatsMonitor;