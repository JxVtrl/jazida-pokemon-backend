require('dotenv').config();
const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 4001;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

// Mapeamento de conexões por treinadorId
const trainerSockets = new Map();

// Mapeamento de salas de batalha
const battleRooms = new Map();

io.on('connection', (socket) => {
    // O frontend deve enviar o id do treinador após conectar
    socket.on('register', (trainerId) => {
        trainerSockets.set(trainerId, socket.id);
        socket.trainerId = trainerId;
        console.log(`🔗 Treinador conectado: ${trainerId} (socket ${socket.id})`);
    });

    // Entrar em uma sala de batalha
    socket.on('join-battle', (battleId) => {
        const roomName = `batalha-${battleId}`;
        socket.join(roomName);
        console.log(`🎯 Treinador ${socket.trainerId} entrou na batalha ${battleId}`);

        // Adicionar à lista de salas ativas
        if (!battleRooms.has(roomName)) {
            battleRooms.set(roomName, new Set());
        }
        battleRooms.get(roomName).add(socket.id);
    });

    // Sair de uma sala de batalha
    socket.on('leave-battle', (battleId) => {
        const roomName = `batalha-${battleId}`;
        socket.leave(roomName);
        console.log(`🚪 Treinador ${socket.trainerId} saiu da batalha ${battleId}`);

        // Remover da lista de salas ativas
        if (battleRooms.has(roomName)) {
            battleRooms.get(roomName).delete(socket.id);
            if (battleRooms.get(roomName).size === 0) {
                battleRooms.delete(roomName);
            }
        }
    });

    socket.on('disconnect', () => {
        if (socket.trainerId) {
            trainerSockets.delete(socket.trainerId);
            console.log(`❌ Treinador desconectado: ${socket.trainerId}`);
        }
    });
});

// Exportar io, trainerSockets e battleRooms para uso nos controllers
app.set('io', io);
app.set('trainerSockets', trainerSockets);
app.set('battleRooms', battleRooms);

server.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));