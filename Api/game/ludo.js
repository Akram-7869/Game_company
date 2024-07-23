class LudoGame {
    constructor(io, roomName, maxPlayers = 4) {
        this.io = io;
        this.roomName = roomName;
        this.maxPlayers = maxPlayers;
        this.players = new Set();
        this.bots = new Set();
        this.playerSockets = {};
        this.turnOrder = [];
        this.currentTurnIndex = 0;
        this.gameState = 'waiting'; // possible states: waiting, playing, finished
        this.timer = null;
    }

    addPlayer(socket) {
        if (this.players.size + this.bots.size < this.maxPlayers) {
            this.players.add(socket.id);
            this.playerSockets[socket.id] = socket;
            socket.join(this.roomName);
            this.io.to(this.roomName).emit('player_joined', { id: socket.id });
            console.log(`Player ${socket.id} joined room ${this.roomName}`);
        } else {
            socket.emit('error', 'Room is full.');
        }
    }

    addBot() {
        if (this.players.size + this.bots.size < this.maxPlayers) {
            const botId = `bot_${this.bots.size + 1}`;
            this.bots.add(botId);
            this.turnOrder.push(botId);
            console.log(`Bot ${botId} added to room ${this.roomName}`);
        }
    }

    startGame() {
        if (this.bettingTimer) return; // Prevent multiple starts

        this.gameState = 'playing';
        this.turnOrder = [...this.players, ...this.bots];
        this.io.to(this.roomName).emit('game_start', { players: this.turnOrder });
        console.log(`Game started in room: ${this.roomName}`);
        this.nextTurn();
    }

    nextTurn() {
        if (this.gameState !== 'playing') return;

        const currentPlayer = this.turnOrder[this.currentTurnIndex];
        this.io.to(this.roomName).emit('turn_start', { player: currentPlayer });

        if (this.bots.has(currentPlayer)) {
            this.botMove(currentPlayer);
        }

        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;

        // Set timer for the next turn
        this.timer = new Timer(20, (remaining) => {
            this.io.to(this.roomName).emit('turn_tick', { remaining });
        }, () => {
            this.nextTurn();
        });

        this.timer.startTimer();
    }

    botMove(botId) {
        // Simulate bot move
        const move = { dice: Math.floor(Math.random() * 6) + 1 };
        console.log(`Bot ${botId} made a move:`, move);
        this.io.to(this.roomName).emit('bot_move', { id: botId, move });
        // Wait for a while before proceeding to the next turn
        setTimeout(() => {
            this.nextTurn();
        }, 2000);
    }

    playerMove(socket, move) {
        if (this.turnOrder[this.currentTurnIndex] !== socket.id) {
            socket.emit('error', 'Not your turn.');
            return;
        }

        this.io.to(this.roomName).emit('player_move', { id: socket.id, move });
        console.log(`Player ${socket.id} made a move:`, move);
        this.nextTurn();
    }

    endGame() {
        this.gameState = 'finished';
        this.io.to(this.roomName).emit('game_end', { message: 'Game has ended.' });
        console.log(`Game ended in room: ${this.roomName}`);
        this.resetGame();
    }

    resetGame() {
        this.players.clear();
        this.bots.clear();
        this.turnOrder = [];
        this.currentTurnIndex = 0;
        this.gameState = 'waiting';
        if (this.timer) {
            this.timer.pause();
        }
    }
}

module.exports = LudoGame;
