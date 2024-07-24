const { state } = require('../utils/JoinRoom');

const Timer = require("./Timer");

class DragonTigerGame {
    constructor(roomName, io) {
        this.io = io;
        this.roomName = roomName;
        this.currentPhase = 'betting';
        this.winList = [1, 2, 3, 3, 1, 2, 1, 3];

        this.dragonBet = 0;
        this.tigerBet = 0;
        this.tieBet = 0;
        this.bettingTime = 20; // 20 seconds
        this.pauseTime = 7; // 5 seconds
        this.players = new Set();
        this.timerRunning = false; // To track if the timer is running
        this.staticDeck = [
            // Clubs (0-12)
            { cardNo: 2, color: 1 }, { cardNo: 3, color: 1 }, { cardNo: 4, color: 1 }, { cardNo: 5, color: 1 },
            { cardNo: 6, color: 1 }, { cardNo: 7, color: 1 }, { cardNo: 8, color: 1 }, { cardNo: 9, color: 1 },
            { cardNo: 10, color: 1 }, { cardNo: 11, color: 1 }, { cardNo: 12, color: 1 }, { cardNo: 13, color: 1 },
            { cardNo: 14, color: 1 },
            // Diamonds (13-25)
            { cardNo: 2, color: 2 }, { cardNo: 3, color: 2 }, { cardNo: 4, color: 2 }, { cardNo: 5, color: 2 },
            { cardNo: 6, color: 2 }, { cardNo: 7, color: 2 }, { cardNo: 8, color: 2 }, { cardNo: 9, color: 2 },
            { cardNo: 10, color: 2 }, { cardNo: 11, color: 2 }, { cardNo: 12, color: 2 }, { cardNo: 13, color: 2 },
            { cardNo: 14, color: 2 },
            // Spades (26-38)
            { cardNo: 2, color: 3 }, { cardNo: 3, color: 3 }, { cardNo: 4, color: 3 }, { cardNo: 5, color: 3 },
            { cardNo: 6, color: 3 }, { cardNo: 7, color: 3 }, { cardNo: 8, color: 3 }, { cardNo: 9, color: 3 },
            { cardNo: 10, color: 3 }, { cardNo: 11, color: 3 }, { cardNo: 12, color: 3 }, { cardNo: 13, color: 3 },
            { cardNo: 14, color: 3 },
            // Hearts (39-51)
            { cardNo: 2, color: 4 }, { cardNo: 3, color: 4 }, { cardNo: 4, color: 4 }, { cardNo: 5, color: 4 },
            { cardNo: 6, color: 4 }, { cardNo: 7, color: 4 }, { cardNo: 8, color: 4 }, { cardNo: 9, color: 4 },
            { cardNo: 10, color: 4 }, { cardNo: 11, color: 4 }, { cardNo: 12, color: 4 }, { cardNo: 13, color: 4 },
            { cardNo: 14, color: 4 }
        ];

    }

    selectWinningCards() {
        let dragonCardIndex, tigerCardIndex, winner;
        const dragonPayout = this.dragonBet * 2;
        const tigerPayout = this.tigerBet * 2;
        const tiePayout = this.tieBet * 10;

        if (dragonPayout <= tigerPayout && dragonPayout <= tiePayout) {
            // Dragon should win
            do {
                dragonCardIndex = Math.floor(Math.random() * 52);
                tigerCardIndex = Math.floor(Math.random() * 52);
            } while (this.staticDeck[dragonCardIndex].cardNo <= this.staticDeck[tigerCardIndex].cardNo);
            winner = 'Dragon';
        } else if (tigerPayout <= dragonPayout && tigerPayout <= tiePayout) {
            do {
                dragonCardIndex = Math.floor(Math.random() * 52);
                tigerCardIndex = Math.floor(Math.random() * 52);
            } while (this.staticDeck[tigerCardIndex].cardNo <= this.staticDeck[dragonCardIndex].cardNo);
            winner = 'Tiger';
        } else {
            do {
                dragonCardIndex = Math.floor(Math.random() * 52);
                tigerCardIndex = Math.floor(Math.random() * 52);
            } while (this.staticDeck[dragonCardIndex].cardNo !== this.staticDeck[tigerCardIndex].cardNo);
            winner = 'Tie';
        }
        return { dragonCardIndex, tigerCardIndex, winner };
    }


    startGame() {
        if (this.timerRunning) return; // Prevent multiple timers
        this.timerRunning = true;
        this.currentPhase = 'betting';
        this.dragonBet = 0;
        this.tigerBet = 0;
        this.tieBet = 0
        this.io.to(this.roomName).emit('OnTimerStart', { phase: 'betting', winList: this.winList,betting_remaing: this.bettingTimer?.remaining,});
        console.log(`Betting phase started in room: ${this.roomName}`);

        this.bettingTimer = new Timer(this.bettingTime, (remaining) => {
            console.log(remaining);
            this.io.to(this.roomName).emit('betting_tick', { remainingTime: remaining });
        }, () => {
            this.startPausePhase();
        });

        this.bettingTimer.startTimer();
    }

    startPausePhase() {
        this.currentPhase = 'pause';
        this.io.to(this.roomName).emit('OnTimeUp', { phase: 'pause' });
        console.log(`Pause phase started in room: ${this.roomName}`);
        const { dragonCardIndex, tigerCardIndex, winner } = this.selectWinningCards();


        // Emit the result to all clients immediately
        this.io.to(this.roomName).emit('OnWinNo', {
            dragonCardIndex,
            tigerCardIndex,
            winner
        });

        this.pauseTimer = new Timer(this.pauseTime, (remaining) => {
            console.log(remaining);
            if(remaining == 7){
                console.log('reseting');
                this.io.to(this.roomName).emit('OnReset', { phase: 'reset' });

            }
            //  this.io.to(this.roomName).emit('pause_tick', { remainingTime: remaining });
        }, () => {
             this.resetTimers();
        });

        this.pauseTimer.startTimer();
    }

    resetTimers() {
        if (this.bettingTimer) {
            this.bettingTimer.reset(0);
        }
        if (this.pauseTimer) {
            this.pauseTimer.reset(0);
        }
        this.timerRunning = false;
        this.startGame();
    }

    updatePlayers(players) {
        this.players = players;
    }

    onBetPlaced(socket) {
        socket.removeAllListeners('onBetPlaced');

        socket.on('onBetPlaced', (d) => {

            const { boxNo, amount } = d;
            switch (boxNo) {
                case 1:
                    this.dragonBet += amount;
                    break;
                case 2:
                    this.tigerBet += amount;
                    break;
                case 3:
                    this.tieBet += amount;
                    break;

            }

            this.io.to(this.roomName).emit('onBetPlaced', d);

        });
    }


    addPlayer(socket) {
        if (this.currentPhase === 'betting') {
            this.players.add(socket.id);
            socket.join(this.roomName);
            this.io.to(this.roomName).emit('player_joined', { id: socket.id });
            console.log(`Player ${socket.id} joined room ${this.roomName}`);
        } else {
            socket.emit('error', 'Can only join during betting phase.');
        }
    }

    removePlayer(socket) {
        this.players.delete(socket.id);
        socket.leave(this.roomName);
        this.io.to(this.roomName).emit('player_left', { id: socket.id });
        console.log(`Player ${socket.id} left room ${this.roomName}`);
    }
    syncPlayer(socket, player) {
        // Send current game state to the player
        this.io.to(socket.id).emit('OnCurrentTimer', {
            gameType: 'DragonTiger',
            room: this.roomName,
            currentPhase: this.currentPhase,
            player: player,
            postion: this.players.indexOf(socket),
            total_players: this.players.size,
            betting_remaing: this.bettingTimer?.remaining,
            pause_remaing: this.pauseTimer?.remaining,
            winList: this.winList

        });
        this.onBetPlaced(socket);
        this.onleaveRoom(socket);
    }
    onleaveRoom(socket) {
        socket.on('onleaveRoom', function (data) {
            try {
                console.log('OnleaveRoom--Anar')
                socket.leave(this.roomName);
                socket.removeAllListeners('OnBetsPlaced');


                socket.removeAllListeners('OnWinNo');
                socket.removeAllListeners('OnTimeUp');
                socket.removeAllListeners('OnTimerStart');
                socket.removeAllListeners('OnCurrentTimer');
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
}

module.exports = DragonTigerGame;