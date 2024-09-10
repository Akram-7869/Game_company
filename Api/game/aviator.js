// const {state ,publicRoom, userSocketMap} = require('../utils/JoinRoom');

const Timer = require("./Timer");

class AviatorGame {
    constructor(io, roomName, maxPlayers ,lobbyId) {
        this.io = io;this.roomName = roomName;this.maxPlayers = maxPlayers;        this.lobbyId = lobbyId;
         this.currentPhase = 'betting';
        this.bets = [];
        this.totalBets = 0;
        this.bettingTime = 10; // 20 seconds
        this.cashoutTime = 75; // 15 seconds
        this.blastDelay = 3; // 3 seconds
        this.players = new Set();
        this.altitude = 1.00;
        this.round=0;
        this.totalPayout = 0;
        this.winList = ['1X','2X','3X','4X','5X'];
        this.timerInterval=null;
        this.maxHeight=1;
        this.flightTimer=null;
    }

    startGame() {
        if (this.timerRunning) return; // Prevent multiple timers
        this.timerRunning = true;
        this.currentPhase = 'betting';
        this.bets = [];
        this.totalBets = 0;
        this.altitude = 1.00;
        this.totalPayout = 0;


        this.round +=1;
        
        this.bettingTimer = new Timer(this.bettingTime, (remaining) => {
//            console.log(remaining);
            this.io.to(this.roomName).emit('betting_tick', { remainingTime: remaining });
        }, () => {
            this.startFlightPhase();
        });
        this.io.to(this.roomName).emit('OnTimerStart', { phase: 'betting', winList: this.winList, betting_remaing: this.bettingTimer?.remaining,round:this.round });
        //console.log(`Betting phase started in room: ${this.roomName}`);

        this.bettingTimer.startTimer();
        
    }

    startFlightPhase() {
        this.currentPhase = 'flight';
        let chance = 0.5;
        this.io.to(this.roomName).emit('OnTimeUp', { phase: 'flight' });
    
        if (this.totalBets > 0) {
            this.totalPayout = this.totalBets * 3;
            this.maxMultiplier = this.totalPayout / this.totalBets;
    
            if (Math.random() <= chance) {
                // Win: payout is bet times a random multiplier between 1 and maxMultiplier
                this.maxHeight = 1 + Math.random() * (this.maxMultiplier - 1);
            } else {
                this.maxHeight = 1; // No win scenario, height remains at minimum
            }
    
            if (this.maxHeight <= 1.00) {
                // Round ended, restart the timers
                this.triggerBlastEvent();
                console.log('reset Aviator');
                return; // Exit if round has ended
            }
        } else {
            // No bets placed, set maxHeight randomly between 10x and 20x
            this.maxHeight = Math.random() * (15 - 1) + 3; // Random value between 10 and 20
        }
    
        // Adjust cashoutTime to sync with maxHeight (target: 20x in 30 seconds)
        
         this.increaseAltitude();
    }
   
 
    
 
        // Dynamically increases the altitude based on the delay
        increaseAltitude() {
            let delay = this.getDelayForCurrentAltitude(); // Get delay based on altitude
    
            // Increase altitude by 0.1
            this.altitude += 0.1;
    
            // Emit flight tick event
            this.io.to(this.roomName).emit('flight_tick', { h: this.altitude.toFixed(2) });
            console.log(`Current altitude: ${this.altitude.toFixed(2)} (Max Height: ${this.maxHeight})`);
    
            // Check if max height is reached
            if (this.altitude >= this.maxHeight) {
                this.triggerBlastEvent();
                return; // Stop further execution
            }
    
            // Schedule the next increase
            this.flightTimer = setTimeout(() => this.increaseAltitude(), delay);
        }
    
        // Determines the delay based on the current altitude
        getDelayForCurrentAltitude() {
            if (this.altitude < 2) {
                return 1000; // 0.1 increase every 1 second
            } else if (this.altitude < 8) {
                return 600; // 0.1 increase every 5 seconds
            } else {
                return 300; // 0.1 increase every 2.5 seconds
            }
        }
    
        
    
        // Pauses the flight
        pauseFlight() {
            if (this.flightTimer) {
                clearTimeout(this.flightTimer);
                this.flightTimer = null;
                console.log("Flight paused.");
            }
        }
    
    
 
    
    triggerBlastEvent() {
        this.pauseFlight();
        this.currentPhase = 'blast';
        this.io.to(this.roomName).emit('OnFlightBlast', { message: 'Blast event!' });
        console.log(`Blast event triggered in room: ${this.roomName}`);
        // Clear bets after blast
        this.bets = [];
        this.timerInterval = new Timer(this.blastDelay, (remaining) => {}, () => {
            this.resetTimers();
        }).startTimer();
    }
    resetTimers() {
        this.timerRunning = false;
        this.startGame();
    }
    OnBetsPlaced(socket, amount) {
        socket.on("OnBetsPlaced", async (data) => {
            if (this.currentPhase === 'betting') {
                this.bets.push({ id: socket.id, amount });
                this.totalBets += amount;
                this.io.to(this.roomName).emit('OnBetsPlaced', { id: socket.id, amount });
                console.log(`Bet placed in room ${this.roomName}:`, amount);
            } else {
                socket.emit('error', 'Bet not place.');
            }

        });

    }

    OnCashOut(socket) {
        socket.on("OnCashOut", async (data) => {
            let { multiplier, amount } = data;
            if (this.currentPhase === 'flight') {
                // const multiplier = this.getRandomMultiplier();
                const userBet = this.bets.find(bet => bet.id === socket.id);

                if (userBet) {
                    const winnings = amount * multiplier;
                    if (this.totalPayout < 1) {
                        //blast
                        this.triggerBlastEvent();
                        return;
                    } else {
                        this.totalPayout -= winnings;
                        console.log('giving pointssssss', winnings);
                    }
                    this.io.to(socket.id).emit('OnCashOut', { amount: winnings, multiplier });
                    console.log(`User ${socket.id} cashed out in room ${this.roomName}: ${winnings}`);
                    // Remove the user's bet to prevent double cashout
                    this.bets = this.bets.filter(bet => bet.id !== socket.id);
                }
            } else {
                socket.emit('error', 'Can only cash out during flight phase.');
            }
        });
    }

    getRandomMultiplier() {
        return (1 + Math.random() * 4).toFixed(2); // Random multiplier between 1 and 5
    }
    updatePlayers(players) {
        this.players = players;
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
        this.bets = this.bets.filter(bet => bet.id !== socket.id);
        this.io.to(this.roomName).emit('player_left', { id: socket.id });
        console.log(`Player ${socket.id} left room ${this.roomName}`);
    }
    handlePlayerLeave(socket) {
        socket.on('onleaveRoom', function (data) {
            try {
                console.log('OnleaveRoom--Aviatot')
                socket.leave(this.roomName);
                socket.removeAllListeners('OnBetsPlaced');
                socket.removeAllListeners('OnCashOut');
                socket.removeAllListeners('OnFlightBlast');
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
    syncPlayer(socket, player) {
        
        this.OnBetsPlaced(socket);
         this.OnCashOut(socket);
        this.OnCurrentStatus(socket);
        socket.on('onleaveRoom', (data) => this.handlePlayerLeave(socket));

    }
    OnCurrentStatus(socket){
        socket.on('OnCurrentStatus', (d) => {
        this.io.to(socket.id).emit('OnCurrentStatus', {
            gameType: 'DragonTiger',
            room: this.roomName,
            currentPhase: this.currentPhase,
            total_players: this.players.size,
            betting_remaing: this.bettingTimer?.remaining,
            pause_remaing: this.flightTimer?.remaining,
            winList: this.winList,
            round:this.round

        });
    });
    }
}

module.exports = AviatorGame;

