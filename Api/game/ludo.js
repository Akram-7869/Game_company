const Timer = require("./Timer");
const { state, publicRoom, userSocketMap, tokenMiddleware, gameName, sleep, userLeave, getRoomLobbyUsers, getRoomUsers, joinRoom, arraymove, getKeyWithMinValue, defaultRolletValue } = require('../utils/JoinRoom');

class LudoGame {
    constructor(io, roomName, maxPlayers ,lobbyId) {
        this.io = io;this.roomName = roomName;this.maxPlayers = maxPlayers;        this.lobbyId = lobbyId;

        this.players = new Map();this.bots = new Map();
         this.turnOrder = [];
        this.currentTurnIndex = 0;
        this.currentPhase = 'waiting'; // possible states: waiting, playing, finished
        this.turnTimer = null;
        this.roomJoinTimers = null;
        this.currentPhase = 'createdroom';
        this.bettingTimer = null;
        this.pauseTimer = null;
        this.round = 0;
        this.bettingTime = 20; // 20 seconds
        this.pauseTime = 9; // 5 seconds
        this.lastDiceValue = 6;
    }

    addPlayer(socket) {
        if (this.players.size + this.bots.size < this.maxPlayers) {
            this.players.add(socket.id);
             console.log(`Player ${socket.id} joined room ${this.roomName}`);
        } else {
            socket.emit('error', 'Room is full.');
        }
    }

    addBot() {
        let bot = {
            userId: '1-bot',
            name: 'Tester-bot',
            balance: '575.79',
            lobbyId: '66613de5980bf75b5ec9abb4',
            maxp: 2,
            type: 'bot',
            pasa_1: 0,
            pasa_2: 0,
            pasa_3: 0,
            pasa_4: 0,
            playerStatus: 'joined',
            avtar: 'http://174.138.52.41/assets/img/logo/profile_default.png'
        }
        console.log(this.players.size,'bot-',this.bots.size,'max',this.maxPlayers  )
        if (this.players.size + this.bots.size < this.maxPlayers) {
            let botNumber =this.maxPlayers-this.players.size ;
             for (let i=0;i<botNumber;i++) {
            let botId = `${i + 1}-bot`;
            bot['userId'] = botId;
            bot['name'] = botId;
            this.bots.set(botId, { player: {...bot,userId:botId, name:botId } });
            console.log(`Bot ${botId} added to room ${this.roomName}`);
             }


        }

    }
    syncPlayer(socket, player) {
        // Send current game state to the player
        if(!this.players.has(player.userId)){
              this.players.set(player.userId, { player, socket, lives: 3, position: -1 });
        this.onleaveRoom(socket);
        this.OnCurrentStatus(socket);
        this.OnMovePasa(socket);
        this.OnRollDice(socket);
        this.OnKillEvent(socket);
        this.OnContinueTurn(socket);

        }
      
    }

    onleaveRoom(socket) {
        socket.on('onleaveRoom',  (data)=> {
            let { PlayerID } = data;
            console.log(data,'onleaveRoom');
            
                console.log('OnleaveRoom--ludo')
                socket.leave(this.roomName);
                socket.removeAllListeners('OnBetsPlaced');
                socket.removeAllListeners('OnCurrentStatus');
                socket.removeAllListeners('OnMovePasa');
                socket.removeAllListeners('OnRollDice');
                socket.removeAllListeners('OnNextTurn');
                socket.removeAllListeners('OnKillEvent');
                socket.removeAllListeners('OnContinueTurn');




                socket.removeAllListeners('OnWinNo');
                socket.removeAllListeners('OnTimeUp');
                socket.removeAllListeners('OnTimerStart');
                socket.removeAllListeners('onleaveRoom');
                if (this.players.has(PlayerID)) {
                    let obj = this.players.get(PlayerID); // Get the object
                    obj.player.playerStatus = 'Left';
                    this.turnOrder = [...this.getPlayers(), ...this.getBots()];

                }
                // Modify the object

                // playerManager.RemovePlayer(socket.id);
                this.io.to(this.roomName).emit('onleaveRoom', {
                    players: this.turnOrder,

                });

             
        });
    }

    setupGame() {
        if (this.roomJoinTimers) return; // Prevent multiple starts

        this.currentPhase = 'createdroom';
        this.roomJoinTimers = new Timer(10, (remaining) => {
            this.io.to(this.roomName).emit('join_tick', { remaining });
            if (remaining === 5) {
                this.addBot();
                this.emitJoinPlayer();
            }

        }, () => {
            this.startGame();
        });

        this.roomJoinTimers.startTimer();
        
        console.log(publicRoom[this.lobbyId]['played'], 'fff')
        console.log(`Game started in room: ${this.roomName}`);

    }
    emitJoinPlayer(socket) {
        console.log('players:',this.players,'Bots: ', this.bots);
        this.turnOrder = [...this.getPlayers(), ...this.getBots()];
        this.io.to(this.roomName).emit('join_players', { players: this.turnOrder });
    }

    

    getPlayers() {
        return Array.from(this.players.values()).map(value => value.player);
    }
    getBots() {
        return Array.from(this.bots.values()).map(value => value.player);
    }
    OnMovePasa(socket) {
        socket.on('OnMovePasa', (d) => {
            let { PlayerID, key, steps } = d;
            let obj = this.players.get(PlayerID); // Get the object
            obj.player[key] = obj.player[key] + steps;
            this.io.to(this.roomName).emit('OnMovePasa', d);
        });
    }
    
    OnRollDice(socket) {
        
        socket.on('OnRollDice', (d) => {
            this.lastDiceValue = this.lastDiceValue === 1 ? 6 : 1;
            this.io.to(this.roomName).emit('OnRollDice', {
            
                dice:  this.lastDiceValue,// Math.floor(Math.random() * 6) + 1,
                currentTurnIndex :this.currentTurnIndex
            });
        });
    }
    OnCurrentStatus(socket) {
        socket.on('OnCurrentStatus', (d) => {
            this.io.to(socket.id).emit('OnCurrentStatus', {
                gameType: 'Ludo',
                room: this.roomName,
                currentPhase: this.currentPhase,
                players: this.turnOrder,
                currentTurnIndex: this.currentTurnIndex,
                betting_remaing: this.bettingTimer?.remaining,
                pause_remaing: this.pauseTimer?.remaining,
                //   winList: this.winList,
                //  round:this.round

            });
        });
    }
    startGame() {
        if (this.bettingTimer) return; // Prevent multiple starts
        publicRoom[this.lobbyId]['played']=true;
        this.currentPhase = 'playing';
        this.round += 1;
        this.turnOrder = [...this.getPlayers(), ...this.getBots()];


        this.bettingTimer = new Timer(3, (remaining) => {
            // console.log(remaining);
            //this.io.to(this.roomName).emit('play_tick', { remainingTime: remaining });
        }, () => {
            //  this.startPausePhase();
            this.nextTurn();

        }).startTimer();
        console.log(`Game started in room: ${this.roomName}`);

    }

    startTurnTimer(socket) {
        if (this.turnTimer) {
            this.turnTimer?.reset(15);
        }
         console.log('OnNextTurn-binding');              
            this.io.to(this.roomName).emit('OnNextTurn', {
                gameType: 'Ludo',
                room: this.roomName,
                currentPhase: this.currentPhase,
                currentTurnIndex: this.currentTurnIndex,
            });
    
      //  Set timer for the next turn
        this.turnTimer = new Timer(15, (remaining) => {
            this.io.to(this.roomName).emit('turn_tick', { remaining, currentTurnIndex: this.currentTurnIndex });
        }, () => {
            this.handleTurnTimeout();
        });

        this.turnTimer.startTimer();
    }
    handleTurnTimeout(socket) {
        const currentPlayer = this.turnOrder[this.currentTurnIndex];
        const playerObj = this.players.get(currentPlayer.userId);

        if (playerObj) {
            playerObj.lives -= 1;
           // this.io.to(this.roomName).emit('player_lost_life', { playerId: currentPlayer.userId, lives: playerObj.lives });

            if (playerObj.lives <= 0) {
                playerObj.status = 'left';
               // this.players.delete(currentPlayer.userId);
               // this.io.to(this.roomName).emit('player_left', { playerId: currentPlayer.userId });
            }
        }

        this.nextTurn();
    }
    OnContinueTurn(socket) {
        socket.on('OnContinueTurn', (d) => {
            let {currentTurnIndex, canContinue}=d;  
            this.turnTimer?.reset(15);
            if(canContinue ===true){
                this.turnTimer?.startTimer();
            }else{
                 this.nextTurn();
            }
            
            this.io.to(this.roomName).emit('OnContinueTurn', d);
        });
    }
    
    nextTurn() {
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
        const currentPlayer = this.turnOrder[this.currentTurnIndex];

        if (this.players.has(currentPlayer.userId) && currentPlayer.status !== 'left') {
          //  this.io.to(this.roomName).emit('turn_start', { player: currentPlayer });
            if (this.bots.has(currentPlayer.userId)) {
              //  this.botMove(currentPlayer.userId);
            } else {
                this.startTurnTimer();
            }
        } else {
            this.nextTurn(); // Skip to the next player if the current player has left
        }
    }


    botMove(botId) {
        // Simulate bot move
        const move = { dice: Math.floor(Math.random() * 6) + 1 };
        console.log(`Bot ${botId} made a move:`, move);
        this.io.to(this.roomName).emit('bot_move', { id: botId, move });
        // Wait for a while before proceeding to the next turn
        setTimeout(() => {
            this.nextTurn();
        }, 2000);
    }

    playerMove(socket, move) {
        if (this.turnOrder[this.currentTurnIndex] !== socket.id) {
            socket.emit('error', 'Not your turn.');
            return;
        }

        this.io.to(this.roomName).emit('player_move', { id: socket.id, move });
        console.log(`Player ${socket.id} made a move:`, move);
        this.nextTurn();
    }

    endGame() {
        this.currentPhase = 'finished';
        this.io.to(this.roomName).emit('game_end', { message: 'Game has ended.' });
        console.log(`Game ended in room: ${this.roomName}`);
        this.resetGame();
    }

    resetGame() {
        this.players.clear();
        this.bots.clear();
        this.turnOrder = [];
        this.currentTurnIndex = 0;
        this.currentPhase = 'waiting';
        if (this.turnTimer) {
            this.turnTimer.pause();
        }
    }
    OnKillEvent(socket) {
        socket.on('OnKillEvent', (d) => {
            this.io.to(this.roomName).emit('OnKillEvent', d);
        });
    }

}

module.exports = LudoGame;
