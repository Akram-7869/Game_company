// const {state ,publicRoom, userSocketMap} = require('../utils/JoinRoom');

const Timer = require("./Timer");

class AviatorGame {
    constructor(roomName, io) {
        this.io = io;
        this.roomName = roomName;
        this.currentPhase = 'betting';
        this.bets = [];
        this.totalBets = 0;
        this.bettingTime = 20; // 20 seconds
        this.cashoutTime = 15; // 15 seconds
        this.blastDelay = 3; // 3 seconds
        this.players = new Set();
        this.altitude = 1.00;
        this.totalPayout = 0;

    }

    startGame() {
        if (this.bettingTimer) return; // Prevent multiple starts

        this.currentPhase = 'betting';
        this.io.to(this.roomName).emit('OnTimerStart', { phase: 'betting' });
        console.log(`Betting phase started in room: ${this.roomName}`);

        this.bettingTimer = new Timer(this.bettingTime, (remaining) => {
            this.io.to(this.roomName).emit('betting_tick', { remainingTime: remaining });
        }, () => {
            this.startFlightPhase();
        });

        this.bettingTimer.startTimer();
    }

    startFlightPhase() {
        this.currentPhase = 'flight';
        let chance = 0.5;
        this.io.to(this.roomName).emit('OnTimeUp', { phase: 'flight' });
        console.log(`Flight phase started in room: ${this.roomName}`);

        let maxHeight = 1;
        if (this.totalBets > 0) {
            this.totalPayout = this.totalBets * 3;
            this.maxMultiplier = this.totalPayout / this.totalBets;
            if (Math.random() <= chance) {
                // Win: payout is bet times a random multiplier between 1 and maxMultiplier
                this.maxHeight = 1 + Math.random() * (this.maxMultiplier - 1);
            }

            //   console.log('maxHeight', maxHeight, 'totalPayout', totalPayout, 'maxMultiplier', maxMultiplier);
            if (maxHeight <= 1.00) {
                //round ended restart the timers
                this.triggerBlastEvent();
                console.log('reset Aviator');
            }
        }
        this.flightTimer = new Timer(this.cashoutTime, (remaining) => {

            this.io.to(this.roomName).emit('flight_tick', { h: this.altitude.toFixed(2) });
            this.altitude += 0.01;
        }, () => {
            this.triggerBlastEvent();
        });

        this.flightTimer.startTimer();
    }

    triggerBlastEvent() {
        this.currentPhase = 'blast';
        this.io.to(this.roomName).emit('OnFlightBlast', { message: 'Blast event!' });
        console.log(`Blast event triggered in room: ${this.roomName}`);
        // Clear bets after blast
        this.bets = [];

        setTimeout(() => {
            this.resetTimers();
        }, this.blastDelay * 1000);
    }
    resetTimers() {
        if (this.bettingTimer) {
            this.bettingTimer.reset(0);
        }
        if (this.flightTimer) {
            this.flightTimer.reset(0);
        }
        this.timerRunning = false;
        this.startGame();
    }
    OnBetsPlaced(socket, amount) {
        let WinX = 0.00;

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
}

module.exports = AviatorGame;

