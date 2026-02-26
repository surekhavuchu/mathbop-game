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
    // Sliders setup
    document.getElementById('speed-slider').oninput = (e) => document.getElementById('speed-val').innerText = e.target.value;
    document.getElementById('q-limit-slider').oninput = (e) => document.getElementById('q-limit-val').innerText = e.target.value;

    if (pilot) {
        showHome();
        speak(`Welcome, ${pilot}!`);
    }

    // Name Screen Enter Key
    const nameInp = document.getElementById('name-input');
    if (nameInp) {
        nameInp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveName();
            }
        });
    }

    // 🐾 INSTANT VALIDATION (No Submit Button Needed)
    const ansInp = document.getElementById('answer-input');
    if (ansInp) {
        ansInp.addEventListener('input', (e) => {
            const userVal = e.target.value;
            if (userVal === "") return;

            const targetAnsStr = currentAns.toString();

            // Auto-submit when the length matches the answer
            if (userVal.length >= targetAnsStr.length) {
                checkAnswer();
            }
        });
    }

    // Operators toggle logic
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
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const friendlyVoice = voices.find(v => 
        v.name.includes('Google US English') || 
        v.name.includes('Samantha') || 
        v.name.toLowerCase().includes('female')
    ) || voices[0];

    if (friendlyVoice) msg.voice = friendlyVoice;
    msg.rate = 0.95; 
    msg.volume = 0.9; 
    window.speechSynthesis.speak(msg);
}

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
    document.getElementById('welcome-msg').innerText = `Welcome, ${pilot}!`;
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

    document.getElementById('op-sign').innerText = op === 'x' ? '×' : (op === '/' ? '÷' : op);
    
    const ansInp = document.getElementById('answer-input');
    ansInp.value = "";
    ansInp.readOnly = false; // Unlock instead of enabling
    
    // Focus with a tiny timeout to keep the mobile keyboard up
    setTimeout(() => {
        ansInp.focus();
    }, 10);

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
    const ansInp = document.getElementById('answer-input');
    
    // 🐾 Set to readOnly to keep keyboard active but prevent typing during feedback
    ansInp.readOnly = true; 

    if (isCorrect) {
        score += 10;
        correctQuestions++;
        streak++;
        document.getElementById('correct-count').innerText = correctQuestions;
        petSay(streak >= 3 ? `SUPER STREAK! ${streak}!` : "Bark! Correct!");
    } else {
        ansInp.classList.add('shake');
        setTimeout(() => ansInp.classList.remove('shake'), 400);
        
        wrongQuestions++;
        streak = 0;
        document.getElementById('wrong-count').innerText = wrongQuestions;
        petSay(message);
    }
    
    document.getElementById('points').innerText = score;
    currentQuestionNum++;
    
    if (currentQuestionNum > totalQuestionsAllowed) {
        const performance = correctQuestions / totalQuestionsAllowed;
        let feedback = (performance === 1) ? "Great job! You are a math superstar!" : 
                       (performance >= 0.8) ? "You did amazing!" :
                       (performance >= 0.5) ? "You are almost there. Good job!" :
                       "You worked hard! Let's practice some more together!";
    
        speak(feedback);
        setTimeout(() => {
            alert(`Mission Complete, Best Friend ${pilot}!\n✅ Correct: ${correctQuestions}\n❌ Wrong/Timeout: ${wrongQuestions}\n\n${feedback}`);
            showHome();
        }, 1500);
    } else {
        document.getElementById('q-current').innerText = currentQuestionNum;
        setTimeout(genProblem, 800); // Quick transition for "Speed" math
    }
}

function petSay(msg) {
    const label = document.getElementById('status-label');
    if (!label) return;
    label.innerText = msg;
    label.style.color = (msg.includes("Correct") || msg.includes("STREAK")) ? "#26de81" : "#FF5E57";

    setTimeout(() => {
        if (label.innerText === msg) {
            label.innerHTML = "&nbsp;"; 
        }
    }, 1500);
}
