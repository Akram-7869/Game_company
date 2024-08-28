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
    handlePlayerMove(socket, data) {
        let { PlayerID, key, steps, currentPosition, newPosition } = data;
        // console.log('handlePlayerMove', data);

        let playerIndex = this.turnOrder.findIndex(p => p.userId === PlayerID);
        let pasaIndex = key + 1;
        let pasa_k = `pasa_${pasaIndex}`;

        let player = this.turnOrder[playerIndex];
        console.log('player-move', data, 'pasa_k', pasa_k);

        if (player && player[pasa_k] !== undefined) {
            // skip for home key
            if (currentPosition !== -1) {

                // Update player position
                player[pasa_k] = newPosition;
                // Emit move to all clients
                this.io.to(this.roomName).emit('OnMovePasa', data);

                // Check for kills
                const killed = this.checkForKills(player, newPosition);
                if (killed) {
                    this.handleKill(player, killed);
                }

                // Update game state
                //this.updateGameState();

                // Handle turn continuation
                this.handleTurnContinuation(player, steps === 6 || killed);
            } else {
                console.log('Invalid move detected currentPosition', currentPosition);
                // Optionally, send an error message back to the client
            }
        }
    }
    handleTurnContinuation(player, diceValue, hasKilled) {
        const canContinue = diceValue === 6 || hasKilled;

        if (canContinue) {
            // Player gets another turn
            this.io.to(this.roomName).emit('AllowReroll', {
                PlayerID: player.userId,
                reason: diceValue === 6 ? 'Rolled a 6' : 'Killed a token'
            });

            // Reset turn timer for the same player
            if (this.turnTimer) {
                this.turnTimer.reset(15); // Reset to 15 seconds or your preferred turn duration
            }
        } else {
            // Move to the next player's turn
            const nextPlayer = this.turnOrder[this.currentTurnIndex];

            // Update game state
            //this.updateGameState();

            // Emit turn change event
            this.io.to(this.roomName).emit('OnNextTurn', {
                gameType: 'Ludo',
                room: this.roomName,
                currentPhase: this.currentPhase,
                currentTurnIndex: this.currentTurnIndex,
                currentPalyerId: this.turnOrder[this.currentTurnIndex].userId,
            });

            // Handle next turn based on player type
            if (nextPlayer.type === 'bot') {
                // Start bot turn after a short delay
                setTimeout(() => this.botTurn(nextPlayer), this.botMoveDelay);
            } else {
                // Start turn timer for human player
                this.startTurnTimer();
            }
        }

        // Emit updated game state
        // this.io.to(this.roomName).emit('GameStateUpdate', this.gameState);
    }

    handleKill(killerPlayer, killed) {
        console.log('handleKill', killed);
        killed.forEach(({ player, tokenKey }) => {
            player[tokenKey] = -1; // Reset to home position

            // If the killed token belongs to a bot, update bot's internal state
            // if (player.type === 'bot') {
            //     const botPlayer = this.bots.get(player.userId);
            //     if (botPlayer) {
            //         botPlayer.player[tokenKey] = -1;
            //     }
            // }
            let dd = {
                killerPlayerIndex: this.turnOrder.findIndex(p => p.userId === killerPlayer.userId),
                killerPasaIndex: parseInt(tokenKey.split('_')[1]) - 1,
                killedPlayerIndex: this.turnOrder.findIndex(p => p.userId === player.userId),
                killedPasaIndex: parseInt(tokenKey.split('_')[1]) - 1
            }
            console.log('handleKill enitin OnKillEvent--', dd)
            this.io.to(this.roomName).emit('OnKillEvent', dd);
        });

        // Update game state after kills
        //  this.updateGameState();
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
    handlePlayerRollDice(socket) {
        this.lastDiceValue = this.lastDiceValue === 1 ? 6 : 1;
        // this.lastDiceValue = Math.floor(Math.random() * 6) + 1;
        this.io.to(this.roomName).emit('OnRollDice', {
            dice: this.lastDiceValue,
            currentTurnIndex: this.currentTurnIndex,
            currentPalyerId: this.turnOrder[this.currentTurnIndex].userId,
            
        });
    }
    sendCurrentStatus(socket) {
        socket.emit('OnCurrentStatus', {
            gameType: 'Ludo',
            room: this.roomName,
            currentPhase: this.currentPhase,
            players: this.turnOrder,
            currentTurnIndex: this.currentTurnIndex,
            betting_remaing: this.bettingTimer?.remaining,
            currentPalyerId: this.turnOrder[this.currentTurnIndex].userId,
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

    nextTurn(socket) {
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
            currentPalyerId: this.turnOrder[this.currentTurnIndex].userId
        });
        console.log('OnNextTurn', this.currentTurnIndex, this.turnOrder);

        if (currentPlayer.type === 'bot') {
            this.botTurn(currentPlayer);
            return;
        }
        // else {
        //     this.startTurnTimer();
        // }
        //  Set timer for the next turn
        this.turnTimer = new Timer(15, (remaining) => {
            this.io.to(this.roomName).emit('turn_tick', { remaining, currentTurnIndex: this.currentTurnIndex , currentPalyerId: this.turnOrder[this.currentTurnIndex].userId });
        }, () => {

            this.nextTurn();
        });

        this.turnTimer.startTimer();



        //  console.log('in-next-index',this.currentTurnIndex);
        //         if (currentPlayer.playerStatus !== 'Left') {
        //             if (currentPlayer.type === 'bot') {
        //                 this.botTurn(currentPlayer);
        //             } else {
        //                 this.startTurnTimer();
        //             }
        //         } else {
        //             this.nextTurn();
        //         }

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

    botTurn(botPlayer) {
        // Ensure we're using the most up-to-date bot state
        // const updatedBotPlayer = this.bots.get(botPlayer.userId).player;
        setTimeout(() => this.botRollDice(botPlayer), this.botMoveDelay);
    }

    botRollDice(botPlayer) {
        // const diceValue = Math.floor(Math.random() * 6) + 1;
        let diceValue = this.lastDiceValue = this.lastDiceValue === 1 ? 6 : 1;
        this.io.to(this.roomName).emit('OnRollDice', {
            dice: diceValue,
            currentTurnIndex: this.currentTurnIndex,
            currentPalyerId: this.turnOrder[this.currentTurnIndex].userId,
        });

        setTimeout(() => this.botChooseMove(botPlayer, diceValue), this.botMoveDelay);
    }

    botChooseMove(botPlayer, diceValue) {
        const possibleMoves = this.getBotPossibleMoves(botPlayer, diceValue);
        // console.log('Bot-possibleMoves', possibleMoves);
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

    getBotPossibleMoves(botPlayer, diceValue) {
        const moves = [];
        for (let i = 1; i <= 4; i++) {
            const tokenKey = `pasa_${i}`;
            const currentPosition = botPlayer[tokenKey];
            if (currentPosition === -1 && diceValue === 6) {
                // Move out of home
                moves.push({ tokenKey, newPosition: 0, pasaIndex: i - 1 });
            } else if (currentPosition >= 0) {
                const newPosition = currentPosition + diceValue;
                if (newPosition <= 56) {
                    moves.push({ tokenKey, newPosition, pasaIndex: i - 1 });
                }
            }
        }
        return moves;
    }



    getRandomMove(possibleMoves) {
        return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }

    getMediumMove(botPlayer, possibleMoves) {
        const killMoves = possibleMoves.filter(move => this.canKill(botPlayer, move.newPosition));
        if (killMoves.length > 0) {
            return this.getRandomMove(killMoves);
        }
        return possibleMoves.reduce((best, current) =>
            current.newPosition > best.newPosition ? current : best
        );
    }

    getHardMove(botPlayer, possibleMoves) {
        const winningMoves = possibleMoves.filter(move => move.newPosition === 56);
        if (winningMoves.length > 0) return winningMoves[0];

        const killMoves = possibleMoves.filter(move => this.canKill(botPlayer, move.newPosition));
        if (killMoves.length > 0) return this.getRandomMove(killMoves);

        const safeMoves = possibleMoves.filter(move => this.isSafePosition(move.newPosition));
        if (safeMoves.length > 0) {
            return safeMoves.reduce((best, current) =>
                current.newPosition > best.newPosition ? current : best
            );
        }

        return possibleMoves.reduce((best, current) =>
            current.newPosition > best.newPosition ? current : best
        );
    }

    canKill(botPlayer, position) {
        return this.turnOrder.some(player =>
            player.userId !== botPlayer.userId &&
            Object.values(player).some(pos => pos === position && !this.isSafePosition(position))
        );
    }

    isSafePosition(position) {
        const safePositions = [1, 9, 14, 22, 27, 35, 40, 48];
        return safePositions.includes(position);
    }
    getServerIndexKey(playerIndex, pasaIndex) {
        return playerIndex * 4 + pasaIndex;
    }
    executeBotMove(botPlayer, move, diceValue) {
        const { tokenKey, newPosition, pasaIndex } = move;
        const currentPosition = botPlayer[tokenKey];
        botPlayer[tokenKey] = newPosition;

        const botServerIndex = this.turnOrder.findIndex(p => p.userId === botPlayer.userId);
        const serverKey = this.getServerIndexKey(botServerIndex, pasaIndex);

        const moveData = {
            PlayerID: botPlayer.userId,
            TournamentID: this.lobbyId,
            RoomId: this.roomName,
            key: serverKey,
            steps: diceValue,
            newPosition: newPosition,
            currentPosition: currentPosition
        };

        this.io.to(this.roomName).emit('OnMovePasa', moveData);

        // Check for kills after the bot move
        const killed = this.checkForBotKills(botServerIndex, newPosition);
        if (killed.length > 0) {
            this.handleBotKill(botPlayer, killed);
        } else {
            this.botEndTurn(botPlayer, diceValue === 6);
        }
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
    botEndTurn(botPlayer, canContinue) {
        this.io.to(this.roomName).emit('OnContinueTurn', {
            PlayerID: botPlayer.userId,
            canContinue: canContinue
        });

        if (canContinue) {
            setTimeout(() => this.botTurn(botPlayer), this.botMoveDelay);
        } else {

            this.nextTurn();
        }
    }


    checkForKills(player, newPosition) {
        const killed = [];
        this.turnOrder.forEach(otherPlayer => {
            if (otherPlayer.userId !== player.userId) {
                for (let i = 1; i <= 4; i++) {
                    const tokenKey = `pasa_${i}`;
                    if (otherPlayer[tokenKey] === newPosition && !this.isSafePosition(newPosition)) {
                        killed.push({ player: otherPlayer, tokenKey });
                    }
                }
            }
        });
        return killed.length > 0 ? killed : null;
    }



  
    setupPlayerListeners(socket) {
        socket.on('OnMovePasa', (data) => this.handlePlayerMove(socket, data));
        socket.on('OnRollDice', () => this.handlePlayerRollDice(socket));
        socket.on('OnCurrentStatus', () => this.sendCurrentStatus(socket));
        socket.on('OnContinueTurn', (data) => this.handlePlayerContinueTurn(socket, data));
        socket.on('onleaveRoom', (data) => this.handlePlayerLeave(socket, data));
        socket.on('OnKillEvent', (data) => this.handleKillEvent(socket, data));

    }

    endGame(reason) {
        this.currentPhase = 'finished';
        const winner = this.getWinner();
        this.io.to(this.roomName).emit('game_end', {
            message: 'Game has ended.',
            reason: reason,
            winner: winner ? winner.userId : null
        });
        console.log(`Game ended in room: ${this.roomName}`);
        this.resetGame();
    }


    handleKillEvent(socket, d) {

        console.log('OnKillEvent', d);
        let targetUser = this.turnOrder[d.killedPlayerIndex];
        let pasaIndex = d.killedPasaIndex;
        let pasa_k = `pasa_${pasaIndex +1}`
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
    isGameOver() {
        return this.turnOrder.some(player =>
            player.pasa_1 === 56 && player.pasa_2 === 56 && player.pasa_3 === 56 && player.pasa_4 === 56
        );
    }

    getWinner() {
        return this.turnOrder.find(player =>
            player.pasa_1 === 56 && player.pasa_2 === 56 && player.pasa_3 === 56 && player.pasa_4 === 56
        );
    }

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
