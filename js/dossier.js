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
