function profileCountdown(callback, ...args) {
    const start = performance.now();
    callback(...args);
    const end = performance.now();
    console.log(`Execution time for ${callback.name}: ${end - start} milliseconds`);
}

// Countdown using setInterval
function countdownWithInterval(seconds) {
    let remaining = seconds;
    const intervalId = setInterval(() => {
        if (remaining <= 0) {
            clearInterval(intervalId);
            console.log('Countdown with interval complete!');
        } else {
            console.log(`Interval - Time remaining: ${remaining} seconds`);
            remaining--;
        }
    }, 1000);
}

// Sleep function using Promises
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Recursive countdown with sleep
async function countdownWithSleep(seconds) {
    if (seconds < 0) {
        console.log('Countdown with sleep complete!');
        return;
    }

    console.log(`Sleep - Time remaining: ${seconds} seconds`);
    await sleep(1000);
    countdownWithSleep(seconds - 1);
}

// Recursive countdown without sleep
function countdownRecursive(seconds) {
    if (seconds < 0) {
        console.log('Recursive countdown complete!');
        return;
    }

    console.log(`Recursive - Time remaining: ${seconds} seconds`);
    setTimeout(() => countdownRecursive(seconds - 1), 1000);
}

// Profile each countdown
profileCountdown(countdownWithInterval, 10);
profileCountdown(() => countdownWithSleep(10), 10);
profileCountdown(() => countdownRecursive(10), 10);
