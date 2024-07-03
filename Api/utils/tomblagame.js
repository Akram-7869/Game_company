class TambolaGenerator {
    constructor() {
      this.numbers = new Set();
      this.generateNumbers();
    }
  
    // Generate numbers 1 to 90 and shuffle them
    generateNumbers() {
      this.numbersArray = Array.from({ length: 90 }, (_, i) => i + 1);
      this.shuffle(this.numbersArray);
    }
  
    // Fisher-Yates Shuffle Algorithm
    shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }
  
    // Get a random number from the shuffled list
    drawNumber() {
      if (this.numbersArray.length === 0) {
        console.log("All numbers have been drawn.");
        return null;
      }
      const number = this.numbersArray.pop();
      this.numbers.add(number);
      return number;
    }
  
    // Display all drawn numbers
    displayDrawnNumbers() {
      return Array.from(this.numbers).sort((a, b) => a - b);
    }
  }
  module.exports = TambolaGenerator;