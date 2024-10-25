// socketHandler.js

const SocketHandler = {
    socket: null,
    gameType: '',
    room: '',
    data: {
        userId: "spectator",
        lobbyId: '',
        maxp: 99999
    },

    initialize(gameType, data) {
        this.gameType = gameType;
        this.data= data;
        this.socket = io("wss://daemon.cherrygames.io", {
            transports: ['websocket'],
            query: "EIO=3&transport=websocket"
        });
        // this.socket = io("ws://localhost:3000", {
        //     transports: ['websocket'],
        //     query: "EIO=3&transport=websocket"
        // });

        this.setupEventListeners();
    },

    setupEventListeners() {
        this.socket.on('connect', this.onConnect.bind(this));
        this.socket.on('disconnect', this.onDisconnect.bind(this));
        this.socket.on('join', this.onJoin.bind(this));
        this.socket.on('OnCurrentStatus', this.onCurrentStatus.bind(this));
        this.socket.on('OnTimerStart', this.onTimerStart.bind(this));
        this.socket.on('OnTimeUp', this.onTimerStop.bind(this));
        this.socket.on('betting_tick', this.onBettingTick.bind(this));
        this.socket.on('onBetPlaced', this.onBetPlaced.bind(this));
        this.socket.on('OnWinNo', this.onGameResult.bind(this));
        this.socket.on('OnReset', this.onGameRestart.bind(this));

        // Crash-specific events
        this.socket.on('OnFlightBlast', this.onFlightBlast.bind(this));
        this.socket.on('OnCashOuts', this.onCashOuts.bind(this));
        this.socket.on('flight_tick', this.onFlightTick.bind(this));

 
         //chat message 
         this.socket.on('emoji_message', this.emoji_message.bind(this));
         this.socket.on('chat_message', this.chat_message.bind(this));
         this.socket.on('gift_message', this.gift_message.bind(this));


    },
    chat_message(data) {
        ChatManager.chatMessage(data);
    },

    emoji_message(data) {
        ChatManager.displayEmoji(data); // Define how emoji messages are handled
    },
    gift_message(data) {
        ChatManager.displayGift(data); // Define how emoji messages are handled
    },
    emit_chat_message(message, data) {
        this.socket.emit('chat_message', { 
            ...data, 
            message: ChatManager.compressMessage(message), 
            room: this.room 
        });
    },
    emit_disconnect(data) {
        this.socket.emit('influencer_leave', {room: this.room, userId:this.data.userId, lobbyId : this.data.lobbyId });
    },

    onConnect() {
        console.log('Connected to server');
        this.socket.emit('join', {...this.data, gameType: this.gameType, room: this.room});
    },

    onDisconnect() {
        console.log('Disconnected from server');
    },

    onJoin(msg) {
        this.room = msg.room;
        console.log('Joined room:', this.room);
        //this.requestCurrentStatus();
       var channel = document.getElementById('channel');
       var userCount = document.getElementById('userCount');
        channel.value =  this.room;
       
        userCount.textContent = msg.numberOfClients;
        

    },

    requestCurrentStatus(r) {
        this.socket.emit('OnCurrentStatus', { room: this.room });
    },
    startGame(r) {
        this.socket.emit('influencer_join', { room: this.room });
    },

    onCurrentStatus(data) {
        console.log('Received current status:', data);
        switch(this.gameType) {
            case 'dragonTiger':
                if (typeof gameManager !== 'undefined') {
                    gameManager.updateGameState(data);
                }
                break;
            case 'roulette':
                if (typeof RouletteManager !== 'undefined') {
                    RouletteManager.onCurrentStatus(data);
                }
                break;
            case 'crash':
                if (typeof CrashManager !== 'undefined') {
                    CrashManager.updateGameState(data.currentPhase, data.betting_remaing, data.pause_remaing, data.winList, data.round);
                }
                break;
            case 'tambola':
                if (typeof TambolaManager !== 'undefined') {
                    TambolaManager.handleGameStatus(data);
                }
        }
    },

    onTimerStart(data) {
        console.log('Timer started:', data);
        switch(this.gameType) {
            case 'dragonTiger':
                if (typeof gameManager !== 'undefined') {
                    gameManager.startBetting(data.winList);
                }
                break;
            case 'roulette':
                if (typeof RouletteManager !== 'undefined') {
                    RouletteManager.onTimerStart(data);
                }
                break;
            case 'crash':
                if (typeof CrashManager !== 'undefined') {
                    CrashManager.handleTimerStart(data);
                }
            case 'tambola':
                if (typeof TambolaManager !== 'undefined') {
                    TambolaManager.startTimer(data.duration);
                }
                break;
        }
    },

    onTimerStop() {
        console.log('Timer stopped');
        switch(this.gameType) {
            case 'dragonTiger':
                if (typeof gameManager !== 'undefined') {
                    gameManager.stopBetting();
                }
                break;
            case 'roulette':
                if (typeof RouletteManager !== 'undefined') {
                    RouletteManager.onTimerStop();
                }
                break;
            case 'crash':
                if (typeof CrashManager !== 'undefined') {
                    CrashManager.handleTimerStop();
                }
            case 'tambola':
                // Tambola might not need this, but you can add logic if necessary
                break;
        }
    },

    onBettingTick(data) {
        switch(this.gameType) {
            case 'dragonTiger':
                if (typeof gameManager !== 'undefined') {
                    gameManager.updateTimer(data.remainingTime);
                }
                break;
            case 'roulette':
                if (typeof RouletteManager !== 'undefined') {
                    RouletteManager.onBettingTick(data);
                }
                break;
            case 'crash':
                if (typeof CrashManager !== 'undefined') {
                    CrashManager.handleBettingTick(data.remainingTime);
                }
            case 'tambola':
                if (typeof TambolaManager !== 'undefined') {
                    TambolaManager.startTimer(data.remainingTime);
                }
                break;
        }
    },

    onBetPlaced(data) {
        if (data.PlayerID !== this.data.userId) {
            switch(this.gameType) {
                case 'dragonTiger':
                    if (typeof gameManager !== 'undefined') {
                        gameManager.placeBet(data.boxNo, data.chipNo, data.amount);
                    }
                    break;
                case 'roulette':
                    if (typeof RouletteManager !== 'undefined') {
                        RouletteManager.onBetPlaced(data);
                    }
                    break;
                case 'crash':
                    if (typeof CrashManager !== 'undefined') {
                        CrashManager.handleBetPlaced(data);
                    }
                    break;
            }
        }
    },

    onGameResult(data) {
        console.log('Game result:', data);
        switch(this.gameType) {
            case 'dragonTiger':
                if (typeof gameManager !== 'undefined') {
                    gameManager.showResult(data);
                }
                break;
            case 'roulette':
                if (typeof RouletteManager !== 'undefined') {
                    RouletteManager.onGameResult(data);
                }
                break;
            case 'crash':
                // Crash game doesn't use this event
                break;
            case 'tambola':
                if (typeof TambolaManager !== 'undefined') {
                    TambolaManager.resetGame();
                }
        }
    },

    onGameRestart() {
        console.log('Game restarted');
        switch(this.gameType) {
            case 'dragonTiger':
                if (typeof gameManager !== 'undefined') {
                    gameManager.resetGame();
                }
                break;
            case 'roulette':
                if (typeof RouletteManager !== 'undefined') {
                    RouletteManager.onGameRestart();
                }
                break;
            case 'crash':
                
                break;
        }
    },

    // Crash-specific event handlers
    onFlightBlast() {
        console.log('Flight blast');
        if (this.gameType === 'crash' && typeof CrashManager !== 'undefined') {
            CrashManager.handleFlightBlast();
        }
    },

    onCashOuts(data) {
        console.log('Cash outs:', data);
        if (this.gameType === 'crash' && typeof CrashManager !== 'undefined') {
            CrashManager.handleCashOuts(data);
        }
    },

    onFlightTick(data) {
        if (this.gameType === 'crash' && typeof CrashManager !== 'undefined') {
            CrashManager.handleFlightX(data.h);
        }
    },

     // Tambola-specific event handlers
     onNewNumber(data) {
        console.log('New number:', data);
        if (this.gameType === 'tambola' && typeof TambolaManager !== 'undefined') {
            TambolaManager.handleNewNumber(data);
        }
    },

    onGameEnded(data) {
        console.log('Game ended:', data);
        if (this.gameType === 'tambola' && typeof TambolaManager !== 'undefined') {
            TambolaManager.handleGameEnded(data);
        }
    },

    onClaimReward(data) {
        console.log('Claim reward:', data);
        if (this.gameType === 'tambola' && typeof TambolaManager !== 'undefined') {
            TambolaManager.handleRewardClaimStatus(data);
        }
    },


    updateRoomAndLobby(newRoomId, newLobbyId) {
        this.room = newRoomId;
        this.data.lobbyId = newLobbyId;
        if (this.socket && this.socket.connected) {
            this.socket.emit('join', {...this.data, gameType: this.gameType, room: this.room});
        } else {
            console.error('Socket not connected. Unable to update room and lobby.');
        }
    }
};
// Make SocketHandler available globally
window.SocketHandler = SocketHandler;

