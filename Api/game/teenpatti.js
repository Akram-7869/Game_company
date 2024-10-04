const { getBotName, publicRoom } = require("../utils/JoinRoom");
const { generateName } = require("../utils/utils");
const Timer = require("./Timer");

class TeenpattiGame {
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
        this.botMoveDelay = 2000;
        this.botDifficulty = 'medium'; // 'easy', 'medium', or 'hard'
        this.isGameReady = false;


        this.botTimer = undefined;
        this.suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        this.ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        let deck = [];

        this.pot = 0;
        this.currentBet = 5; //tournament.betAmount;



    }

    syncPlayer(socket, player) {

        let playerExit = this.findPlayerByUserId(player.userId);
        if (this.turnOrder.length < this.maxPlayers && !playerExit) {

            player['hand'] = [];
            player['seen'] = false;
            player['pack'] = false;
            player['isDealer'] = false;
            this.turnOrder.push(player);
            this.setupPlayerListeners(socket)

        }


    }


    setupPlayerListeners(socket) {
        // socket.on('OnCall', (data) => this.handlePlayerCall(socket, data));
        // socket.on('OnBetPlaced', (data) => this.handlePlayerBet(socket, data));
        // socket.on('OnSideShow', (data) => this.sendCurrentSideShow(socket, data));
        // socket.on('OnFold', (data) => this.handlePlayerFold(socket, data));
        // socket.on('OnRaise', (data) => this.handlePlayerRaise(socket, data));
        // socket.on('OnRaise', (data) => this.handlePlayerRaise(socket, data));
        // socket.on('OnSeen', (data) => this.handlePlayerSeen(socket, data));
        // socket.on('OnPack', (data) => this.handlePlayerPack(socket, data));
        // socket.on('OnPack', (data) => this.handlePlayerPack(socket, data));
        socket.on('OnCurrentStatus', () => this.sendCurrentStatus(socket));




        socket.on('onleaveRoom', (data) => this.handlePlayerLeave(socket, data));

    }
    sendCurrentStatus(socket) {
        let d = {
            gameType: 'TeenPatti',
            room: this.roomName,
            currentPhase: this.currentPhase,
            players: this.turnOrder,
            currentTurnIndex: this.currentTurnIndex,
            turnTimer: this.turnTimer?.remaining,
            currentPalyerId: this.turnOrder[this.currentTurnIndex].userId,
            ante: this.currentBet,

            currentBet: this.currentBet,
            pot: this.pot
        };
        console.log('OnCurrentStatus');
        socket.emit('OnCurrentStatus', d);
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
    initializePlayerScores() {
        for (let i = 0; i < this.turnOrder.length; i++) {
            let player = this.turnOrder[i];
            if (i == 0) {
                player['isDealer'] = true;
            }
            player['score'] = 0;
            player['winnerPosition'] = this.maxPlayers;
            player['winingAmount'] = 0;
        }
        this.pot = this.currentBet * this.turnOrder.length;
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

            let name = generateName();
            let pathurl = process.env.IMAGE_URL + '/img/logo/profile_default.png';
            let botPlayer = {
                userId: `${i + 1}-bot`,
                name,
                balance: '1000',
                lobbyId: this.tournament._id,
                maxp: this.maxPlayers,
                type: 'bot',
                playerStatus: 'joined',
                avtar: pathurl,

                score: 0,
                winingAmount: 0,
                hand: [],
                'seen': false,
                'pack': false,
                'isDealer': false,
            }

            this.turnOrder.push(botPlayer);
            console.log(`Bot ${botId} added to room ${this.roomName}`);
        }
    }
    emitJoinPlayer() {
        this.io.to(this.roomName).emit('join_players', { players: this.turnOrder });
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

    async startGame() {
        publicRoom[this.tournament._id]['played'] = true;
        this.currentPhase = 'playing';
        this.round += 1;
        this.createDeck();
        this.dealCards();
        console.log(`Game started in room: ${this.roomName}`);

        //await sleep(3000)
        this.nextTurn();

    }



    endGame() {
        this.gameState = 'finished';
        this.io.to(this.roomName).emit('game_end', { message: 'Game has ended.' });
        console.log(`Game ended in room: ${this.roomName}`);
        this.resetGame();
    }

    resetGame() {
        this.gameState = 'waiting';
    }

    handlePlayerLeave(socket) {
        try {
            console.log('OnleaveRoom--teenpatii')
            socket.leave(this.roomName);

            socket.removeAllListeners('onleaveRoom');
            // playerManager.RemovePlayer(socket.id);
            socket.emit('onleaveRoom', {
                success: `successfully leave ${this.roomName} game.`,
            });
        } catch (err) {
            console.log(err);
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


    placeBet(player, amount) {

        if (amount < this.currentBet) {
            throw new Error("Bet amount must be equal to or higher than the current bet");
        }

        player.bet = amount;
        player.balance -= amount;
        this.pot += amount;
        this.currentBet = amount; // Update the current bet
        this.nextTurn();
    }

    fold(player) {
        console.log(`${player.name} has folded.`);
        player.folded = true;
        this.activePlayers = this.activePlayers.filter(p => p !== player);
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
            gameType: 'Teenpati',
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
    botTurn(bot) {
        // Function for bot decision-making

        const handValue = this.evaluateHand(bot.hand);
        // Simple logic for bots to decide to bet, call, or fold
        if (handValue === 'Three of a Kind' || handValue === 'Pair') {
            return 'bet'; // Bet with good hands
        } else if (Math.random() > 0.5) {
            return 'call'; // Random chance to call
        } else {
            return 'fold'; // Random chance to fold
        }


    }
    checkGameStatus() {
        // let players = this.countJoinedPlayers();
        // console.log('checkGameStatus', this.maxPlayers, players);
        // if (this.maxPlayers == 2) {
        //     if (this.winnerPosition == 1) {
        //         return this.endGame('Game completed');
        //     }
        // } else if (this.maxPlayers == 4) {
        //     if (this.winnerPosition == this.tournament.winners) {
        //         return this.endGame('Game completed');
        //     }
        // }
        // if (players <= 1) {
        //     this.endGame('All players left');
        // }


    }


    //game function
    sideshow(currentPlayer, previousPlayer) {
        if (!currentPlayer || !previousPlayer) {
            throw new Error('Both current and previous players must be defined.');
        }

        const result = this.compareHands(currentPlayer, previousPlayer);

        return result;
    }


    createDeck() {
        this.deck = [];
        for (let suit of this.suits) {
            for (let rank of this.ranks) {
                this.deck.push({ suit, rank });
            }
        }
        this.deck.sort(() => Math.random() - 0.5); // Shuffle the deck
    }

    // Deal cards to players
    dealCards(players, deck) {
        this.turnOrder.forEach(player => {
            player.hand = this.deck.splice(0, 3); // Deal 3 cards to each player
        });
    }

    // Evaluate the player's hand
    evaluateHand(hand) {
        const rankCount = {};
        hand.forEach(card => {
            rankCount[card.rank] = (rankCount[card.rank] || 0) + 1;
        });
        const uniqueRanks = Object.keys(rankCount).length;

        if (uniqueRanks === 1) return 'Three of a Kind';
        if (uniqueRanks === 2) return 'Pair';
        return 'High Card';
    }

    // Compare two hands to determine the better hand
    compareHands(hand1, hand2) {
        const sortedHand1 = hand1.sort((a, b) => this.ranks.indexOf(b.rank) - this.ranks.indexOf(a.rank));
        const sortedHand2 = hand2.sort((a, b) => this.ranks.indexOf(b.rank) - this.ranks.indexOf(a.rank));

        for (let i = 0; i < 3; i++) {
            if (this.ranks.indexOf(sortedHand1[i].rank) > this.ranks.indexOf(sortedHand2[i].rank)) {
                return 1; // hand1 wins
            } else if (this.ranks.indexOf(sortedHand1[i].rank) < this.ranks.indexOf(sortedHand2[i].rank)) {
                return -1; // hand2 wins
            }
        }
        return 0; // Draw
    }

    // Determine the winner from a list of players
    determineWinner(players) {
        let bestPlayer = players[0];
        players.forEach(player => {
            if (this.compareHands(player.hand, bestPlayer.hand) > 0) {
                bestPlayer = player;
            }
        });
        return bestPlayer;
    }
}

module.exports = TeenpattiGame;
