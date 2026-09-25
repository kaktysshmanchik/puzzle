(()=>{if(!document.querySelector('link[data-site-theme]')){const l=document.createElement('link');l.rel='stylesheet';l.href='css/theme.css';l.dataset.siteTheme='';document.head.appendChild(l);}})();
const flipCards = document.querySelectorAll(".flip-card");

flipCards.forEach((card) => {
    const backFace = card.querySelector(".flip-card-back");

    function toggleCard() {
        const isFlipped = card.classList.toggle("flipped");
        card.setAttribute("aria-pressed", String(isFlipped));

        if (backFace) {
            backFace.setAttribute("aria-hidden", String(!isFlipped));
        }
    }

    card.addEventListener("click", toggleCard);

    card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleCard();
        }
    });
});


document.querySelectorAll("[data-audio-player]").forEach((player) => {
    const audio = player.querySelector("audio");
    const toggle = player.querySelector("[data-audio-toggle]");
    const icon = player.querySelector("[data-audio-icon]");
    const progress = player.querySelector("[data-audio-progress]");
    const current = player.querySelector("[data-audio-current]");
    const duration = player.querySelector("[data-audio-duration]");

    if (!audio || !toggle || !icon || !progress || !current || !duration) return;

    const formatTime = (seconds) => {
        if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

        const wholeSeconds = Math.floor(seconds);
        const minutes = Math.floor(wholeSeconds / 60);
        const remainingSeconds = String(wholeSeconds % 60).padStart(2, "0");

        return minutes + ":" + remainingSeconds;
    };

    const updateButton = () => {
        const isPlaying = !audio.paused && !audio.ended;
        icon.textContent = isPlaying ? "❚❚" : "▶";
        toggle.setAttribute("aria-label", isPlaying ? "Pause charisma audio" : "Play charisma audio");
        player.classList.toggle("is-playing", isPlaying);
    };

    const updateProgress = () => {
        const durationSeconds = audio.duration;
        const ratio = Number.isFinite(durationSeconds) && durationSeconds > 0
            ? audio.currentTime / durationSeconds
            : 0;

        progress.value = String(Math.round(ratio * 1000));
        current.textContent = formatTime(audio.currentTime);
        progress.style.setProperty("--audio-progress", (ratio * 100) + "%");
    };

    const updateDuration = () => {
        duration.textContent = formatTime(audio.duration);
        updateProgress();
    };

    toggle.addEventListener("click", () => {
        if (audio.paused || audio.ended) {
            audio.play().catch(() => {});
        } else {
            audio.pause();
        }
    });

    progress.addEventListener("input", () => {
        if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;

        const ratio = Number(progress.value) / 1000;
        audio.currentTime = ratio * audio.duration;
        current.textContent = formatTime(audio.currentTime);
        progress.style.setProperty("--audio-progress", (ratio * 100) + "%");
    });

    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("play", updateButton);
    audio.addEventListener("pause", updateButton);
    audio.addEventListener("ended", () => {
        audio.currentTime = 0;
        updateProgress();
        updateButton();
    });

    updateButton();
    updateProgress();
});
