const RouletteManager = {
    currentPhase: '',
    timerValue: 0,
    winList: [],
    maxWinList: 8,
    wheelNumbers: [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26],
    redNumbers: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],
    isRoundOn: false,
    isGameRouletteStart: false,
    latestResult: null,
    winMessageElement: null,

    initialize() {
        this.setDefaultWinList();
        this.createBoard();
        this.updateHistory();
        this.wheelElement = document.getElementById('roulette-wheel');
        this.scrollingNumbersElement = document.getElementById('scrolling-numbers');
        this.currentNumberElement = document.getElementById('current-number');
        this.winMessageElement = document.getElementById('win-message');
    },

    createBoard() {
        const boardContainer = document.getElementById('board-container');
        boardContainer.innerHTML = '';

        // Create 0
        this.createBoardNumber(boardContainer, 0, 'green', { gridColumn: '1', gridRow: '1 / span 3' });

        // Create numbers 1-36
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 12; col++) {
                const number = col * 3 + (3 - row);
                this.createBoardNumber(boardContainer, number, this.getNumberColor(number), {
                    gridColumn: col + 2,
                    gridRow: row + 1
                });
            }
        }

        // Create 2 to 1 sections
        for (let row = 1; row <= 3; row++) {
            this.createBoardSection(boardContainer, '2 TO 1', { gridColumn: '14', gridRow: row });
        }

        // Create 1st 12, 2nd 12, 3rd 12 sections
        const twelveSections = ['1st 12', '2nd 12', '3rd 12'];
        twelveSections.forEach((text, index) => {
            this.createBoardSection(boardContainer, text, { 
                gridColumn: `${2 + index * 4} / span 4`, 
                gridRow: 4
            });
        });

        // Create bottom sections
        const bottomSections = [
            '1-18', 'EVEN', 'RED', 'BLACK', 'ODD', '19-36'
        ];
        bottomSections.forEach((text, index) => {
            this.createBoardSection(boardContainer, text, { 
                gridColumn: `${2 + index * 2} / span 2`, 
                gridRow: 5
            });
        });
    },

    createBoardNumber(container, number, color, style = {}) {
        const numberDiv = document.createElement('div');
        numberDiv.className = `board-number ${color}`;
        numberDiv.textContent = number;
        Object.assign(numberDiv.style, style);
        container.appendChild(numberDiv);
    },

    createBoardSection(container, text, style = {}) {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'board-section';
        sectionDiv.textContent = text;
        Object.assign(sectionDiv.style, style);
        container.appendChild(sectionDiv);
    },

    onCurrentStatus(data) {
        this.updateGameState(data.currentPhase, data.betting_remaing, data.pause_remaing, data.winList, data.round);
    },

    updateGameState(currentPhase, bettingRemaining, pauseRemaining, winList, roundCount) {
        this.currentPhase = currentPhase;
        this.updateWinList(winList);

        switch (currentPhase) {
            case "betting":
                this.isRoundOn = false;
                this.updateTimer(bettingRemaining);
                break;
            case "pause":
                this.isRoundOn = true;
                this.updateTimer(pauseRemaining);
                break;
            default:
                this.updateTimer(0);
                break;
        }
    },

    onTimerStart(data) {
        this.isRoundOn = false;
        this.updateWinList(data.winList);
        this.updateTimer(data.betting_remaing);
    },

    onTimerStop() {
        this.isRoundOn = true;
        this.startRouletteSpinning();
    },

    onBettingTick(data) {
        this.updateTimer(data.remainingTime);
    },

    onGameResult(data) {
        this.latestResult = data.betWin;
        this.startRouletteSpinning();
    },

    onGameRestart() {
        this.resetGame();
    },

    updateTimer(remainingTime) {
        this.timerValue = remainingTime;
        document.getElementById('time-remaining').textContent = this.timerValue;
    },

    updateWinList(winListData) {
        try {
            if (Array.isArray(winListData)) {
                this.winList = winListData.map(Number);
            } else if (typeof winListData === 'string') {
                this.winList = JSON.parse(winListData).map(Number);
            } else {
                throw new Error('Invalid winList data type');
            }
        } catch (e) {
            console.error("Error parsing win list data:", e);
            this.setDefaultWinList();
        }
        this.updateHistory();
    },

    setDefaultWinList() {
        this.winList = [15, 26, 21, 25, 20, 27, 22, 23];
    },

    updateHistory() {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';
        this.winList.slice(0, this.maxWinList).forEach(number => {
            const item = document.createElement('div');
            item.className = `history-item ${this.getNumberColor(number)}`;
            item.textContent = number;
            historyList.appendChild(item);
        });
    },

    startRouletteSpinning() {
        this.isGameRouletteStart = true;
        //this.scrollNumbers();
        this.animateNumberChange();
    },

    animateNumberChange() {
        const duration = 6000; // 6 seconds
        const startTime = Date.now();
        const endTime = startTime + duration;

        const animate = () => {
            const now = Date.now();
            const timeLeft = Math.max(0, endTime - now);
            const progress = 1 - (timeLeft / duration);

            if (progress < 1) {
                // Generate a random number
                const randomNumber = Math.floor(Math.random() * 37); // 0-36
                this.currentNumberElement.textContent = randomNumber;
                this.currentNumberElement.className = this.getNumberColor(randomNumber);

                // Adjust the speed of number changes
                const changeInterval = Math.max(50, Math.floor(500 * progress));

                // Add a pulsating effect
                const scale = 1 + 0.2 * Math.sin(progress * Math.PI * 10);
                this.currentNumberElement.style.transform = `scale(${scale})`;

                setTimeout(animate, changeInterval);
            } else {
                this.showResult(this.latestResult);
            }
        };

        this.currentNumberElement.style.display = 'block';
        animate();
    },

    // scrollNumbers() {
    //     this.scrollingNumbersElement.style.display = 'block';
    //     this.currentNumberElement.style.display = 'none';
        
    //     let scrollContent = '';
    //     for (let i = 0; i < 100; i++) {
    //         scrollContent += `<span class="${this.getNumberColor(this.wheelNumbers[i % 37])}">${this.wheelNumbers[i % 37]}</span> `;
    //     }
    //     this.scrollingNumbersElement.innerHTML = scrollContent;

    //     let start = null;
    //     const duration = 5000; // 5 seconds

    //     const step = (timestamp) => {
    //         if (!start) start = timestamp;
    //         let progress = timestamp - start;
            
    //         if (progress < duration) {
    //             let offset = (progress / duration) * this.scrollingNumbersElement.scrollWidth;
    //             this.scrollingNumbersElement.scrollLeft = offset;
    //             window.requestAnimationFrame(step);
    //         } else {
    //             setTimeout(() => this.showResult(this.latestResult), 1000); // Wait 1 more second before showing result
    //         }
    //     };

    //     window.requestAnimationFrame(step);
    // },

    showResult(winningNumber) {
        this.currentNumberElement.textContent = winningNumber;
        this.currentNumberElement.className = this.getNumberColor(winningNumber);
        this.currentNumberElement.style.transform = 'scale(1)';
        this.currentNumberElement.style.animation = 'winReveal 0.5s ease-out';

        // Show winning message
        setTimeout(() => {
            this.winMessageElement.textContent = `Winning number is ${winningNumber}!`;
            this.winMessageElement.style.display = 'block';
        }, 500);

        this.isGameRouletteStart = false;
        
        // Update winList and history after a delay
        setTimeout(() => {
            if (this.winList[0] !== winningNumber) {
                this.winList.unshift(winningNumber);
                if (this.winList.length > this.maxWinList) {
                    this.winList.pop();
                }
                this.updateHistory();
            }
        }, 2000);
    },

    resetGame() {
        this.isRoundOn = false;
        this.isGameRouletteStart = false;
        this.currentNumberElement.style.display = 'none';
        this.currentNumberElement.textContent = '';
        this.currentNumberElement.style.transform = 'scale(1)';
        this.currentNumberElement.style.animation = 'none';
        this.winMessageElement.style.display = 'none';
        this.winMessageElement.textContent = '';
        this.latestResult = null;
    },

    getNumberColor(number) {
        if (number === 0) return 'green';
        return this.redNumbers.includes(number) ? 'red' : 'black';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    RouletteManager.initialize();
});

// Make RouletteManager available globally
window.RouletteManager = RouletteManager;