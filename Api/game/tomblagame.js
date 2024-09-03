// const {state ,publicRoom, userSocketMap} = require('../utils/JoinRoom');
const { publicRoom } = require("../utils/JoinRoom");
const Timer = require("./Timer");

class TambolaGame {
  constructor(io, roomName, maxPlayers ,lobbyId) {
    this.io = io;this.room = roomName;this.maxPlayers = maxPlayers;        this.lobbyId = lobbyId;    this.io = io;
    this.numbers = new Set();
    this.numbersArray = this.generateNumbers();
    this.claimed = {
      upperRow: 5,
      lowerRow: 5,
      fullHouse: 5,
      middle: 5,
      fourCorner: 5,
      earlyFive: 5,
      upperRowTotal: 0,
      lowerRowTotal: 0,
      fullHouseTotal: 0,
      middleTotal: 0,
      fourcornerTotal: 0,
      earlyFiveToal: 0
    };

    this.players = new Map();
    this.gameStarted = false;
    this.totalTicket = 0;
    this.totalAmount = 0;
    this.roomJoinTimers=null;
    this.bettingTimer=null;
    this.prizeDistribution = {
      top: 0.15,
      middle: 0.15,
      bottom: 0.15,
      earlyFive: 0.05,
      fourCorners: 0.15,
      fullHouse: 0.35
    };
    this.adminCommission = 0.2;
    this.intervalId = null;
    this.currentPhase = 'joining';
    this.messages = []; 
  }

  updatePlayers(players) {
    this.players = players;
  }
  addMessage(message) {
    if (this.messages.length >= 100) {
      this.messages.shift(); // Remove the oldest message to maintain the limit
    }
    this.messages.push(message);
  }
  setupGame() {
    if (this.roomJoinTimers) return; // Prevent multiple starts

    this.currentPhase = 'joining';
 
    this.io.to(this.room).emit('OnTimerStart', { phase: 'joining', joining_remaing: this.bettingTimer?.remaining});

    this.roomJoinTimers =  new Timer(10, (remaining) => {
        this.io.to(this.room).emit('join_tick', { remaining });
    }, () => {
        this.startGame();
    });

    this.roomJoinTimers.startTimer();
    console.log(`Game started in room: ${this.room}`);
    
}
  startGame() {
    if (this.gameStarted) return; // Prevent multiple starts
    publicRoom[this.lobbyId]['played']=true;
    this.gameStarted = true;
    // for (let value of this.players.values()) {
    //   const ticket = this.generateTicket();
    //   this.io.to(value.socket_id).emit('gameStart', { gameType: 'tambola', room: this.room, ticket, totalTicket: 0 });
    // };
    this.currentPhase = 'started';

    // Start the game logic here (e.g., drawing numbers)
    this.io.to(this.room).emit('OnTimeUp', { phase: 'started' });
    this.startGameLogic();
  }

  startGameLogic() {
    console.log(`Tambola game started in room: ${this.room}`);
    let delay = 5;
    let delayMicrosec = delay*1000;

    this.intervalId  = setInterval(() => {
      if (this.currentPhase === 'paused') return; // Skip drawing numbers if game is paused

      const number = this.drawNumber();
      if (number === null) {
        clearInterval(this.intervalId);
        this.io.to(this.room).emit('gameEnded', { message: 'All numbers have been drawn' });
      } else {
        console.log(`newnumber--->`, number)
        this.io.to(this.room).emit('newNumber', { gameType: 'tambola', room: this.room, number , intervel:delay, playerCount:this.players.size});
      }
    }, delayMicrosec); // Draw a number every second
  }

  generateNumbers() {
    const numbersArray = Array.from({ length: 90 }, (_, i) => i + 1);
    this.shuffle(numbersArray);
    return numbersArray;
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  drawNumber() {
    if (this.numbersArray.length === 0) {
      console.log("All numbers have been drawn.");
      return null;
    }
    const number = this.numbersArray.pop();
    this.numbers.add(number);
    return number;
  }

  generateTicket() {
    // const ticket = Array.from({ length: 3 }, () => Array(9).fill(null));

    // const columns = Array.from({ length: 9 }, (_, i) => i);
    // this.shuffle(columns);

    // for (let row = 0; row < 3; row++) {
    //   const numbers = Array.from({ length: 5 }, () => this.randomNumberInRange(row * 10 + 1, (row + 1) * 10));
    //   this.shuffle(numbers);
    //   for (let col = 0; col < 9; col++) {
    //     if (numbers.length && columns.includes(col)) {
    //       ticket[row][col] = numbers.pop();
    //     }
    //   }
    // }

    // return ticket;
  }
  onBetPlaced(socket) {
    socket.removeAllListeners('onBetPlaced');

    socket.on('onBetPlaced', (d) => {
console.log('onBetPlaced',d);
      const { playerTickets, betAmount } = d;
      this.totalTicket += playerTickets;
      this.totalAmount += betAmount;

      this.io.to(this.room).emit('onBetPlaced', d);

    });
  }

  randomNumberInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  syncPlayer(socket, player) {

    // Send current game state to the player
    // this.io.to(playerId).emit('syncState', {
    //   gameType: 'Tambola',
    //   room: this.room,
    //   numbers: Array.from(this.numbers),
    //   claimed: this.claimed,
    //   gameStarted: this.gameStarted,
    //   player:player,
    //   totalTicket:this.totalTicket
    // });
    if(!this.players.has(player.userId)){
      const { playerTickets, betAmount } = player;
      this.totalTicket += playerTickets;
      this.totalAmount += betAmount;
      this.players.set(player.userId, socket);
    }
    

    this.onBetPlaced(socket);
    socket.on('onleaveRoom', (data) => this.handlePlayerLeave(socket));
    this.OnCurrentStatus(socket);
    this.OnClaimReward(socket);
  }


  handlePlayerLeave(socket) {
    socket.on('onleaveRoom', function (data) {
      try {
        console.log('OnleaveRoom--tambola')
        socket.leave(this.roomName);
        socket.removeAllListeners('OnBetsPlaced');
        socket.removeAllListeners('OnCurrentStatus');
        socket.removeAllListeners('OnClaimReward');



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
      this.io.to(socket.id).emit('OnCurrentStatus', {
        gameType: 'Tambola',
        room: this.room,
        numbers: Array.from(this.numbers),
        claimed: this.claimed,
        gameStarted: this.gameStarted,
        joining_remaing: this.bettingTimer?.remaining,
        currentPhase:this.currentPhase,
        // player:player,
        totalTicket: this.totalTicket,
        totalAmount: this.totalAmount

      });
    });
  }
  OnClaimReward(socket) {
    socket.on('OnClaimReward', (d) => {
      console.log('OnClaimReward',d);

      // Pause the game
      this.currentPhase = 'paused';
      this.io.to(this.room).emit('gamePaused', { message: 'Game paused to validate claims.' });

      const rewardType = d.ClaimType; // 'top', 'middle', 'bottom', 'earlyFive', 'fourCorners', or 'fullHouse'
     // const rewardAmount = this.calculateReward(rewardType);

      if (this.claimed[rewardType] >  0) {
        this.claimed[rewardType] -= 1;
        this.claimed[`${rewardType}Total`] += d.rewardAmount;
        this.io.to(this.room).emit('OnClaimReward', {
          success: true,
          rewardType,
          name:d.name,
          rewardAmount:d.rewardAmount,
          claimed: this.claimed
        });
        console.log('OnClaimReward<<<-----', this.claimed);
      } else {
        console.log('OnClaimReward<<==== Error');

        this.io.to(socket.id).emit('OnClaimReward', {
          success: false,
          message: 'Invalid claim or reward already distributed.'
        });
      }

      // Check if any prizes are left
      const prizesLeft = Object.keys(this.claimed).some(
        key => key.endsWith('Total') && this.claimed[key] === 0
      );

      if (!prizesLeft) {
        this.currentPhase = 'ended';
        clearInterval(this.intervalId); // Stop the number drawing interval
        this.io.to(this.room).emit('gameEnded', { message: 'All prizes claimed, game ended.' });
      } else {
        this.currentPhase = 'started';
        this.io.to(this.room).emit('gameResumed', { message: 'Game resumed.' });
      }
    });
  }

  calculateReward(rewardType) {
    const totalAfterCommission = this.totalAmount * (1 - this.adminCommission);
    return totalAfterCommission * this.prizeDistribution[rewardType];
  }


}

module.exports = TambolaGame;
