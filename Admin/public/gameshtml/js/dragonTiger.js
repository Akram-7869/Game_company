const gameManager = {
    currentPhase: '',
    winList: [],

    updateGameState(data) {
        this.currentPhase = data.currentPhase;
        this.updateTimer(data.betting_remaing);
        this.updateWinList(data.winList);
    },

    startBetting(winList) {
        this.currentPhase = 'betting';
        this.updateWinList(winList);
        this.resetCards();
    },

    stopBetting() {
        this.currentPhase = 'pause';
        this.updateTimer(0);
    },

    updateTimer(remainingTime) {
        document.getElementById('time-remaining').textContent = remainingTime;
    },

    placeBet(boxNo, chipNo, amount) {
        const chipImage = `assets/dragonTiger/coins/${amount}_0.png`;
        switch(boxNo) {
            case 1:
                this.animateBetPlaced('dragon-area', chipImage);
                break;
            case 2:
                this.animateBetPlaced('tiger-area', chipImage);
                break;
            case 3:
                this.animateBetPlaced('tie-area', chipImage);
                break;
        }
        this.updateBets();
    },

    showResult(data) {
        console.log('Showing result after delay');
        setTimeout(() => {
            this.revealCards(data.dragonCardIndex, data.tigerCardIndex);
            setTimeout(() => {
                this.showWinner(data.winner);
            }, 2000); 
        }, 1700);
    },

    resetGame() {
        this.resetCards();
    },


    updateWinList(winList) {
        this.winList = winList;
        const historyContainer = document.getElementById('history-container');
        historyContainer.innerHTML = '';
        this.winList.forEach(result => {
            const resultElement = document.createElement('div');
            resultElement.className = 'history-item ' + this.getWinnerClass(result);
            resultElement.textContent = this.getWinnerInitial(result);
            historyContainer.appendChild(resultElement);
        });
    },

    getWinnerClass(winner) {
        switch(winner) {
            case 1: return 'dragon';
            case 2: return 'tiger';
            case 3: return 'tie';
            default: return '';
        }
    },

    getWinnerInitial(winner) {
        switch(winner) {
            case 1: return 'D';
            case 2: return 'T';
            case 3: return 'TIE';
            default: return '';
        }
    },

    animateBetPlaced(areaId, chipImage) {
        const betArea = document.getElementById(areaId);
        const chip = document.createElement('img');
        chip.src = chipImage;
        chip.style.position = 'absolute';
        chip.style.width = '40px';
        chip.style.height = '40px';
        chip.style.left = '50%';
        chip.style.top = '50%';
        chip.style.transform = 'translate(-50%, -50%)';
        chip.style.opacity = '0';
        betArea.appendChild(chip);

        setTimeout(() => {
            chip.style.transition = 'all 0.5s ease-in-out';
            chip.style.opacity = '1';
        }, 50);

        setTimeout(() => {
            chip.style.opacity = '0';
        }, 1000);

        setTimeout(() => {
            betArea.removeChild(chip);
        }, 1500);
    },

    resetCards() {
        const dragonCard = document.getElementById('dragon-card');
        const tigerCard = document.getElementById('tiger-card');
        
        dragonCard.style.transition = 'transform 0.5s';
        tigerCard.style.transition = 'transform 0.5s';
        
        dragonCard.style.transform = 'rotateY(90deg)';
        tigerCard.style.transform = 'rotateY(90deg)';
        
        setTimeout(() => {
            dragonCard.style.backgroundImage = 'url("/public/gameshtml/assets/dragonTiger/cards/CardBack.png")';
            tigerCard.style.backgroundImage = 'url("/public/gameshtml/assets/dragonTiger/cards/CardBack.png")';
            dragonCard.style.transform = 'rotateY(0deg)';
            tigerCard.style.transform = 'rotateY(0deg)';
        }, 250);
    },

    revealCards(dragonCardIndex, tigerCardIndex) {
        this.flipCard('dragon-card', dragonCardIndex);
        setTimeout(() => this.flipCard('tiger-card', tigerCardIndex), 1000);
    },

    flipCard(cardId, cardIndex) {
        const card = document.getElementById(cardId);
        card.style.transition = 'transform 0.5s';
        card.style.transform = 'rotateY(90deg)';
        
        setTimeout(() => {
            card.style.backgroundImage = `url("/public/gameshtml/assets/dragonTiger/cards/${cardIndex}.png")`;
            card.style.transform = 'rotateY(0deg)';  // Changed from 180deg to 0deg
        }, 250);
    },

    showWinner(winner) {
        let winnerText;
        switch(parseInt(winner)) {
            case 1:
                winnerText = 'Dragon Wins!';
                break;
            case 2:
                winnerText = 'Tiger Wins!';
                break;
            case 3:
                winnerText = 'Tie!';
                break;
            default:
                winnerText = 'Unknown Result';
        }

        const winnerElement = document.createElement('div');
        winnerElement.className = 'winner-announcement';
        winnerElement.textContent = winnerText;
        document.getElementById('game-container').appendChild(winnerElement);
        setTimeout(() => winnerElement.remove(), 3000);
    }
};