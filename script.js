// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active or not
let dropMaker; // Will store our timer that creates drops regularly
let gameTimer; // Will store our countdown timer
let timeLeft = 30; // Game duration in seconds
let score = 0; // Track player's score
let highScore = localStorage.getItem('highScore') || 0; // Track high score
let scoreMultiplier = 1; // Score multiplier for combos
let lastScoreTime = 0; // Track timing for combo system
let dropsCollected = 0; // Track total drops for impact calculation
let peopleHelped = 0; // Track number of people helped

// Educational facts and messages
const waterFacts = [
    "1 in 10 people lack access to clean water",
    "Women and girls spend 200 million hours daily collecting water",
    "A child dies every 2 minutes from a water-related disease",
    "2.3 billion people lack basic sanitation services",
    "charity: water has funded 91,414 water projects",
    "Clean water can reduce water-related deaths by 21%",
    "Every $1 invested in clean water yields $4-$12 in economic returns"
];

// Initialize mission overlay
document.getElementById('startMission').addEventListener('click', () => {
    document.getElementById('missionOverlay').style.display = 'none';
    showWaterFact();
});

// Wait for button click to start the game
document.getElementById("start-btn").addEventListener("click", startGame);

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    // Debounce resize events
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        adjustGameContainer();
    }, 250);
});

// Adjust game container size and position
function adjustGameContainer() {
    const gameContainer = document.getElementById("game-container");
    const gameWrapper = document.querySelector(".game-wrapper");
    
    // Update container dimensions
    const computedStyle = window.getComputedStyle(gameContainer);
    const width = computedStyle.width;
    const height = computedStyle.height;
    
    // Adjust any active drops to stay within new boundaries
    const drops = document.querySelectorAll('.water-drop');
    drops.forEach(drop => {
        const dropRect = drop.getBoundingClientRect();
        const containerRect = gameContainer.getBoundingClientRect();
        
        // Keep drops within horizontal bounds
        if (dropRect.right > containerRect.right) {
            drop.style.left = (containerRect.width - dropRect.width) + 'px';
        }
        
        // Optional: adjust fall animation duration based on screen height
        const fallDuration = Math.max(3, Math.min(5, containerRect.height / 200));
        drop.style.animationDuration = fallDuration + 's';
    });
};

function startGame() {
  // Prevent multiple games from running at once
  if (gameRunning) return;

  // Reset game state
  score = 0;
  timeLeft = 30;
  scoreMultiplier = 1;
  lastScoreTime = 0;
  updateScoreDisplay();
  updateTimerDisplay();

  gameRunning = true;

  // Create new drops every second (1000 milliseconds)
  dropMaker = setInterval(createDrop, 1000);

  // Start the countdown timer
  gameTimer = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);

  // Update the game container with a visual effect
  const gameContainer = document.getElementById("game-container");
  gameContainer.classList.add("game-started");
  setTimeout(() => gameContainer.classList.remove("game-started"), 500);
}

function createDrop() {
  // Create a new div element that will be our water drop
  const drop = document.createElement("div");
  drop.className = "water-drop";

  // Make drops different sizes for visual variety
  const baseSize = window.innerWidth <= 480 ? 40 : 60; // Smaller on mobile
  const sizeMultiplier = Math.random() * 0.8 + 0.5;
  const size = baseSize * sizeMultiplier;
  drop.style.width = drop.style.height = `${size}px`;

  // Position the drop randomly across the game width
  // Subtract 60 pixels to keep drops fully inside the container
  const gameWidth = document.getElementById("game-container").offsetWidth;
  const xPosition = Math.random() * (gameWidth - 60);
  drop.style.left = xPosition + "px";

  // Make drops fall for 4 seconds
  drop.style.animationDuration = "4s";

  // Add the new drop to the game screen
  document.getElementById("game-container").appendChild(drop);

  // Remove drops that reach the bottom (weren't clicked)
  drop.addEventListener("animationend", () => {
    drop.remove(); // Clean up drops that weren't caught
    // Reset combo when missing drops
    scoreMultiplier = 1;
  });

  // Make drops clickable for points
  drop.addEventListener("click", () => {
    if (!gameRunning) return;
    
    // Calculate points with combo system
    const basePoints = 5;
    const now = Date.now();
    if (now - lastScoreTime < 1000) { // If clicked within 1 second of last click
      scoreMultiplier = Math.min(scoreMultiplier + 0.5, 3); // Cap at 3x
    } else {
      scoreMultiplier = 1;
    }
    lastScoreTime = now;
    
    const earnedPoints = Math.floor(basePoints * scoreMultiplier);
    score += earnedPoints;
    
    // Visual and audio feedback
    drop.classList.add('caught');
    playScoreSound(scoreMultiplier);
    updateScoreDisplay();
    showFloatingPoints(earnedPoints, drop, scoreMultiplier);
    
    // Remove the drop with a small delay for animation
    setTimeout(() => drop.remove(), 100);
  });
}

function createCollectible() {
  if (!gameRunning) return;

  const collectible = document.createElement("div");
  collectible.className = "collectible";

  // Position randomly on screen
  const gameContainer = document.getElementById("game-container");
  const maxX = gameContainer.offsetWidth - 40;
  const maxY = gameContainer.offsetHeight - 40;
  const xPos = Math.random() * maxX;
  const yPos = Math.random() * maxY;

  collectible.style.left = xPos + "px";
  collectible.style.top = yPos + "px";

  // Make collectible clickable
  collectible.addEventListener("click", () => {
    if (!gameRunning) return;
    score += 10;
    updateScoreDisplay();
    showFloatingPoints(10, collectible);
    collectible.remove();
  });

  gameContainer.appendChild(collectible);

  // Remove collectible after 5 seconds if not clicked
  setTimeout(() => {
    if (collectible.parentNode) {
      collectible.remove();
    }
  }, 5000);
}

function updateScoreDisplay() {
  const scoreElement = document.querySelector(".score");
  if (scoreElement) {
    // Update current score with animation
    scoreElement.classList.add('score-updated');
    scoreElement.innerHTML = `Score: <span class="current-score">${score}</span>`;
    
    // Update high score if needed
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('highScore', highScore);
      showHighScoreAnimation();
    }
    
    // Add multiplier indicator
    if (scoreMultiplier > 1) {
      const multiplierEl = document.createElement('span');
      multiplierEl.className = 'multiplier';
      multiplierEl.textContent = `${scoreMultiplier}x`;
      scoreElement.appendChild(multiplierEl);
    }
    
    // Remove animation class
    setTimeout(() => scoreElement.classList.remove('score-updated'), 300);
  }
}

function showFloatingPoints(points, element, multiplier = 1) {
  const floating = document.createElement("div");
  floating.className = "floating-points";
  
  // Show multiplier if active
  if (multiplier > 1) {
    floating.innerHTML = `+${points} <span class="combo">${multiplier}x!</span>`;
    floating.classList.add('combo-active');
  } else {
    floating.textContent = `+${points}`;
  }

  // Position with slight randomization for visual variety
  const rect = element.getBoundingClientRect();
  const randomX = (Math.random() - 0.5) * 20;
  floating.style.left = `${rect.left + randomX}px`;
  floating.style.top = `${rect.top}px`;

  document.body.appendChild(floating);
  
  // Add entrance animation
  requestAnimationFrame(() => floating.classList.add('float-active'));

  // Remove after animation
  setTimeout(() => {
    floating.classList.add('float-exit');
    setTimeout(() => floating.remove(), 300);
  }, 700);
}

function showHighScoreAnimation() {
  const highScoreAlert = document.createElement('div');
  highScoreAlert.className = 'high-score-alert';
  highScoreAlert.textContent = '🏆 New High Score!';
  document.body.appendChild(highScoreAlert);
  
  setTimeout(() => {
    highScoreAlert.classList.add('show');
    setTimeout(() => {
      highScoreAlert.classList.remove('show');
      setTimeout(() => highScoreAlert.remove(), 300);
    }, 2000);
  }, 10);
}

function playScoreSound(multiplier) {
  // Create different sounds based on multiplier
  const frequency = 440 + (multiplier - 1) * 220;
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gainNode.gain.value = 0.1;
  
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  
  oscillator.start();
  gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
  
  setTimeout(() => {
    oscillator.stop();
    context.close();
  }, 100);
}

function updateTimerDisplay() {
  const timerElement = document.querySelector("#time");
  if (timerElement) {
    timerElement.textContent = timeLeft;
    
    // Add visual feedback for low time
    if (timeLeft <= 5) {
      timerElement.classList.add('time-low');
    } else {
      timerElement.classList.remove('time-low');
    }
  }
}

function endGame() {
    gameRunning = false;
    
    // Clear all intervals
    clearInterval(dropMaker);
    clearInterval(gameTimer);
    
    // Remove all existing drops
    const drops = document.querySelectorAll('.water-drop');
    drops.forEach(drop => drop.remove());
    
    // Calculate impact
    const peopleHelped = Math.floor(score / 10); // Each 10 points = 1 person helped
    
    // Show final score and impact
    const finalScoreMessage = document.createElement('div');
    finalScoreMessage.className = 'game-over-message';
    finalScoreMessage.innerHTML = `
        <h2>Mission Complete!</h2>
        <p>Water Drops Collected: ${score}</p>
        <p class="impact-message">You helped provide clean water to ${peopleHelped} people!</p>
        ${score > highScore ? '<p class="new-high-score">New High Score! 🏆</p>' : ''}
        <p>Previous Best: ${highScore}</p>
        <div class="water-fact">${getRandomWaterFact()}</div>
    `;
    
    document.getElementById('game-container').appendChild(finalScoreMessage);
    
    // Enable the start button
    const startButton = document.getElementById('start-btn');
    startButton.textContent = 'Start New Mission';
    startButton.disabled = false;
}

function showWaterFact() {
    const factOverlay = document.createElement('div');
    factOverlay.className = 'fact-overlay';
    factOverlay.innerHTML = `
        <div class="fact-content">
            <p>${getRandomWaterFact()}</p>
        </div>
    `;
    document.body.appendChild(factOverlay);
    
    setTimeout(() => {
        factOverlay.classList.add('fade-out');
        setTimeout(() => factOverlay.remove(), 500);
    }, 3000);
}

function getRandomWaterFact() {
    return waterFacts[Math.floor(Math.random() * waterFacts.length)];
}

function updateImpactDisplay() {
    const dropsElement = document.getElementById('dropsCollected');
    const peopleElement = document.getElementById('peopleHelped');
    
    dropsCollected = score;
    peopleHelped = Math.floor(score / 10); // Each 10 points = 1 person helped
    
    dropsElement.textContent = dropsCollected;
    peopleElement.textContent = peopleHelped;
    
    // Add celebration effect when reaching new milestones
    if (score % 50 === 0 && score > 0) {
        showMilestoneMessage();
    }
}

function showMilestoneMessage() {
    const milestone = document.createElement('div');
    milestone.className = 'milestone-message';
    milestone.innerHTML = `
        <span class="milestone-icon">🎉</span>
        <p>Amazing! You've helped ${peopleHelped} people get clean water!</p>
    `;
    document.body.appendChild(milestone);
    
    setTimeout(() => {
        milestone.classList.add('fade-out');
        setTimeout(() => milestone.remove(), 500);
    }, 2000);
}
