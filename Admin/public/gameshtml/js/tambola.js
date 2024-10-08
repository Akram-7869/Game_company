const TambolaManager = {
    currentNumber: 0,
    calledNumbers: [],
    timerValue: 0,
    duration: 30,
    isGameRunning: false,

    initialize() {
        this.createNumberBoard();
        this.setupEventListeners();
    },

    createNumberBoard() {
        const numberBoard = document.getElementById('number-board');
        for (let i = 1; i <= 90; i++) {
            const cell = document.createElement('div');
            cell.className = 'number-cell';
            cell.textContent = i;
            cell.id = `number-${i}`;
            numberBoard.appendChild(cell);
        }
    },

    setupEventListeners() {
        SocketHandler.socket.on('OnCurrentStatus', this.handleGameStatus.bind(this));
        SocketHandler.socket.on('OnClaimReward', this.handleRewardClaimStatus.bind(this));
        SocketHandler.socket.on('newNumber', this.handleNewNumber.bind(this));
        SocketHandler.socket.on('gameEnded', this.handleGameEnded.bind(this));
    },

    handleGameStatus(data) {
        console.log('Game Status:', data);
        if (data.currentPhase === "betting") {
            this.resetGame();
            this.startTimer(data.betting_remaing);
        }
        if (data.winList && Array.isArray(data.winList)) {
            this.updateHistory(data.winList);
        }
        if (data.claimed ) {
            this.renderClaimedData(data.claimed);
        }
    },

    handleRewardClaimStatus(data) {
        console.log('Reward Claim Status:', data);
        // Implement reward claim status update logic here if needed
        if (data.claimed ) {
            this.renderClaimedData(data.claimed);
        }
    },

    handleNewNumber(data) {
        this.currentNumber = data.number;
        this.duration = data.intervel;
        this.calledNumbers.push(this.currentNumber);
        this.updateNumberBoard();
        this.updateCurrentNumberDisplay();
        this.addToHistory(this.currentNumber);
        this.startTimer(this.duration);
    },

    handleGameEnded(data) {
        console.log('Game Ended:', data);
        this.isGameRunning = false;
        // Implement game end logic here if needed
    },

    updateNumberBoard() {
        const cell = document.getElementById(`number-${this.currentNumber}`);
        if (cell) {
            cell.classList.add('called');
            gsap.from(cell, {scale: 1.2, duration: 0.5, ease: "elastic.out(1, 0.3)"});
        }
    },

    updateCurrentNumberDisplay() {
        const currentNumberElement = document.getElementById('number');
        currentNumberElement.textContent = this.currentNumber;
        gsap.from(currentNumberElement, {scale: 1.5, duration: 0.5, ease: "bounce.out"});
    },

    startTimer(duration) {
        const timeRemainingElement = document.getElementById('time-remaining');
        this.timerValue = duration;

        const updateTimer = () => {
            if (this.timerValue > 0) {
                this.timerValue--;
                timeRemainingElement.textContent = this.timerValue.toString().padStart(2, '0');
                setTimeout(updateTimer, 1000);
            }
        };

        updateTimer();
    },

    addToHistory(number) {
        const historyContainer = document.getElementById('history-container');
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.textContent = number;
        historyContainer.insertBefore(historyItem, historyContainer.firstChild);
        gsap.from(historyItem, {y: -20, opacity: 0, duration: 0.5, ease: "power2.out"});
    },

    updateHistory(winList) {
        const historyContainer = document.getElementById('history-container');
        winList.forEach(win => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.textContent = win;
            item.style.backgroundColor = this.getColorForWin(win);
            historyContainer.insertBefore(item, historyContainer.firstChild);
            gsap.from(item, {y: -20, opacity: 0, duration: 0.5, ease: "power2.out"});
        });
    },
     renderClaimedData(claimedData) {
        const list = document.getElementById('claimed-list');
        list.innerHTML = ''; // Clear previous content

        const keysToDisplay = ['upperRow', 'lowerRow', 'fullHouse', 'middle', 'fourCorner', 'earlyFive'];

        keysToDisplay.forEach(key => {
            const value = claimedData[key];

            if (value !== undefined) {
                // Sanitize the key and value to avoid XSS
                const sanitizedKey = key.replace(/([A-Z])/g, ' $1').trim();
                const sanitizedValue = value.toString();

                // Create a new list item for each claimed item
                const listItem = document.createElement('li');
                listItem.classList.add('list-group-item');
                listItem.innerHTML = `
                        <div class="d-flex align-items-start align-items-center">
                            <div class="avatar-xs me-3">
                                <span class="avatar-title rounded-circle bg-soft-primary text-primary">
                                ${sanitizedValue}
                                </span>
                            </div>
                            
                            <div class="flex-1">
                                <h5 class="font-size-14 mb-0">${sanitizedKey}</h5>
                            </div>
                        </div>
                `;

                // Append the list item to the UL element
                list.appendChild(listItem);
            }
        });
    
    },
    getColorForWin(win) {
        const winTypes = {
            'early5': '#FF6B6B',
            'topLine': '#4ECDC4',
            'middleLine': '#45B7D1',
            'bottomLine': '#F7B731',
            'fullHouse': '#FF9FF3'
        };
        return winTypes[win] || '#2ecc40';
    },

    resetGame() {
        this.currentNumber = 0;
        this.calledNumbers = [];
        document.querySelectorAll('.number-cell').forEach(cell => cell.classList.remove('called'));
        document.getElementById('history-container').innerHTML = '';
        document.getElementById('number').textContent = '--';
        document.getElementById('time-remaining').textContent = '00';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    TambolaManager.initialize();
});

// Make TambolaManager available globally
window.TambolaManager = TambolaManager;