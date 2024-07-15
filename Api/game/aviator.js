// const {state ,publicRoom, userSocketMap} = require('../utils/JoinRoom');
 
const Timer = require("./Timer");
 
class AviatorGame {
    constructor( roomName,io) {
        this.io = io;
        this.roomName = roomName;
        this.currentPhase = 'betting';
        this.bets = [];
        this.totalBets = 0;
        this.bettingTime = 20; // 20 seconds
        this.cashoutTime = 15; // 15 seconds
        this.blastDelay = 3; // 3 seconds
        this.players = new Set();
    }

    startGame() {
        this.currentPhase = 'betting';
        this.io.to(this.roomName).emit('phase_change', { phase: 'betting' });
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
        this.io.to(this.roomName).emit('phase_change', { phase: 'flight' });
        console.log(`Flight phase started in room: ${this.roomName}`);

        this.flightTimer = new Timer(this.cashoutTime, (remaining) => {
            this.io.to(this.roomName).emit('flight_tick', { remainingTime: remaining });
        }, () => {
            this.triggerBlastEvent();
        });

        this.flightTimer.startTimer();
    }

    triggerBlastEvent() {
        this.io.to(this.roomName).emit('blast', { message: 'Blast event!' });
        console.log(`Blast event triggered in room: ${this.roomName}`);
        // Clear bets after blast
        this.bets = [];

        setTimeout(() => {
            this.startGame();
        }, this.blastDelay * 1000);
    }

    placeBet(socket, amount) {
        if (this.currentPhase === 'betting') {
            this.bets.push({ id: socket.id, amount });
            this.totalBets += amount;
            this.io.to(this.roomName).emit('bet_placed', { id: socket.id, amount });
            console.log(`Bet placed in room ${this.roomName}:`, amount);
        } else {
            socket.emit('error', 'Betting phase is over.');
        }
    }

    cashout(socket) {
        if (this.currentPhase === 'flight') {
            const multiplier = this.getRandomMultiplier();
            const userBet = this.bets.find(bet => bet.id === socket.id);
            if (userBet) {
                const winnings = userBet.amount * multiplier;
                this.io.to(socket.id).emit('cashout_success', { amount: winnings, multiplier });
                console.log(`User ${socket.id} cashed out in room ${this.roomName}: ${winnings}`);
                // Remove the user's bet to prevent double cashout
                this.bets = this.bets.filter(bet => bet.id !== socket.id);
            }
        } else {
            socket.emit('error', 'Can only cash out during flight phase.');
        }
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

 