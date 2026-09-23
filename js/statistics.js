(() => {
    const questions = document.querySelectorAll("[data-stat-question]");

    questions.forEach((question) => {
        const input = question.querySelector(".stat-guess-input");
        const button = question.querySelector(".stat-verify-button");
        const guessRow = question.querySelector(".stat-guess-row");
        const detail = question.querySelector(".stat-detail");

        if (!input || !button || !guessRow) return;

        function revealAnswer() {
            const guess = input.value.trim();
            if (!guess) {
                input.focus();
                return;
            }

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

        button.addEventListener("click", revealAnswer);

        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                revealAnswer();
            }
        });
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

        function verifyChecksum() {
            const digitsOnly = checksumInput.value.replace(/\D/g, "");

            if (!digitsOnly) {
                checksumInput.focus();
                return;
            }

            if (digitsOnly === expectedChecksum) {
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
