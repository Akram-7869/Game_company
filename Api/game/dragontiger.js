// const {state ,publicRoom, userSocketMap} = require('../utils/JoinRoom');
 
const Timer = require("./Timer");
class DragonTigerGame {
  constructor(roomName, io) {
      this.roomName = roomName;
      this.io = io;
      this.players = [];
      this.gameState = 'waiting';
      this.bettingTimer = new Timer( 10, (remainingTime) => {
        console.log(`Countdown: ${remainingTime}`);
    },()=>{this.endBettingPhase()} ); // 15 seconds betting phase
      this.pauseTimer = new Timer( 3, (remainingTime) => {
        console.log(`PassCountdown: ${remainingTime}`);
    },()=>{this.startBettingPhase()} ); // 6 seconds waiting phase
  }

  startBettingPhase() {
      this.gameState = 'betting';
      this.io.in(this.roomName).emit('message', 'Betting phase started. You have 15 seconds to place your bets.');
      console.log('startBettingPhase');
      this.bettingTimer.reset(10);
      this.bettingTimer.startTimer();
  }

  endBettingPhase() {
      this.gameState = 'paused';
      this.io.in(this.roomName).emit('message', 'Betting phase ended. Calculating results...');
      console.log('endBettingPhase');

      this.pauseTimer.reset(3);
      this.pauseTimer.startTimer();
  }

  addPlayer(playerId) {
      if (this.gameState === 'waiting') {
          this.players.push(playerId);
          this.io.to(playerId).emit('message', 'Waiting for the next game to start...');
      } else {
          this.io.to(playerId).emit('message', 'Cannot join, game in progress. Please wait.');
      }
  }

  updatePlayers(players) {
      this.players = players;
  }

  pauseBettingTimer() {
      this.bettingTimer.pause();
  }

  resumeBettingTimer() {
      this.bettingTimer.resume();
  }

  pausePauseTimer() {
      this.pauseTimer.pause();
  }

  resumePauseTimer() {
      this.pauseTimer.resume();
  }
}
module.exports = DragonTigerGame;
