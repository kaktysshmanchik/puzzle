(()=>{if(!document.querySelector('link[data-site-theme]')){const l=document.createElement('link');l.rel='stylesheet';l.href='css/theme.css';l.dataset.siteTheme='';document.head.appendChild(l);}})();
(() => {
    const STORAGE_KEY = "jonathanStatisticsStateV1";

    function freshState() {
        return {
            answers: {},
            checksumVerified: false,
            checksumValue: ""
        };
    }

    function loadState() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

            if (saved && typeof saved === "object") {
                return {
                    answers: saved.answers && typeof saved.answers === "object" ? saved.answers : {},
                    checksumVerified: Boolean(saved.checksumVerified),
                    checksumValue: typeof saved.checksumValue === "string" ? saved.checksumValue : ""
                };
            }
        } catch (_) {}

        return freshState();
    }

    function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    if (new URLSearchParams(window.location.search).get("reset") === "1") {
        localStorage.removeItem(STORAGE_KEY);
    }

    const state = loadState();
    const questions = document.querySelectorAll("[data-stat-question]");

    questions.forEach((question, index) => {
        const input = question.querySelector(".stat-guess-input");
        const button = question.querySelector(".stat-verify-button");
        const detail = question.querySelector(".stat-detail");
        const questionKey = question.dataset.statId || question.dataset.answer || String(index);

        if (!input || !button) return;

        function renderAnswer(guess) {
            const guessRow = question.querySelector(".stat-guess-row");
            if (!guessRow) return;

            const displayAnswer = question.dataset.displayAnswer || question.dataset.answer || "";
            const result = document.createElement("div");
            result.className = "stat-result";
            result.innerHTML =
                '<span>Correct answer</span>' +
                '<strong></strong>' +
                '<small></small>';

            result.querySelector("strong").textContent = displayAnswer;
            result.querySelector("small").textContent = "Your guess: " + guess;

            guessRow.replaceWith(result);

            if (detail) {
                detail.hidden = false;
            }
        }

        function revealAnswer() {
            const guess = input.value.trim();

            if (!guess) {
                input.focus();
                return;
            }

            state.answers[questionKey] = guess;
            saveState();
            renderAnswer(guess);
        }

        button.addEventListener("click", revealAnswer);

        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                revealAnswer();
            }
        });

        if (Object.prototype.hasOwnProperty.call(state.answers, questionKey)) {
            renderAnswer(String(state.answers[questionKey]));
        }
    });

    const checksumRoot = document.querySelector("[data-stat-checksum]");
    const checksumStatus = document.querySelector("[data-checksum-status]");
    const checksumToken = document.querySelector("[data-checksum-token]");

    if (checksumRoot) {
        const checksumInput = checksumRoot.querySelector(".stat-checksum-input");
        const checksumButton = checksumRoot.querySelector(".stat-checksum-button");
        const expectedChecksum = "15596869604158011";

        function clearChecksumError() {
            checksumInput.classList.remove("invalid");

            if (checksumStatus && checksumToken?.hidden) {
                checksumStatus.textContent = "";
                checksumStatus.classList.remove("is-valid");
            }
        }

        function showChecksumSuccess(value) {
            checksumInput.value = value || expectedChecksum;
            checksumInput.classList.remove("invalid");
            checksumInput.disabled = true;
            checksumButton.disabled = true;

            if (checksumStatus) {
                checksumStatus.textContent = "Checksum accepted. Archive integrity confirmed.";
                checksumStatus.classList.add("is-valid");
            }

            if (checksumToken) {
                checksumToken.hidden = false;
            }
        }

        function verifyChecksum() {
            const digitsOnly = checksumInput.value.replace(/\D/g, "");

            if (!digitsOnly) {
                checksumInput.focus();
                return;
            }

            if (digitsOnly === expectedChecksum) {
                state.checksumVerified = true;
                state.checksumValue = checksumInput.value.trim();
                saveState();
                showChecksumSuccess(state.checksumValue);
                return;
            }

            checksumInput.classList.add("invalid");

            if (checksumStatus) {
                checksumStatus.textContent = "Checksum mismatch.";
                checksumStatus.classList.remove("is-valid");
            }
        }

        checksumButton.addEventListener("click", verifyChecksum);

        checksumInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                verifyChecksum();
            }
        });

        checksumInput.addEventListener("input", clearChecksumError);

        if (state.checksumVerified) {
            showChecksumSuccess(state.checksumValue);
        }
    }

    document.querySelectorAll("[data-message-modal]").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();

            const modal = document.getElementById(link.dataset.messageModal);
            if (modal && typeof modal.showModal === "function") {
                modal.showModal();
            }
        });
    });

    document.querySelectorAll(".stat-message-modal").forEach((modal) => {
        const closeButton = modal.querySelector("[data-close-modal]");

        if (closeButton) {
            closeButton.addEventListener("click", () => modal.close());
        }

        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                modal.close();
            }
        });
    });
})();
