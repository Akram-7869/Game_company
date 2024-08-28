const Timer = require("./Timer");
const { state, publicRoom, userSocketMap, tokenMiddleware, gameName, sleep, userLeave, getRoomLobbyUsers, getRoomUsers, joinRoom, arraymove, getKeyWithMinValue, defaultRolletValue } = require('../utils/JoinRoom');
const { listeners } = require("../models/File");

class LudoGame {
    constructor(io, roomName, maxPlayers, lobbyId) {
        this.io = io; this.roomName = roomName; this.maxPlayers = maxPlayers; this.lobbyId = lobbyId;

        this.players = new Map(); this.bots = new Map();
        this.turnOrder = [];
        this.currentTurnIndex = -1;
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
        this.botMoveDelay = 2000;
        this.botDifficulty = 'medium'; // 'easy', 'medium', or 'hard'
        this.isGameReady = false;

        // New global path constants
        this.globalPath = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51];
        this.safeSpots = [0, 8, 13, 21, 26, 34, 39, 47];
        this.playerStartPositions = [0, 13, 26, 39];
    }

    syncPlayer(socket, player) {
        // Send current game state to the player
        if (!this.players.has(player.userId)) {
            this.players.set(player.userId, { player, socket, lives: 3, position: -1 });
            this.setupPlayerListeners(socket)

        }

    }
    checkAndAddBots() {
        let totalPlayers = this.players.size + this.bots.size;
        if (totalPlayers < this.maxPlayers && this.players.size > 0) {
            const botsToAdd = this.maxPlayers - totalPlayers;
            this.addBots(botsToAdd);
            totalPlayers = this.players.size + this.bots.size;
        }
        if (totalPlayers === this.maxPlayers) {
            this.isGameReady = true;
            this.emitJoinPlayer();
        }
    }
    addBots(count) {
        for (let i = 0; i < count; i++) {
            //let botId = `bot-${this.bots.size + 1}`;
            let botId = `${i + 1}-bot`;
            this.bots.set(botId, {
                player: {
                    userId: botId,
                    name: `Bot ${this.bots.size + 1}`,
                    balance: '1000',
                    lobbyId: this.lobbyId,
                    maxp: this.maxPlayers,
                    type: 'bot',
                    pasa_1: -1, pasa_2: -1, pasa_3: -1, pasa_4: -1,
                    playerStatus: 'joined',
                    avtar: 'http://example.com/bot-avatar.png'
                }
            });
            console.log(`Bot ${botId} added to room ${this.roomName}`);
        }
    }
    setupGame() {
        if (this.roomJoinTimers) return; // Prevent multiple starts

        this.currentPhase = 'createdroom';
        this.roomJoinTimers = new Timer(10, (remaining) => {
            this.io.to(this.roomName).emit('join_tick', { remaining });
            if (remaining === 5) {
                this.checkAndAddBots();
            }

        }, () => {
            if (this.isGameReady) {
                this.startGame();
            } else {
                console.log("Not enough players to start the game.");
                this.io.to(this.roomName).emit('game_cancelled', { reason: 'Not enough players' });
            }
        });

        this.roomJoinTimers.startTimer();
        console.log(`Game started in room: ${this.roomName}`);

    }
    emitJoinPlayer() {
        this.io.to(this.roomName).emit('join_players', { players: this.getTurnOrder() });
    }

    getJoinedPlayers() {
        return Array.from(this.players.values())
            .filter(value => value.status === 'joined') // Filter players with status 'joined'
            .map(value => value.player); // Map to get the player objects
    }

    getPlayers() {
        return Array.from(this.players.values()).map(value => value.player);
    }
    getBots() {
        return Array.from(this.bots.values()).map(value => value.player);
    }
    // Updated handlePlayerMove method with validation
    handlePlayerMove(socket, data) {
        let { PlayerID, pasaIndex, steps, currentPosition, newPosition, globalPosition, isGlobal } = data;
        let playerIndex = this.turnOrder.findIndex(p => p.userId === PlayerID);
        let player = this.turnOrder[playerIndex];
        let pasa_k = `pasa_${pasaIndex + 1}`;
 
        console.log('player-move', data, 'pasa_k', pasa_k);
 
        if (player && player[pasa_k] !== undefined) {
            // Validate the move
            if (!this.validateMove(player, pasaIndex, steps)) {
                console.log('Invalid move detected');
                socket.emit('InvalidMove', { message: 'The move is not valid.' });
                return;
            }
 
            // Update player position
            player[pasa_k] = newPosition;
            player.score = this.calculatePlayerScore(player); // Recalculate score
 
            // Emit move to all clients
            this.io.to(this.roomName).emit('OnMovePasa', data);
 
            // Check for kills
            const killed = this.checkForKills(player, globalPosition);
            if (killed.length > 0) {
                this.handleKill(player, killed);
            }
 
            // Handle turn continuation
            this.handleTurnContinuation(player, steps === 6 || killed.length > 0);
 
            // Update and emit scores
            this.updateScores();
        }
    }
      // New method to handle game state updates
      updateGameState() {
        const gameState = {
            currentTurnIndex: this.currentTurnIndex,
            currentPlayerId: this.turnOrder[this.currentTurnIndex].userId,
            players: this.turnOrder.map(player => ({
                userId: player.userId,
                score: player.score,
                pasaPositions: [player.pasa_1, player.pasa_2, player.pasa_3, player.pasa_4]
            }))
        };
        this.io.to(this.roomName).emit('GameStateUpdate', gameState);
    }
    handleTurnContinuation(player, canContinue) {
        if (canContinue) {
            this.io.to(this.roomName).emit('AllowReroll', {
                PlayerID: player.userId,
                reason: canContinue ? 'Rolled a 6 or Killed a token' : 'Normal turn end'
            });
 
            if (this.turnTimer) {
                this.turnTimer.reset(15);
            }
        } else {
            this.nextTurn();
        }
 
        this.io.to(this.roomName).emit('OnContinueTurn', {
            PlayerID: player.userId,
            canContinue: canContinue
        });
    }

    handleKill(killerPlayer, killed) {
        killed.forEach(({ player, tokenKey, pasaIndex }) => {
            player[tokenKey] = -1; // Reset to home position
            player.score -= this.calculateKillPenalty(player[tokenKey]); // Deduct points for being killed
 
            let killData = {
                killerPlayerIndex: this.turnOrder.findIndex(p => p.userId === killerPlayer.userId),
                killerPasaIndex: parseInt(tokenKey.split('_')[1]) - 1,
                killedPlayerIndex: this.turnOrder.findIndex(p => p.userId === player.userId),
                killedPasaIndex: pasaIndex
            };
            console.log('handleKill emitting OnKillEvent', killData);
            this.io.to(this.roomName).emit('OnKillEvent', killData);
        });
 
        // Update killer's score
        killerPlayer.score += killed.length * 10; // Add points for killing
 
        this.updateScores();
    }
    calculateKillPenalty(position) {
        return Math.max(0, position); // Penalty is the number of steps taken, minimum 0
    }
       // New method to update and emit scores
       updateScores() {
        let scores = this.turnOrder.map(player => ({
            PlayerID: player.userId,
            score: player.score
        }));
        this.io.to(this.roomName).emit('UpdateScores', scores);
    }
 
    // Updated checkForKills method
    checkForKills(killerPlayer, globalPosition) {
        const killed = [];
        this.turnOrder.forEach(player => {
            if (player.userId !== killerPlayer.userId) {
                for (let i = 1; i <= 4; i++) {
                    const tokenKey = `pasa_${i}`;
                    if (this.getGlobalPosition(player, player[tokenKey]) === globalPosition && !this.isSafePosition(globalPosition)) {
                        killed.push({ player, tokenKey, pasaIndex: i - 1 });
                    }
                }
            }
        });
        return killed;
    }
    getGlobalPosition(player, localPosition) {
        if (localPosition === -1) return -1; // Home position
        let startPosition = this.playerStartPositions[this.turnOrder.indexOf(player) % 4];
        return (startPosition + localPosition) % 52;
    }
 
    checkAndUpdateBotPositions(newPosition) {
        this.turnOrder.forEach(player => {
            if (player.type === 'bot') {
                for (let i = 1; i <= 4; i++) {
                    const tokenKey = `pasa_${i}`;
                    if (player[tokenKey] === newPosition && !this.isSafePosition(newPosition)) {
                        this.updateBotPosition(player, tokenKey);
                    }
                }
            }
        });
    }
    updateBotPosition(botPlayer, tokenKey) {
        // Reset bot token to home position
        botPlayer[tokenKey] = -1;

        // Update bot's state in the bots Map
        const botInMap = this.bots.get(botPlayer.userId);
        if (botInMap) {
            botInMap.player[tokenKey] = -1;
        }

        console.log(`Bot token updated: ${botPlayer.userId}, ${tokenKey} set to -1`);
    }
     // Updated handlePlayerRollDice method
     handlePlayerRollDice(socket) {
        let diceValue = Math.floor(Math.random() * 6) + 1;
        this.io.to(this.roomName).emit('OnRollDice', {
            dice: diceValue,
            currentTurnIndex: this.currentTurnIndex,
            currentPalyerId: this.turnOrder[this.currentTurnIndex].userId,
        });
    }
     // Updated sendCurrentStatus method
     sendCurrentStatus(socket) {
        socket.emit('OnCurrentStatus', {
            gameType: 'Ludo',
            room: this.roomName,
            currentPhase: this.currentPhase,
            players: this.turnOrder.map(player => ({
                ...player,
                score: player.score // Include the score in the status update
            })),
            currentTurnIndex: this.currentTurnIndex,
            betting_remaing: this.bettingTimer?.remaining,
            currentPalyerId: this.turnOrder[this.currentTurnIndex].userId,
        });
    }
    initializePlayerScores() {
        this.turnOrder.forEach(player => {
            player.score = 0;
        });
    }
    
    startGame() {
        if (this.bettingTimer) return; // Prevent multiple starts
        publicRoom[this.lobbyId]['played'] = true;
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

     // Updated nextTurn method
     nextTurn() {
        if (this.turnTimer) {
            this.turnTimer?.reset(15);
        }
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
        const currentPlayer = this.turnOrder[this.currentTurnIndex];
        this.io.to(this.roomName).emit('OnNextTurn', {
            gameType: 'Ludo',
            room: this.roomName,
            currentPhase: this.currentPhase,
            currentTurnIndex: this.currentTurnIndex,
            currentPalyerId: currentPlayer.userId
        });
        console.log('OnNextTurn', this.currentTurnIndex, this.turnOrder);
 
        if (currentPlayer.type === 'bot') {
            this.botTurn(currentPlayer);
        } else {
            this.startTurnTimer();
        }
    }
  // New method to calculate player's score
  calculatePlayerScore(player) {
    let score = 0;
    for (let i = 1; i <= 4; i++) {
        const position = player[`pasa_${i}`];
        if (position > 0 && position <= 56) {
            score += position;
        }
    }
    return score;
}
 // New method to handle pasa movement validation
 validateMove(player, pasaIndex, steps) {
    const currentPosition = player[`pasa_${pasaIndex + 1}`];
    const newPosition = currentPosition + steps;

    // Check if the move is within bounds
    if (newPosition > 56) {
        return false;
    }

    // Check if the pasa is moving out of home
    if (currentPosition === -1 && steps !== 6) {
        return false;
    }

    // Additional game-specific rules can be added here

    return true;
}

 startTurnTimer() {
        if (this.turnTimer) {
            this.turnTimer.reset(15); // Reset to 15 seconds or your preferred turn duration
        } else {
            this.turnTimer = new Timer(15, (remaining) => {
                this.io.to(this.roomName).emit('turn_tick', {
                    remaining,
                    currentTurnIndex: this.currentTurnIndex,
                    currentPalyerId: this.turnOrder[this.currentTurnIndex].userId,
                });
            }, () => {
                // Time's up, move to next player
                this.handleTurnTimeout();
            });
        }
        this.turnTimer.startTimer();
    }


    handleTurnTimeout() {
        const currentPlayer = this.turnOrder[this.currentTurnIndex];
        console.log(`Turn timeout for player: ${currentPlayer.userId}`);

        // Implement any timeout-specific logic here
        // For example, you might want to penalize the player or simply move to the next turn

        // Move to next turn
        this.handleTurnContinuation(currentPlayer, 0, false);
    }


    getRandomMove(possibleMoves) {
        return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }

      // Updated getMediumMove method with improved strategy
      getMediumMove(botPlayer, possibleMoves) {
        // Prioritize moves that can kill opponent tokens
        const killMoves = possibleMoves.filter(move => this.canKill(botPlayer, move.globalPosition));
        if (killMoves.length > 0) {
            return this.getRandomMove(killMoves);
        }
 
        // Otherwise, move the farthest token
        return possibleMoves.reduce((prev, current) => 
            (current.newPosition > prev.newPosition) ? current : prev
        );
    }
 

   // Updated getHardMove method with advanced strategy
   getHardMove(botPlayer, possibleMoves) {
    // Prioritize moves that can finish the game
    const winningMoves = possibleMoves.filter(move => move.newPosition === 56);
    if (winningMoves.length > 0) return winningMoves[0];

    // Then prioritize kills
    const killMoves = possibleMoves.filter(move => this.canKill(botPlayer, move.globalPosition));
    if (killMoves.length > 0) return this.getRandomMove(killMoves);

    // Then prioritize safe moves
    const safeMoves = possibleMoves.filter(move => this.isSafePosition(move.globalPosition));
    if (safeMoves.length > 0) {
        return safeMoves.reduce((prev, current) => 
            (current.newPosition > prev.newPosition) ? current : prev
        );
    }

    // If no safe moves, choose the move that advances the farthest
    return possibleMoves.reduce((prev, current) => 
        (current.newPosition > prev.newPosition) ? current : prev
    );
}

  // New method to check if a move can kill opponent tokens
  canKill(botPlayer, globalPosition) {
    return this.turnOrder.some(player => 
        player.userId !== botPlayer.userId && 
        [player.pasa_1, player.pasa_2, player.pasa_3, player.pasa_4].some(pos => 
            this.getGlobalPosition(player, pos) === globalPosition && !this.isSafePosition(globalPosition)
        )
    );
}

    isSafePosition(position) {
        return this.safeSpots.includes(position);
    }
        // Updated botTurn method with improved logic
        botTurn(botPlayer) {
            setTimeout(() => {
                const diceValue = Math.floor(Math.random() * 6) + 1;
                this.io.to(this.roomName).emit('OnRollDice', {
                    dice: diceValue,
                    currentTurnIndex: this.currentTurnIndex,
                    currentPalyerId: botPlayer.userId,
                });
     
                setTimeout(() => {
                    const move = this.getBotMove(botPlayer, diceValue);
                    if (move) {
                        this.executeBotMove(botPlayer, move, diceValue);
                    } else {
                        this.botEndTurn(botPlayer, false);
                    }
                }, this.botMoveDelay);
            }, this.botMoveDelay);
        }
   // New method to get the best move for a bot based on difficulty
   getBotMove(botPlayer, diceValue) {
    const possibleMoves = this.getBotPossibleMoves(botPlayer, diceValue);
    if (possibleMoves.length === 0) return null;

    switch (this.botDifficulty) {
        case 'easy':
            return this.getRandomMove(possibleMoves);
        case 'medium':
            return this.getMediumMove(botPlayer, possibleMoves);
        case 'hard':
            return this.getHardMove(botPlayer, possibleMoves);
        default:
            return this.getRandomMove(possibleMoves);
    }
}








    getServerIndexKey(playerIndex, pasaIndex) {
        return playerIndex * 4 + pasaIndex;
    }

       // Updated botRollDice method
       botRollDice(botPlayer) {
        let diceValue = Math.floor(Math.random() * 6) + 1;
        this.io.to(this.roomName).emit('OnRollDice', {
            dice: diceValue,
            currentTurnIndex: this.currentTurnIndex,
            currentPalyerId: botPlayer.userId,
        });
 
        setTimeout(() => this.botChooseMove(botPlayer, diceValue), this.botMoveDelay);
    }
 
    // Updated botChooseMove method
    botChooseMove(botPlayer, diceValue) {
        const possibleMoves = this.getBotPossibleMoves(botPlayer, diceValue);
        if (possibleMoves.length > 0) {
            let chosenMove;
            switch (this.botDifficulty) {
                case 'easy':
                    chosenMove = this.getRandomMove(possibleMoves);
                    break;
                case 'medium':
                    chosenMove = this.getMediumMove(botPlayer, possibleMoves);
                    break;
                case 'hard':
                    chosenMove = this.getHardMove(botPlayer, possibleMoves);
                    break;
                default:
                    chosenMove = this.getRandomMove(possibleMoves);
            }
            this.executeBotMove(botPlayer, chosenMove, diceValue);
        } else {
            this.botEndTurn(botPlayer, false);
        }
    }
 
    // Updated getBotPossibleMoves method
    getBotPossibleMoves(botPlayer, diceValue) {
        const moves = [];
        for (let i = 1; i <= 4; i++) {
            const tokenKey = `pasa_${i}`;
            const currentPosition = botPlayer[tokenKey];
            if (currentPosition === -1 && diceValue === 6) {
                moves.push({ tokenKey, newPosition: 0, pasaIndex: i - 1, globalPosition: this.getGlobalPosition(botPlayer, 0) });
            } else if (currentPosition >= 0) {
                const newPosition = currentPosition + diceValue;
                if (newPosition <= 56) {
                    moves.push({ tokenKey, newPosition, pasaIndex: i - 1, globalPosition: this.getGlobalPosition(botPlayer, newPosition) });
                }
            }
        }
        return moves;
    }
 
    // Updated getRandomMove, getMediumMove, getHardMove methods remain mostly unchanged
    // Just update them to use the new globalPosition property in moves
 
     // Updated executeBotMove method
     executeBotMove(botPlayer, move, diceValue) {
        const { tokenKey, newPosition, pasaIndex, globalPosition } = move;
        const currentPosition = botPlayer[tokenKey];
        botPlayer[tokenKey] = newPosition;
        botPlayer.score = this.calculatePlayerScore(botPlayer);
 
        const moveData = {
            PlayerID: botPlayer.userId,
            TournamentID: this.lobbyId,
            RoomId: this.roomName,
            pasaIndex: pasaIndex,
            steps: diceValue,
            newPosition: newPosition,
            currentPosition: currentPosition,
            globalPosition: globalPosition,
            isGlobal: true
        };
 
        this.io.to(this.roomName).emit('OnMovePasa', moveData);
 
        const killed = this.checkForKills(botPlayer, globalPosition);
        if (killed.length > 0) {
            this.handleKill(botPlayer, killed);
            this.botEndTurn(botPlayer, true);
        } else {
            this.botEndTurn(botPlayer, diceValue === 6);
        }
 
        this.updateScores();
        this.updateGameState();
    }
       // New method to check if the game is finished
    checkGameFinished() {
        const winner = this.getWinner();
        if (winner) {
            this.endGame('Player finished all tokens');
            return true;
        }
        return false;
    }
    checkForBotKills(botServerIndex, botNewPosition) {
        const killed = [];
        const botRelativePosition = botNewPosition % 13;

        this.turnOrder.forEach((player, serverPlayerIndex) => {
            if (serverPlayerIndex !== botServerIndex) {
                for (let pasaIndex = 0; pasaIndex < 4; pasaIndex++) {
                    const tokenKey = `pasa_${pasaIndex + 1}`;
                    const playerTokenPosition = player[tokenKey];
                    //console.log( 'botRelativePosition', botRelativePosition ,'playerTokenPosition', playerTokenPosition)
                    if (playerTokenPosition >= 0) {
                        const relativePosition = (playerTokenPosition - (serverPlayerIndex * 13) + 52) % 52;
                        //  console.log('relativePosition',relativePosition ,'botRelativePosition', botRelativePosition ,'playerTokenPosition', playerTokenPosition)
                        if (relativePosition === botRelativePosition && !this.isSafePosition(relativePosition)) {
                            killed.push({
                                player,
                                serverPlayerIndex,
                                pasaIndex,
                                tokenKey
                            });
                        }
                    }
                }
            }
        });

        return killed;
    }



    handleBotKill(botPlayer, killed) {
        const botServerIndex = this.turnOrder.findIndex(p => p.userId === botPlayer.userId);

        killed.forEach(({ player, serverPlayerIndex, pasaIndex, tokenKey }) => {
            player[tokenKey] = -1; // Reset to home position

            const killerServerKey = this.getServerIndexKey(botServerIndex, 0); // Assuming bot always uses first pasa
            const killedServerKey = this.getServerIndexKey(serverPlayerIndex, pasaIndex);

            this.io.to(this.roomName).emit('OnKillEvent', {
                killerPlayerIndex: botServerIndex,
                killerPasaIndex: 0, // Assuming bot always uses first pasa
                killedPlayerIndex: serverPlayerIndex,
                killedPasaIndex: pasaIndex
            });
        });

        this.botEndTurn(botPlayer, true);
    }
     // Updated botEndTurn method
     botEndTurn(botPlayer, canContinue) {
        this.io.to(this.roomName).emit('OnContinueTurn', {
            PlayerID: botPlayer.userId,
            canContinue: canContinue
        });
 
        if (this.checkGameFinished()) {
            return;
        }
 
        if (canContinue) {
            setTimeout(() => this.botTurn(botPlayer), this.botMoveDelay);
        } else {
            this.nextTurn();
        }
    }

    setupPlayerListeners(socket) {
        socket.on('OnMovePasa', (data) => this.handlePlayerMove(socket, data));
        socket.on('OnRollDice', () => this.handlePlayerRollDice(socket));
        socket.on('OnCurrentStatus', () => this.sendCurrentStatus(socket));
        socket.on('OnContinueTurn', (data) => this.handlePlayerContinueTurn(socket, data));
        socket.on('onleaveRoom', (data) => this.handlePlayerLeave(socket, data));
       // socket.on('OnKillEvent', (data) => this.handleKillEvent(socket, data));

    }


    // Updated endGame method
    endGame(reason) {
        this.currentPhase = 'finished';
        const winner = this.getWinner();
        this.io.to(this.roomName).emit('game_end', {
            message: 'Game has ended.',
            reason: reason,
            winner: winner ? winner.userId : null,
            finalScores: this.turnOrder.map(player => ({
                PlayerID: player.userId,
                score: player.score
            }))
        });
        console.log(`Game ended in room: ${this.roomName}`);
        this.resetGame();
    }

    handleKillEvent(socket, d) {

        console.log('OnKillEvent', d);
        let targetUser = this.turnOrder[d.killedPlayerIndex];
        let pasaIndex = d.killedPasaIndex;
        let pasa_k = `pasa_${pasaIndex + 1}`
        targetUser[pasa_k] = -1;
        console.log('OnKillEvent', targetUser, pasa_k)
        this.io.to(this.roomName).emit('OnKillEvent', d);

    }



    handlePlayerContinueTurn(socket, data) {
        let { canContinue } = data;
        if (this.turnTimer) {
            this.turnTimer.reset(15);
        }
        if (canContinue) {
            if (this.turnTimer) {
                this.turnTimer.startTimer();
            }
        } else {

            this.nextTurn();
        }
        this.io.to(this.roomName).emit('OnContinueTurn', data);
    }

    handlePlayerLeave(socket, data) {
        let { PlayerID } = data;
        socket.leave(this.roomName);
        if (this.players.has(PlayerID)) {
            let obj = this.players.get(PlayerID);
            obj.player.playerStatus = 'Left';
            this.players.delete(PlayerID);
            this.updateTurnOrder();
        }
        this.io.to(this.roomName).emit('onleaveRoom', {
            players: this.getTurnOrder(),
        });
        this.checkGameStatus();
    }

    updateTurnOrder() {
        this.turnOrder = this.getTurnOrder();
        if (this.currentTurnIndex >= this.turnOrder.length) {
            this.currentTurnIndex = 0;
        }
    }

    getTurnOrder() {
        return [...this.getPlayers(), ...this.getBots()];
    }
    checkGameStatus() {
        let players = this.getJoinedPlayers();
        if (players.length === 0) {
            this.endGame('All players left');
        } else if (this.isGameOver()) {
            this.endGame('Game completed');
        }
    }
    // Updated isGameOver method
    isGameOver() {
        return this.turnOrder.some(player =>
            player.pasa_1 === 56 && player.pasa_2 === 56 && player.pasa_3 === 56 && player.pasa_4 === 56
        );
    }
    // Updated getWinner method
    getWinner() {
        let winner = this.turnOrder.find(player =>
            player.pasa_1 === 56 && player.pasa_2 === 56 && player.pasa_3 === 56 && player.pasa_4 === 56
        );
        if (!winner) {
            // If no player has finished, get the player with the highest score
            winner = this.turnOrder.reduce((prev, current) => (prev.score > current.score) ? prev : current);
        }
        return winner;
    }

   // Updated resetGame method
   resetGame() {
    this.players.clear();
    this.bots.clear();
    this.turnOrder = [];
    this.currentTurnIndex = 0;
    this.currentPhase = 'waiting';
    this.round = 0;
    this.isGameReady = false;
    if (this.turnTimer) {
        this.turnTimer.pause();
    }
    if (this.roomJoinTimers) {
        this.roomJoinTimers.pause();
    }
    if (this.bettingTimer) {
        this.bettingTimer.pause();
    }
    // Reset scores
    this.turnOrder.forEach(player => {
        player.score = 0;
});
}

    setBotDifficulty(difficulty) {
        if (['easy', 'medium', 'hard'].includes(difficulty)) {
            this.botDifficulty = difficulty;
            console.log(`Bot difficulty set to ${difficulty} for room ${this.roomName}`);
        } else {
            console.error(`Invalid bot difficulty: ${difficulty}`);
        }
    }


}

module.exports = LudoGame;
