const Timer = require("./Timer");

class RolletGame {
    static io;

    constructor(roomName, io) {
        RolletGame.io = io;
        this.roomName = roomName;
        this.currentPhase = 'betting';
        this.winList = [1, 2, 3, 3, 1, 2, 1, 3];
        this.round = 0;
        this.dragonBet = 0;
        this.bettingTime = 20; // 20 seconds
        this.pauseTime = 12; // 5 seconds
        this.players = new Set();
        this.timerRunning = false; // To track if the timer is running

        this.betList = {};



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
        this.round += 1;
        RolletGame.io.to(this.roomName).emit('OnTimerStart', { phase: 'betting', winList: this.winList, betting_remaing: this.bettingTimer?.remaining, round: this.round });
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
        let betWin= this.getKeyWithMinValue(this.betList)
        this.winList.shift();
        this.winList.push(betWin);

        // Emit the result to all clients immediately
 

            let data = { room: this.roomName, betWin}
            console.log('getBetData', data);
            this.betList = this.defaultRolletValue();        
            RolletGame.io.to(this.roomName).emit('OnWinNo', data);

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
            if (this.currentPhase !== 'betting') {
                socket.emit('error', 'Can only join during betting phase.');
                return;
            }
              
            
                let { room, betNo, amount, action = 'bet', manyBet = '[]' } = d; //JSON.parse(d);
                console.log('setBetData', d);
                amount = parseInt(amount);
                if (betNo <= 36 && amount > 0) {
                    if (action === 'bet') {
                        this.betList[betNo] = amount + parseInt(this.betList[betNo]);
                    } else if (action === 'unbet' && this.betList[betNo] > 0) {
                        let x = parseInt(this.betList[betNo]) - amount;
                        this.betList[betNo] = x < 0 ? 0 : x;
                    }
    
                } else if (betNo > 36 && amount > 0) {
                    const betArray = JSON.parse(manyBet);
                    let amountMany = amount / manyBet.length;
                    if (action === 'bet') {
                        for (const id of betArray) {
                            this.betList[id] = amountMany + parseInt(this.betList[betNo][id]);
                        }
                    } else if (action === 'unbet') {
                        for (const id of betArray) {
                            if (this.betList[id] > 0) {
                                let x = parseInt(this.betList[id]) - amountMany;
                                this.betList[id] = x < 0 ? 0 : x;
                            }
    
    
                        }
                    }
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
        // RolletGame.io.to(socket.id).emit('OnCurrentTimer', {
        //     gameType: 'Roulette',
        //     room: this.roomName,
        //     currentPhase: this.currentPhase,
        //     player: player,
        //     postion: this.players.indexOf(socket),
        //     total_players: this.players.size,
        //     betting_remaing: this.bettingTimer?.remaining,
        //     pause_remaing: this.pauseTimer?.remaining,
        //     winList: this.winList,
        //     round: this.round

        // });
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
            socket.emit('OnCurrentStatus', {
                gameType: 'Roulette',
                room: this.roomName,
                currentPhase: this.currentPhase,
                total_players: this.players.size,
                betting_remaing: this.bettingTimer?.remaining,
                pause_remaing: this.pauseTimer?.remaining,
                winList: this.winList,
                round: this.round

            });
        });
    }
  
  

    defaultRolletValue = () => {
        return {
            0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0,
            11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0,
            21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0,
            31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0
        }

    }
    getKeyWithMinValue(data) {
        // Ensure none of the values are less than 0
        Object.keys(data).forEach(key => {
            data[key] = Math.max(0, data[key]);
        });

        // Find the minimum value
        const minValue = Math.min(...Object.values(data));

        // Find keys with the minimum value
        const minKeys = Object.keys(data).filter(key => data[key] === minValue);

        // Pick a random key from keys with the minimum value
        const randomMinKey = minKeys[Math.floor(Math.random() * minKeys.length)];
        return randomMinKey;

    }
}

module.exports = RolletGame;