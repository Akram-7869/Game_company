class Timer {
    constructor(delay, onTick, callback) {
        this.onTick = typeof onTick === 'function' ? onTick : null; // Optional onTick callback
        this.callback = callback; // Optional final callback
        this.remaining = delay; // Remaining time in seconds
        this.timerId = null; // Reference to the timeout
    }

    // Start the timer countdown
    startTimer() {
        this.countdown();
    }

    // The core countdown method
    countdown() {
        if (this.remaining <= 0) {

            this.callback(); // Execute the final callback

            this.reset(0); // Reset timer to zero when it reaches the end
            return;
        }

        // Set a timeout to count down each second
        this.timerId = setTimeout(() => {
            if (this.onTick) {
                this.onTick(this.remaining); // Execute onTick callback if provided
            }
            this.remaining -= 1; // Decrease the remaining time
            this.countdown(); // Continue the countdown
        }, 1000);
    }

    // Reset the timer to a specified delay
    reset(delay) {
        clearTimeout(this.timerId); // Clear the existing timeout
        this.remaining = delay; // Set the new delay time
    }
}

module.exports = Timer;
