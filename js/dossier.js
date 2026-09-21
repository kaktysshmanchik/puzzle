const practicalBastardCard = document.getElementById("practicalBastardCard");

if (practicalBastardCard) {
    const backFace = practicalBastardCard.querySelector(".flip-card-back");

    function togglePracticalBastard() {
        const isFlipped = practicalBastardCard.classList.toggle("flipped");
        practicalBastardCard.setAttribute("aria-pressed", String(isFlipped));
        practicalBastardCard.setAttribute(
            "aria-label",
            isFlipped
                ? "Practical Bastard evidence. Click to return."
                : "Practical Bastard. Click to reveal."
        );

        if (backFace) {
            backFace.setAttribute("aria-hidden", String(!isFlipped));
        }
    }

    practicalBastardCard.addEventListener("click", togglePracticalBastard);

    practicalBastardCard.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            togglePracticalBastard();
        }
    });
}
