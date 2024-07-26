const Timer = require("./Timer");

class RolletGame {
    static io;
    
    constructor(roomName, io) {
        RolletGame.io = io;
        this.roomName = roomName;
        this.currentPhase = 'betting';
        this.winList = [1, 2, 3, 3, 1, 2, 1,3];

        this.dragonBet = 0;
        this.round=0;
        this.tigerBet = 0;
        this.tieBet = 0;
        this.bettingTime = 20; // 20 seconds
        this.pauseTime = 9; // 5 seconds
        this.players = new Set();
        this.timerRunning = false; // To track if the timer is running


    }

    selectWinningCards() {
        let dragonCardIndex, tigerCardIndex, winner;
        return { dragonCardIndex, tigerCardIndex, winner };
    }


    startGame() {
        if (this.timerRunning) return; // Prevent multiple timers
        this.timerRunning = true;
        this.currentPhase = 'betting';
        this.dragonBet = 0;
        this.tigerBet = 0;
        this.tieBet = 0;
        this.round+=1;
        RolletGame.io.to(this.roomName).emit('OnTimerStart', { phase: 'betting', winList: this.winList, betting_remaing: this.bettingTimer?.remaining,round:this.round });
        console.log(`Betting phase started in room: ${this.roomName}`);

        this.bettingTimer = new Timer(this.bettingTime, (remaining) => {
           // console.log(remaining);
            RolletGame.io.to(this.roomName).emit('betting_tick', { remainingTime: remaining });
        }, () => {
            this.startPausePhase();
        });

        this.bettingTimer.startTimer();
    }

    startPausePhase() {
        this.currentPhase = 'pause';
        RolletGame.io.to(this.roomName).emit('OnTimeUp', { phase: 'pause' });
        console.log(`Pause phase started in room: ${this.roomName}`);
        const { dragonCardIndex, tigerCardIndex, winner } = this.selectWinningCards();
        this.winList.shift();
        this.winList.push(winner);
        // Emit the result to all clients immediately
        RolletGame.io.to(this.roomName).emit('OnWinNo', {
            dragonCardIndex,
            tigerCardIndex,
            winner
        });

        this.pauseTimer = new Timer(this.pauseTime, (remaining) => {
            console.log(remaining);
            if (remaining == 2) {
                console.log('reseting');
                RolletGame.io.to(this.roomName).emit('OnReset', { phase: 'reset' });
            }
            //  RolletGame.io.to(this.roomName).emit('pause_tick', { remainingTime: remaining });
        }, () => {
            this.resetTimers();
        });

        this.pauseTimer.startTimer();
    }

    resetTimers() {
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

            RolletGame.io.to(this.roomName).emit('onBetPlaced', d);

        });
    }


    addPlayer(socket) {
        if (this.currentPhase === 'betting') {
            this.players.add(socket.id);
            socket.join(this.roomName);
            RolletGame.io.to(this.roomName).emit('player_joined', { id: socket.id });
            console.log(`Player ${socket.id} joined room ${this.roomName}`);
        } else {
            socket.emit('error', 'Can only join during betting phase.');
        }
    }

    removePlayer(socket) {
        this.players.delete(socket.id);
        socket.leave(this.roomName);
        RolletGame.io.to(this.roomName).emit('player_left', { id: socket.id });
        console.log(`Player ${socket.id} left room ${this.roomName}`);
    }
    syncPlayer(socket, player) {
        // Send current game state to the player
        RolletGame.io.to(socket.id).emit('OnCurrentTimer', {
            gameType: 'DragonTiger',
            room: this.roomName,
            currentPhase: this.currentPhase,
            player: player,
            postion: this.players.indexOf(socket),
            total_players: this.players.size,
            betting_remaing: this.bettingTimer?.remaining,
            pause_remaing: this.pauseTimer?.remaining,
            winList: this.winList,
            round:this.round

        });
        this.onBetPlaced(socket);
        this.onleaveRoom(socket);
        this.OnCurrentStatus(socket);
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
    OnCurrentStatus(socket) {
        socket.on('OnCurrentStatus', (d) => {
            RolletGame.io.to(socket.id).emit('OnCurrentStatus', {
                gameType: 'DragonTiger',
                room: this.roomName,
                currentPhase: this.currentPhase,
                total_players: this.players.size,
                betting_remaing: this.bettingTimer?.remaining,
                pause_remaing: this.pauseTimer?.remaining,
                winList: this.winList,
                round:this.round

            });
        });
    }
}

module.exports = RolletGame;