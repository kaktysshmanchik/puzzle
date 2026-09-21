const rows = document.querySelectorAll(".link-row");

rows.forEach((row) => {
    const correctPasscode = row.dataset.passcode;
    const input = row.querySelector(".passcode-input");
    const verifyButton = row.querySelector(".verify-button");
    const link = row.querySelector(".section-link");
    const tooltip = row.querySelector(".tooltip");

    let errorTimer = null;

    function clearError() {
        input.classList.remove("invalid");
        tooltip.classList.remove("visible");
    }

    function showError() {
        if (errorTimer !== null) {
            clearTimeout(errorTimer);
        }

        input.classList.add("invalid");
        tooltip.classList.add("visible");

        errorTimer = window.setTimeout(() => {
            clearError();
            errorTimer = null;
        }, 3000);
    }

    function unlock() {
        clearError();

        link.classList.remove("disabled");
        link.classList.add("unlocked");
        link.setAttribute("aria-disabled", "false");
        link.setAttribute("href", "#");

        input.disabled = true;
        verifyButton.disabled = true;
    }

    function verifyPasscode() {
        if (input.value === correctPasscode) {
            unlock();
            return;
        }

        showError();
    }

    verifyButton.addEventListener("click", verifyPasscode);

    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            verifyPasscode();
        }
    });

    input.addEventListener("input", clearError);

    link.addEventListener("click", (event) => {
        if (!link.classList.contains("unlocked")) {
            event.preventDefault();
        }
    });
});
