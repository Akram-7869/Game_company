const Timer = require("./Timer");
const { state, publicRoom, getBotName } = require('../utils/JoinRoom');
const { listeners } = require("../models/File");

class LudoGame {
    constructor(io, roomName, maxPlayers, lobby) {
        this.io = io; this.roomName = roomName; this.maxPlayers = maxPlayers; this.lobbyId = lobby._id;
        this.bot = lobby.bot; this.complexity = lobby.complexity;
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
        this.safeSpots = [0, 8, 13, 21, 26, 34, 39, 47];
        this.playerStartPositions = [0, 13, 26, 39];


    }
    isPlayerInTurnOrder(id) {
        return this.turnOrder.findIndex(player => player.userId === id) !== -1;
    }
    syncPlayer(socket, player) {

        let playerExit = this.turnOrder.findIndex(player1 => player1.userId === player.userId) !== -1;
        if (this.turnOrder.length < this.maxPlayers && !playerExit) {
            let startPosition = this.playerStartPositions[this.turnOrder.length];
            player['startPosition'] = startPosition;
            player['pasa'] = [-1, -1, -1, -1];
            player['global'] = [-1, -1, -1, -1];
            player['life'] = 3;

            this.turnOrder.push(player);
            this.setupPlayerListeners(socket)

        }


    }
    checkAndAddBots() {
        if (!this.bot) {
            return;
        }

        this.setBotDifficulty(getBotName(this.complexity))
        let totalPlayers = this.turnOrder.length;
        if (totalPlayers < this.maxPlayers) {
            const botsToAdd = this.maxPlayers - totalPlayers;
            this.addBots(botsToAdd);
        }
        if (this.turnOrder.length === this.maxPlayers) {
            this.isGameReady = true;
            this.emitJoinPlayer();
        }
    }
    addBots(count) {
        for (let i = 0; i < count; i++) {
            let botId = `${i + 1}-bot`;
            let startPosition = this.playerStartPositions[this.turnOrder.length + i];
            if (this.maxPlayers == 2) {
                startPosition = this.playerStartPositions[2]
            }

            let botPlayer = {
                userId: `${i + 1}-bot`,
                name: `Bot-${i + 1}`,
                balance: '1000',
                lobbyId: this.lobbyId,
                maxp: this.maxPlayers,
                type: 'bot',
                pasa: [-1, -1, -1, -1],
                global: [-1, -1, -1, -1],
                startPosition,
                playerStatus: 'joined',
                avtar: 'http://example.com/bot-avatar.png'
            }

            this.turnOrder.push(botPlayer);
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
        this.io.to(this.roomName).emit('join_players', { players: this.turnOrder });
    }

    getJoinedPlayers() {
        return this.turnOrder.filter(player => player.status === 'joined' && player.type === 'player').length;
    }


    handlePlayerMove(socket, data) {
        let { PlayerID, pasaIndex, steps, currentPosition, newPosition, globalPosition, isGlobal } = data;
        let playerIndex = this.turnOrder.findIndex(p => p.userId === PlayerID);
        let player = this.turnOrder[playerIndex];
        console.log('OnMovePasa', data);



        player.pasa[pasaIndex] = newPosition;
        player.global[pasaIndex] = globalPosition;
        let score = this.calculatePlayerScore(player); // Recalculate score
        player['score'] = score;
        console.log('player', player);
        if (newPosition >= 56) {
            this.checkGameStatus();
        }

        this.io.to(this.roomName).emit('OnMovePasa', data);
        // this.updateScores();
    }

    // New method to update and emit scores
    updateScores() {
        let scores = this.turnOrder.map(player => ({
            PlayerID: player.userId,
            score: player.score
        }));
        this.io.to(this.roomName).emit('UpdateScores', scores);
    }

    // New method to calculate player's score
    calculatePlayerScore(player) {
        let score = 0;
        for (let i = 0; i <= 3; i++) {
            const position = player.pasa[i];
            if (position > 0 && position <= 56) {
                score += position;
            }
        }
        return score;
    }

    // New method to handle pasa movement validation
    validateMove(player, pasaIndex, steps) {
        const currentPosition = player.pasa[pasaIndex];
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
    botKill(killerPlayer, killed, killerPasaIndex) {
        // Extract killer player index once
        const killerPlayerIndex = this.turnOrder.findIndex(p => p.userId === killerPlayer.userId);

        // Iterate over each killed player
        for (const { player, pasaIndex } of killed) {
            player.pasa[pasaIndex] = -1; // Reset to home position

            // Extract killed player index only once per player
            const killedPlayerIndex = this.turnOrder.findIndex(p => p.userId === player.userId);

            const dd = {
                killerPlayerIndex,
                killerPasaIndex: parseInt(killerPasaIndex, 10),
                killedPlayerIndex,
                killedPasaIndex: parseInt(pasaIndex, 10)
            };

            console.log('botKill  OnKillEvent--', dd);
            // Emit event for each killed player
            this.io.to(this.roomName).emit('OnKillEvent', dd);
        }

        // Optionally update game state after kills
        // this.updateGameState();
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
            this.io.to(this.roomName).emit('turn_tick', { remaining, currentTurnIndex: this.currentTurnIndex, currentPalyerId: this.turnOrder[this.currentTurnIndex].userId });
        }, () => {
            if (currentPlayer['life'] <= 0) {
                currentPlayer.playerStatus = "left";
                this.checkGameStatus();
            } else {
                currentPlayer['life'] -= 1
            }

            if (this.currentPhase === 'playing') {
                this.nextTurn();
            }

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





    botTurn(botPlayer) {
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
    // Updated getBotPossibleMoves method
    getBotPossibleMoves(botPlayer, diceValue) {
        const moves = [];
        for (let i = 0; i <= 3; i++) {
            const currentPosition = botPlayer.pasa[i];
            if (currentPosition === -1 && diceValue === 6) {
                moves.push({ newPosition: 0, pasaIndex: i, globalPosition: this.getGlobalPosition(botPlayer, 0) });
            } else if (currentPosition >= 0) {
                const newPosition = currentPosition + diceValue;
                if (newPosition <= 56) {
                    moves.push({ newPosition, pasaIndex: i, globalPosition: this.getGlobalPosition(botPlayer, newPosition) });
                }
            }
        }
        return moves;
    }



    // Updated checkForKills method
    checkForKills(killerPlayer, globalPosition) {
        const killed = [];
        const isOnSafeBox = this.isSafePosition(globalPosition);
        for (const player of this.turnOrder) {
            if (player.userId === killerPlayer.userId) continue; // Skip the killerPlayer

            for (let i = 0; i < player.global.length; i++) {
                if (player.global[i] === globalPosition && !isOnSafeBox) {
                    killed.push({ player, pasaIndex: i });
                }
            }
        }

        console.log('killed', killed);
        return killed;
    }

    // New method to get global position
    getGlobalPosition(player, localPosition) {
        if (localPosition === -1) return -1; // Home position
        return (player.startPosition + localPosition) % 52;
    }

    getRandomMove(possibleMoves) {
        return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }

    getMediumMove(botPlayer, possibleMoves) {
        const killMoves = possibleMoves.filter(move => this.checkForKills(botPlayer, move.globalPosition));
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

        const killMoves = possibleMoves.filter(move => this.checkForKills(botPlayer, move.globalPosition));
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


    isSafePosition(position) {
        return this.safeSpots.includes(position);
    }



    executeBotMove(botPlayer, move, diceValue) {
        const { newPosition, pasaIndex, globalPosition } = move;
        const currentPosition = botPlayer.pasa[pasaIndex];
        botPlayer.pasa[pasaIndex] = newPosition;
        botPlayer.global[pasaIndex] = globalPosition;
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
            this.botKill(botPlayer, killed, pasaIndex);
            this.botEndTurn(botPlayer, true);
        } else {
            this.botEndTurn(botPlayer, diceValue === 6);
        }
        if (newPosition == 57) {
            this.checkGameStatus();
        }
        //this.updateScores();
        //this.updateGameState();
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






    setupPlayerListeners(socket) {
        socket.on('OnMovePasa', (data) => this.handlePlayerMove(socket, data));
        socket.on('OnRollDice', () => this.handlePlayerRollDice(socket));
        socket.on('OnCurrentStatus', () => this.sendCurrentStatus(socket));
        socket.on('OnContinueTurn', (data) => this.handlePlayerContinueTurn(socket, data));
        socket.on('onleaveRoom', (data) => this.handlePlayerLeave(socket, data));
        socket.on('OnKillEvent', (data) => this.playerKillEvent(socket, data));

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


    playerKillEvent(socket, d) {

        console.log('OnKillEvent', d);
        let targetUser = this.turnOrder[d.killedPlayerIndex];
        let pasaIndex = d.killedPasaIndex;

        targetUser[pasaIndex] = -1;
        console.log('OnKillEvent', targetUser, pasaIndex)
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

        let playerIndex = this.turnOrder.findIndex(player1 => player1.userId === PlayerID);
        if (playerIndex !== -1) {
            let player = this.turnOrder[playerIndex];
            player.playerStatus = 'Left';
            if (this.currentPhase != 'playing') {
                delete this.turnOrder[playerIndex];
            }


        }
        this.io.to(this.roomName).emit('onleaveRoom', {
            players: this.turnOrder,
        });
        this.checkGameStatus();
    }

    checkGameStatus() {
        let players = this.getJoinedPlayers();

        if (players === 0) {
            this.endGame('All players left');
        } else if (this.isGameOver()) {
            this.endGame('Game completed');
        }

    }
    isGameOver() {
        return this.turnOrder.some(player => player.pasa.every(position => position === 56));
    }

    getWinner() {
        return this.turnOrder.find(player => player.pasa.every(position => position === 56));
    }

    resetGame() {

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
