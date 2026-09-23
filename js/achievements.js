(() => {
    const game = document.querySelector("[data-latency-game]");
    if (!game) return;

    const PASSCODE = "iYBa2504ieTVfsfOtPVk0eyRRV0";
    const rounds = [
        { speed: 56, targetWidth: 28 },
        { speed: 72, targetWidth: 22 },
        { speed: 88, targetWidth: 16 }
    ];
    const missMessages = [
        "PACKET LOST. Blaming the Atlantic Ocean...",
        "SYNC FAILED. Discord probably did it.",
        "LATENCY SPIKE. Ireland has moved slightly farther away.",
        "SIGNAL MISSED. Geographical bullshit persists."
    ];
    const successMessages = [
        "SIGNAL LOCK: 33% // Voice channel holding.",
        "SIGNAL LOCK: 66% // Shared save located.",
        "SIGNAL LOCK: 100% // Connection stable."
    ];

    const button = game.querySelector("[data-latency-button]");
    const track = game.querySelector("[data-latency-track]");
    const target = game.querySelector("[data-latency-target]");
    const marker = game.querySelector("[data-latency-marker]");
    const message = game.querySelector("[data-latency-message]");
    const progress = game.querySelector("[data-sync-progress]");
    const pill = game.querySelector("[data-connection-pill]");
    const packetLoss = game.querySelector("[data-packet-loss]");
    const sharedSave = game.querySelector("[data-shared-save]");
    const localMultiplayer = game.querySelector("[data-local-multiplayer]");
    const connectionStatus = game.querySelector("[data-connection-status]");
    const ping = game.querySelector("[data-ping]");
    const token = game.querySelector("[data-latency-token]");
    const passcode = game.querySelector("[data-latency-passcode]");

    let state = "idle";
    let round = 0;
    let markerPosition = 4;
    let direction = 1;
    let lastTime = 0;
    let animationFrame = null;
    let missIndex = 0;

    function setRound(index) {
        const config = rounds[index];
        target.style.width = config.targetWidth + "%";
        markerPosition = 4;
        direction = 1;
        marker.style.left = markerPosition + "%";
    }

    function animate(time) {
        if (state !== "running") return;

        if (!lastTime) lastTime = time;
        const deltaSeconds = Math.min((time - lastTime) / 1000, 0.05);
        lastTime = time;

        markerPosition += direction * rounds[round].speed * deltaSeconds;

        if (markerPosition >= 98) {
            markerPosition = 98;
            direction = -1;
        } else if (markerPosition <= 2) {
            markerPosition = 2;
            direction = 1;
        }

        marker.style.left = markerPosition + "%";
        animationFrame = requestAnimationFrame(animate);
    }

    function startAnimation() {
        lastTime = 0;
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(animate);
    }

    function flashResult(className) {
        track.classList.remove("is-hit", "is-miss");
        void track.offsetWidth;
        track.classList.add(className);
        window.setTimeout(() => track.classList.remove(className), 380);
    }

    function startGame() {
        state = "running";
        round = 0;
        setRound(round);
        pill.textContent = "CALIBRATING";
        pill.classList.add("is-live");
        button.textContent = "SYNC SIGNAL";
        message.textContent = "Round 1/3 // Catch the signal inside the target.";
        connectionStatus.textContent = "CALIBRATING";
        startAnimation();
    }

    function completeGame() {
        state = "complete";
        if (animationFrame) cancelAnimationFrame(animationFrame);

        marker.style.left = "50%";
        target.style.width = "16%";
        progress.textContent = "100%";
        pill.textContent = "STABLE";
        pill.classList.remove("is-live");
        pill.classList.add("is-stable");

        ping.textContent = "STILL ABSURD";
        packetLoss.textContent = "0%";
        sharedSave.textContent = "FOUND";
        localMultiplayer.textContent = "PENDING";
        connectionStatus.textContent = "STABLE";

        message.textContent = successMessages[2];
        button.textContent = "CONNECTION CALIBRATED";
        button.disabled = true;

        passcode.textContent = PASSCODE;
        token.hidden = false;
        token.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function attemptSync() {
        if (state === "idle") {
            startGame();
            return;
        }

        if (state !== "running") return;

        const halfWidth = rounds[round].targetWidth / 2;
        const min = 50 - halfWidth;
        const max = 50 + halfWidth;
        const hit = markerPosition >= min && markerPosition <= max;

        if (!hit) {
            flashResult("is-miss");
            message.textContent = missMessages[missIndex % missMessages.length];
            missIndex += 1;
            return;
        }

        flashResult("is-hit");
        round += 1;
        const percentage = Math.round((round / rounds.length) * 100);
        progress.textContent = percentage + "%";
        message.textContent = successMessages[round - 1];

        if (round >= rounds.length) {
            completeGame();
            return;
        }

        state = "pause";
        if (animationFrame) cancelAnimationFrame(animationFrame);
        button.disabled = true;

        if (round === 1) {
            sharedSave.textContent = "SIGNAL FOUND";
        } else if (round === 2) {
            sharedSave.textContent = "FOUND";
            packetLoss.textContent = "CALCULATING...";
        }

        window.setTimeout(() => {
            setRound(round);
            state = "running";
            button.disabled = false;
            message.textContent = "Round " + (round + 1) + "/3 // Signal window narrowed.";
            startAnimation();
        }, 650);
    }

    button.addEventListener("click", attemptSync);

    game.addEventListener("keydown", (event) => {
        if (event.code !== "Space" || event.target === button) return;
        event.preventDefault();
        attemptSync();
    });

    setRound(0);
})();
