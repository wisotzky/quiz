class GermanWordQuiz {
    constructor() {
        this.words = [];
        this.correctMessages = [];
        this.wrongMessages = [];
        this.currentWord = null;
        this.lastWord = null;
        this.isSpinning = false;
        this.spinStartTime = 0;
        this.spinDuration = 0;
        this.initElements();
        this.loadYamlData();
    }
    
    initElements() {
        this.wheelSection = document.getElementById('wheel-section');
        this.quizSection = document.getElementById('quiz-section');
        this.canvas = document.getElementById('wheel');
        this.ctx = this.canvas.getContext('2d');
        this.spinBtn = document.getElementById('spin-btn');
        this.statusMessage = document.getElementById('status-message');
        this.wordDisplay = document.getElementById('word-display');
        this.optionsContainer = document.getElementById('options-container');
        this.feedback = document.getElementById('feedback');
        this.nextBtn = document.getElementById('next-btn');
        
        const container = document.getElementById('wheel-container');
        const size = Math.min(container.offsetWidth, container.offsetHeight);
        this.canvas.width = size;
        this.canvas.height = size;
        
        this.spinBtn.addEventListener('mousedown', () => this.startSpin());
        this.spinBtn.addEventListener('mouseup', () => this.spinWheel());
        this.spinBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.startSpin(); });
        this.spinBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.spinWheel(); });
        
        this.canvas.addEventListener('mousedown', () => { if (!this.isSpinning) this.startSpin(); });
        this.canvas.addEventListener('mouseup', () => { if (!this.isSpinning) this.spinWheel(); });
        this.canvas.addEventListener('touchstart', (e) => { if (!this.isSpinning) { e.preventDefault(); this.startSpin(); } });
        this.canvas.addEventListener('touchend', (e) => { if (!this.isSpinning) { e.preventDefault(); this.spinWheel(); } });
        
        this.nextBtn.addEventListener('click', () => this.showWheel());
    }
    
    startSpin() {
        this.spinStartTime = Date.now();
    }
    
    async loadYamlData() {
        try {
            const response = await fetch('quiz.yaml');
            const yamlText = await response.text();
            const data = jsyaml.load(yamlText);
            
            // Store messages
            this.correctMessages = data.messages?.correctAnswer || [];
            this.wrongMessages = data.messages?.wrongAnswer || [];
            
            // Transform YAML structure to app format
            this.words = Object.entries(data.words || {}).map(([word, wordData]) => ({
                word: word,
                options: [
                    { text: wordData.answer, correct: true },
                    { text: wordData.wrong[0], correct: false },
                    { text: wordData.wrong[1], correct: false }
                ]
            }));
            
            // Update title if provided
            if (data.title) {
                document.title = data.title;
            }
            
            this.loadData();
        } catch (error) {
            console.error('Error loading quiz.yaml:', error);
            this.statusMessage.textContent = '❌ Error loading quiz data';
        }
    }
    
    loadData() {
        this.drawWheel();
        this.statusMessage.textContent = '✨ Ready to play!';
    }
    
    drawWheel() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        const segmentAngle = (2 * Math.PI) / this.words.length;
        
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.words.forEach((wordData, index) => {
            const startAngle = index * segmentAngle;
            const endAngle = startAngle + segmentAngle;
            const colors = ['#1976D2', '#1E88E5', '#42A5F5'];
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = colors[index % colors.length];
            ctx.fill();
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + segmentAngle / 2);
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.font = 'bold 20px Arial';
            ctx.fillText(wordData.word, radius * 0.65, 8);
            ctx.restore();
        });
    }
    
    spinWheel() {
        if (this.isSpinning || this.words.length === 0) return;
        
        // Calculate hold duration (clamped between 100ms and 2000ms)
        this.spinDuration = Math.min(Math.max(Date.now() - this.spinStartTime, 100), 2000);
        
        this.isSpinning = true;
        this.spinBtn.disabled = true;
        this.statusMessage.textContent = '🎰 Spinning...';
        
        let availableWords = this.words.filter(w => this.words.length === 1 || w !== this.lastWord);
        if (availableWords.length === 0) availableWords = this.words;
        
        const selectedWord = availableWords[Math.floor(Math.random() * availableWords.length)];
        const selectedIndex = this.words.indexOf(selectedWord);
        const segmentAngle = 360 / this.words.length;
        
        // Calculate base rotations based on hold duration (3-10 rotations)
        const baseRotations = 3 + Math.floor((this.spinDuration / 2000) * 7);
        
        // Fix: The wheel is drawn starting at 0° (3 o'clock in canvas = right side)
        // Segment 0 center is at: 0 + segmentAngle/2 degrees
        // The pointer is at 12 o'clock (top) = -90° (or 270°) in standard rotation
        // To align selected segment center with pointer at top:
        // We need to rotate so: (selectedIndex * segmentAngle + segmentAngle/2) ends up at -90°
        // Since we're rotating the canvas clockwise, rotation needed is:
        const segmentCenterAngle = selectedIndex * segmentAngle + segmentAngle / 2;
        const targetAngle = -90 - segmentCenterAngle; // Align segment center with top
        const totalRotation = baseRotations * 360 + targetAngle;
        
        this.canvas.style.transform = `rotate(${totalRotation}deg)`;
        
        setTimeout(() => {
            this.currentWord = selectedWord;
            this.lastWord = selectedWord;
            this.isSpinning = false;
            this.spinBtn.disabled = false;
            this.statusMessage.textContent = `🎯 Selected: ${selectedWord.word}`;
            // Increased pause to 2 seconds before showing quiz
            setTimeout(() => this.showQuiz(), 2000);
        }, 4000);
    }
    
    showQuiz() {
        this.wheelSection.classList.remove('active');
        this.quizSection.classList.add('active');
        this.wordDisplay.textContent = this.currentWord.word;
        this.feedback.textContent = '';
        this.nextBtn.style.display = 'none';
        this.optionsContainer.innerHTML = '';
        
        const options = this.shuffleArray([...this.currentWord.options]);
        options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = option.text;
            btn.addEventListener('click', () => this.checkAnswer(option, btn));
            this.optionsContainer.appendChild(btn);
        });
    }
    
    checkAnswer(selectedOption, clickedBtn) {
        const allBtns = document.querySelectorAll('.option-btn');
        allBtns.forEach(btn => btn.classList.add('disabled'));
        
        if (selectedOption.correct) {
            clickedBtn.classList.add('correct');
            const messages = this.correctMessages.length > 0 
                ? this.correctMessages 
                : ['🎉 Wunderbar! Awesome!', '⭐ Fantastisch! You rock!', '🦋 Ausgezeichnet! Perfect!'];
            this.feedback.textContent = messages[Math.floor(Math.random() * messages.length)];
            this.feedback.className = 'correct';
            this.createConfetti();
        } else {
            clickedBtn.classList.add('wrong');
            const messages = this.wrongMessages.length > 0
                ? this.wrongMessages
                : ['😢 Not quite! Try again next time!'];
            this.feedback.textContent = messages[Math.floor(Math.random() * messages.length)];
            this.feedback.className = 'wrong';
            allBtns.forEach(btn => {
                const correctOption = this.currentWord.options.find(o => o.correct && o.text === btn.textContent);
                if (correctOption) setTimeout(() => { btn.classList.add('correct'); btn.style.border = '4px solid #00AA00'; }, 500);
            });
        }
        
        setTimeout(() => { this.nextBtn.style.display = 'inline-block'; }, 1000);
    }
    
    createConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const confettiPieces = [];
        for (let i = 0; i < 150; i++) {
            confettiPieces.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                rotation: Math.random() * 360,
                speed: Math.random() * 3 + 2,
                size: Math.random() * 10 + 5,
                emoji: ['🎉', '⭐', '✨', '🦋', '🌟', '💫'][Math.floor(Math.random() * 6)]
            });
        }
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            confettiPieces.forEach((piece, index) => {
                piece.y += piece.speed;
                piece.rotation += 5;
                ctx.save();
                ctx.translate(piece.x, piece.y);
                ctx.rotate(piece.rotation * Math.PI / 180);
                ctx.font = `${piece.size * 2}px Arial`;
                ctx.fillText(piece.emoji, -piece.size, piece.size);
                ctx.restore();
                if (piece.y > canvas.height) confettiPieces.splice(index, 1);
            });
            if (confettiPieces.length > 0) requestAnimationFrame(animate);
            else ctx.clearRect(0, 0, canvas.width, canvas.height);
        };
        animate();
    }
    
    showWheel() {
        this.quizSection.classList.remove('active');
        this.wheelSection.classList.add('active');
        this.statusMessage.textContent = '✨ Ready for the next round!';
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

document.addEventListener('DOMContentLoaded', () => { new GermanWordQuiz(); });
