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
})();
