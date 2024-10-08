const CrashManager = {
    currentPhase: '',
    timerValue: 0,
    currentMultiplier: 1,
    isGameRunning: false,
    environment: null,
    flight: null,
    multiplierElement: null,
    historyContainer: null,
    timerElement: null,
    backgroundAnimation: null,
    flightAnimation: null,
    timerPanel: null,
    timerProgress: null,
    timerText: null,
    totalBettingTime: 10, // Assuming total betting time is 10 seconds
    lastWinList: [],
    
    initialize() {
        this.environment = document.getElementById('environment');
        this.flight = document.getElementById('flight');
        this.multiplierElement = document.getElementById('multiplier');
        this.historyContainer = document.getElementById('history-container');
        this.timerElement = document.getElementById('time-remaining');
        this.timerPanel = document.getElementById('timer-panel');
        this.timerProgress = document.querySelector('.timer-progress');
        this.timerText = document.querySelector('.timer-text');
         // Initialize history with dummy data
         this.initializeHistory();
    },

    initializeHistory() {
        const dummyWinList = ['1X', '2.5X', '1.5X', '1.45X', '5X'];
        this.updateHistory(dummyWinList);
    },

    updateGameState(phase, bettingRemaining, winList, round) {
        this.currentPhase = phase;

        if (phase === "betting") {
            this.handleBettingPhase(bettingRemaining);
        } else if (phase === "flight") {
            this.handleFlightPhase();
        }

        if (winList && Array.isArray(winList) && winList.length > 0) {
            this.updateHistory(winList);
        }
    },

    handleBettingPhase(bettingRemaining) {
        this.resetGame();
        this.showTimerPanel();
        this.updateCircularTimer(bettingRemaining);
        this.hideBettingScene();
    },

    showTimerPanel() {
        this.timerPanel.style.display = 'flex';
    },

    hideTimerPanel() {
        this.timerPanel.style.display = 'none';
    },

    updateCircularTimer(remainingTime) {
        const progress = (this.totalBettingTime - remainingTime) / this.totalBettingTime;
        const dashoffset = 565.48 * (1 - progress);
        
        this.timerProgress.style.strokeDashoffset = dashoffset;
        this.timerText.textContent = Math.max(0, Math.ceil(remainingTime));

        if (remainingTime <= 0) {
            this.hideTimerPanel();
            this.startFlight();
        }
    },

    handleFlightPhase() {
        this.hideTimerPanel();
        this.startFlight();
    },

    showBettingScene() {
        this.timerElement.parentElement.style.display = 'block';
        this.multiplierElement.style.display = 'none';
        gsap.to(this.flight, { x: 1, y: "80%", rotation: 0, duration: 0.5 });
    },

    hideBettingScene() {
        this.timerElement.parentElement.style.display = 'none';
        this.multiplierElement.style.display = 'block';
    },

    updateTimer(remainingTime) {
        this.timerValue = parseInt(remainingTime, 10);
        if (isNaN(this.timerValue)) {
            this.timerValue = 0;
        }
        this.timerElement.textContent = Math.max(0, this.timerValue).toString().padStart(2, '0');
    },

    startFlight() {
        this.isGameRunning = true;
        this.currentMultiplier = 1;
        this.updateMultiplierDisplay();
        this.animateFlight();
        this.startBackgroundAnimation();
    },

    animateFlight() {
        if (this.flightAnimation) {
            this.flightAnimation.kill();
        }
        
        this.flightAnimation = gsap.timeline()
            // Straight movement (simulating runway)
            .to(this.flight, {
                x: "+=50",
                duration: 1,
                ease: "power1.in"
            })
            // Takeoff: rotate and start ascending simultaneously
            .to(this.flight, {
                x: "+=100",
                y: "-=300%",
                rotation: -5,
                duration: 3,
                ease: "power1.in"
            }, "<") // The "<" ensures this animation starts at the same time as the previous one
            // Continue ascending while reducing rotation
            .to(this.flight, {
                x: "+=100",
                y: "-=250%",
                rotation: -10,
                duration: 3,
                ease: "power1.in"
            })
            // Level off
            .to(this.flight, {
                rotation: 0,
                duration: 1,
                ease: "power1.out"
            })
            // Slight up and down movement
            .to(this.flight, {
                y: "+=25%",
                rotation: 5,
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
    },

    startBackgroundAnimation() {
        if (this.backgroundAnimation) {
            this.backgroundAnimation.kill();
        }
        this.backgroundAnimation = gsap.to(this.environment, {
            x: "-=50%",
            repeat: -1,
            duration: 10,
            ease: "none"
        });
    },

    updateMultiplierDisplay() {
        this.multiplierElement.textContent = this.currentMultiplier.toFixed(2) + 'X';
    },

    handleFlightX(multiplier) {
        this.currentMultiplier = parseFloat(multiplier);
        this.updateMultiplierDisplay();
    },

    handleFlightBlast() {
        this.isGameRunning = false;
        this.blinkMultiplier();
        this.stopBackgroundAnimation();
        this.animateBlast();
        setTimeout(() => {
            this.showTimerPanel();
            this.updateCircularTimer(this.totalBettingTime); // Reset timer for next round
        }, 2000);
    },

    blinkMultiplier() {
        this.multiplierElement.classList.add('blinking');
        setTimeout(() => {
            this.multiplierElement.classList.remove('blinking');
        }, 2000);
    },

    stopBackgroundAnimation() {
        if (this.backgroundAnimation) {
            this.backgroundAnimation.kill();
        }
    },

    animateBlast() {
        if (this.flightAnimation) {
            this.flightAnimation.kill();
        }
        
        this.flight.style.backgroundImage = 'url("/public/gameshtml/assets/crash/Blast.png")';
        
        gsap.to(this.flight, {
            opacity: 0,
            duration: 1,
            onComplete: () => {
                setTimeout(() => this.resetGame(), 2000);
            }
        });
    },

    resetGame() {
        this.isGameRunning = false;
        this.currentMultiplier = 1;
        this.updateMultiplierDisplay();
        this.stopBackgroundAnimation();
        gsap.set(this.environment, { x: 0 });
        gsap.set(this.flight, { 
            x: 1, 
            y: "80%", 
            rotation: 0, 
            opacity: 1,
            clearProps: "all"
        });
        this.flight.style.backgroundImage = 'url("/public/gameshtml/assets/crash/Flight.png")';
    },

    updateHistory(winList) {
        if (!this.historyContainer) {
            console.error("History container not found!");
            return;
        }
        
        // If winList is empty or not provided, use the dummy list
        if (!winList || winList.length === 0) {
            winList = ['1X', '2.5X', '1.5X', '1.45X', '5X'];
        }

        this.historyContainer.innerHTML = '';
        winList.forEach((multiplier) => {
            const item = document.createElement('div');
            item.className = 'history-item';
            const multiplierValue = parseFloat(multiplier.replace('X', ''));
            if (isNaN(multiplierValue)) {
                console.error("Invalid multiplier value:", multiplier);
                return;
            }
            item.style.backgroundColor = this.getColorForMultiplier(multiplierValue);
            item.textContent = multiplierValue.toFixed(2) + 'X';
            this.historyContainer.appendChild(item);
        });
    },

    getColorForMultiplier(multiplier) {
        if (multiplier < 1.5) return '#ff4136';
        if (multiplier < 2) return '#ff851b';
        if (multiplier < 3) return '#ffdc00';
        if (multiplier < 5) return '#2ecc40';
        return '#0074d9';
    },

   // Update the handleTimerStart method to always update the history
   handleTimerStart(data) {
    if (typeof data === 'string') {
        this.updateGameState(data, this.totalBettingTime, this.lastWinList, 0);
    } else if (data && typeof data === 'object') {
        const { phase, winList, betting_remaing, round } = data;
        this.lastWinList = winList;
        this.updateGameState(phase, betting_remaing, winList, round);
    }
    this.updateHistory(this.lastWinList);
    this.showTimerPanel();
    this.updateCircularTimer(this.totalBettingTime); // Start with full time
},

handleTimerStop(data) {
    console.log("Event received - Timer stopped:", JSON.stringify(data));
    this.hideTimerPanel();
    this.handleFlightPhase();
},

    handleBettingTick(data) {
        //console.log("Event received - Betting tick:", JSON.stringify(data));
        if (typeof data === 'number') {
            this.updateCircularTimer(data);
        }
    },

    // Update the handleCurrentStatus method to always update the history
    handleCurrentStatus(data) {
        console.log("Event received - Current status:", JSON.stringify(data));
        if (data && typeof data === 'object') {
            const { currentPhase, betting_remaing, winList, round } = data;
            this.updateGameState(currentPhase, betting_remaing, winList, round);
            // Always update history, even if winList is not provided
            this.updateHistory(winList);
        }
    },
};

document.addEventListener('DOMContentLoaded', () => {
    CrashManager.initialize();
});

window.CrashManager = CrashManager;