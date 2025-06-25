(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
class CookingGame {
  // Custom cursor element
  constructor() {
    this.items = [];
    this.gameWon = false;
    this.gameFailed = false;
    this.gameStarted = false;
    this.draggedItem = null;
    this.dragOffset = { x: 0, y: 0 };
    this.firePosition = null;
    this.customCursor = null;
    this.container = document.querySelector("#captcha-container");
    this.init();
  }
  init() {
    this.createGameHTML();
    this.createCookingItems();
    this.setupEventListeners();
    this.calculateFirePosition();
    this.createCustomCursor();
    this.showStartButton();
  }
  createGameHTML() {
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
  createCookingItems() {
    this.gameArea = document.getElementById("game-area");
    this.fireElement = document.getElementById("fire");
    const itemConfigs = [
      { name: "Steak", icon: "steak", cookTime: 15, tolerance: 0.2 },
      { name: "Egg", icon: "egg", cookTime: 2, tolerance: 0.3 },
      { name: "Chicken", icon: "chicken", cookTime: 6, tolerance: 1 },
      { name: "Potato", icon: "potato", cookTime: 5, tolerance: 0.8 },
      { name: "Sausage", icon: "sausage", cookTime: 7, tolerance: 1 },
      { name: "Naan", icon: "naan", cookTime: 3, tolerance: 0.5 }
    ];
    const itemWidth = 60;
    const totalWidth = itemConfigs.length * itemWidth;
    const startX = (374 - totalWidth) / 2;
    const startY = 10;
    itemConfigs.forEach((config, index) => {
      const itemElement = document.createElement("div");
      itemElement.className = "cooking-item";
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
      const x = startX + index * itemWidth;
      const y = startY;
      const item = {
        element: itemElement,
        name: config.name,
        cookTime: config.cookTime,
        currentTime: 0,
        isOnFire: false,
        tolerance: config.tolerance,
        x,
        y
      };
      this.items.push(item);
      this.gameArea.appendChild(itemElement);
      this.positionItem(item, x, y);
      itemElement.addEventListener("pointerdown", (e) => this.handlePointerDown(e, item));
    });
  }
  setupEventListeners() {
    document.addEventListener("pointermove", this.handlePointerMove.bind(this));
    document.addEventListener("pointerup", this.handlePointerUp.bind(this));
    window.addEventListener("resize", () => {
      this.calculateFirePosition();
    });
    this.container.addEventListener("pointerenter", (e) => {
      if (this.customCursor && e.pointerType !== "touch") {
        this.customCursor.style.display = "block";
      }
    });
    this.container.addEventListener("pointerleave", (e) => {
      if (this.customCursor && e.pointerType !== "touch") {
        this.customCursor.style.display = "none";
      }
    });
  }
  calculateFirePosition() {
    if (!this.fireElement || !this.gameArea) return;
    const fireRect = this.fireElement.getBoundingClientRect();
    const gameAreaRect = this.gameArea.getBoundingClientRect();
    this.firePosition = {
      x: fireRect.left + fireRect.width / 2 - gameAreaRect.left,
      y: fireRect.top + fireRect.height / 2 - gameAreaRect.top
    };
  }
  startProximityChecking() {
    if (this.proximityCheckTimer) {
      clearInterval(this.proximityCheckTimer);
    }
    this.proximityCheckTimer = window.setInterval(() => {
      this.items.forEach((item) => {
        this.checkFireProximity(item);
      });
    }, 300);
  }
  positionItem(item, x, y) {
    const gameAreaRect = this.gameArea.getBoundingClientRect();
    const clampedX = Math.max(0, Math.min(gameAreaRect.width - 55, x));
    const clampedY = Math.max(0, Math.min(gameAreaRect.height - 75, y));
    item.x = clampedX;
    item.y = clampedY;
    item.element.style.position = "absolute";
    item.element.style.left = `${clampedX}px`;
    item.element.style.top = `${clampedY}px`;
    item.element.style.zIndex = "10";
  }
  checkFireProximity(item) {
    if (!this.gameStarted || this.gameFailed) return;
    this.calculateFirePosition();
    if (!this.firePosition) {
      return;
    }
    const fireRect = this.fireElement.getBoundingClientRect();
    const gameAreaRect = this.gameArea.getBoundingClientRect();
    const fireLeft = fireRect.left - gameAreaRect.left;
    const fireRight = fireRect.right - gameAreaRect.left;
    const fireTop = fireRect.top - gameAreaRect.top;
    const fireBottom = fireRect.bottom - gameAreaRect.top;
    const itemLeft = item.x;
    const itemRight = item.x + 50;
    const itemTop = item.y;
    const itemBottom = item.y + 70;
    const margin = 15;
    const isOverFire = itemRight > fireLeft + margin && itemLeft < fireRight - margin && itemBottom > fireTop + margin && itemTop < fireBottom - margin;
    const isOverFireWithHysteresis = item.isOnFire ? itemRight > fireLeft && itemLeft < fireRight && itemBottom > fireTop && itemTop < fireBottom : isOverFire;
    if (isOverFireWithHysteresis && !item.isOnFire) {
      this.startCooking(item);
    } else if (!isOverFireWithHysteresis && item.isOnFire) {
      this.stopCooking(item);
    }
  }
  handlePointerDown(e, item) {
    e.preventDefault();
    if (e.pointerType === "touch") {
      document.body.style.touchAction = "none";
    }
    this.draggedItem = item;
    const itemRect = item.element.getBoundingClientRect();
    this.gameArea.getBoundingClientRect();
    this.dragOffset.x = e.clientX - itemRect.left;
    this.dragOffset.y = e.clientY - itemRect.top;
    item.element.classList.add("dragging");
    item.element.style.zIndex = "1000";
    item.element.setPointerCapture(e.pointerId);
  }
  handlePointerMove(e) {
    if (this.customCursor && e.pointerType !== "touch") {
      this.customCursor.style.left = `${e.clientX}px`;
      this.customCursor.style.top = `${e.clientY}px`;
    }
    if (!this.draggedItem) return;
    e.preventDefault();
    const gameAreaRect = this.gameArea.getBoundingClientRect();
    const newX = e.clientX - gameAreaRect.left - this.dragOffset.x;
    const newY = e.clientY - gameAreaRect.top - this.dragOffset.y;
    this.positionItem(this.draggedItem, newX, newY);
  }
  handlePointerUp(e) {
    if (!this.draggedItem) return;
    if (e.pointerType === "touch") {
      document.body.style.touchAction = "auto";
    }
    this.draggedItem.element.classList.remove("dragging");
    this.draggedItem.element.style.zIndex = "10";
    this.draggedItem = null;
  }
  startCooking(item) {
    if (!this.gameStarted || this.gameFailed || item.isOnFire) return;
    item.isOnFire = true;
    item.element.classList.add("cooking");
    const sizzleSound = document.getElementById("sizzle-sound");
    if (sizzleSound) {
      sizzleSound.currentTime = 0;
      sizzleSound.play().catch((error) => {
        console.log("Could not play sizzle sound:", error);
      });
    }
    item.timer = window.setInterval(() => {
      item.currentTime += 0.1;
      this.updateTimer(item);
      this.checkCookingStatus(item);
    }, 100);
    this.updateStatus(`Started cooking ${item.name}`);
  }
  stopCooking(item) {
    if (!item.isOnFire) return;
    item.isOnFire = false;
    item.element.classList.remove("cooking");
    const progress = item.currentTime / item.cookTime;
    const timeDiff = Math.abs(item.currentTime - item.cookTime);
    const isPerfectOrDecent = timeDiff <= item.tolerance * 2;
    const isUndercooked = item.currentTime < item.cookTime;
    if (isPerfectOrDecent && !isUndercooked) {
      const beautifulSound = document.getElementById("beautiful-sound");
      if (beautifulSound) {
        beautifulSound.currentTime = 0;
        beautifulSound.play().catch((error) => {
          console.log("Could not play beautiful sound:", error);
        });
      }
    } else if (isUndercooked) {
      const orderUpSound = document.getElementById("order-up-sound");
      if (orderUpSound) {
        orderUpSound.currentTime = 0;
        orderUpSound.play().catch((error) => {
          console.log("Could not play order-up sound:", error);
        });
      }
    } else {
      const burnedSound = document.getElementById("burned-sound");
      if (burnedSound) {
        burnedSound.currentTime = 0;
        burnedSound.play().catch((error) => {
          console.log("Could not play burned sound:", error);
        });
      }
    }
    if (item.timer) {
      clearInterval(item.timer);
      item.timer = void 0;
    }
    const cookIntensity = Math.max(0, Math.min(1, (progress - 0.2) / 1.3));
    item.element.style.setProperty("--cook-intensity", cookIntensity.toString());
    this.checkWinCondition(item);
  }
  updateTimer(item) {
    const timerText = item.element.querySelector(".current-time");
    timerText.textContent = `${item.currentTime.toFixed(1)}s`;
    const progress = item.currentTime / item.cookTime;
    const cookIntensity = Math.max(0, Math.min(1, (progress - 0.2) / 1.3));
    item.element.style.setProperty("--cook-intensity", cookIntensity.toString());
    if (progress < 0.7) {
      timerText.style.color = "#4CAF50";
    } else if (progress < 1.2) {
      timerText.style.color = "#FF9800";
    } else {
      timerText.style.color = "#f44336";
    }
  }
  checkCookingStatus(item) {
    const progress = item.currentTime / item.cookTime;
    if (progress > 1.5) {
      item.element.classList.add("burnt");
      const burnedSound = document.getElementById("burned-sound");
      if (burnedSound) {
        burnedSound.currentTime = 0;
        burnedSound.play().catch((error) => {
          console.log("Could not play burned sound:", error);
        });
      }
      this.stopCooking(item);
      this.updateStatus(`Oh no! ${item.name} is burnt! 🔥💀`);
    }
  }
  checkWinCondition(item) {
    if (this.gameFailed) return;
    const timeDiff = Math.abs(item.currentTime - item.cookTime);
    const isPerfect = timeDiff <= item.tolerance;
    const isDecent = timeDiff <= item.tolerance * 2;
    const isBurnt = item.currentTime > item.cookTime * 1.5;
    if (isPerfect) {
      item.element.classList.add("perfect");
      const timerText = item.element.querySelector(".current-time");
      timerText.textContent = "✓";
      timerText.classList.add("perfect");
      this.updateStatus(`Perfect! ${item.name} cooked to perfection! ✨`);
    } else if (isBurnt) {
      item.element.classList.add("burnt");
      this.updateStatus(`${item.name} is burnt! 🔥💀`);
    } else if (isDecent) {
      item.element.classList.add("decent");
      this.updateStatus(`${item.name} is decent, but not perfect.`);
    } else {
      if (item.currentTime < item.cookTime) {
        this.updateStatus(`${item.name} needs more time! Currently ${item.currentTime.toFixed(1)}s, target ${item.cookTime}s`);
      } else {
        this.updateStatus(`${item.name} is overcooked! Currently ${item.currentTime.toFixed(1)}s, target ${item.cookTime}s`);
      }
    }
    let cookedCount = 0;
    let perfectCount = 0;
    let decentCount = 0;
    for (let i = 0; i < this.items.length; i++) {
      const cookingItem = this.items[i];
      if (cookingItem.currentTime > 0) {
        cookedCount++;
        if (cookingItem.element.classList.contains("perfect")) {
          perfectCount++;
        } else if (cookingItem.element.classList.contains("decent")) {
          decentCount++;
        } else if (cookingItem.element.classList.contains("burnt")) ;
      }
    }
    if (cookedCount === this.items.length && !this.gameWon) {
      this.gameWon = true;
      if (perfectCount === this.items.length) {
        this.updateStatus("🎉 PERFECT! All items cooked to perfection! Master Chef! 🎉");
        this.celebrateWin();
      } else if (perfectCount + decentCount === this.items.length) {
        this.updateStatus("🎉 SUCCESS! Good cooking! All items are edible! 🎉");
        this.celebrateWin();
      } else {
        this.handleFailure();
      }
    }
  }
  updateStatus(message, autoClear = true) {
    if (this.gameFailed) return;
    const status = document.getElementById("status");
    status.textContent = message;
    if (autoClear) {
      setTimeout(() => {
        if (status.textContent === message && !this.gameFailed) {
          status.textContent = "";
        }
      }, 3e3);
    }
  }
  handleFailure() {
    this.gameFailed = true;
    this.items.forEach((item) => {
      if (item.timer) {
        clearInterval(item.timer);
        item.timer = void 0;
      }
      item.isOnFire = false;
      item.element.classList.remove("cooking");
    });
    if (this.proximityCheckTimer) {
      clearInterval(this.proximityCheckTimer);
      this.proximityCheckTimer = void 0;
    }
    this.updateStatus("💀 FAILED! Too many items were burnt or ruined!", false);
    const restartButton = document.createElement("button");
    restartButton.textContent = "Try Again";
    restartButton.className = "restart-button";
    restartButton.addEventListener("click", () => this.restartGame());
    const statusElement = document.getElementById("status");
    statusElement.appendChild(document.createElement("br"));
    statusElement.appendChild(restartButton);
  }
  restartGame() {
    this.gameWon = false;
    this.gameFailed = false;
    this.gameStarted = false;
    this.items.forEach((item) => {
      item.currentTime = 0;
      item.isOnFire = false;
      item.element.className = "cooking-item";
      item.element.style.setProperty("--cook-intensity", "0");
      const timerText = item.element.querySelector(".current-time");
      timerText.textContent = "0.0s";
      timerText.style.color = "#333";
      timerText.classList.remove("perfect");
      this.positionItem(item, item.x, item.y);
    });
    const statusElement = document.getElementById("status");
    statusElement.innerHTML = "";
    if (this.proximityCheckTimer) {
      clearInterval(this.proximityCheckTimer);
      this.proximityCheckTimer = void 0;
    }
    this.showStartButton();
    this.container.classList.remove("celebration");
  }
  celebrateWin() {
    this.updateStatus("🎉 CONGRATULATIONS! You've mastered the cooking challenge! 🎉");
    const beautifulSound = document.getElementById("beautiful-sound");
    if (beautifulSound) {
      beautifulSound.currentTime = 0;
      beautifulSound.play().catch((error) => {
        console.log("Could not play beautiful sound:", error);
      });
    }
    this.container.classList.add("celebration");
    setTimeout(() => {
      window.top.postMessage("success", "*");
    }, 2e3);
  }
  createCustomCursor() {
    this.customCursor = document.createElement("div");
    this.customCursor.className = "custom-cursor";
    this.customCursor.style.display = "none";
    document.body.appendChild(this.customCursor);
  }
  showStartButton() {
    const statusElement = document.getElementById("status");
    statusElement.innerHTML = "";
    const instruction = document.createElement("div");
    instruction.textContent = "Grill the items to perfection!";
    const startButton = document.createElement("button");
    startButton.textContent = "Start Cooking";
    startButton.className = "start-button";
    startButton.addEventListener("click", () => this.startGame());
    statusElement.appendChild(instruction);
    statusElement.appendChild(startButton);
  }
  startGame() {
    this.gameStarted = true;
    const statusElement = document.getElementById("status");
    statusElement.innerHTML = "";
    const bgMusic = document.getElementById("bg-music");
    if (bgMusic) {
      bgMusic.volume = 0.4;
      bgMusic.play().catch((error) => {
        console.log("Could not play background music:", error);
      });
    }
    this.startProximityChecking();
    this.updateStatus("Grill the items to perfection", false);
  }
}
document.addEventListener("DOMContentLoaded", () => {
  new CookingGame();
});
