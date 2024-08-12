const Timer = require("./Timer");

class LudoGame {
    constructor(io, roomName, maxPlayers = 4) {
        this.io = io;
        this.roomName = roomName;
        this.maxPlayers = maxPlayers;
        this.players = new Map();
        this.bots = new Map();
        this.playerSockets = {};
        this.turnOrder = [];
        this.currentTurnIndex = 0;
        this.currentPhase = 'waiting'; // possible states: waiting, playing, finished
        this.timer = null;
        this.roomJoinTimers = null;
        this.currentPhase = 'createdroom';
        this.bettingTimer = null;
        this.pauseTimer = null;
        this.round = 0;
        this.bettingTime = 20; // 20 seconds
        this.pauseTime = 9; // 5 seconds
    }

    addPlayer(socket) {
        if (this.players.size + this.bots.size < this.maxPlayers) {
            this.players.add(socket.id);
            this.playerSockets[socket.id] = socket;
            console.log(`Player ${socket.id} joined room ${this.roomName}`);
        } else {
            socket.emit('error', 'Room is full.');
        }
    }

    addBot() {
        let bot = {
            userId: 'b656d926053f8b7693896509',
            name: 'Tester-bot',
            balance: '575.79',
            lobbyId: '66613de5980bf75b5ec9abb4',
            maxp: 2,
            type: 'bot',
            avtar: 'http://174.138.52.41/assets/img/logo/profile_default.png'
        }
        if (this.players.size + this.bots.size < this.maxPlayers) {
            const botId = 'b656d926053f8b7693896509';
            this.bots.set(botId, { player: bot });
            console.log(`Bot ${botId} added to room ${this.roomName}`);
        }
    }
    syncPlayer(socket, player) {
        // Send current game state to the player
        this.players.set(player.userId, { player, socket, lives: 3, position: -1 });
        this.onleaveRoom(socket);
        this.OnCurrentStatus(socket);
    }
    setupGame() {
        if (this.roomJoinTimers) return; // Prevent multiple starts

        this.currentPhase = 'createdroom';
        this.roomJoinTimers = new Timer(30, (remaining) => {
            this.io.to(this.roomName).emit('join_tick', { remaining });
            if(remaining === 5){
                this.addBot();
              

                this.emitJoinPlayer();
            }

        }, () => {
            this.startGameWithBots();
        });

        this.roomJoinTimers.startTimer();
        console.log(`Game started in room: ${this.roomName}`);

    }
    emitJoinPlayer() {
        this.turnOrder = [...this.getPlayers(), ...this.getBots()];
        this.io.to(this.roomName).emit('join_players', { players: this.turnOrder });
    }

    startGameWithBots() {
            this.startGame();
    }
    onleaveRoom(socket) {
        socket.on('onleaveRoom', function (data) {
            try {
                console.log('OnleaveRoom--dragon')
                socket.leave(this.roomName);
                socket.removeAllListeners('OnBetsPlaced');
                socket.removeAllListeners('OnCurrentStatus');

                socket.removeAllListeners('OnWinNo');
                socket.removeAllListeners('OnTimeUp');
                socket.removeAllListeners('OnTimerStart');
                socket.removeAllListeners('OnCurrentStatus');
                socket.removeAllListeners('onleaveRoom');

                // playerManager.RemovePlayer(socket.id);
                socket.emit('onleaveRoom', {
                    success: `successfully leave ${this.roomName} game.`,
                });

            } catch (err) {
                console.log(err);
            }
        });
    }
    updatePlayers(players) {
        this.players = players;
    }
    getPlayers() {
        return Array.from(this.players.values()).map(value => value.player);
    }
    getBots() {
        return Array.from(this.bots.values()).map(value => value.player);
    }
    OnCurrentStatus(socket) {
        socket.on('OnCurrentStatus', (d) => {
            this.io.to(socket.id).emit('OnCurrentStatus', {
                gameType: 'Ludo',
                room: this.roomName,
                currentPhase: this.currentPhase,
                players: this.turnOrder,
                currentTurnIndex: this.currentTurnIndex,
                betting_remaing: this.bettingTimer?.remaining,
                pause_remaing: this.pauseTimer?.remaining,
                //   winList: this.winList,
                //  round:this.round

            });
        });
    }
    startGame() {
        if (this.bettingTimer) return; // Prevent multiple starts
        this.addBot();
        this.currentPlayerIndex = 0;
        this.currentPhase = 'playing';
        this.round += 1;
        this.turnOrder = [...this.getPlayers(), ...this.getBots()];
        console.log(`Betting phase started in room: ${this.roomName}`);

        this.bettingTimer = new Timer(this.bettingTime, (remaining) => {
            // console.log(remaining);
            this.io.to(this.roomName).emit('play_tick', { remainingTime: remaining });
        }, () => {
            //  this.startPausePhase();
        });

        this.bettingTimer.startTimer();

        this.io.to(this.roomName).emit('game_start', { players: this.turnOrder });
        console.log(`Game started in room: ${this.roomName}`);
        this.nextTurn();
    }

    nextTurn() {
        if (this.currentPhase !== 'playing') return;

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
        this.currentPhase = 'finished';
        this.io.to(this.roomName).emit('game_end', { message: 'Game has ended.' });
        console.log(`Game ended in room: ${this.roomName}`);
        this.resetGame();
    }

    resetGame() {
        this.players.clear();
        this.bots.clear();
        this.turnOrder = [];
        this.currentTurnIndex = 0;
        this.currentPhase = 'waiting';
        if (this.timer) {
            this.timer.pause();
        }
    }
}

module.exports = LudoGame;
