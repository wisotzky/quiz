class GermanWordQuiz {
    constructor() {
        this.allWords = []; // All words from YAML
        this.words = []; // Current 18 words on wheel
        this.answeredWords = new Set(); // Track answered words
        this.recentlyAnswered = []; // Track last 5 correctly answered words
        this.correctMessages = [];
        this.wrongMessages = [];
        this.currentWord = null;
        this.lastWord = null;
        this.isSpinning = false;
        this.spinBtn = null;
        this.spinStartTime = 0;
        this.spinDuration = 0;
        this.initElements();
        this.loadYamlData();
    }
    
    initElements() {
        this.startSection = document.getElementById('start-section');
        this.container = document.getElementById('container');
        this.wheelSection = document.getElementById('wheel-section');
        this.sayItSection = document.getElementById('say-it-section');
        this.guessItSection = document.getElementById('guess-it-section');
        this.canvas = document.getElementById('wheel');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.startBtn = document.getElementById('start-btn');
        this.spinBtn = document.getElementById('spin-btn');
        this.continueBtn = document.getElementById('continue-btn');
        this.wordDisplay = document.getElementById('word-display');
        this.wordDisplayQuiz = document.getElementById('word-display-quiz');
        this.optionsContainer = document.getElementById('options-container');
        this.nextBtn = document.getElementById('next-btn');
        
        // Canvas initialization will be done when wheel section is shown
        if (this.canvas) {
            const container = document.getElementById('wheel-container');
            if (container && container.offsetWidth > 0) {
                const size = Math.min(container.offsetWidth, container.offsetHeight);
                this.canvas.width = size;
                this.canvas.height = size;
            }
        }
        
        this.startBtn.addEventListener('click', () => {
            console.log('Start button clicked');
            try {
                this.showWheel();
            } catch (error) {
                console.error('Error in showWheel:', error);
            }
        });
        
        this.spinBtn.addEventListener('mousedown', () => this.startSpin());
        this.spinBtn.addEventListener('mouseup', () => this.spinWheel());
        this.spinBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.startSpin(); });
        this.spinBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.spinWheel(); });
        
        if (this.canvas) {
            this.canvas.addEventListener('mousedown', () => { if (!this.isSpinning) this.startSpin(); });
            this.canvas.addEventListener('mouseup', () => { if (!this.isSpinning) this.spinWheel(); });
            this.canvas.addEventListener('touchstart', (e) => { if (!this.isSpinning) { e.preventDefault(); this.startSpin(); } });
            this.canvas.addEventListener('touchend', (e) => { if (!this.isSpinning) { e.preventDefault(); this.spinWheel(); } });
        }
        
        this.continueBtn.addEventListener('click', () => this.showQuiz());
        this.nextBtn.addEventListener('click', () => this.showWheel());
    }
    
    startSpin() {
        this.spinStartTime = Date.now();
    }
    
    async loadYamlData() {
        try {
            const response = await fetch('quiz.yaml');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const yamlText = await response.text();
            const data = jsyaml.load(yamlText);
            
            // Store messages
            this.correctMessages = data.messages?.correctAnswer || [];
            this.wrongMessages = data.messages?.wrongAnswer || [];
            
            // Transform YAML structure to app format
            this.allWords = Object.entries(data.words || {}).map(([word, wordData]) => ({
                word: word,
                options: [
                    { text: wordData.answer, correct: true },
                    { text: wordData.wrong[0], correct: false },
                    { text: wordData.wrong[1], correct: false }
                ]
            }));
            
            // Validate word count (need 18 on wheel + 5 recently answered + at least 1 spare)
            const MIN_WORDS = 24;
            if (this.allWords.length < MIN_WORDS) {
                this.updateMessageArea(`❌ Not enough words! Need at least ${MIN_WORDS} words (found ${this.allWords.length})`);
                console.error(`Quiz requires at least ${MIN_WORDS} words, but only ${this.allWords.length} found in quiz.yaml`);
                return;
            }
            
            // Select random 18 words for initial wheel
            this.selectRandomWords();
            
            // Update title if provided
            if (data.title) {
                document.title = data.title;
            }
            
            this.loadData();
        } catch (error) {
            console.error('Error loading quiz.yaml:', error);
            this.updateMessageArea('⚠️ Could not load quiz.yaml - using placeholder data for preview');
            setTimeout(() => this.loadPlaceholderData(), 2000);
        }
    }
    
    loadPlaceholderData() {
        // Generate placeholder data for local preview/testing
        console.log('Loading placeholder data for preview...');
        
        this.correctMessages = [
            '🎉 Wunderbar! Awesome!',
            '⭐ Fantastisch! You rock!',
            '🦋 Ausgezeichnet! Perfect!'
        ];
        
        this.wrongMessages = [
            '😢 Not quite! Try again next time!'
        ];
        
        // Create 28 placeholder German words
        const placeholderWords = [
            { word: 'Hund', answer: 'dog', wrong: ['cat', 'bird'] },
            { word: 'Katze', answer: 'cat', wrong: ['dog', 'mouse'] },
            { word: 'Haus', answer: 'house', wrong: ['car', 'tree'] },
            { word: 'Baum', answer: 'tree', wrong: ['flower', 'grass'] },
            { word: 'Buch', answer: 'book', wrong: ['pen', 'paper'] },
            { word: 'Tisch', answer: 'table', wrong: ['chair', 'desk'] },
            { word: 'Stuhl', answer: 'chair', wrong: ['table', 'bench'] },
            { word: 'Wasser', answer: 'water', wrong: ['juice', 'milk'] },
            { word: 'Brot', answer: 'bread', wrong: ['cake', 'cookie'] },
            { word: 'Apfel', answer: 'apple', wrong: ['banana', 'orange'] },
            { word: 'Auto', answer: 'car', wrong: ['bus', 'bike'] },
            { word: 'Blume', answer: 'flower', wrong: ['tree', 'grass'] },
            { word: 'Sonne', answer: 'sun', wrong: ['moon', 'star'] },
            { word: 'Mond', answer: 'moon', wrong: ['sun', 'star'] },
            { word: 'Stern', answer: 'star', wrong: ['sun', 'moon'] },
            { word: 'Fenster', answer: 'window', wrong: ['door', 'wall'] },
            { word: 'Tür', answer: 'door', wrong: ['window', 'gate'] },
            { word: 'Schule', answer: 'school', wrong: ['house', 'office'] },
            { word: 'Lehrer', answer: 'teacher', wrong: ['student', 'principal'] },
            { word: 'Kind', answer: 'child', wrong: ['adult', 'baby'] },
            { word: 'Mutter', answer: 'mother', wrong: ['father', 'sister'] },
            { word: 'Vater', answer: 'father', wrong: ['mother', 'brother'] },
            { word: 'Bruder', answer: 'brother', wrong: ['sister', 'cousin'] },
            { word: 'Schwester', answer: 'sister', wrong: ['brother', 'cousin'] },
            { word: 'Freund', answer: 'friend', wrong: ['enemy', 'stranger'] },
            { word: 'Stadt', answer: 'city', wrong: ['town', 'village'] },
            { word: 'Land', answer: 'country', wrong: ['city', 'ocean'] },
            { word: 'Meer', answer: 'sea', wrong: ['lake', 'river'] }
        ];
        
        this.allWords = placeholderWords.map(item => ({
            word: item.word,
            options: [
                { text: item.answer, correct: true },
                { text: item.wrong[0], correct: false },
                { text: item.wrong[1], correct: false }
            ]
        }));
        
        this.selectRandomWords();
        this.loadData();
    }
    
    selectRandomWords() {
        // Shuffle all words and select exactly 18 for the wheel
        const shuffled = this.shuffleArray([...this.allWords]);
        this.words = shuffled.slice(0, 18);
    }
    
    replaceAnsweredWord(answeredWord) {
        // Add to recently answered list (keep last 5)
        this.recentlyAnswered.push(answeredWord.word);
        if (this.recentlyAnswered.length > 5) {
            this.recentlyAnswered.shift(); // Remove oldest
        }
        
        // Find words not currently on wheel, not answered, and not recently answered
        const availableWords = this.allWords.filter(w => 
            !this.words.includes(w) && 
            !this.answeredWords.has(w.word) &&
            !this.recentlyAnswered.includes(w.word)
        );
        
        if (availableWords.length > 0) {
            // Replace the answered word with a random available word
            const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
            const index = this.words.findIndex(w => w.word === answeredWord.word);
            if (index !== -1) {
                this.words[index] = randomWord;
                this.drawWheel(); // Redraw wheel with new word
            }
        }
    }
    
    loadData() {
        // Ensure canvas is properly sized before first draw
        if (this.canvas) {
            const container = document.getElementById('wheel-container');
            if (container) {
                const size = Math.min(container.offsetWidth, container.offsetHeight);
                if (size > 0) {
                    this.canvas.width = size;
                    this.canvas.height = size;
                }
            }
        }
        this.drawWheel();
    }
    
    updateMessageArea(text) {
        const messageAreas = document.querySelectorAll('#message-area');
        messageAreas.forEach(area => area.textContent = text);
    }
    
    drawWheel() {
        if (!this.ctx || !this.canvas) {
            console.warn('Canvas not ready for drawing');
            return;
        }
        
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        const segmentAngle = (2 * Math.PI) / this.words.length;
        
        // Dynamic font size based on canvas size and screen size
        // Mobile and iPad specific sizing
        const isMobile = window.innerWidth <= 767 && window.matchMedia('(orientation: portrait)').matches;
        const isIPad = window.innerWidth >= 768 && window.innerWidth <= 1024 
                       && window.innerHeight >= 1024 && window.innerHeight <= 1366;
        const baseFontSize = isMobile ? 11 : (isIPad ? 16 : 20);
        const fontSize = Math.max(10, Math.min(baseFontSize, radius / 15));
        
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
            ctx.font = `bold ${fontSize}px Arial`;
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
        this.updateMessageArea('🎰 Spinning...');
        
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
        let totalRotation = baseRotations * 360 + targetAngle;
        
        // Ensure rotation is always positive (clockwise)
        while (totalRotation < 0) {
            totalRotation += 360;
        }
        
        this.canvas.style.transform = `rotate(${totalRotation}deg)`;
        
        setTimeout(() => {
            this.currentWord = selectedWord;
            this.lastWord = selectedWord;
            this.isSpinning = false;
            this.updateMessageArea(`🎯 Selected: ${selectedWord.word}`);
            // Pause before showing pronounce step - keep button disabled
            setTimeout(() => {
                this.spinBtn.disabled = false;
                this.showPronounce();
            }, 2000);
        }, 4000);
    }
    
    showPronounce() {
        this.wheelSection.classList.add('hidden');
        this.sayItSection.classList.remove('hidden');
        this.guessItSection.classList.add('hidden');
        
        this.wordDisplay.textContent = this.currentWord.word;
        
        this.spinBtn.style.display = 'none';
        this.continueBtn.style.display = 'inline-block';
        this.nextBtn.style.display = 'none';
        
        this.updateMessageArea("Take your time and have fun! There's no right or wrong way!");
    }
    
    showQuiz() {
        this.wheelSection.classList.add('hidden');
        this.sayItSection.classList.add('hidden');
        this.guessItSection.classList.remove('hidden');
        
        this.wordDisplayQuiz.textContent = this.currentWord.word;
        
        this.spinBtn.style.display = 'none';
        this.continueBtn.style.display = 'none';
        this.nextBtn.style.display = 'none';
        
        this.updateMessageArea('');
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
            this.updateMessageArea(messages[Math.floor(Math.random() * messages.length)]);
            this.createConfetti();
            
            // Mark word as answered and replace on wheel
            this.answeredWords.add(this.currentWord.word);
            this.replaceAnsweredWord(this.currentWord);
        } else {
            clickedBtn.classList.add('wrong');
            const messages = this.wrongMessages.length > 0
                ? this.wrongMessages
                : ['😢 Not quite! Try again next time!'];
            this.updateMessageArea(messages[Math.floor(Math.random() * messages.length)]);
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
        console.log('showWheel called');
        console.log('Elements:', {
            startSection: this.startSection,
            container: this.container,
            wheelSection: this.wheelSection
        });
        
        this.startSection.classList.remove('active');
        this.startSection.classList.add('hidden');
        this.container.classList.remove('hidden');
        
        this.wheelSection.classList.remove('hidden');
        this.sayItSection.classList.add('hidden');
        this.guessItSection.classList.add('hidden');
        
        this.spinBtn.style.display = 'inline-block';
        this.continueBtn.style.display = 'none';
        this.nextBtn.style.display = 'none';
        
        // Ensure canvas is properly sized when wheel section becomes visible
        setTimeout(() => {
            const container = document.getElementById('wheel-container');
            const size = Math.min(container.offsetWidth, container.offsetHeight);
            if (size > 0) {
                this.canvas.width = size;
                this.canvas.height = size;
                this.drawWheel(); // Redraw with correct size
            }
        }, 100);
        
        this.updateMessageArea('✨ Ready for the next round!');
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
