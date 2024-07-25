// const {state ,publicRoom, userSocketMap} = require('../utils/JoinRoom');

class TambolaGame {
  constructor(io, room) {
    this.io = io;
    this.room = room;
    this.numbers = new Set();
    this.numbersArray = this.generateNumbers();
    this.claimed = {
      upperRow: false,
      lowerRow: false,
      fullHouse: false,
      middle: false,
      fourcorner: false,
      earlyfive: false
    };
    this.players = [];
    this.gameStarted = false;
    this.totalTicket= 0;
    this.totalAmount=0;
  }

  updatePlayers(players) {
    this.players = players;
  }

  startGame() {
    if (this.gameStarted) return; // Prevent multiple starts

    this.gameStarted = true;
    const players = this.players;
    players.forEach(playerId => {
      const ticket = this.generateTicket();
      this.io.to(playerId.socket_id).emit('gameStart', { gameType: 'tambola', room: this.room, ticket , totalTicket:0  });
    });

    // Start the game logic here (e.g., drawing numbers)
    this.startGameLogic();
  }

  startGameLogic() {
    console.log(`Tambola game started in room: ${this.room}`);
    const intervalId = setInterval(() => {
      const number = this.drawNumber();
      if (number === null) {
        clearInterval(intervalId);
        this.io.to(this.room).emit('tambolaEnd', { message: 'All numbers have been drawn' });
      } else {
         console.log(`newnumber`)
        this.io.to(this.room).emit('newNumber', { gameType: 'tambola', room: this.room, number });
      }
    }, 30000); // Draw a number every second
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
    const ticket = Array.from({ length: 3 }, () => Array(9).fill(null));

    const columns = Array.from({ length: 9 }, (_, i) => i);
    this.shuffle(columns);

    for (let row = 0; row < 3; row++) {
      const numbers = Array.from({ length: 5 }, () => this.randomNumberInRange(row * 10 + 1, (row + 1) * 10));
      this.shuffle(numbers);
      for (let col = 0; col < 9; col++) {
        if (numbers.length && columns.includes(col)) {
          ticket[row][col] = numbers.pop();
        }
      }
    }

    return ticket;
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

  randomNumberInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  syncPlayer(playerId,player) {
    this.totalTicket +=  player.playerTickets; 
    this.totalAmount +=  player.amount; 
    // Send current game state to the player
    this.io.to(playerId).emit('syncState', {
      gameType: 'tambola',
      room: this.room,
      numbers: Array.from(this.numbers),
      claimed: this.claimed,
      gameStarted: this.gameStarted,
      player:player,
      totalTicket:this.totalTicket
    });
    
  }
}

module.exports = TambolaGame;
