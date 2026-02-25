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

    // Keydown Listener (Instant One-Tap Enter)
    const ansInp = document.getElementById('answer-input');
    ansInp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            checkAnswer();
        }
    });

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

function speak(text) {
    const msg = new SpeechSynthesisUtterance(text);
    
    // 🐾 Get all available voices
    const voices = window.speechSynthesis.getVoices();
    
    // 🐾 Try to find a soft, friendly-sounding voice
    // We look for "Google" voices or "female" in the name as they are often gentler
    const friendlyVoice = voices.find(v => v.name.includes('Google US English') || v.name.toLowerCase().includes('female')) || voices[0];
    
    if (friendlyVoice) {
        msg.voice = friendlyVoice;
    }

    // 🐾 Tuning for a "Kid-Friendly" sound
    msg.pitch = 1.4;  // Higher pitch sounds more like a friendly character
    msg.rate = 0.9;   // Slightly slower is easier for kids to follow
    msg.volume = 0.8; // Not too loud!

    window.speechSynthesis.speak(msg);
}

// 🐾 This ensures voices are loaded before the first bark
window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
};

function saveName() {
    const val = document.getElementById('name-input').value;
    if (val.trim()) {
        pilot = val;
        localStorage.setItem('pilot', pilot);
        speak(`Woof! Let's go Pilot ${pilot}!`);
        showHome();
    }
}

function showHome() {
    document.getElementById('name-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('home-screen').classList.remove('hidden');
    document.getElementById('welcome-msg').innerText = `Welcome, Pilot ${pilot}!`;
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
    ansInp.focus();
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
    handleResult(val === currentAns, val === currentAns ? "Bark! Correct!" : "Oops! Wrong!");
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
            petSay(`STREAK! ${streak} in a row!`);
        } else {
            petSay(message);
        }
    } else {
        wrongQuestions++;
        streak = 0;
        document.getElementById('wrong-count').innerText = wrongQuestions;
        petSay(message);
    }
    
    document.getElementById('points').innerText = score;

    if (currentQuestionNum >= totalQuestionsAllowed) {
        setTimeout(() => {
            alert(`Mission Complete, Pilot ${pilot}!\n✅ Correct: ${correctQuestions}\n❌ Wrong/Timeout: ${wrongQuestions}`);
            showHome();
        }, 800);
    } else {
        currentQuestionNum++;
        document.getElementById('q-current').innerText = currentQuestionNum;
        setTimeout(genProblem, 1000);
    }
}

function petSay(msg) {
    const label = document.getElementById('status-label');
    label.innerText = msg;
    
    // 🐾 Change color based on the message
    if (msg.includes("Correct") || msg.includes("STREAK")) {
        label.style.color = "#26de81"; // Success Green
    } else {
        label.style.color = "#FF5E57"; // Alert Red
    }

    // Clear the label after a short delay so the deck is clean for the next question
    setTimeout(() => {
        if (label.innerText === msg) {
            label.innerHTML = "&nbsp;"; 
        }
    }, 1500);

}
