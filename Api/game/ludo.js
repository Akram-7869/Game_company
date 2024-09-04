const Timer = require("./Timer");
const { state, publicRoom, getBotName, sleep, userLeave } = require('../utils/JoinRoom');
const { generateName } = require('../utils/utils');

class LudoGame {
    constructor(io, roomName, maxPlayers, tournament) {
        this.io = io; this.roomName = roomName; this.maxPlayers = maxPlayers; this.tournament = tournament;

        this.turnOrder = [];
        this.currentTurnIndex = -1;
        this.currentPhase = 'waiting'; // possible states: waiting, playing, finished
        this.turnTimer = undefined;
        this.roomJoinTimers = undefined;
        this.bettingTimer = undefined;

        this.round = 0;
        this.bettingTime = 20; // 20 seconds
        this.pauseTime = 9; // 5 seconds
        this.lastDiceValue = 6;
        this.botMoveDelay = 2000;
        this.botDifficulty = 'medium'; // 'easy', 'medium', or 'hard'
        this.isGameReady = false;

        this.safeSpots = [0, 8, 13, 21, 26, 34, 39, 47];
        this.playerStartPositions = [0, 13, 26, 39];
        this.winnerPosition = 0; // Start tracking winners from position 1
        this.botTimer = undefined;




    }

    syncPlayer(socket, player) {

        let playerExit = this.findPlayerByUserId(player.userId);
        if (this.turnOrder.length < this.maxPlayers && !playerExit) {
            let startPosition = this.playerStartPositions[this.turnOrder.length];
            player['startPosition'] = startPosition;
            player['pasa'] = [-1, -1, -1, -1];
            player['global'] = [-1, -1, -1, -1];
            player['life'] = 3;
            player['winnerPosition'] = this.maxPlayers;
            player['score'] = 0;
            player['winingAmount'] = 0;


            this.turnOrder.push(player);
            this.setupPlayerListeners(socket)

        }


    }
    checkAndAddBots() {
        if (this.tournament.bot) {
            this.setBotDifficulty(getBotName(this.tournament.complexity))
            let totalPlayers = this.turnOrder.length;
            if (totalPlayers < this.maxPlayers) {
                const botsToAdd = this.maxPlayers - totalPlayers;
                this.addBots(botsToAdd);
            }
        }
        if (this.turnOrder.length === this.maxPlayers) {
            this.isGameReady = true;
            this.emitJoinPlayer();
        }
    }
    addBots(count) {
        for (let i = 0; i < count; i++) {
            let botId = `${i + 1}-bot`;
            let startPosition = this.playerStartPositions[this.turnOrder.length];
            if (this.maxPlayers == 2) {
                startPosition = this.playerStartPositions[2]
            }
            let name = generateName();
            let pathurl = process.env.IMAGE_URL + '/img/logo/profile_default.png';
            let botPlayer = {
                userId: `${i + 1}-bot`,
                name,
                balance: '1000',
                lobbyId: this.tournament._id,
                maxp: this.maxPlayers,
                type: 'bot',
                pasa: [-1, -1, -1, -1],
                global: [-1, -1, -1, -1],
                startPosition,
                playerStatus: 'joined',
                avtar: pathurl,
                score: 0,
                winingAmount: 0
            }

            this.turnOrder.push(botPlayer);
            console.log(`Bot ${botId} added to room ${this.roomName}`);
        }
    }
    initializePlayerScores() {
              for (let i = 0; i < this.turnOrder.length; i++) {
                let player = this.turnOrder[i];

                player['score'] = 0;
                player['winnerPosition'] = this.maxPlayers;
                player['winingAmount'] = 0;
            }
        

    }

    setupGame() {
        if (this.roomJoinTimers) return; // Prevent multiple starts

        this.currentPhase = 'createdroom';
        this.roomJoinTimers = new Timer(10, (remaining) => {
            this.io.to(this.roomName).emit('join_tick', { remaining });
            if (remaining === 3) {
                this.checkAndAddBots();
            }
        }, () => {
            if (this.isGameReady) {
                this.initializePlayerScores();
                this.startGame();
            } else {
                console.log("Not enough players to start the game.");
                this.io.to(this.roomName).emit('game_cancelled', { reason: 'Not enough players' });
            }
        });

        this.roomJoinTimers.startTimer();
        console.log(`Game setup in room: ${this.roomName}`);

    }
    sendCurrentStatus(socket) {
        let d = {
            gameType: 'Ludo',
            room: this.roomName,
            currentPhase: this.currentPhase,
            players: this.turnOrder,
            currentTurnIndex: this.currentTurnIndex,
            turnTimer: this.turnTimer?.remaining,
            currentPalyerId: this.turnOrder[this.currentTurnIndex].userId,
        };
        console.log('OnCurrentStatus');
        socket.emit('OnCurrentStatus', d);
    }
    async startGame() {
        publicRoom[this.tournament._id]['played'] = true;
        this.currentPhase = 'playing';
        this.round += 1;
        console.log(`Game started in room: ${this.roomName}`);

        //await sleep(3000)
        this.nextTurn();

    }

    nextTurn(socket) {

        if (this.turnTimer) {
            this.turnTimer?.reset(15);
            if (this.currentPhase === 'finshed') {
                return;
            }
        }
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
        let currentPlayer = this.turnOrder[this.currentTurnIndex];
        console.log('OnNextTurn', this.currentTurnIndex);

        if (currentPlayer.playerStatus !== 'joined') {
            for (let i = 1; i < this.turnOrder.length; i++) {
                this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
                currentPlayer = this.turnOrder[this.currentTurnIndex];
                if (currentPlayer.playerStatus === 'joined') {
                    break;
                }
            }
            if (currentPlayer.playerStatus !== 'joined') {
                this.checkGameStatus();
                return;
            }
        }



        this.io.to(this.roomName).emit('OnNextTurn', {
            gameType: 'Ludo',
            room: this.roomName,
            currentPhase: this.currentPhase,
            currentTurnIndex: this.currentTurnIndex,
            currentPalyerId: this.turnOrder[this.currentTurnIndex].userId,
            timer: 15

        });

        if (currentPlayer.type === 'bot') {
            this.botTurn(currentPlayer);
            return;
        }

        this.turnTimer = new Timer(15, undefined, () => {

            if (this.currentPhase === 'playing') {
                this.nextTurn();
            }

        });

        this.turnTimer.startTimer();
    }


    botTurn(botPlayer) {
        // Clear any existing timer to avoid multiple timers running at the same time
        clearTimeout(this.botTimer);
console.log('botTurn');
        this.botTimer = setTimeout(() => this.botRollDice(botPlayer), this.botMoveDelay);
    }

    emitJoinPlayer() {
        this.io.to(this.roomName).emit('join_players', { players: this.turnOrder });
    }

    countJoinedPlayers() {
        let joinedCount = 0;
        for (let i = 0; i < this.turnOrder.length; i++) {
            if (this.turnOrder[i].playerStatus === 'joined') {
                joinedCount++;
            }
        }
        return joinedCount;
    }
    countPlayers() {
        let joinedCount = 0;
        for (let i = 0; i < this.turnOrder.length; i++) {
            if (this.turnOrder[i].playerStatus === 'joined' && this.turnOrder[i].playerStatus === 'player') {
                joinedCount++;
            }
        }
        return joinedCount;
    }


    handlePlayerMove(socket, data) {
        let { PlayerID, pasaIndex, steps, currentPosition, newPosition, globalPosition, isGlobal } = data;
        let player = this.findPlayerByUserId(PlayerID);



        player.pasa[pasaIndex] = newPosition;
        player.global[pasaIndex] = globalPosition;
        //let score = this.calculatePlayerScore(player); // Recalculate score
        //player['score'] = score;

        this.io.to(this.roomName).emit('OnMovePasa', data);

        if (newPosition >= 56) {
            this.handleWinners(player);
        }

    }

    // New method to update and emit scores
    handleResult(socket, data) {

        this.turnOrder.forEach(player => {
            player['score'] = this.calculatePlayerScore(player);
        })
        const sortedPlayers = this.turnOrder.map(({ userId, name, avtar, type, score, playerStatus, winnerPosition, winingAmount }) => ({
            userId,
            name,
            avtar,
            type,
            score,
            playerStatus, winnerPosition, winingAmount
        }))
            .sort((a, b) => {
                // 1. Sort by `winnerPosition` in ascending order if both have a winner position
                if (a.winnerPosition && b.winnerPosition) {
                    if (a.winnerPosition === b.winnerPosition) {
                        // If both have the same `winnerPosition`, sort by score in descending order
                        return b.score - a.score;
                    }
                    return a.winnerPosition - b.winnerPosition; // Sort by `winnerPosition` in ascending order
                }

                // 2. Prioritize players with a `winnerPosition` over others
                if (a.winnerPosition) return -1;
                if (b.winnerPosition) return 1;

                // 3. Sort 'joined' players by `score` in descending order
                if (a.playerStatus === 'joined' && b.playerStatus === 'joined') {
                    return b.score - a.score;
                }

                // 4. Place 'joined' players before 'left' players
                if (a.playerStatus === 'joined') return -1;
                if (b.playerStatus === 'joined') return 1;

                // 5. Sort 'left' players by `score` in descending order
                if (a.playerStatus === 'left' && b.playerStatus === 'left') {
                    return b.score - a.score;
                }

                return 0; // Default case
            });

        if (sortedPlayers.length === 0) {
            return;
        }


        this.botTimer = setTimeout(() => {
            this.io.to(this.roomName).emit('OnResult', { result: sortedPlayers });
            clearTimeout(this.botTimer);
            console.log('result declared', sortedPlayers);
            publicRoom[this.tournament._id]['played'] = true;
            delete state[this.roomName]
        }, 3000);
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
        const killerPlayerId = killerPlayer.userId;

        // Iterate over each killed player
        for (const { player, pasaIndex } of killed) {

            this.setPass(player, pasaIndex, -1);// Reset to home position

            // Extract killed player index only once per player
            const killedPlayerId = player.userId;

            const dd = {
                PlayerID: killerPlayerId,
                TournamentID: this.tournament._id,
                RoomId: this.roomName,

                killerPlayerId,
                killerPasaIndex: parseInt(killerPasaIndex, 10),
                killedPlayerId,
                killedPasaIndex: parseInt(pasaIndex, 10)
            };

            console.log('botKill  OnKillEvent--', dd);
            // Emit event for each killed player
            this.io.to(this.roomName).emit('OnKillEvent', dd);
            break;
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


    botRollDice(botPlayer) {
        console.log('botRollDice');
        // const diceValue = Math.floor(Math.random() * 6) + 1;
        if (this.currentPhase === 'finshed') {
            return;
        }
        let diceValue = this.lastDiceValue = this.lastDiceValue === 1 ? 6 : 1;
        this.io.to(this.roomName).emit('OnRollDice', {
            dice: diceValue,
            currentTurnIndex: this.currentTurnIndex,
            currentPalyerId: this.turnOrder[this.currentTurnIndex].userId,
        });
        clearTimeout(this.botTimer);
        this.botTimer = setTimeout(() => this.botChooseMove(botPlayer, diceValue), this.botMoveDelay);
    }

    botChooseMove(botPlayer, diceValue) {
        console.log('botChooseMove');

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
            console.log(chosenMove)
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
        if (this.isSafePosition(globalPosition)) return [];
        for (let i = 0; i < this.turnOrder.length; i++) {
            const player = this.turnOrder[i];
            if (player.userId !== killerPlayer.userId) {
                for (let j = 0; j < player.global.length; j++) {
                    if (player.global[j] === globalPosition) {
                        killed.push({ player, pasaIndex: j });
                        break; // Stop searching this player's positions once a match is found
                    }
                }
            }
        }
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
    filterPossibleKillMoves(botPlayer, possibleMoves) {
        const filteredMoves = [];
        for (let i = 0; i < possibleMoves.length; i++) {
            const move = possibleMoves[i];
            if (this.checkForKills(botPlayer, move.globalPosition)) {
                filteredMoves.push(move);
            }
        }
        return filteredMoves;
    }
    // Method to filter moves with newPosition equal to 56
    filterWinningMoves(possibleMoves) {
        const filteredMoves = [];
        for (let i = 0; i < possibleMoves.length; i++) {
            const move = possibleMoves[i];
            if (move.newPosition === 56) {
                filteredMoves.push(move);
            }
        }
        return filteredMoves;
    }

    // Method to filter moves with newPosition considered safe
    filterSafeMoves(possibleMoves) {
        const safeMoves = [];
        for (let i = 0; i < possibleMoves.length; i++) {
            const move = possibleMoves[i];
            if (this.isSafePosition(move.newPosition)) {
                safeMoves.push(move);
            }
        }
        return safeMoves;
    }
    // Method to find the move with the highest newPosition
    findBestMove(possibleMoves) {
        if (possibleMoves.length === 0) return null; // Handle empty array case

        let bestMove = possibleMoves[0]; // Assume the first move is the best initially

        for (let i = 1; i < possibleMoves.length; i++) {
            const current = possibleMoves[i];
            if (current.newPosition > bestMove.newPosition) {
                bestMove = current;
            }
        }
        return bestMove;
    }

    getMediumMove(botPlayer, possibleMoves) {
        const killMoves = this.filterPossibleKillMoves(botPlayer, possibleMoves);
        if (killMoves.length > 0) {
            return this.getRandomMove(killMoves);
        }
        return this.findBestMove(possibleMoves);
    }

    getHardMove(botPlayer, possibleMoves) {
        const winningMoves = this.filterWinningMoves(possibleMoves);
        if (winningMoves.length > 0) return winningMoves[0];

        const killMoves = this.filterPossibleKillMoves(botPlayer, possibleMoves);
        console.log('killMoves ',killMoves.length );
        if (killMoves.length > 0) return this.getRandomMove(killMoves);

        const safeMoves = this.filterSafeMoves(possibleMoves);
        if (safeMoves.length > 0) {
            return safeMoves.reduce((best, current) =>
                current.newPosition > best.newPosition ? current : best
            );
        }

        return this.findBestMove(possibleMoves);
    }


    isSafePosition(position) {
        for (let i = 0; i < this.safeSpots.length; i++) {
            if (this.safeSpots[i] === position) {
                return true;
            }
        }
        return false;
    }



    async executeBotMove(botPlayer, move, diceValue) {
        console.log('executeBotMove');

        const { newPosition, pasaIndex, globalPosition } = move;
        const currentPosition = botPlayer.pasa[pasaIndex];
        botPlayer.pasa[pasaIndex] = newPosition;
        botPlayer.global[pasaIndex] = globalPosition;
        //botPlayer.score = this.calculatePlayerScore(botPlayer);

        const moveData = {
            PlayerID: botPlayer.userId,
            TournamentID: this.tournament._id,
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
            await sleep(diceValue * 250);

            this.botKill(botPlayer, killed, pasaIndex);
            this.botEndTurn(botPlayer, true);

        } else {

            this.botEndTurn(botPlayer, diceValue === 6);
        }

        if (newPosition == 56) {

            this.handleWinners(botPlayer)

        }
    }

    isEveryPawnAtPosition56(player) {
        for (let i = 0; i < player.pasa.length; i++) {
            if (player.pasa[i] !== 56) {
                return false;
            }
        }
        return true;
    }
    async handleWinners(player) {
        let isWinner = this.isEveryPawnAtPosition56(player);
        console.log('handleWinners');

        if (isWinner) {
            console.log(player, this.turnOrder)
            await sleep(3500);
            this.winnerPosition += 1;
            let win_key = `winner_${this.winnerPosition}`
            let winingAmount = this.tournament.winnerRow[win_key];
            player.winnerPosition = this.winnerPosition; // Assign the winner position and increment
            player.playerStatus = 'winner'; // Mark the winner as playing
            player['winingAmount'] = winingAmount;
            this.io.to(this.roomName).emit('winner', {
                message: 'Winner - this.winnerPosition',
                winnerPosition: this.winnerPosition,
                winner: player.userId,
                winingAmount,
                reason: 'won',
                leftPlayerId: ''
            });
            this.checkGameStatus();
        }
    }
    findPlayerByUserId(userId) {
        for (let i = 0; i < this.turnOrder.length; i++) {
            if (this.turnOrder[i].userId === userId) {
                return this.turnOrder[i]; // Return the player when a match is found
            }
        }
        return null; // Return null if no matching player is found
    }
    deletePlayerByUserId(userId) {
        for (let i = 0; i < this.turnOrder.length; i++) {
            if (this.turnOrder[i].userId === userId) {
                this.turnOrder.splice(i, 1);// Return the player when a match is found
                return;
            }
        }
        return null; // Return null if no matching player is found
    }
    filterJoinedPlayers() {
        const filtered = [];
        for (let i = 0; i < this.turnOrder.length; i++) {
            const player = this.turnOrder[i];
            if (player.playerStatus === 'joined' && player.type === 'player') {
                filtered.push(player);
            }
        }
        return filtered;
    }
    handleLeftWinners(leftPlayer) {
        let players = this.filterJoinedPlayers();

        // console.log('handleLeftWinners', this.turnOrder);
        if (players.length < 1) {
            this.endGame('All players left'); return;
        }
        if (players.length === 1) {

            let player = this.findPlayerByUserId(players[0].userId);

            this.winnerPosition += 1;
            let win_key = `winner_${this.winnerPosition}`
            let winingAmount = this.tournament.winnerRow[win_key];
            console.log('winingAmount', winingAmount);

            player.winnerPosition = this.winnerPosition; // Assign the winner position and increment
            player.playerStatus = 'winner'; // Mark the winner as playing
            player['winingAmount'] = winingAmount;
            this.io.to(this.roomName).emit('winner', {
                message: 'Winner - this.winnerPosition',
                winnerPosition: this.winnerPosition,
                winner: player.userId,
                winingAmount,
                reason: 'left',
                leftPlayerId: leftPlayer.userId,
            });

            this.checkGameStatus();
        }
    }
    botEndTurn(botPlayer, canContinue) {

        clearTimeout(this.botTimer);

        if (canContinue) {
            this.turnTimer?.reset(15);
            this.turnTimer?.startTimer();
            this.botTimer = setTimeout(() => this.botTurn(botPlayer), this.botMoveDelay);
        } else {
            //this.calculatePlayerScore(botPlayer);
            this.nextTurn();
        }
        let data={
            PlayerID: botPlayer.userId,
            canContinue: canContinue,
            turnTimer: this.turnTimer?.remaining
        };
        console.log('OnContinueTurn-bot',data);
        this.io.to(this.roomName).emit('OnContinueTurn',data );
    }






    setupPlayerListeners(socket) {
        socket.on('OnMovePasa', (data) => this.handlePlayerMove(socket, data));
        socket.on('OnRollDice', () => this.handlePlayerRollDice(socket));
        socket.on('OnCurrentStatus', () => this.sendCurrentStatus(socket));
        socket.on('OnContinueTurn', (data) => this.handlePlayerContinueTurn(socket, data));
        socket.on('onleaveRoom', (data) => this.handlePlayerLeave(socket, data));
        socket.on('OnKillEvent', (data) => this.playerKillEvent(socket, data));
        //socket.on('OnResult', (data) => this.handleResult(socket, data));

    }

    endGame(reason) {
        this.currentPhase = 'finished';
        this.handleResult({}, {});
        console.log(`Game ended in room: ${this.roomName}`);

        this.resetGame();
    }


    playerKillEvent(socket, d) {

        let targetUser = this.findPlayerByUserId(d.killedPlayerId);

        let pasaIndex = d.killedPasaIndex;
        console.log('OnKillEvent', d, this.turnOrder);
        console.log('targetUser', targetUser);
        this.setPass(targetUser, pasaIndex, -1);

        this.io.to(this.roomName).emit('OnKillEvent', d);
    }
    setPass(player, pasaIndex, value) {
        player.pasa[pasaIndex] = value;
        player.global[pasaIndex] = value;
    }


    handlePlayerContinueTurn(socket, data) {
        let { canContinue } = data;


        if (canContinue) {
            this.turnTimer.reset(15);
            this.turnTimer.startTimer();

        } else {

            this.nextTurn();
        }
        data['turnTimer'] = this.turnTimer?.remaining;
        this.io.to(this.roomName).emit('OnContinueTurn', data);
    }

    handlePlayerLeave(socket, data) {
        let { PlayerID } = data;
        userLeave({ userId: PlayerID, room: this.roomName })


        let player = this.findPlayerByUserId(PlayerID);
        console.log(' player', player);
        if (player) {

            if (this.currentPhase !== 'finished') {

                player.playerStatus = 'Left';
                player.winnerPosition = this.maxPlayers + 1;
            }
            // dont delete after game started 
            if (!this.isGameReady) {
                this.deletePlayerByUserId(PlayerID);
            }


        }
        this.io.to(this.roomName).emit('onleaveRoom', {
            players: this.turnOrder,
        });

        // Unbind all the event listeners when the player leaves
        socket.removeAllListeners('OnMovePasa');
        socket.removeAllListeners('OnRollDice');
        socket.removeAllListeners('OnCurrentStatus');
        socket.removeAllListeners('OnContinueTurn');

        // Avoid unbinding onLeaveRoom itself during its execution
        socket.removeAllListeners('OnKillEvent');
        // socket.removeAllListeners('OnResult');
        socket.removeAllListeners('onLeaveRoom');
        socket.leave(this.roomName);
        console.log('handlePlayerLeave', this.currentPhase, this.isGameReady, this.turnOrder)
        //if game is reday then check winner
        if (this.currentPhase === 'playing') {
            this.handleLeftWinners(player);

        } else if (this.currentPhase === 'createdroom') {
            this.deletePlayerByUserId(PlayerID);
            this.emitJoinPlayer();
            let playerCount = this.countPlayers();
            if (playerCount <= 1) {
                delete state[this.roomName];
                publicRoom[this.tournament._id]['played'] = true;
            }
        }


    }

    checkGameStatus() {
        let players = this.countJoinedPlayers();
        console.log('checkGameStatus', this.maxPlayers, players);
        if (this.maxPlayers == 2) {
            if (this.winnerPosition == 1) {
                return this.endGame('Game completed');
            }
        } else if (this.maxPlayers == 4) {
            if (this.winnerPosition == this.tournament.winners) {
                return this.endGame('Game completed');
            }
        }
        if (players <= 1) {
            this.endGame('All players left');
        }


    }




    resetGame() {
        clearTimeout(this.botTimer);

        this.turnOrder = [];
        this.currentTurnIndex = 0;
        this.currentPhase = 'waiting';
        this.round = 0;
        this.isGameReady = false;
        if (this.turnTimer) {
            this.turnTimer.reset(15);
        }
        if (this.roomJoinTimers) {
            this.roomJoinTimers.reset(15);
        }
        if (this.bettingTimer) {
            this.bettingTimer.reset(3);
        }



    }

    setBotDifficulty(difficulty) {
        const validDifficulties = ['easy', 'medium', 'hard'];
        let isValid = false;

        for (let i = 0; i < validDifficulties.length; i++) {
            if (validDifficulties[i] === difficulty) {
                isValid = true;
                break;
            }
        }

        if (isValid) {
            this.botDifficulty = difficulty;
            console.log(`Bot difficulty set to ${difficulty} for room ${this.roomName}`);
        } else {
            console.error(`Invalid bot difficulty: ${difficulty}`);
        }
    }


}

module.exports = LudoGame;
