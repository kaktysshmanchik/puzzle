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
