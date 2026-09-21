const STORAGE_KEY = "jonathanPuzzleUnlocked";
const rows = document.querySelectorAll(".link-row");

function loadUnlockedSections() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
        return {};
    }
}

function saveUnlockedSections(unlockedSections) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unlockedSections));
}

function resetPuzzleProgress() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
}

window.resetPuzzleProgress = resetPuzzleProgress;

const params = new URLSearchParams(window.location.search);

if (params.get("reset") === "1") {
    localStorage.removeItem(STORAGE_KEY);
    params.delete("reset");

    const cleanQuery = params.toString();
    const cleanUrl =
        window.location.pathname +
        (cleanQuery ? "?" + cleanQuery : "") +
        window.location.hash;

    window.history.replaceState({}, "", cleanUrl);
}

const unlockedSections = loadUnlockedSections();

rows.forEach((row) => {
    const sectionId = row.dataset.section;
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

    function unlock({ save = true } = {}) {
        clearError();

        link.classList.remove("disabled");
        link.classList.add("unlocked");
        link.setAttribute("aria-disabled", "false");

        input.disabled = true;
        verifyButton.disabled = true;

        if (save) {
            unlockedSections[sectionId] = true;
            saveUnlockedSections(unlockedSections);
        }
    }

    function verifyPasscode() {
        if (input.value === correctPasscode) {
            unlock();
            return;
        }

        showError();
    }

    if (unlockedSections[sectionId]) {
        unlock({ save: false });
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
