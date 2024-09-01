class Timer {
    constructor(delay, onTick, callback) {
        this.onTick = onTick; // Callback for each tick
        this.callback = callback;
        this.remaining = delay;
        this.delay = delay;

        this.timerId = undefined;
         this.paused = false;
    }

    startTimer() {
        
        this.countdown();
    }

    countdown() {
        if (this.remaining <= 0) {
            if (this.onTick) this.onTick(this.remaining);

            this.callback();
            this.reset();
            return;
        }
        this.timerId = setTimeout(() => {
            if (!this.paused) {
               
    if (this.onTick) this.onTick(this.remaining);

                this.remaining -= 1;
                this.countdown();
            }
        }, 1000);
    }

    pause() {
        if (!this.paused) {
            this.paused = true;
            clearTimeout(this.timerId);
             console.log('Timer paused.');
        }
    }

    reset(delay) {
        clearTimeout(this.timerId);
        this.remaining =  delay || this.delay;
        this.paused = false;
    }

    resume() {
        if (this.paused) {
            this.paused = false;
             console.log('Timer resumed.');
            this.countdown();
        }
    }
}
module.exports = Timer;
