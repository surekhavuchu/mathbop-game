const SB_URL = "https://cwpkubbrptqlojzlaerf.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cGt1YmJycHRxbG9qemxhZXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMjg3MDgsImV4cCI6MjA4NzYwNDcwOH0.ZKin927e5VpshLO31mCnWBJJCDOCSa0F7jEsyYq-yhg";
const sb = supabase.createClient(SB_URL, SB_KEY);

let pilot = localStorage.getItem('pilot') || "";
let totalCoins = parseInt(localStorage.getItem('totalCoins')) || 0;
let score = 0, sessionCoins = 0, currentAns = 0, streak = 0;
let currentQuestionNum = 1, totalQuestionsAllowed = 10;
let selectedOps = ['+'], gameTimer, gameMode = 'math';
let lastProblemKey = "";

// Define coin properties for CSS generation
const coinsConfig = [
    { name: 'penny', value: 1, img: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/US_One_Cent_Obv.png' },
    { name: 'nickel', value: 5, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Jefferson-Nickel-Unc-Obv.jpg/640px-Jefferson-Nickel-Unc-Obv.jpg' },
    { name: 'dime', value: 10, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/2015-W_proof_Roosevelt_dime_obverse.jpg/640px-2015-W_proof_Roosevelt_dime_obverse.jpg' },
    { name: 'quarter', value: 25, img: 'https://upload.wikimedia.org/wikipedia/commons/4/44/2014_ATB_Quarter_Obv.png' }
];

const cheers = ["High five!", "Math superstar!", "Unstoppable!", "Wag wag!", "Look at those coins!", "Pure Genius!"];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('total-coins').innerText = totalCoins;
    document.getElementById('hi-score').innerText = localStorage.getItem('hiScore') || 0;

    const speedSlider = document.getElementById('speed-slider');
    speedSlider.oninput = (e) => document.getElementById('speed-val').innerText = e.target.value + " s";

    if (pilot) { showHome(); speak(`Welcome back ${pilot}!`); }

    setupInputListener('answer-input', checkMathAnswer);
    setupInputListener('money-input', checkMoneyAnswer);

    document.querySelectorAll('.op-btn').forEach(btn => {
        btn.onclick = () => {
            btn.classList.toggle('active');
            selectedOps = Array.from(document.querySelectorAll('.op-btn.active')).map(b => b.dataset.op);
            if (selectedOps.length === 0) { btn.classList.add('active'); selectedOps = ['+']; }
        };
    });
});

function setupInputListener(id, callback) {
    const el = document.getElementById(id);
    el.addEventListener('input', (e) => {
        if (e.target.value !== "" && e.target.value.length >= currentAns.toString().length) callback();
    });
}

function setMode(mode) {
    gameMode = mode;
    document.getElementById('math-mode-btn').classList.toggle('active', mode === 'math');
    document.getElementById('money-mode-btn').classList.toggle('active', mode === 'money');
    document.getElementById('math-settings').style.display = (mode === 'math') ? 'block' : 'none';
    document.getElementById('money-cheat-sheet').classList.toggle('hidden', mode === 'math');
}

function speak(text) {
    // 1. Stop any current talking
    window.speechSynthesis.cancel(); 

    const msg = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    // 2. Look for the high-quality "Natural" or "Samantha" voices
    // These are the ones that sound like a friendly teacher
    const femaleVoice = voices.find(v => 
        v.name.includes("Google US English") || 
        v.name.includes("Samantha") || 
        v.name.includes("Microsoft Zira") ||
        v.name.includes("Female")
    );

    // 3. Apply the voice if found, otherwise use default
    if (femaleVoice) {
        msg.voice = femaleVoice;
    }

    // 4. Fine-tune for a friendly, clear tone
    msg.pitch = 1.2;  // Slightly higher for a "cheerleader" vibe
    msg.rate = 0.9;   // Just a tiny bit slower so Avi can process the words
    msg.volume = 1;

    window.speechSynthesis.speak(msg);
}

// CRITICAL: This helps the browser "load" the voices so they are ready
window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
};

function saveName() {
    pilot = document.getElementById('name-input').value.trim();
    if (pilot) { localStorage.setItem('pilot', pilot); showHome(); speak(`Ready for takeoff!`); }
}

function showHome() {
    ['name-screen', 'game-screen', 'money-screen'].forEach(s => document.getElementById(s).classList.add('hidden'));
    document.getElementById('home-screen').classList.remove('hidden');
    document.getElementById('total-coins').innerText = totalCoins;
    document.getElementById('welcome-msg').innerText = `Welcome, Pilot ${pilot}!`;
}

function startGame() {
    sessionCoins = 0; currentQuestionNum = 1; streak = 0; score = 0;
    document.getElementById('home-screen').classList.add('hidden');
    
    if (gameMode === 'math') {
        document.getElementById('game-screen').classList.remove('hidden');
        genMathProblem();
    } else {
        document.getElementById('money-screen').classList.remove('hidden');
        genMoneyProblem();
    }
}

// --- Math Logic ---
function genMathProblem() {
    const level = document.getElementById('difficulty-select').value;
    const op = selectedOps[Math.floor(Math.random() * selectedOps.length)];
    let n1, n2, key;
    do {
        n1 = Math.floor(Math.random() * (level==='easy'?10:level==='medium'?20:50));
        n2 = Math.floor(Math.random() * 10);
        if (op === '-') { if (n1 < n2) [n1, n2] = [n2, n1]; currentAns = n1 - n2; }
        else if (op === 'x') { n1 = Math.min(n1, 10); currentAns = n1 * n2; }
        else if (op === '/') { n2 = Math.floor(Math.random()*5)+1; currentAns = Math.floor(Math.random()*6); n1 = currentAns * n2; }
        else currentAns = n1 + n2;
        key = `${n1}${op}${n2}`;
    } while (key === lastProblemKey);
    lastProblemKey = key;
    document.getElementById('n1').innerText = n1; document.getElementById('n2').innerText = n2;
    document.getElementById('op-sign').innerText = op==='x'?'×':op==='/'?'÷':op;
    document.getElementById('answer-input').value = "";
    document.getElementById('answer-input').focus();
    startTimer(gameMode === 'math' ? 'timer-bar' : 'm-timer-bar');
}

function checkMathAnswer() { handleResult(parseInt(document.getElementById('answer-input').value) === currentAns); }

// --- Money Logic ---
function genMoneyProblem() {
    const display = document.getElementById('money-display');
    display.innerHTML = "";
    let totalCents = 0;
    
    // Generates 2 or 3 coins for kindergartners
    const count = Math.floor(Math.random() * 2) + 1; 
    
    for (let i = 0; i < count; i++) {
        const coinData = coinsConfig[Math.floor(Math.random() * coinsConfig.length)];
        totalCents += coinData.value;
        
        // 1. Create a container for the coin + its label
        const coinWrapper = document.createElement('div');
        coinWrapper.className = "coin-wrapper";
        
        // 2. Create the Image
        const coinImg = document.createElement('img');
        coinImg.src = coinData.img;
        coinImg.className = `real-coin ${coinData.name}`;
        
        // 3. Create the Label (the number underneath)
        const coinLabel = document.createElement('div');
        coinLabel.className = "coin-value-label";
        coinLabel.innerText = coinData.name;
        
        // Hover/Click to speak
        const speakVal = () => speak(`${coinData.value} cents`);
        coinWrapper.onmouseenter = speakVal;
        coinWrapper.onclick = speakVal;
        
        // 4. Put them together
        coinWrapper.appendChild(coinImg);
        coinWrapper.appendChild(coinLabel);
        display.appendChild(coinWrapper);
    }
    
    currentAns = totalCents;
    document.getElementById('money-input').value = "";
    document.getElementById('money-input').focus();
    startTimer('m-timer-bar');
}

function checkMoneyAnswer() { handleResult(parseInt(document.getElementById('money-input').value) === currentAns); }

// --- Universal Helpers ---
function startTimer(barId) {
    clearInterval(gameTimer);
    let dur = parseInt(document.getElementById('speed-slider').value), time = dur;
    gameTimer = setInterval(() => {
        time -= 0.1; document.getElementById(barId).style.width = (time/dur)*100+"%";
        if (time <= 0) { clearInterval(gameTimer); handleResult(false); }
    }, 100);
}

function handleResult(isCorrect) {
    clearInterval(gameTimer);
    const label = gameMode==='math' ? document.getElementById('status-label') : document.getElementById('money-status');
    if (isCorrect) {
        let earn = 5 + (streak >= 3 ? 5 : 0); streak++; sessionCoins += earn; totalCoins += earn;
        localStorage.setItem('totalCoins', totalCoins);
        label.innerText = `💰 +${earn} Coins!`; label.style.color = "#26de81";
        speak(cheers[Math.floor(Math.random()*cheers.length)]);
    } else {
        streak = 0; label.innerText = "Try again!"; label.style.color = "#FF5E57";
    }
    updateUI();
    setTimeout(() => {
        currentQuestionNum++;
        if (currentQuestionNum > totalQuestionsAllowed) endGame();
        else gameMode==='math' ? genMathProblem() : genMoneyProblem();
    }, 1200);
}

function updateUI() {
    if (gameMode==='math') {
        document.getElementById('session-coins').innerText = sessionCoins;
        document.getElementById('q-current').innerText = currentQuestionNum;
        document.getElementById('streak-count').innerText = streak;
    } else {
        document.getElementById('m-session-coins').innerText = sessionCoins;
        document.getElementById('m-q-current').innerText = currentQuestionNum;
    }
}

function endGame() {
    speak(`Mission Complete! You earned ${sessionCoins} coins!`);
    alert(`Mission Complete! Total Coins: ${totalCoins}`);
    showHome();
}

function goToHome() { clearInterval(gameTimer); showHome(); }
