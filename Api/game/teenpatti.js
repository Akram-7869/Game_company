const { getBotName, publicRoom, sleep, state, userLeave } = require("../utils/JoinRoom");
const { generateName } = require("../utils/utils");
const Timer = require("./Timer");

class TeenpattiGame {
    constructor(io, roomName, maxPlayers, tournament) {
        this.io = io; this.roomName = roomName; this.maxPlayers = maxPlayers; this.tournament = tournament;

        this.turnOrder = [];
        this.currentTurnIndex = 0;
        this.currentPhase = 'waiting'; // possible states: waiting, playing, finished
        this.turnTimer = undefined;
        this.roomJoinTimers = undefined;
        this.bettingTimer = undefined;

        this.round = 0;
        this.bettingTime = 20; // 20 seconds
        this.pauseTime = 5; // 5 seconds
        this.botMoveDelay = 5000;
        this.botDifficulty = 'medium'; // 'easy', 'medium', or 'hard'
        this.isGameReady = false;


        this.botTimer = undefined;
        // ['Hearts = 1', 'Diamonds = 2', 'Clubs = 3', 'Spades = 4'];
        this.suits = [1, 2, 3, 4];
        // [2, 3, 4, 5, 6, 7, 8, 9, 10,j, k, q, a]];
        this.ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
        this.deck = [];

        this.pot = 0;
        this.currentBet = 5; //tournament.betAmount;



    }

    syncPlayer(socket, player) {

        let playerExit = this.findPlayerByUserId(player.userId);
        if (this.turnOrder.length < this.maxPlayers && !playerExit) {
            player['hand'] = [];
            player['type'] = 'player';
            player['seen'] = false;
            player['fold'] = false;
            player['isDealer'] = false;
            player['playerStatus'] = 'joined',
                player['cardRank'] = '';
            this.turnOrder.push(player);
            this.setupPlayerListeners(socket)
        }
    }


    setupPlayerListeners(socket) {
        socket.on('OnBetPlaced', (data) => this.handlePlayerBet(socket, data));
        socket.on('OnSideShow', (data) => this.handleSideShow(socket, data));
        socket.on('OnFold', (data) => this.handlefold(socket, data));
        socket.on('OnSeen', (data) => this.handleSeen(socket, data));
        socket.on('OnSideShowResponse', (data) => this.handleSideShowResponse(socket, data));
        socket.on('OnShow', (data) => this.handleShow(socket, data));

        socket.on('OnCurrentStatus', () => this.sendCurrentStatus(socket));
        socket.on('onleaveRoom', (data) => this.handlePlayerLeave(socket, data));
    }
    removePlayerListeners(socket) {

        socket.on('OnCurrentStatus', () => this.sendCurrentStatus(socket));
        socket.removeAllListeners('OnFold');
        socket.removeAllListeners('OnSeen');
        socket.removeAllListeners('OnShow');
        socket.removeAllListeners('OnCurrentStatus');
    
        socket.removeAllListeners('OnBetPlaced');
        socket.removeAllListeners('OnSideShow');
        socket.removeAllListeners('OnSideShowResponse');
        socket.removeAllListeners('onleaveRoom');
    
    }
    sendCurrentStatus(socket) {
        let d = {
            gameType: 'TeenPatti',
            room: this.roomName,
            currentPhase: this.currentPhase,
            players: this.turnOrder,
            currentTurnIndex: this.currentTurnIndex,
            turnTimer: !this.turnTimer ? 15 : this.turnTimer.remaining,
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
            this.initializeBoard();
        });

        this.roomJoinTimers.startTimer();
        console.log(`Game setup in room: ${this.roomName}`);

    }
    async initializeBoard() {
        this.currentPhase = 'initializing';
        console.log(`setupGameBoard phase started in room: ${this.roomName}`);
        this.createDeck();
        for (let i = 0; i < this.turnOrder.length; i++) {
            let player = this.turnOrder[i];
            if (i == 0) {
                player['isDealer'] = true;
            }
            player.hand = this.deck.splice(0, 3);
            player.cardRank = this.evaluateHand(player.hand);

        }
        this.pot = this.currentBet * this.turnOrder.length;


         await sleep(9000);
            if (this.isGameReady) {
                 this.startGame();
            } else {
                console.log("Not enough players to start the game.");
                this.io.to(this.roomName).emit('game_cancelled', { reason: 'Not enough players' });
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

            let name = generateName();
            let pathurl = process.env.IMAGE_URL + '/img/logo/profile_default.png';
            let botPlayer = {
                userId: `${i + 1}-bot`,
                name,
                balance: '1000',
                lobbyId: this.tournament._id,
                type: 'bot',
                playerStatus: 'joined',
                avtar: pathurl,
                hand: [],
                'seen': false,
                'fold': false,
                'isDealer': false,
                'cardRank': ''
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
        // this.createDeck();
        // this.dealCards();
        console.log(`Game started in room: ${this.roomName}`);
        // await sleep(5000);
        this.currentPhase = 'playing';
        this.round += 1;
        this.nextTurn();

    }
    resetGame() {

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


    endGame() {
        this.gameState = 'finished';
      
        this.handleResult();
        console.log(`Game ended in room: ${this.roomName}`);
        this.resetGame();
    }
    handleResult() {

        clearTimeout(this.botTimer);
        let winner = this.determineWinner(this.turnOrder.filter(p=>p.playerStatus ==='joined'));
        this.botTimer = setTimeout(() => {
            let d= { winnerId: winner.userId, name:winner.name };
            this.io.to(this.roomName).emit('OnResult', d);
            clearTimeout(this.botTimer);
            console.log('result declared', d);
            publicRoom[this.tournament._id]['played'] = true;
            delete state[this.roomName]
        }, 3000);
    }

    
    handleShow(socket, data) {
        let { PlayerID, amount } = data;
        let player = this.findPlayerByUserId(PlayerID);

        this,this.checkGameStatus();

    }
    handleSideShowResponse(socket, data) {
        let { PlayerID, amount } = data;
        let player = this.findPlayerByUserId(PlayerID);

        this.checkGameStatus();

    }
    handlePlayerLeave(socket, data) {
        try {

            console.log('OnleaveRoom--teenpatii')
            let { PlayerID } = data;
            userLeave({ userId: PlayerID, room: this.roomName })
            
            socket.leave(this.roomName);

            this.removePlayerListeners(socket);
            // playerManager.RemovePlayer(socket.id);
            socket.emit('onleaveRoom', {
                success: `successfully leave ${this.roomName} game.`,
            });

            if (this.currentPhase === 'playing') {
                this.checkGameStatus();
    
            } else if (this.currentPhase === 'createdroom') {
                this.deletePlayerByUserId(PlayerID);
                this.emitJoinPlayer();
                let playerCount = this.countPlayers();
                if (playerCount <= 1) {
                    delete state[this.roomName];
                    publicRoom[this.tournament._id]['played'] = true;
                }
            }
            
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


    handlePlayerBet(socket, data) {
        let { PlayerID, amount } = data;
        let player = this.findPlayerByUserId(PlayerID);
        if (amount < this.currentBet) {
            throw new Error("Bet amount must be equal to or higher than the current bet");
        }

        this.pot += amount;
        this.currentBet = amount; // Update the current bet
        this.io.to(this.roomName).emit('OnBetPlaced', { ...data, pot: this.pot });
        this.nextTurn();
    }

    handlefold(socket, data) {
        let { PlayerID } = data;
        let player = this.findPlayerByUserId(PlayerID);
        console.log(`has folded.`);

        player.fold = true;
        player.playerStatus = 'fold';


        this.io.to(this.roomName).emit('OnFold', data);

       this.checkGameStatus();
    }

    handleSeen(socket, data) {

        let { PlayerID } = data;
        let player = this.findPlayerByUserId(PlayerID);
        console.log(`${player.name} has seen.`);
        player.seen = true;
        this.io.to(this.roomName).emit('OnSeen', data);
        // this.nextTurn();
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


        let d = {
            gameType: 'Teenpati',
            room: this.roomName,
            currentPhase: this.currentPhase,
            currentTurnIndex: this.currentTurnIndex,
            currentPalyerId: this.turnOrder[this.currentTurnIndex].userId,
            timer: 15

        }
        this.io.to(this.roomName).emit('OnNextTurn', d);

        if (currentPlayer.type === 'bot') {
            this.botTurn(socket, { PlayerID: d.currentPalyerId, amount: this.currentBet });
            return;
        }

        this.turnTimer = new Timer(15, undefined, () => {

            if (this.currentPhase === 'playing') {
                let data = {};
                // this.handlefold(socket, data);
                this.nextTurn();
            }

        });

        this.turnTimer.startTimer();
    }
    async botTurn(socket, data) {
        // Function for bot decision-making
        let { PlayerID, amount } = data;
        let player = this.findPlayerByUserId(PlayerID);
        if (!player.seen) {
            await sleep(3000);
            this.handleSeen(socket, data)

        }

        const handValue = this.evaluateHand(player.hand);

        await sleep(5000);

        // Simple logic for bots to decide to bet, call, or fold
        if (handValue === 'Trail or Set' || handValue === 'Pure Sequence') {
            this.handlePlayerBet(socket, data);
        } else if (Math.random() > 0.5) {
            this.handlePlayerBet(socket, data);
        } else {
            this.handlefold(socket, data);
        }




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
    checkGameStatus() {
         let players = this.countJoinedPlayers();
        if (players <= 1) {
            this.endGame();
        }else{
            this.nextTurn();
        }


    }
    handleSideShow(socket, data) {
        let { currentPlayer, previousPlayer } = data;
        let result = this.sideshow(currentPlayer, previousPlayer);

        this.io.to(this.roomName).emit('OnSideShow', { ...data, result });
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
        this.deck = this.shuffle(this.deck);
    }
    // Shuffle the deck (Fisher-Yates algorithm)
    shuffle(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }


    // Deal cards to players
    // dealCards() {
    //     this.turnOrder.forEach(player => {
    //         player.hand = this.deck.splice(0, 3); // Deal 3 cards to each player
    //     });
    // }

    // Evaluate the player's hand
    // gameLogic.js
    evaluateHand(cards) {

        // Helper functions
        function isTrail(cards) {
            return cards.every(card => card.rank === cards[0].rank);
        }

        function isPureSequence(cards) {
            return isSequence(cards) && cards.every(card => card.suit === cards[0].suit);
        }

        function isSequence(cards) {
            return cards.sort((a, b) => a.rank - b.rank).every((card, index, arr) => {
                if (index === 0) return true;
                return card.rank === arr[index - 1].rank + 1;
            });
        }

        function isColor(cards) {
            return cards.every(card => card.suit === cards[0].suit);
        }

        function isPair(cards) {
            return cards.filter(card => card.rank === cards[0].rank).length === 2;
        }

        function isHighCard(cards) {
            return !isTrail(cards) && !isPureSequence(cards) && !isSequence(cards) && !isColor(cards) && !isPair(cards);
        }

        // Ranking logic
        if (isTrail(cards)) return "Trail or Set";
        if (isPureSequence(cards)) return "Pure Sequence";
        if (isSequence(cards)) return "Sequence";
        if (isColor(cards)) return "Color";
        if (isPair(cards)) return "Pair";
        if (isHighCard(cards)) return "High Card";

    }

    // Compare two hands to determine the better hand
    compareHands(hand1, hand2) {
        const handRanks = {
            'Trail or Set': 6,
            'Pure Sequence': 5,
            'Sequence': 4,
            'Color': 3,
            'Pair': 2,
            'High Card': 1
        };

        const hand1Rank = handRanks[this.evaluateHand(hand1)];
        const hand2Rank = handRanks[this.evaluateHand(hand2)];

        if (hand1Rank > hand2Rank) {
            return 1;
        } else if (hand2Rank > hand1Rank) {
            return -1;
        } else {
            return 0;
        }
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
