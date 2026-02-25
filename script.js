const SB_URL = "https://cwpkubbrptqlojzlaerf.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cGt1YmJycHRxbG9qemxhZXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMjg3MDgsImV4cCI6MjA4NzYwNDcwOH0.ZKin927e5VpshLO31mCnWBJJCDOCSa0F7jEsyYq-yhg";
const sb = supabase.createClient(SB_URL, SB_KEY);

let pilot = localStorage.getItem('pilot') || "";
let score = 0;
let currentAns = 0;
let selectedOps = ['+'];
let gameTimer;
let correctQuestions = 0;
let wrongQuestions = 0; 
let totalQuestionsAllowed = 10;
let currentQuestionNum = 1;
let streak = 0;

document.addEventListener('DOMContentLoaded', () => {
    // Sliders
    document.getElementById('speed-slider').oninput = (e) => document.getElementById('speed-val').innerText = e.target.value;
    document.getElementById('q-limit-slider').oninput = (e) => document.getElementById('q-limit-val').innerText = e.target.value;

    if (pilot) showHome();

    // 🐾 FIX: Enter key for the Name Screen (resonates with puppy energy!)
    const nameInp = document.getElementById('name-input');
    if (nameInp) {
        nameInp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveName();
            }
        });
    }

    // 🐾 FIX: Enter key for Gameplay
    const ansInp = document.getElementById('answer-input');
    if (ansInp) {
        ansInp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); 
                checkAnswer();
            }
        });
    }

    // Operators
    document.querySelectorAll('.op-btn').forEach(btn => {
        btn.onclick = () => {
            btn.classList.toggle('active');
            selectedOps = Array.from(document.querySelectorAll('.op-btn.active')).map(b => b.dataset.op);
            if (selectedOps.length === 0) {
                btn.classList.add('active');
                selectedOps = [btn.dataset.op];
            }
        };
    });
});

// 🐾 Animated, Kid-Friendly Voice Tuning
function speak(text) {
    window.speechSynthesis.cancel(); // Stop talking to start the new bark immediately!
    const msg = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    // Look for soft, friendly voices like Google or Samantha
    const friendlyVoice = voices.find(v => 
        v.name.includes('Google US English') || 
        v.name.includes('Samantha') || 
        v.name.toLowerCase().includes('female')
    ) || voices[0];

    if (friendlyVoice) msg.voice = friendlyVoice;

    // "Animated" character settings
    msg.rate = 0.95; 
    msg.volume = 0.9; 

    window.speechSynthesis.speak(msg);
}

// Ensure voices are ready
window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
};

function saveName() {
    const val = document.getElementById('name-input').value;
    if (val.trim()) {
        pilot = val;
        localStorage.setItem('pilot', pilot);
        speak(`Wag wag! Let's go, Best Friend ${pilot}!`);
        showHome();
    }
}

function showHome() {
    document.getElementById('name-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('home-screen').classList.remove('hidden');
    // 🐾 Updated to "Best Friend" theme
    document.getElementById('welcome-msg').innerText = `Welcome, Best Friend ${pilot}!`;
    document.getElementById('hi-score').innerText = localStorage.getItem('hiScore') || 0;
}

function startGame() {
    totalQuestionsAllowed = parseInt(document.getElementById('q-limit-slider').value);
    score = 0;
    correctQuestions = 0;
    wrongQuestions = 0;
    currentQuestionNum = 1;
    streak = 0;

    document.getElementById('correct-count').innerText = 0;
    document.getElementById('wrong-count').innerText = 0;
    document.getElementById('q-current').innerText = 1;
    document.getElementById('q-total').innerText = totalQuestionsAllowed;
    document.getElementById('points').innerText = 0;

    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    genProblem();
}

function genProblem() {
    const op = selectedOps[Math.floor(Math.random() * selectedOps.length)] || '+';
    let n1 = Math.floor(Math.random() * 10);
    let n2 = Math.floor(Math.random() * 10);

    if (op === '-') {
        currentAns = Math.max(n1, n2) - Math.min(n1, n2);
        document.getElementById('n1').innerText = Math.max(n1, n2);
        document.getElementById('n2').innerText = Math.min(n1, n2);
    } else if (op === 'x') {
        n1 = Math.floor(Math.random() * 6);
        n2 = Math.floor(Math.random() * 6);
        currentAns = n1 * n2;
        document.getElementById('n1').innerText = n1;
        document.getElementById('n2').innerText = n2;
    } else if (op === '/') {
        let divisor = Math.floor(Math.random() * 9) + 1;
        currentAns = Math.floor(Math.random() * 10);
        document.getElementById('n1').innerText = currentAns * divisor;
        document.getElementById('n2').innerText = divisor;
    } else {
        currentAns = n1 + n2;
        document.getElementById('n1').innerText = n1;
        document.getElementById('n2').innerText = n2;
    }

    document.getElementById('op-sign').innerText = op === 'x' ? '×' : op;
    const ansInp = document.getElementById('answer-input');
    ansInp.value = "";
    ansInp.disabled = false;
    ansInp.focus(); // 🐾 No overlay bubble, so focus works perfectly!
    startTimer();
}

function startTimer() {
    clearInterval(gameTimer);
    let timeLeft = parseInt(document.getElementById('speed-slider').value);
    const totalTime = timeLeft;
    gameTimer = setInterval(() => {
        timeLeft -= 0.1;
        document.getElementById('timer-bar').style.width = (timeLeft / totalTime) * 100 + "%";
        if (timeLeft <= 0) {
            clearInterval(gameTimer);
            handleResult(false, "Time's up!");
        }
    }, 100);
}

function checkAnswer() {
    const val = parseInt(document.getElementById('answer-input').value);
    handleResult(val === currentAns, val === currentAns ? "Bark! Correct!" : "Oops! Try again!");
}

function handleResult(isCorrect, message) {
    clearInterval(gameTimer);
    document.getElementById('answer-input').disabled = true;

    if (isCorrect) {
        score += 10;
        correctQuestions++;
        streak++;
        document.getElementById('correct-count').innerText = correctQuestions;
        if (streak >= 3) {
            new Audio('https://www.soundjay.com/misc/sounds/magic-chime-01.mp3').play();
            petSay(`SUPER STREAK! ${streak} in a row!`);
            speak("You're a superstar!");
        } else {
            petSay(message);
            speak("Bark! You got it!");
        }
    } else {
        wrongQuestions++;
        streak = 0;
        document.getElementById('wrong-count').innerText = wrongQuestions;
        petSay(message);
        speak("Aww, don't worry! Try another!");
    }
    
    document.getElementById('points').innerText = score;

    if (currentQuestionNum >= totalQuestionsAllowed) {
        setTimeout(() => {
            // 🐾 Alert updated to Best Friend
            alert(`Mission Complete, Best Friend ${pilot}!\n✅ Correct: ${correctQuestions}\n❌ Wrong/Timeout: ${wrongQuestions}`);
            showHome();
        }, 800);
    } else {
        currentQuestionNum++;
        document.getElementById('q-current').innerText = currentQuestionNum;
        setTimeout(genProblem, 1000);
    }
}

// 🐾 Updated to use the status label (non-blocking)
function petSay(msg) {
    const label = document.getElementById('status-label');
    if (!label) return;
    label.innerText = msg;
    
    if (msg.includes("Correct") || msg.includes("STREAK")) {
        label.style.color = "#26de81";
    } else {
        label.style.color = "#FF5E57";
    }

    setTimeout(() => {
        if (label.innerText === msg) {
            label.innerHTML = "&nbsp;"; 
        }
    }, 1500);
}

