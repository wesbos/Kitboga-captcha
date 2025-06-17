const container = document.querySelector<HTMLDivElement>('#captcha-container');

let solve = ['a', 'b', 'c', 'd'];
let letters = [...solve, ...'fposaidfamrlwer'.split('')];

interface Reel {
  letter: string;
  i: number;
  element: HTMLDivElement;
  lettersContainer: HTMLDivElement;
  stopped: boolean;
  spawnInterval: number;
}

function getRandomLetter(): string {
  return letters[Math.floor(Math.random() * letters.length)];
}

function getRandomSpeed(): number {
  return Math.random() * 3 + 2; // 2-5 seconds
}

function getRandomDelay(): number {
  return Math.random() * 2000 + 500; // 500-2500ms
}

function start() {
  const reels: Reel[] = solve.map((letter, i) => {
    return {
      letter,
      i,
      element: null as any,
      lettersContainer: null as any,
      stopped: false,
      spawnInterval: 0,
    }
  });

  const html = render(reels);
  container!.innerHTML = html;

  // Get DOM references after rendering
  reels.forEach((reel, i) => {
    reel.element = container!.querySelector(`.reel:nth-child(${i + 1})`) as HTMLDivElement;
    reel.lettersContainer = reel.element.querySelector('.letters') as HTMLDivElement;

    // Add button click handler
    const button = reel.element.querySelector('button') as HTMLButtonElement;
    button.addEventListener('click', () => stopReel(reel));

    // Start spawning letters for this reel
    startLetterSpawning(reel);
  });

  return reels;
}

function createFallingLetter(reel: Reel): HTMLSpanElement {
  const letterElement = document.createElement('span');
  letterElement.className = 'letter falling';
  letterElement.textContent = getRandomLetter();

  // Random speed and delay
  const duration = getRandomSpeed();
  letterElement.style.animationDuration = `${duration}s`;
  letterElement.style.animationDelay = `0s`;

  // Position at top
  letterElement.style.top = '-40px';

  // Remove letter when animation ends
  letterElement.addEventListener('animationend', () => {
    if (letterElement.parentNode) {
      letterElement.remove();
    }
  });

  return letterElement;
}

function startLetterSpawning(reel: Reel) {
  function spawnLetter() {
    if (!reel.stopped) {
      const letter = createFallingLetter(reel);
      reel.lettersContainer.appendChild(letter);
    }

    // Schedule next letter with random delay
    const nextDelay = getRandomDelay();
    reel.spawnInterval = window.setTimeout(spawnLetter, nextDelay);
  }

  // Start spawning
  spawnLetter();
}

function stopReel(reel: Reel) {
  reel.stopped = true;

  // Stop spawning new letters
  clearTimeout(reel.spawnInterval);

  // Pause all falling letters in this reel
  const fallingLetters = reel.lettersContainer.querySelectorAll('.letter.falling');
  fallingLetters.forEach((letter: HTMLElement) => {
    letter.style.animationPlayState = 'paused';
  });

  // Check if any letter is in the hit zone
  const windowElement = reel.element.querySelector('.window') as HTMLDivElement;
  const windowRect = windowElement.getBoundingClientRect();

  let hitLetter = null;
  let hitElement = null;

  fallingLetters.forEach((letter: HTMLElement) => {
    const letterRect = letter.getBoundingClientRect();
    const letterCenter = letterRect.top + letterRect.height / 2;
    const windowCenter = windowRect.top + windowRect.height / 2;

    if (Math.abs(letterCenter - windowCenter) < windowRect.height / 2) {
      hitLetter = letter.textContent;
      hitElement = letter;
      letter.classList.add('hit');
    }
  });

  // Visual feedback
  if (hitLetter === reel.letter) {
    windowElement.style.borderColor = '#00ff00';
    windowElement.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.8)';
  } else {
    windowElement.style.borderColor = '#ff0000';
    windowElement.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.8)';
  }
}

function render(reels: Reel[]) {
  const html = /*html*/`
    <div class="reels">
      ${reels.map(reel => /*html*/`
          <div class="reel">
            <div class="letters">
              <!-- Letters will fall here -->
            </div>
            <div class="window"></div>
            <button>×</button>
          </div>
        `).join('')}
    </div>
  `;

  return html;
}

start();
