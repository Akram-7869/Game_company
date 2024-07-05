class TambolaGenerator {
    constructor(io,state) {
      this.io=io;
      this.state=state;
    }
  
    // Generate numbers 1 to 90 and shuffle them
    generateNumbers(roomName) {
      this.state[roomName].numbersArray = Array.from({ length: 90 }, (_, i) => i + 1);
      this.shuffle(this.state[roomName].numbersArray);
    }
  
    // Fisher-Yates Shuffle Algorithm
    shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }
  
    // Get a random number from the shuffled list
    drawNumber(roomName) {
      if (this.state[roomName].numbersArray.length === 0) {
        console.log("All numbers have been drawn.");
        return null;
      }
      const number = this.state[roomName].numbersArray.pop();
      this.state[roomName].numbers.add(number);
      return number;
    }
  
    // Display all drawn numbers
    displayDrawnNumbers(roomName) {
      return Array.from(this.state[roomName].numbers).sort((a, b) => a - b);
    }
    emitStartTambola = (roomName) => {
      console.log('Tambola game started');
      this.state[roomName]['intervalId'] = setInterval(() => {
        const number = this.drawNumber();
        if (number === null) {
          this.io.to(roomName).emit('tambolaEnd', { message: 'All numbers have been drawn' });
          clearInterval(this.state[roomName]['intervalId']);
          this.state[roomName]['status'] = 'ended';
          this.state[roomName]['intervalId'] = null;
          
        } else {
          this.io.to(roomName).emit('newNumber', { number: number });
        }
      }, 10000); // Draw a number every second
    };
    handleTambolaStart(roomName, socket){
      
      if (this.state[roomName]['status'] === 'open' || this.state[roomName]['status'] === 'pause') {
        this.io.to(roomName).emit('startTambola', {});
        this.generateNumbers(roomName);
        this.state[roomName]['status'] = 'started';
        console.log('emited----startTambola');
        this.emitStartTambola(roomName);
      }else{
          this.io.to(socket.id).emit('startTambola',{});  // Send event only to the rejoining user
      }
    }
  }
  module.exports = TambolaGenerator;