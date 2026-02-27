const SB_URL = "https://cwpkubbrptqlojzlaerf.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cGt1YmJycHRxbG9qemxhZXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMjg3MDgsImV4cCI6MjA4NzYwNDcwOH0.ZKin927e5VpshLO31mCnWBJJCDOCSa0F7jEsyYq-yhg";
const sb = supabase.createClient(SB_URL, SB_KEY);

// --- Global Variables & State ---
let pilot = localStorage.getItem('pilot') || "";
let totalCoins = parseInt(localStorage.getItem('totalCoins')) || 0;
let score = 0;
let sessionCoins = 0;
let currentAns = 0;
let selectedOps = ['+'];
let gameTimer;
let correctQuestions = 0;
let wrongQuestions = 0; 
let totalQuestionsAllowed = 10;
let currentQuestionNum = 1;
let streak = 0;
let lastProblemKey = ""; // Prevents immediate repeats

// --- Friendly Reinforcements ---
const cheers = [
    "High five, Pilot!", 
    "You're a math superstar!", 
    "Unstoppable!", 
    "Wag wag! Amazing!", 
    "Look at those coins go!", 
    "You're on fire!",
    "Boom! Correct!", 
    "Calculation Sensation!", 
    "Pure Genius!",
    "Way to go, Best Friend!"
];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Update UI with saved data
    document.getElementById('total-coins').innerText = totalCoins;
    document.getElementById('hi-score').innerText = localStorage.getItem('hiScore') || 0;

    // Slider listener
    const speedSlider = document.getElementById('speed-slider');
    speedSlider.oninput = (e) => {
        document.getElementById('speed-val').innerText = e.target.value + " s";
    };

    if (pilot) {
        showHome();
        speak(`Welcome back, Captain ${pilot}!`);
    }

    // Instant validation for the number input
    const ansInp = document.getElementById('answer-input');
    ansInp.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val === "") return;

        // Auto-check when the user has typed the required number of digits
        if (val.length >= currentAns.toString().length) {
            checkAnswer();
        }
    });

    // Operator Selection Logic
    document.querySelectorAll('.op-btn').forEach(btn => {
        btn.onclick = () => {
            btn.classList.toggle('active');
            selectedOps = Array.from(document.querySelectorAll('.op-btn.active')).map(b => b.dataset.op);
            
            // Ensure at least one operator is always selected
            if (selectedOps.length === 0) {
                btn.classList.add('active');
                selectedOps = [btn.dataset.op];
            }
        };
    });
});

// --- Speech Engine ---
function speak(text) {
    window.speechSynthesis.cancel(); // Stop current speech
    const msg = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    // Attempt to find a warm, high-quality voice
    msg.voice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha')) || voices[0];
    msg.pitch = 1.25; // Energetic and kid-friendly
    msg.rate = 0.95;  // Slightly slower for clear understanding
    window.speechSynthesis.speak(msg);
}

// --- Navigation & Setup ---
function saveName() {
    const val = document.getElementById('name-input').value.trim();
    if (val) {
        pilot = val;
        localStorage.setItem('pilot', pilot);
        speak(`Ready for takeoff, ${pilot}! Let's earn some coins!`);
        showHome();
    }
}

function showHome() {
    document.getElementById('name-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('home-screen').classList.remove('hidden');
    document.getElementById('total-coins').innerText = totalCoins;
    document.getElementById('welcome-msg').innerText = `Welcome, Pilot ${pilot}!`;
}

function startGame() {
    score = 0;
    sessionCoins = 0;
    correctQuestions = 0;
    wrongQuestions = 0;
    currentQuestionNum = 1;
    streak = 0;

    // Reset UI
    document.getElementById('session-coins').innerText = 0;
    document.getElementById('streak-count').innerText = 0;
    document.getElementById('q-current').innerText = 1;
    document.getElementById('points').innerText = 0;
    document.getElementById('status-label').innerHTML = "&nbsp;";

    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    genProblem();
}

// --- Core Game Logic ---
function genProblem() {
    const level = document.getElementById('difficulty-select').value;
    const op = selectedOps[Math.floor(Math.random() * selectedOps.length)];
    let n1, n2, key;

    // Difficulty-based number generation
    do {
        if (level === 'easy') {
            n1 = Math.floor(Math.random() * 10); // 0-9
            n2 = Math.floor(Math.random() * 10);
        } else if (level === 'medium') {
            n1 = Math.floor(Math.random() * 11) + 10; // 10-20
            n2 = Math.floor(Math.random() * 10);
        } else { // Hard (Double Digits)
            n1 = Math.floor(Math.random() * 41) + 10; // 10-50
            n2 = Math.floor(Math.random() * 41) + 10;
        }

        // Logic Tweaks for specific operators
        if (op === '-') {
            if (n1 < n2) [n1, n2] = [n2, n1]; // Avoid negatives
            currentAns = n1 - n2;
        } else if (op === 'x') {
            // Cap multiplication for kindergartner accessibility
            n1 = Math.min(n1, 10); 
            n2 = Math.floor(Math.random() * 6); 
            currentAns = n1 * n2;
        } else if (op === '/') {
            let divisor = Math.floor(Math.random() * 5) + 1;
            currentAns = Math.floor(Math.random() * 6);
            n1 = currentAns * divisor;
            n2 = divisor;
        } else { // Addition
            currentAns = n1 + n2;
        }

        key = `${n1}${op}${n2}`;
    } while (key === lastProblemKey); // Prevent exact repeat

    lastProblemKey = key;

    // Update Display
    document.getElementById('n1').innerText = n1;
    document.getElementById('n2').innerText = n2;
    document.getElementById('op-sign').innerText = op === 'x' ? '×' : (op === '/' ? '÷' : op);
    
    const ansInp = document.getElementById('answer-input');
    ansInp.value = "";
    ansInp.readOnly = false;
    
    setTimeout(() => ansInp.focus(), 20);
    startTimer();
}

function startTimer() {
    clearInterval(gameTimer);
    let duration = parseInt(document.getElementById('speed-slider').value);
    let timeLeft = duration;
    const bar = document.getElementById('timer-bar');

    gameTimer = setInterval(() => {
        timeLeft -= 0.1;
        bar.style.width = (timeLeft / duration) * 100 + "%";
        
        if (timeLeft <= 0) {
            clearInterval(gameTimer);
            handleResult(false, "Time's up! Let's try another!");
        }
    }, 100);
}

function checkAnswer() {
    const val = parseInt(document.getElementById('answer-input').value);
    handleResult(val === currentAns);
}

function handleResult(isCorrect) {
    clearInterval(gameTimer);
    const label = document.getElementById('status-label');
    const input = document.getElementById('answer-input');
    input.readOnly = true;

    if (isCorrect) {
        score += 10;
        correctQuestions++;
        streak++;
        
        // Coin Logic: 5 coins base, +5 more if on a streak
        let earned = 5;
        if (streak >= 3) {
            earned += 5;
            label.innerText = `🔥 STREAK! +${earned} COINS!`;
        } else {
            label.innerText = `💰 +${earned} Coins!`;
        }

        sessionCoins += earned;
        totalCoins += earned;
        localStorage.setItem('totalCoins', totalCoins);
        
        label.style.color = "#26de81";
        label.classList.add('coin-pop');
        
        // Randomly cheer
        speak(cheers[Math.floor(Math.random() * cheers.length)]);
    } else {
        wrongQuestions++;
        streak = 0;
        label.innerText = "Keep trying! You can do it!";
        label.style.color = "#FF5E57";
        input.classList.add('shake');
    }

    // Refresh Stats
    document.getElementById('session-coins').innerText = sessionCoins;
    document.getElementById('streak-count').innerText = streak;
    document.getElementById('points').innerText = score;

    // Delay for feedback before next problem
    setTimeout(() => {
        label.classList.remove('coin-pop');
        input.classList.remove('shake');
        currentQuestionNum++;

        if (currentQuestionNum > totalQuestionsAllowed) {
            endGame();
        } else {
            document.getElementById('q-current').innerText = currentQuestionNum;
            genProblem();
        }
    }, 1200);
}

function endGame() {
    // Save High Score
    const hi = localStorage.getItem('hiScore') || 0;
    if (score > hi) localStorage.setItem('hiScore', score);

    const feedback = `Mission Complete, ${pilot}! You earned ${sessionCoins} coins!`;
    speak(feedback);
    
    // Brief delay to allow the child to see their final score
    setTimeout(() => {
        alert(`${feedback}\nTotal Coins in your Bank: 💰${totalCoins}`);
        showHome();
    }, 500);
}
