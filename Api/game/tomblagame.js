// const {state ,publicRoom, userSocketMap} = require('../utils/JoinRoom');
const Timer = require("./Timer");

class TambolaGame {
  constructor(io, room) {
    this.io = io;
    this.room = room;
    this.numbers = new Set();
    this.numbersArray = this.generateNumbers();
    this.claimed = {
      upperRow: 0,
      lowerRow: 0,
      fullHouse: 0,
      middle: 0,
      fourcorner: 0,
      earlyfive: 0,
      upperRowTotal: 0,
      lowerRowTotal: 0,
      fullHouseTotal: 0,
      middleTotal: 0,
      fourcornerTotal: 0,
      earlyfiveToal: 0
    };

    this.players = new Map();
    this.gameStarted = false;
    this.totalTicket = 0;
    this.totalAmount = 0;
    this.roomJoinTimers=null;
  }

  updatePlayers(players) {
    this.players = players;
  }
  setupGame() {
    if (this.roomJoinTimers) return; // Prevent multiple starts

    this.currentPhase = 'joining';
 
    this.io.to(this.room).emit('OnTimerStart', { phase: 'joining', joining_remaing: this.bettingTimer?.remaining});

    this.roomJoinTimers =  new Timer(30, (remaining) => {
        this.io.to(this.room).emit('join_tick', { remaining });
    }, () => {
        this.startGame();
    });

    this.roomJoinTimers.startTimer();
    console.log(`Game started in room: ${this.room}`);
    
}
  startGame() {
    if (this.gameStarted) return; // Prevent multiple starts

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

      const { playerTickets, amount } = d;
      this.totalTicket += playerTickets;
      this.totalAmount += amount;

      this.io.to(this.roomName).emit('onBetPlaced', d);

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
    this.players.set(player.userId, socket);

    this.onBetPlaced(socket);
    this.onleaveRoom(socket);
    this.OnCurrentStatus(socket);
  }


  onleaveRoom(socket) {
    socket.on('onleaveRoom', function (data) {
      try {
        console.log('OnleaveRoom--tambola')
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
      this.io.to(socket.id).emit('OnCurrentStatus', {
        gameType: 'Tambola',
        room: this.room,
        numbers: Array.from(this.numbers),
        claimed: this.claimed,
        gameStarted: this.gameStarted,
        joining_remaing: this.bettingTimer?.remaining,
        currentPhase:this.currentPhase,
        // player:player,
        totalTicket: this.totalTicket
      });
    });
  }


}

module.exports = TambolaGame;
