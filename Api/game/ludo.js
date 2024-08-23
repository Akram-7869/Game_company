const Timer = require("./Timer");
const { state, publicRoom, userSocketMap, tokenMiddleware, gameName, sleep, userLeave, getRoomLobbyUsers, getRoomUsers, joinRoom, arraymove, getKeyWithMinValue, defaultRolletValue } = require('../utils/JoinRoom');
const { listeners } = require("../models/File");

class LudoGame {
    constructor(io, roomName, maxPlayers, lobbyId) {
        this.io = io; this.roomName = roomName; this.maxPlayers = maxPlayers; this.lobbyId = lobbyId;

        this.players = new Map(); this.bots = new Map();
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
        this.botMoveDelay = 2000;
        this.botDifficulty = 'easy'; // 'easy', 'medium', or 'hard'
        this.isGameReady = false;
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
                    pasa_1: 0, pasa_2: 0, pasa_3: 0, pasa_4: 0,
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
        let { PlayerID, key, newPosition } = data;
        const currentPlayer = this.turnOrder[this.currentTurnIndex];
        let pasa_k = `pasa_${key}`;
        console.log('handlePlayerMove', data, pasa_k, currentPlayer);
        
        let player = this.turnOrder.find(p => p.userId === PlayerID);
        if (player && player[pasa_k] !== undefined) {
            player[pasa_k] = newPosition;
            this.io.to(this.roomName).emit('OnMovePasa', data);
            this.updateGameState(); // New: Update game state after move
        }
    }


    handlePlayerRollDice(socket) {
        this.lastDiceValue = this.lastDiceValue === 1 ? 6 : 1;
        // this.lastDiceValue = Math.floor(Math.random() * 6) + 1;
        this.io.to(this.roomName).emit('OnRollDice', {
            dice: this.lastDiceValue,
            currentTurnIndex: this.currentTurnIndex
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
        console.log('OnNextTurn', this.currentTurnIndex);
        this.io.to(this.roomName).emit('OnNextTurn', {
            gameType: 'Ludo',
            room: this.roomName,
            currentPhase: this.currentPhase,
            currentTurnIndex: this.currentTurnIndex,
        });
        const currentPlayer = this.turnOrder[this.currentTurnIndex];
        if (currentPlayer.type === 'bot') {
            this.botTurn(currentPlayer);
            return;
        }
        // else {
        //     this.startTurnTimer();
        // }
        //  Set timer for the next turn
        this.turnTimer = new Timer(15, (remaining) => {
            this.io.to(this.roomName).emit('turn_tick', { remaining, currentTurnIndex: this.currentTurnIndex });
        }, () => {
            this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
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
            this.turnTimer.reset(15);
        }
        this.io.to(this.roomName).emit('OnNextTurn', {
            gameType: 'Ludo',
            room: this.roomName,
            currentPhase: this.currentPhase,
            currentTurnIndex: this.currentTurnIndex,
        });

        this.turnTimer = new Timer(15, (remaining) => {
            console.log('turn_tick', remaining);
            this.io.to(this.roomName).emit('turn_tick', { remaining, currentTurnIndex: this.currentTurnIndex });
        }, () => {
            this.handleTurnTimeout();
        });

        this.turnTimer.startTimer();
    }

    handleTurnTimeout() {

        const currentPlayer = this.turnOrder[this.currentTurnIndex];
        console.log('handle time out', this.turnOrder, this.currentTurnIndex);
        if (this.players.has(currentPlayer.userId)) {
            let playerObj = this.players.get(currentPlayer.userId);
            playerObj.lives = (playerObj.lives || 3) - 1;
            console.log('player_lost_life', playerObj.lives);

            this.io.to(this.roomName).emit('player_lost_life', { playerId: currentPlayer.userId, lives: playerObj.lives });

            if (playerObj.lives <= 0) {
                playerObj.player.playerStatus = 'Left';
            }
            this.checkGameStatus();
        }
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;

        this.nextTurn();
    }

    botTurn(botPlayer) {
        setTimeout(() => this.botRollDice(botPlayer), this.botMoveDelay);
    }

    botRollDice(botPlayer) {
        // const diceValue = Math.floor(Math.random() * 6) + 1;
        let diceValue = this.lastDiceValue = this.lastDiceValue === 1 ? 6 : 1;
        this.io.to(this.roomName).emit('OnRollDice', {
            dice: diceValue,
            currentTurnIndex: this.currentTurnIndex
        });

        setTimeout(() => this.botChooseMove(botPlayer, diceValue), this.botMoveDelay);
    }

    botChooseMove(botPlayer, diceValue) {
        const possibleMoves = this.getBotPossibleMoves(botPlayer, diceValue);
        console.log('Bot-possibleMoves', possibleMoves);
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
            if (currentPosition === 0 && diceValue === 6) {
                moves.push({ tokenKey, newPosition: 1, pasaIndex: i - 1 });
            } else if (currentPosition > 0) {
                const newPosition = currentPosition + diceValue;
                if (newPosition <= 56) {
                    moves.push({ tokenKey, newPosition, pasaIndex:i-1 });
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

    executeBotMove(botPlayer, move, diceValue) {
        const { tokenKey, newPosition, pasaIndex } = move;
        botPlayer[tokenKey] = newPosition;
 
        const moveData = {
            PlayerID: botPlayer.userId,
            TournamentID: this.lobbyId,
            RoomId: this.roomName,
            key: pasaIndex,
            steps: diceValue,
            newPosition: newPosition,
            currentPosition: newPosition - diceValue
        };
 
        this.io.to(this.roomName).emit('OnMovePasa', moveData);
        //this.updateGameState(); // New: Update game state after bot move
 
        const killed = this.checkForKills(botPlayer, newPosition);
        if (killed) {
            setTimeout(() => this.handleBotKill(botPlayer, killed), this.botMoveDelay);
        } else {
            this.botEndTurn(botPlayer, diceValue === 6);
        }
    }

    checkForKills(botPlayer, newPosition) {
        const killed = [];
        this.turnOrder.forEach(player => {
            if (player.userId !== botPlayer.userId) {
                for (let i = 1; i <= 4; i++) {
                    const tokenKey = `pasa_${i}`;
                    if (player[tokenKey] === newPosition && !this.isSafePosition(newPosition)) {
                        killed.push({ player, tokenKey });
                    }
                }
            }
        });
        return killed.length > 0 ? killed : null;
    }

    handleBotKill(botPlayer, killed) {
        killed.forEach(({ player, tokenKey }) => {
            player[tokenKey] = 0;
            this.io.to(this.roomName).emit('OnKillEvent', {
                killerPlayerIndex: this.turnOrder.findIndex(p => p.userId === botPlayer.userId),
                killerPasaIndex: parseInt(tokenKey.split('_')[1]) - 1,
                killedPlayerIndex: this.turnOrder.findIndex(p => p.userId === player.userId),
                killedPasaIndex: parseInt(tokenKey.split('_')[1]) - 1
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
            this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
            this.nextTurn();
        }
    }
    setupPlayerListeners(socket) {
        socket.on('OnMovePasa', (data) => this.handlePlayerMove(socket, data));
        socket.on('OnRollDice', () => this.handlePlayerRollDice(socket));
        socket.on('OnCurrentStatus', () => this.sendCurrentStatus(socket));
        socket.on('OnContinueTurn', (data) => this.handlePlayerContinueTurn(socket, data));
        socket.on('onleaveRoom', (data) => this.handlePlayerLeave(socket, data));
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


    OnKillEvent(socket) {
        socket.on('OnKillEvent', (d) => {
            this.io.to(this.roomName).emit('OnKillEvent', d);
        });
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
            this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
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
