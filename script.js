const openButton = document.getElementById("openButton");
const secretText = document.getElementById("secretText");

openButton.addEventListener("click", function () {
    secretText.classList.remove("hidden");
    openButton.style.display = "none";
});