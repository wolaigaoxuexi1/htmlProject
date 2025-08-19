/**
 * 游戏主控制器 - 管理游戏的核心逻辑和状态
 */
class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.snake = null;
        this.food = null;
        this.ui = null;
        
        // 游戏状态
        this.state = 'waiting'; // waiting, running, paused, gameOver
        this.score = 0;
        this.gameSpeed = GAME_CONFIG.SPEED.VERY_SLOW;
        this.lastUpdateTime = 0;
        this.gameLoopId = null;
        
        this.init();
    }
    
    /**
     * 初始化游戏
     */
    init() {
        this.initCanvas();
        this.initGameObjects();
        this.initUI();
        this.loadSettings();
        this.drawInitialState();
        
        // 初始化音效
        SoundManager.init();
        
        console.log('🐍 贪吃蛇游戏初始化完成！');
    }
    
    /**
     * 初始化Canvas
     */
    initCanvas() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        if (!this.canvas || !this.ctx) {
            throw new Error('无法获取Canvas元素或上下文');
        }
        
        // 设置Canvas样式
        this.ctx.imageSmoothingEnabled = false;
    }
    
    /**
     * 初始化游戏对象
     */
    initGameObjects() {
        this.snake = new Snake();
        this.food = new Food();
        this.food.generate(this.snake);
    }
    
    /**
     * 初始化UI
     */
    initUI() {
        this.ui = new UIController();
        this.ui.setGameInstance(this);
        this.ui.showStartScreen();
        this.ui.updateButtonStates(this.state);
    }
    
    /**
     * 加载游戏设置
     */
    loadSettings() {
        const settings = Storage.getSettings();
        this.applySettings(settings);
    }
    
    /**
     * 应用游戏设置
     * @param {Object} settings - 设置对象
     */
    applySettings(settings) {
        // 应用难度设置
        const speedKey = settings.difficulty.toUpperCase();
        this.gameSpeed = GAME_CONFIG.SPEED[speedKey] || GAME_CONFIG.SPEED.NORMAL;

        // 应用音效设置
        SoundManager.setEnabled(settings.soundEnabled);

        // 更新UI显示
        this.ui.updateDifficulty(settings.difficulty);
    }
    
    /**
     * 开始游戏
     */
    start() {
        if (this.state === 'waiting' || this.state === 'gameOver') {
            this.reset();
        }
        
        this.state = 'running';
        this.ui.hideOverlay();
        this.ui.updateButtonStates(this.state);
        this.startGameLoop();
    }
    
    /**
     * 暂停/继续游戏
     */
    togglePause() {
        if (this.state === 'running') {
            this.pause();
        } else if (this.state === 'paused') {
            this.resume();
        }
    }
    
    /**
     * 暂停游戏
     */
    pause() {
        if (this.state !== 'running') return;
        
        this.state = 'paused';
        this.stopGameLoop();
        this.ui.showPauseScreen();
        this.ui.updateButtonStates(this.state);
    }
    
    /**
     * 继续游戏
     */
    resume() {
        if (this.state !== 'paused') return;
        
        this.state = 'running';
        this.ui.hideOverlay();
        this.ui.updateButtonStates(this.state);
        this.startGameLoop();
    }
    
    /**
     * 重置游戏
     */
    reset() {
        this.stopGameLoop();
        this.state = 'waiting';
        this.score = 0;
        
        // 重置游戏对象
        this.snake.reset();
        this.food.generate(this.snake);
        
        // 更新UI
        this.ui.updateScore(this.score);
        this.ui.showStartScreen();
        this.ui.updateButtonStates(this.state);
        
        // 重绘游戏
        this.draw();
    }
    
    /**
     * 设置蛇的移动方向
     * @param {Object} direction - 方向对象
     */
    setDirection(direction) {
        if (this.state === 'running') {
            this.snake.setDirection(direction);
        }
    }
    
    /**
     * 开始游戏循环
     */
    startGameLoop() {
        this.lastUpdateTime = performance.now();
        this.gameLoop();
    }
    
    /**
     * 停止游戏循环
     */
    stopGameLoop() {
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
    }
    
    /**
     * 游戏主循环
     * @param {number} currentTime - 当前时间戳
     */
    gameLoop(currentTime = performance.now()) {
        if (this.state !== 'running') return;
        
        const deltaTime = currentTime - this.lastUpdateTime;
        
        if (deltaTime >= this.gameSpeed) {
            this.update();
            this.draw();
            this.lastUpdateTime = currentTime;
        }
        
        this.gameLoopId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    /**
     * 更新游戏状态
     */
    update() {
        // 移动蛇
        this.snake.move();
        
        // 检查食物碰撞
        if (this.food.checkCollision(this.snake)) {
            this.handleFoodCollision();
        }
        
        // 检查游戏结束条件
        if (this.snake.checkCollision()) {
            this.gameOver();
        }
    }
    
    /**
     * 处理食物碰撞
     */
    handleFoodCollision() {
        // 增加分数
        this.score += this.food.getValue();
        this.ui.updateScore(this.score);
        
        // 蛇增长
        this.snake.grow();
        
        // 播放音效
        SoundManager.playEatSound();
        
        // 生成新食物
        this.food.generate(this.snake);
    }
    
    /**
     * 游戏结束
     */
    gameOver() {
        this.state = 'gameOver';
        this.stopGameLoop();
        
        // 播放游戏结束音效
        SoundManager.playGameOverSound();
        
        // 检查并保存最高分
        const isNewRecord = Storage.setHighScore(this.score);
        if (isNewRecord) {
            this.ui.updateHighScore();
            this.ui.showNewRecordAnimation();
        }
        
        // 显示游戏结束界面
        this.ui.showGameOverScreen(this.score, isNewRecord);
        this.ui.updateButtonStates(this.state);
    }
    
    /**
     * 绘制游戏
     */
    draw() {
        this.clearCanvas();
        this.drawGrid();
        this.snake.draw(this.ctx);
        this.food.draw(this.ctx);
    }
    
    /**
     * 绘制初始状态
     */
    drawInitialState() {
        this.draw();
    }
    
    /**
     * 清空画布
     */
    clearCanvas() {
        this.ctx.fillStyle = GAME_CONFIG.COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
    }
    
    /**
     * 绘制网格
     */
    drawGrid() {
        this.ctx.strokeStyle = GAME_CONFIG.COLORS.GRID;
        this.ctx.lineWidth = 1;
        
        // 绘制垂直线
        for (let x = 0; x <= GAME_CONFIG.CANVAS_WIDTH; x += GAME_CONFIG.GRID_SIZE) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, GAME_CONFIG.CANVAS_HEIGHT);
            this.ctx.stroke();
        }
        
        // 绘制水平线
        for (let y = 0; y <= GAME_CONFIG.CANVAS_HEIGHT; y += GAME_CONFIG.GRID_SIZE) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(GAME_CONFIG.CANVAS_WIDTH, y);
            this.ctx.stroke();
        }
    }
    
    /**
     * 获取当前分数
     * @returns {number} 当前分数
     */
    getScore() {
        return this.score;
    }
    
    /**
     * 获取游戏状态
     * @returns {string} 游戏状态
     */
    getState() {
        return this.state;
    }
}

// 游戏实例
let gameInstance = null;

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    try {
        gameInstance = new Game();
    } catch (error) {
        console.error('游戏初始化失败:', error);
        alert('游戏初始化失败，请刷新页面重试。');
    }
});
