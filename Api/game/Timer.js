 class Timer  {
    constructor(delay , onTick,callback) {
        this.onTick = onTick; // Callback for each tick
        this.callback = callback;
        this.remaining = delay;
        this.timerId = null;
        this.start = null;
        this.paused = false;
    }

    startTimer() {
        this.start = 0;
         this.countdown();
    }

    countdown() {
        if (this.remaining <= 0) {
            this.callback();
            return;
        }
         this.timerId = setTimeout(() => {
            if (!this.paused) {
                this.onTick(this.remaining);

                this.remaining -= 1;
                this.countdown();
            }
        }, 1000);
    }

    pause() {
        if (!this.paused) {
            this.paused = true;
            clearTimeout(this.timerId);
         //   this.remaining -= Date.now() - this.start;
            console.log( 'Timer paused.');
        }
    }

    reset(delay) {
        clearTimeout(this.timerId);
        this.remaining = delay;
        this.paused = false;
    }

    resume() {
        if (this.paused) {
            this.paused = false;
           // this.start = 0;
            console.log('Timer resumed.');
            this.countdown();
        }
    }
}
module.exports = Timer;
