/**
 * 工具函数库
 * 包含游戏中使用的通用工具函数
 */

// 游戏配置常量
const GAME_CONFIG = {
    GRID_SIZE: 20,           // 网格大小
    CANVAS_WIDTH: 600,       // 画布宽度
    CANVAS_HEIGHT: 400,      // 画布高度
    INITIAL_SNAKE_LENGTH: 3, // 初始蛇长度
    
    // 游戏速度配置（5档速度）
    SPEED: {
        VERY_SLOW: 250,  // 非常慢
        SLOW: 180,       // 慢
        NORMAL: 120,     // 普通
        FAST: 80,        // 快
        VERY_FAST: 50    // 非常快
    },
    
    // 颜色配置
    COLORS: {
        SNAKE_HEAD: '#2D5A27',
        SNAKE_BODY: '#4CAF50',
        FOOD: '#FF5722',
        GRID: '#E8F5E8',
        BACKGROUND: '#F0F8F0'
    },
    
    // 方向常量
    DIRECTIONS: {
        UP: { x: 0, y: -1 },
        DOWN: { x: 0, y: 1 },
        LEFT: { x: -1, y: 0 },
        RIGHT: { x: 1, y: 0 }
    }
};

/**
 * 生成指定范围内的随机整数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机整数
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成网格坐标内的随机位置
 * @returns {Object} 包含x和y坐标的对象
 */
function getRandomGridPosition() {
    const maxX = Math.floor(GAME_CONFIG.CANVAS_WIDTH / GAME_CONFIG.GRID_SIZE) - 1;
    const maxY = Math.floor(GAME_CONFIG.CANVAS_HEIGHT / GAME_CONFIG.GRID_SIZE) - 1;
    
    return {
        x: getRandomInt(0, maxX),
        y: getRandomInt(0, maxY)
    };
}

/**
 * 检查两个位置是否相同
 * @param {Object} pos1 - 位置1
 * @param {Object} pos2 - 位置2
 * @returns {boolean} 是否相同
 */
function isSamePosition(pos1, pos2) {
    return pos1.x === pos2.x && pos1.y === pos2.y;
}

/**
 * 检查位置是否在数组中
 * @param {Object} position - 要检查的位置
 * @param {Array} positions - 位置数组
 * @returns {boolean} 是否存在
 */
function isPositionInArray(position, positions) {
    return positions.some(pos => isSamePosition(position, pos));
}

/**
 * 将网格坐标转换为像素坐标
 * @param {number} gridX - 网格X坐标
 * @param {number} gridY - 网格Y坐标
 * @returns {Object} 像素坐标
 */
function gridToPixel(gridX, gridY) {
    return {
        x: gridX * GAME_CONFIG.GRID_SIZE,
        y: gridY * GAME_CONFIG.GRID_SIZE
    };
}

/**
 * 将像素坐标转换为网格坐标
 * @param {number} pixelX - 像素X坐标
 * @param {number} pixelY - 像素Y坐标
 * @returns {Object} 网格坐标
 */
function pixelToGrid(pixelX, pixelY) {
    return {
        x: Math.floor(pixelX / GAME_CONFIG.GRID_SIZE),
        y: Math.floor(pixelY / GAME_CONFIG.GRID_SIZE)
    };
}

/**
 * 本地存储工具
 */
const Storage = {
    /**
     * 获取最高分
     * @returns {number} 最高分
     */
    getHighScore() {
        return parseInt(localStorage.getItem('snakeHighScore') || '0');
    },
    
    /**
     * 保存最高分
     * @param {number} score - 分数
     */
    setHighScore(score) {
        const currentHigh = this.getHighScore();
        if (score > currentHigh) {
            localStorage.setItem('snakeHighScore', score.toString());
            return true; // 返回true表示创造了新纪录
        }
        return false;
    },
    
    /**
     * 获取游戏设置
     * @returns {Object} 游戏设置
     */
    getSettings() {
        const defaultSettings = {
            difficulty: 'very_slow',
            soundEnabled: true
        };
        
        try {
            const saved = localStorage.getItem('snakeSettings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch (e) {
            return defaultSettings;
        }
    },
    
    /**
     * 保存游戏设置
     * @param {Object} settings - 设置对象
     */
    saveSettings(settings) {
        localStorage.setItem('snakeSettings', JSON.stringify(settings));
    }
};

/**
 * 音效管理器
 */
const SoundManager = {
    sounds: {},
    enabled: true,
    
    /**
     * 初始化音效
     */
    init() {
        // 这里可以预加载音效文件
        // 由于是基础版本，暂时使用Web Audio API生成简单音效
        this.enabled = Storage.getSettings().soundEnabled;
    },
    
    /**
     * 播放吃食物音效
     */
    playEatSound() {
        if (!this.enabled) return;
        this.playBeep(800, 100); // 高频短音
    },
    
    /**
     * 播放游戏结束音效
     */
    playGameOverSound() {
        if (!this.enabled) return;
        this.playBeep(200, 500); // 低频长音
    },
    
    /**
     * 生成简单的蜂鸣音
     * @param {number} frequency - 频率
     * @param {number} duration - 持续时间（毫秒）
     */
    playBeep(frequency, duration) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        } catch (e) {
            console.log('音效播放失败:', e);
        }
    },
    
    /**
     * 设置音效开关
     * @param {boolean} enabled - 是否启用音效
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
};

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间
 * @returns {Function} 防抖后的函数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 格式化分数显示
 * @param {number} score - 分数
 * @returns {string} 格式化后的分数字符串
 */
function formatScore(score) {
    return score.toString().padStart(4, '0');
}

// 导出配置和工具函数（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GAME_CONFIG,
        getRandomInt,
        getRandomGridPosition,
        isSamePosition,
        isPositionInArray,
        gridToPixel,
        pixelToGrid,
        Storage,
        SoundManager,
        debounce,
        formatScore
    };
}
