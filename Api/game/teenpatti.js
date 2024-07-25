class TeenpattiGame {
    constructor(io, roomName) {
        this.io = io;
        this.roomName = roomName;
        this.players = new Set();
        this.gameState = 'waiting'; // possible states: waiting, playing, finished
    }

    addPlayer(socket) {
        if (this.players.size < 2) {
            this.players.add(socket.id);
            socket.join(this.roomName);
            this.io.to(this.roomName).emit('player_joined', { id: socket.id });
            console.log(`Player ${socket.id} joined room ${this.roomName}`);

            if (this.players.size === 2) {
                this.startGame();
            }
        } else {
            socket.emit('error', 'Room is full.');
        }
    }

    removePlayer(socket) {
        this.players.delete(socket.id);
        socket.leave(this.roomName);
        this.io.to(this.roomName).emit('player_left', { id: socket.id });
        console.log(`Player ${socket.id} left room ${this.roomName}`);

        if (this.gameState === 'playing') {
            this.endGame();
        }
    }

    startGame() {
        
        this.gameState = 'playing';
        this.io.to(this.roomName).emit('game_start', { players: Array.from(this.players) });
        console.log(`Game started in room: ${this.roomName}`);
        this.dealCards();
    }

    dealCards() {
        // Deal cards logic here
        this.io.to(this.roomName).emit('deal_cards', { cards: 'dealt cards' });
    }

    playerMove(socket, move) {
        if (this.gameState === 'playing') {
            this.io.to(this.roomName).emit('player_move', { id: socket.id, move });
        } else {
            socket.emit('error', 'Game not started.');
        }
    }

    endGame() {
        this.gameState = 'finished';
        this.io.to(this.roomName).emit('game_end', { message: 'Game has ended.' });
        console.log(`Game ended in room: ${this.roomName}`);
        this.resetGame();
    }

    resetGame() {
        this.players.clear();
        this.gameState = 'waiting';
    }
    syncPlayer(socket, player) {
        // Send current game state to the player
        // this.io.to(socket.id).emit('OnCurrentTimer', {
        //     gameType: 'TeenPatti',
        //     room: this.roomName,
        //     currentPhase: this.currentPhase,
        //     player: player,
        //     postion: this.players.indexOf(socket),
        //     total_players: this.players.size,
        //     betting_remaing: this.bettingTimer?.remaining,
        //     winList: this.winList

        // });
        // this.onBetPlaced(socket);
        // this.onleaveRoom(socket);
    }
}

module.exports = TeenpattiGame;
