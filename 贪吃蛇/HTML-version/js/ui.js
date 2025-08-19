/**
 * UI控制器 - 管理用户界面交互
 */
class UIController {
    constructor() {
        this.elements = {};
        this.gameInstance = null;
        this.init();
    }
    
    /**
     * 初始化UI控制器
     */
    init() {
        this.bindElements();
        this.bindEvents();
        this.updateHighScore();
        this.loadSettings();
    }
    
    /**
     * 绑定DOM元素
     */
    bindElements() {
        this.elements = {
            // 分数显示
            currentScore: document.getElementById('current-score'),
            highScore: document.getElementById('high-score'),
            difficulty: document.getElementById('difficulty'),
            
            // 游戏覆盖层
            gameOverlay: document.getElementById('game-overlay'),
            overlayTitle: document.getElementById('overlay-title'),
            overlayMessage: document.getElementById('overlay-message'),
            startButton: document.getElementById('start-button'),
            
            // 控制按钮
            startBtn: document.getElementById('start-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            resetBtn: document.getElementById('reset-btn'),
            settingsBtn: document.getElementById('settings-btn'),
            
            // 移动端方向键
            directionBtns: document.querySelectorAll('.direction-btn'),
            
            // 设置面板
            settingsPanel: document.getElementById('settings-panel'),
            difficultySelect: document.getElementById('difficulty-select'),
            soundToggle: document.getElementById('sound-toggle'),
            saveSettings: document.getElementById('save-settings'),
            cancelSettings: document.getElementById('cancel-settings')
        };
    }
    
    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 控制按钮事件
        this.elements.startBtn.addEventListener('click', () => this.handleStart());
        this.elements.pauseBtn.addEventListener('click', () => this.handlePause());
        this.elements.resetBtn.addEventListener('click', () => this.handleReset());
        this.elements.settingsBtn.addEventListener('click', () => this.showSettings());
        this.elements.startButton.addEventListener('click', () => this.handleStart());
        
        // 移动端方向键事件
        this.elements.directionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const direction = e.target.dataset.direction;
                this.handleDirectionInput(direction);
            });
        });
        
        // 设置面板事件
        this.elements.saveSettings.addEventListener('click', () => this.saveSettings());
        this.elements.cancelSettings.addEventListener('click', () => this.hideSettings());
        
        // 点击设置面板外部关闭
        this.elements.settingsPanel.addEventListener('click', (e) => {
            if (e.target === this.elements.settingsPanel) {
                this.hideSettings();
            }
        });
        
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // 防止方向键滚动页面
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });
    }
    
    /**
     * 设置游戏实例引用
     * @param {Game} gameInstance - 游戏实例
     */
    setGameInstance(gameInstance) {
        this.gameInstance = gameInstance;
    }
    
    /**
     * 处理键盘按键
     * @param {KeyboardEvent} event - 键盘事件
     */
    handleKeyPress(event) {
        if (!this.gameInstance) return;
        
        switch (event.code) {
            case 'ArrowUp':
                this.gameInstance.setDirection(GAME_CONFIG.DIRECTIONS.UP);
                break;
            case 'ArrowDown':
                this.gameInstance.setDirection(GAME_CONFIG.DIRECTIONS.DOWN);
                break;
            case 'ArrowLeft':
                this.gameInstance.setDirection(GAME_CONFIG.DIRECTIONS.LEFT);
                break;
            case 'ArrowRight':
                this.gameInstance.setDirection(GAME_CONFIG.DIRECTIONS.RIGHT);
                break;
            case 'Space':
                this.gameInstance.togglePause();
                break;
            case 'KeyR':
                if (event.ctrlKey || event.metaKey) return; // 避免冲突刷新页面
                this.gameInstance.reset();
                break;
        }
    }
    
    /**
     * 处理方向输入
     * @param {string} direction - 方向字符串
     */
    handleDirectionInput(direction) {
        if (!this.gameInstance) return;
        
        const directions = {
            'up': GAME_CONFIG.DIRECTIONS.UP,
            'down': GAME_CONFIG.DIRECTIONS.DOWN,
            'left': GAME_CONFIG.DIRECTIONS.LEFT,
            'right': GAME_CONFIG.DIRECTIONS.RIGHT
        };
        
        if (directions[direction]) {
            this.gameInstance.setDirection(directions[direction]);
        }
    }
    
    /**
     * 处理开始按钮
     */
    handleStart() {
        if (this.gameInstance) {
            this.gameInstance.start();
        }
    }
    
    /**
     * 处理暂停按钮
     */
    handlePause() {
        if (this.gameInstance) {
            this.gameInstance.togglePause();
        }
    }
    
    /**
     * 处理重置按钮
     */
    handleReset() {
        if (this.gameInstance) {
            this.gameInstance.reset();
        }
    }
    
    /**
     * 更新分数显示
     * @param {number} score - 当前分数
     */
    updateScore(score) {
        this.elements.currentScore.textContent = formatScore(score);
    }
    
    /**
     * 更新最高分显示
     */
    updateHighScore() {
        const highScore = Storage.getHighScore();
        this.elements.highScore.textContent = formatScore(highScore);
    }
    
    /**
     * 更新难度显示
     * @param {string} difficulty - 难度级别
     */
    updateDifficulty(difficulty) {
        const difficultyNames = {
            'very_slow': '非常慢',
            'slow': '慢',
            'normal': '普通',
            'fast': '快',
            'very_fast': '非常快'
        };
        this.elements.difficulty.textContent = difficultyNames[difficulty] || '普通';
    }
    
    /**
     * 显示游戏覆盖层
     * @param {string} title - 标题
     * @param {string} message - 消息
     * @param {boolean} showButton - 是否显示按钮
     */
    showOverlay(title, message, showButton = true) {
        this.elements.overlayTitle.textContent = title;
        this.elements.overlayMessage.textContent = message;
        this.elements.startButton.style.display = showButton ? 'block' : 'none';
        this.elements.gameOverlay.classList.remove('hidden');
    }
    
    /**
     * 隐藏游戏覆盖层
     */
    hideOverlay() {
        this.elements.gameOverlay.classList.add('hidden');
    }
    
    /**
     * 显示游戏开始界面
     */
    showStartScreen() {
        this.showOverlay('🐍 贪吃蛇游戏', '按空格键或点击按钮开始游戏', true);
    }
    
    /**
     * 显示游戏暂停界面
     */
    showPauseScreen() {
        this.showOverlay('游戏暂停', '按空格键继续游戏', false);
    }
    
    /**
     * 显示游戏结束界面
     * @param {number} score - 最终分数
     * @param {boolean} isNewRecord - 是否创造新纪录
     */
    showGameOverScreen(score, isNewRecord = false) {
        const title = isNewRecord ? '🎉 新纪录！' : '游戏结束';
        const message = `最终分数: ${formatScore(score)}\n${isNewRecord ? '恭喜创造新纪录！' : '再试一次吧！'}`;
        this.showOverlay(title, message, true);
    }
    
    /**
     * 显示设置面板
     */
    showSettings() {
        this.loadSettings();
        this.elements.settingsPanel.classList.remove('hidden');
    }
    
    /**
     * 隐藏设置面板
     */
    hideSettings() {
        this.elements.settingsPanel.classList.add('hidden');
    }
    
    /**
     * 加载设置
     */
    loadSettings() {
        const settings = Storage.getSettings();
        this.elements.difficultySelect.value = settings.difficulty;
        this.elements.soundToggle.checked = settings.soundEnabled;
        this.updateDifficulty(settings.difficulty);
    }
    
    /**
     * 保存设置
     */
    saveSettings() {
        const settings = {
            difficulty: this.elements.difficultySelect.value,
            soundEnabled: this.elements.soundToggle.checked
        };
        
        Storage.saveSettings(settings);
        SoundManager.setEnabled(settings.soundEnabled);
        this.updateDifficulty(settings.difficulty);
        
        // 如果游戏正在运行，应用新的难度设置
        if (this.gameInstance) {
            this.gameInstance.applySettings(settings);
        }
        
        this.hideSettings();
    }
    
    /**
     * 更新按钮状态
     * @param {string} gameState - 游戏状态
     */
    updateButtonStates(gameState) {
        switch (gameState) {
            case 'waiting':
                this.elements.startBtn.textContent = '开始';
                this.elements.startBtn.disabled = false;
                this.elements.pauseBtn.disabled = true;
                this.elements.resetBtn.disabled = false;
                break;
            case 'running':
                this.elements.startBtn.textContent = '开始';
                this.elements.startBtn.disabled = true;
                this.elements.pauseBtn.textContent = '暂停';
                this.elements.pauseBtn.disabled = false;
                this.elements.resetBtn.disabled = false;
                break;
            case 'paused':
                this.elements.startBtn.disabled = true;
                this.elements.pauseBtn.textContent = '继续';
                this.elements.pauseBtn.disabled = false;
                this.elements.resetBtn.disabled = false;
                break;
            case 'gameOver':
                this.elements.startBtn.textContent = '重新开始';
                this.elements.startBtn.disabled = false;
                this.elements.pauseBtn.disabled = true;
                this.elements.resetBtn.disabled = false;
                break;
        }
    }
    
    /**
     * 显示新纪录动画
     */
    showNewRecordAnimation() {
        // 简单的闪烁效果
        this.elements.highScore.style.animation = 'pulse 1s ease-in-out 3';
        setTimeout(() => {
            this.elements.highScore.style.animation = '';
        }, 3000);
    }
}
