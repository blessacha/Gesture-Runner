const homeScreen = document.getElementById("homeScreen");
const aboutScreen = document.getElementById("aboutScreen");
const gameScreen = document.getElementById("gameScreen");

const startBtn = document.getElementById("startBtn");
const aboutBtn = document.getElementById("aboutBtn");
const aboutBackBtn = document.getElementById("aboutBackBtn");
const aboutStartBtn = document.getElementById("aboutStartBtn");

const toHomeBtn = document.getElementById("toHomeBtn");
const toAboutBtn = document.getElementById("toAboutBtn");

// helper: show one screen
function showScreen(screen) {
  homeScreen.classList.remove("active");
  aboutScreen.classList.remove("active");
  gameScreen.classList.remove("active");
  screen.classList.add("active");
}

// HOME -> GAME
startBtn.addEventListener("click", () => showScreen(gameScreen));

// HOME -> ABOUT
aboutBtn.addEventListener("click", () => showScreen(aboutScreen));

// ABOUT -> HOME
aboutBackBtn.addEventListener("click", () => showScreen(homeScreen));

// ABOUT -> GAME
aboutStartBtn.addEventListener("click", () => showScreen(gameScreen));

// GAME -> HOME
toHomeBtn.addEventListener("click", () => showScreen(homeScreen));

// GAME -> ABOUT
toAboutBtn.addEventListener("click", () => showScreen(aboutScreen));
