interface CookingItem {
  element: HTMLElement;
  name: string;
  cookTime: number; // seconds needed to cook perfectly
  currentTime: number;
  isOnFire: boolean;
  timer?: number;
  tolerance: number; // +/- seconds tolerance for perfect cooking
  x: number; // Current x position
  y: number; // Current y position
}

class CookingGame {
  private container: HTMLDivElement;
  private gameArea: HTMLElement;
  private fireElement: HTMLElement;
  private items: CookingItem[] = [];
  private gameWon = false;
  private gameFailed = false;
  private gameStarted = false;
  private draggedItem: CookingItem | null = null;
  private dragOffset = { x: 0, y: 0 };
  private proximityCheckTimer?: number; // Timer for continuous proximity checking
  private firePosition: { x: number; y: number } | null = null; // Cache fire position
  private customCursor: HTMLElement | null = null; // Custom cursor element

  constructor() {
    this.container = document.querySelector<HTMLDivElement>('#captcha-container')!;
    this.init();
  }

  private init() {
    this.createGameHTML();
    this.createCookingItems();
    this.setupEventListeners();
    this.calculateFirePosition();
    this.createCustomCursor();
    this.showStartButton();
  }

  private createGameHTML() {
    this.container.innerHTML = `
      <div class="cooking-game">
        <div class="game-area" id="game-area">
          <div class="game-area-inner">
          <div class="preparation-area"></div>
          <div class="fire" id="fire">
            <div class="fire-background"></div>
            <div class="fire-grates"></div>
          </div>
          </div>
        </div>
        <div class="status" id="status"></div>
      </div>
    `;
  }

  private createCookingItems() {
    this.gameArea = document.getElementById('game-area')!;
    this.fireElement = document.getElementById('fire')!;

    const itemConfigs = [
      { name: 'Steak', icon: 'steak', cookTime: 15, tolerance: 0.2 },
      { name: 'Egg', icon: 'egg', cookTime: 2, tolerance: 0.3 },
      { name: 'Chicken', icon: 'chicken', cookTime: 6, tolerance: 1 },
      { name: 'Potato', icon: 'potato', cookTime: 5, tolerance: 0.8 },
      { name: 'Sausage', icon: 'sausage', cookTime: 7, tolerance: 1 },
      { name: 'Naan', icon: 'naan', cookTime: 3, tolerance: 0.5 }
    ];

    // Position items in a single horizontal row across the top
    const itemWidth = 60; // Width including spacing (reduced to fit 6 items)
    const totalWidth = itemConfigs.length * itemWidth;
    const startX = (374 - totalWidth) / 2; // Center the row (374 = 390 - 16px padding)
    const startY = 10; // Top margin

    itemConfigs.forEach((config, index) => {
      const itemElement = document.createElement('div');
      itemElement.className = 'cooking-item';
      itemElement.id = `item-${index}`;
      itemElement.innerHTML = `
        <div class="item-content">
          <div class="item-info">
            <div class="item-times">
              <span class="target-time">${config.cookTime}s</span>
              <span class="current-time">0.0s</span>
            </div>
          </div>
          <div class="asset ${config.icon}"></div>
        </div>
      `;

      const x = startX + (index * itemWidth);
      const y = startY;

      const item: CookingItem = {
        element: itemElement,
        name: config.name,
        cookTime: config.cookTime,
        currentTime: 0,
        isOnFire: false,
        tolerance: config.tolerance,
        x: x,
        y: y
      };

      this.items.push(item);
      this.gameArea.appendChild(itemElement);
      this.positionItem(item, x, y);

      // Add pointer event listeners for dragging
      itemElement.addEventListener('pointerdown', (e) => this.handlePointerDown(e, item));
    });
  }

  private setupEventListeners() {
    document.addEventListener('pointermove', this.handlePointerMove.bind(this));
    document.addEventListener('pointerup', this.handlePointerUp.bind(this));

    // Recalculate fire position if window is resized
    window.addEventListener('resize', () => {
      this.calculateFirePosition();
    });

    // Show/hide custom cursor in game area (only on non-touch devices)
    this.container.addEventListener('pointerenter', (e) => {
      if (this.customCursor && e.pointerType !== 'touch') {
        this.customCursor.style.display = 'block';
      }
    });

    this.container.addEventListener('pointerleave', (e) => {
      if (this.customCursor && e.pointerType !== 'touch') {
        this.customCursor.style.display = 'none';
      }
    });
  }

  private calculateFirePosition() {
    if (!this.fireElement || !this.gameArea) return;

    // Calculate fire position relative to game area once and cache it
    const fireRect = this.fireElement.getBoundingClientRect();
    const gameAreaRect = this.gameArea.getBoundingClientRect();

    this.firePosition = {
      x: fireRect.left + fireRect.width / 2 - gameAreaRect.left,
      y: fireRect.top + fireRect.height / 2 - gameAreaRect.top
    };
  }

  private startProximityChecking() {
    // Clear any existing timer first
    if (this.proximityCheckTimer) {
      clearInterval(this.proximityCheckTimer);
    }

    // Check proximity for all items every 300ms (reduced frequency to prevent flickering)
    this.proximityCheckTimer = window.setInterval(() => {
      this.items.forEach(item => {
        this.checkFireProximity(item);
      });
    }, 300);
  }

  private positionItem(item: CookingItem, x: number, y: number) {
    const gameAreaRect = this.gameArea.getBoundingClientRect();

    // Clamp position within game area bounds - adjusted for smaller container
    const clampedX = Math.max(0, Math.min(gameAreaRect.width - 55, x));
    const clampedY = Math.max(0, Math.min(gameAreaRect.height - 75, y));

    item.x = clampedX;
    item.y = clampedY;

    item.element.style.position = 'absolute';
    item.element.style.left = `${clampedX}px`;
    item.element.style.top = `${clampedY}px`;
    item.element.style.zIndex = '10';
  }

  private checkFireProximity(item: CookingItem) {
    // Don't check proximity if game hasn't started or has failed
    if (!this.gameStarted || this.gameFailed) return;

    // Recalculate fire position each time to ensure accuracy
    this.calculateFirePosition();

    if (!this.firePosition) {
      return;
    }

    // Get fire boundaries instead of just center point
    const fireRect = this.fireElement.getBoundingClientRect();
    const gameAreaRect = this.gameArea.getBoundingClientRect();

    // Fire boundaries relative to game area
    const fireLeft = fireRect.left - gameAreaRect.left;
    const fireRight = fireRect.right - gameAreaRect.left;
    const fireTop = fireRect.top - gameAreaRect.top;
    const fireBottom = fireRect.bottom - gameAreaRect.top;

    // Item boundaries
    const itemLeft = item.x;
    const itemRight = item.x + 50; // item width (reduced from 100)
    const itemTop = item.y;
    const itemBottom = item.y + 70; // item height (reduced from 140)

    // Check if item overlaps with fire area (with some margin for easier cooking)
    const margin = 15; // pixels of overlap needed (reduced from 30)
    const isOverFire = (
      itemRight > fireLeft + margin &&
      itemLeft < fireRight - margin &&
      itemBottom > fireTop + margin &&
      itemTop < fireBottom - margin
    );

    // Use hysteresis for on/off to prevent flickering
    const isOverFireWithHysteresis = item.isOnFire ?
      (itemRight > fireLeft && itemLeft < fireRight && itemBottom > fireTop && itemTop < fireBottom) :
      isOverFire;

    if (isOverFireWithHysteresis && !item.isOnFire) {
      this.startCooking(item);
    } else if (!isOverFireWithHysteresis && item.isOnFire) {
      this.stopCooking(item);
    }
  }

  private handlePointerDown(e: PointerEvent, item: CookingItem) {
    e.preventDefault();

    // Prevent scrolling on touch devices while dragging
    if (e.pointerType === 'touch') {
      document.body.style.touchAction = 'none';
    }

    this.draggedItem = item;

    const itemRect = item.element.getBoundingClientRect();
    const gameAreaRect = this.gameArea.getBoundingClientRect();

    this.dragOffset.x = e.clientX - itemRect.left;
    this.dragOffset.y = e.clientY - itemRect.top;

    item.element.classList.add('dragging');
    item.element.style.zIndex = '1000';

    // Set pointer capture for better mobile support
    item.element.setPointerCapture(e.pointerId);
  }

  private handlePointerMove(e: PointerEvent) {
    // Update custom cursor position (only for mouse, not touch)
    if (this.customCursor && e.pointerType !== 'touch') {
      this.customCursor.style.left = `${e.clientX}px`;
      this.customCursor.style.top = `${e.clientY}px`;
    }

    // Handle item dragging
    if (!this.draggedItem) return;

    e.preventDefault();
    const gameAreaRect = this.gameArea.getBoundingClientRect();

    const newX = e.clientX - gameAreaRect.left - this.dragOffset.x;
    const newY = e.clientY - gameAreaRect.top - this.dragOffset.y;

    this.positionItem(this.draggedItem, newX, newY);
  }

  private handlePointerUp(e: PointerEvent) {
    if (!this.draggedItem) return;

    // Restore scrolling on touch devices
    if (e.pointerType === 'touch') {
      document.body.style.touchAction = 'auto';
    }

    this.draggedItem.element.classList.remove('dragging');
    this.draggedItem.element.style.zIndex = '10';
    this.draggedItem = null;
  }

  private startCooking(item: CookingItem) {
    // Don't start cooking if game hasn't started or has failed
    if (!this.gameStarted || this.gameFailed || item.isOnFire) return;

    item.isOnFire = true;
    item.element.classList.add('cooking');

    // Play sizzle sound when item hits the grill
    const sizzleSound = document.getElementById('sizzle-sound') as HTMLAudioElement;
    if (sizzleSound) {
      sizzleSound.currentTime = 0; // Reset to start for multiple plays
      sizzleSound.play().catch(error => {
        console.log('Could not play sizzle sound:', error);
      });
    }

    // Start timer - this will run continuously every 100ms
    item.timer = window.setInterval(() => {
      item.currentTime += 0.1;
      this.updateTimer(item);
      this.checkCookingStatus(item);
    }, 100);

    this.updateStatus(`Started cooking ${item.name}`);
  }

  private stopCooking(item: CookingItem) {
    if (!item.isOnFire) return;

    item.isOnFire = false;
    item.element.classList.remove('cooking');

    // Check cooking status to determine which sound to play
    const progress = item.currentTime / item.cookTime;
    const timeDiff = Math.abs(item.currentTime - item.cookTime);
    const isPerfectOrDecent = timeDiff <= item.tolerance * 2;
    const isUndercooked = item.currentTime < item.cookTime;

    // Play appropriate sound based on cooking state (check tolerance first!)
    if (isPerfectOrDecent && !isUndercooked) {
      // Play beautiful sound for properly cooked food (within tolerance, not undercooked)
      const beautifulSound = document.getElementById('beautiful-sound') as HTMLAudioElement;
      if (beautifulSound) {
        beautifulSound.currentTime = 0;
        beautifulSound.play().catch(error => {
          console.log('Could not play beautiful sound:', error);
        });
      }
    } else if (isUndercooked) {
      // Play order-up sound for undercooked food
      const orderUpSound = document.getElementById('order-up-sound') as HTMLAudioElement;
      if (orderUpSound) {
        orderUpSound.currentTime = 0;
        orderUpSound.play().catch(error => {
          console.log('Could not play order-up sound:', error);
        });
      }
    } else {
      // Play burned sound for overcooked food (outside tolerance)
      const burnedSound = document.getElementById('burned-sound') as HTMLAudioElement;
      if (burnedSound) {
        burnedSound.currentTime = 0;
        burnedSound.play().catch(error => {
          console.log('Could not play burned sound:', error);
        });
      }
    }

    // Clear timer
    if (item.timer) {
      clearInterval(item.timer);
      item.timer = undefined;
    }

    // Keep the final cooking intensity visual effect
    const cookIntensity = Math.max(0, Math.min(1, (progress - 0.2) / 1.3));

    // Preserve the cooking visual state
    item.element.style.setProperty('--cook-intensity', cookIntensity.toString());

    this.checkWinCondition(item);
  }

  private updateTimer(item: CookingItem) {
    const timerText = item.element.querySelector('.current-time') as HTMLElement;
    timerText.textContent = `${item.currentTime.toFixed(1)}s`;

    // Calculate cooking progress
    const progress = item.currentTime / item.cookTime;

    // Calculate smooth cooking intensity (0 to 1)
    // Start darkening at 20% cooked, reach maximum darkness at 150% cooked
    const cookIntensity = Math.max(0, Math.min(1, (progress - 0.2) / 1.3));

    // Apply smooth cooking visual effect using CSS custom property
    item.element.style.setProperty('--cook-intensity', cookIntensity.toString());

    // Color coding for timer text based on cooking progress
    if (progress < 0.7) {
      timerText.style.color = '#4CAF50'; // Green - safe
    } else if (progress < 1.2) {
      timerText.style.color = '#FF9800'; // Orange - getting close
    } else {
      timerText.style.color = '#f44336'; // Red - overcooked
    }
  }

  private checkCookingStatus(item: CookingItem) {
    const progress = item.currentTime / item.cookTime;

    if (progress > 1.5) {
      // Burnt!
      item.element.classList.add('burnt');

      // Play burned sound when food gets burnt
      const burnedSound = document.getElementById('burned-sound') as HTMLAudioElement;
      if (burnedSound) {
        burnedSound.currentTime = 0; // Reset to start for multiple plays
        burnedSound.play().catch(error => {
          console.log('Could not play burned sound:', error);
        });
      }

      this.stopCooking(item);
      this.updateStatus(`Oh no! ${item.name} is burnt! 🔥💀`);
    }
  }

  private checkWinCondition(item: CookingItem) {
    // Don't check win condition if game has already failed
    if (this.gameFailed) return;

    const timeDiff = Math.abs(item.currentTime - item.cookTime);
    const isPerfect = timeDiff <= item.tolerance;
    const isDecent = timeDiff <= item.tolerance * 2;
    const isBurnt = item.currentTime > item.cookTime * 1.5;

    if (isPerfect) {
      item.element.classList.add('perfect');

      // Replace current time with green checkmark
      const timerText = item.element.querySelector('.current-time') as HTMLElement;
      timerText.textContent = '✓';
      timerText.classList.add('perfect');

      this.updateStatus(`Perfect! ${item.name} cooked to perfection! ✨`);
    } else if (isBurnt) {
      item.element.classList.add('burnt');
      this.updateStatus(`${item.name} is burnt! 🔥💀`);
    } else if (isDecent) {
      item.element.classList.add('decent');
      this.updateStatus(`${item.name} is decent, but not perfect.`);
    } else {
      // More specific feedback about undercooked vs overcooked
      if (item.currentTime < item.cookTime) {
        this.updateStatus(`${item.name} needs more time! Currently ${item.currentTime.toFixed(1)}s, target ${item.cookTime}s`);
      } else {
        this.updateStatus(`${item.name} is overcooked! Currently ${item.currentTime.toFixed(1)}s, target ${item.cookTime}s`);
      }
    }

    // Check if all items have been cooked (moved away from fire at least once)
    let cookedCount = 0;
    let perfectCount = 0;
    let decentCount = 0;
    let burntCount = 0;

    for (let i = 0; i < this.items.length; i++) {
      const cookingItem = this.items[i];
      if (cookingItem.currentTime > 0) {
        cookedCount++;
        if (cookingItem.element.classList.contains('perfect')) {
          perfectCount++;
        } else if (cookingItem.element.classList.contains('decent')) {
          decentCount++;
        } else if (cookingItem.element.classList.contains('burnt')) {
          burntCount++;
        }
      }
    }

    // Check win/lose condition when all items have been cooked
    if (cookedCount === this.items.length && !this.gameWon) {
      this.gameWon = true;

      if (perfectCount === this.items.length) {
        // Perfect success
        this.updateStatus('🎉 PERFECT! All items cooked to perfection! Master Chef! 🎉');
        this.celebrateWin();
      } else if (perfectCount + decentCount === this.items.length) {
        // Good success
        this.updateStatus('🎉 SUCCESS! Good cooking! All items are edible! 🎉');
        this.celebrateWin();
      } else {
        // Failure
        this.handleFailure();
      }
    }
  }

  private updateStatus(message: string, autoClear: boolean = true) {
    // Don't update status if game has failed (to preserve restart button)
    if (this.gameFailed) return;

    const status = document.getElementById('status')!;
    status.textContent = message;

    // Only auto-clear if specified
    if (autoClear) {
      setTimeout(() => {
        if (status.textContent === message && !this.gameFailed) {
          status.textContent = '';
        }
      }, 3000);
    }
  }

  private handleFailure() {
    this.gameFailed = true;

    // Stop all cooking timers
    this.items.forEach(item => {
      if (item.timer) {
        clearInterval(item.timer);
        item.timer = undefined;
      }
      item.isOnFire = false;
      item.element.classList.remove('cooking');
    });

    // Stop proximity checking
    if (this.proximityCheckTimer) {
      clearInterval(this.proximityCheckTimer);
      this.proximityCheckTimer = undefined;
    }

    this.updateStatus('💀 FAILED! Too many items were burnt or ruined!', false);

    // Create restart button
    const restartButton = document.createElement('button');
    restartButton.textContent = 'Try Again';
    restartButton.className = 'restart-button';
    restartButton.addEventListener('click', () => this.restartGame());

    // Add button to status area
    const statusElement = document.getElementById('status')!;
    statusElement.appendChild(document.createElement('br'));
    statusElement.appendChild(restartButton);
  }

  private restartGame() {
    // Reset game state
    this.gameWon = false;
    this.gameFailed = false;
    this.gameStarted = false;

    // Reset all items
    this.items.forEach(item => {
      item.currentTime = 0;
      item.isOnFire = false;
      item.element.className = 'cooking-item';
      item.element.style.setProperty('--cook-intensity', '0');

      // Reset timer display
      const timerText = item.element.querySelector('.current-time') as HTMLElement;
      timerText.textContent = '0.0s';
      timerText.style.color = '#333';
      timerText.classList.remove('perfect');

      // Reset position to original
      this.positionItem(item, item.x, item.y);
    });

    // Clear status area completely (including restart button)
    const statusElement = document.getElementById('status')!;
    statusElement.innerHTML = '';

    // Stop proximity checking
    if (this.proximityCheckTimer) {
      clearInterval(this.proximityCheckTimer);
      this.proximityCheckTimer = undefined;
    }

    // Show start button again
    this.showStartButton();

    // Remove celebration class if it exists
    this.container.classList.remove('celebration');
  }

  private celebrateWin() {
    this.updateStatus('🎉 CONGRATULATIONS! You\'ve mastered the cooking challenge! 🎉');

    // Play beautiful sound for successful completion
    const beautifulSound = document.getElementById('beautiful-sound') as HTMLAudioElement;
    if (beautifulSound) {
      beautifulSound.currentTime = 0;
      beautifulSound.play().catch(error => {
        console.log('Could not play beautiful sound:', error);
      });
    }

    // Add celebration animation
    this.container.classList.add('celebration');

    // Trigger captcha success
    setTimeout(() => {
      window.top.postMessage("success", "*");
    }, 2000);
  }

  private createCustomCursor() {
    this.customCursor = document.createElement('div');
    this.customCursor.className = 'custom-cursor';
    this.customCursor.style.display = 'none';
    document.body.appendChild(this.customCursor);
  }

  private showStartButton() {
    const statusElement = document.getElementById('status')!;
    statusElement.innerHTML = '';

    // Create start instruction
    const instruction = document.createElement('div');
    instruction.textContent = 'Grill the items to perfection!';

    // Create start button
    const startButton = document.createElement('button');
    startButton.textContent = 'Start Cooking';
    startButton.className = 'start-button';
    startButton.addEventListener('click', () => this.startGame());

    statusElement.appendChild(instruction);
    statusElement.appendChild(startButton);
  }

  private startGame() {
    this.gameStarted = true;

    // Clear the status area
    const statusElement = document.getElementById('status')!;
    statusElement.innerHTML = '';

    // Play background music
    const bgMusic = document.getElementById('bg-music') as HTMLAudioElement;
    if (bgMusic) {
      bgMusic.volume = 0.4;
      bgMusic.play().catch(error => {
        console.log('Could not play background music:', error);
      });
    }

    // Start the game
    this.startProximityChecking();
    this.updateStatus('Grill the items to perfection', false);
  }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new CookingGame();
});

// Export for potential use
export default CookingGame;
