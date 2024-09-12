const Timer = require("./Timer");

class TeenpattiGame {
    constructor(io, roomName, maxPlayers ,lobby) {
        this.io = io;this.roomName = roomName;this.maxPlayers = maxPlayers;        this.lobby = lobby;
        this.roomName = roomName;
        this.players = new Set();
        this.gameState = 'waiting'; // possible states: waiting, playing, finished
        this.roomJoinTimers = undefined;
    }

    setupGame() {
        if (this.roomJoinTimers) return; // Prevent multiple starts

        this.currentPhase = 'createdroom';
        this.roomJoinTimers = new Timer(10, (remaining) => {
            
            this.io.to(this.roomName).emit('join_tick', { remaining });
            // if (remaining === 3) {
            //     this.checkAndAddBots();
            // }
        }, () => {
            // if (this.isGameReady) {
            //     this.initializePlayerScores();
            //     this.startGame();
            // } else {
            //     console.log("Not enough players to start the game.");
            //     this.io.to(this.roomName).emit('game_cancelled', { reason: 'Not enough players' });
            // }
        });

        this.roomJoinTimers.startTimer();
        console.log(`Game setup in room: ${this.roomName}`);

    }

    startGame() {
        
        this.gameState = 'playing';
        this.io.to(this.roomName).emit('game_start', { players: Array.from(this.players) });
        console.log(`Game started in room: ${this.roomName}`);
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
        // this.onBetPlaced(socket);
        socket.on('onleaveRoom', (data) => this.handlePlayerLeave(socket));
    }
    handlePlayerLeave(socket) {
             try {
                console.log('OnleaveRoom--teenpatii')
                socket.leave(this.roomName);
        
                socket.removeAllListeners('onleaveRoom');
                // playerManager.RemovePlayer(socket.id);
                socket.emit('onleaveRoom', {
                    success: `successfully leave ${this.roomName} game.`,
                });
            } catch (err) {
                console.log(err);
            }
        
    }
}

module.exports = TeenpattiGame;
