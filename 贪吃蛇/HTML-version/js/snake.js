/**
 * 蛇类 - 管理蛇的状态和行为
 */
class Snake {
    constructor() {
        this.reset();
    }
    
    /**
     * 重置蛇到初始状态
     */
    reset() {
        // 初始化蛇的身体，从中间位置开始
        const startX = Math.floor(GAME_CONFIG.CANVAS_WIDTH / GAME_CONFIG.GRID_SIZE / 2);
        const startY = Math.floor(GAME_CONFIG.CANVAS_HEIGHT / GAME_CONFIG.GRID_SIZE / 2);
        
        this.body = [];
        for (let i = 0; i < GAME_CONFIG.INITIAL_SNAKE_LENGTH; i++) {
            this.body.push({
                x: startX - i,
                y: startY
            });
        }
        
        // 初始方向向右
        this.direction = { ...GAME_CONFIG.DIRECTIONS.RIGHT };
        this.nextDirection = { ...GAME_CONFIG.DIRECTIONS.RIGHT };
        
        // 标记是否需要增长
        this.shouldGrow = false;
    }
    
    /**
     * 设置移动方向
     * @param {Object} newDirection - 新的移动方向
     */
    setDirection(newDirection) {
        // 防止蛇反向移动（撞到自己）
        if (this.isOppositeDirection(newDirection)) {
            return;
        }
        
        this.nextDirection = { ...newDirection };
    }
    
    /**
     * 检查是否是相反方向
     * @param {Object} direction - 要检查的方向
     * @returns {boolean} 是否是相反方向
     */
    isOppositeDirection(direction) {
        return (
            (this.direction.x === 1 && direction.x === -1) ||
            (this.direction.x === -1 && direction.x === 1) ||
            (this.direction.y === 1 && direction.y === -1) ||
            (this.direction.y === -1 && direction.y === 1)
        );
    }
    
    /**
     * 移动蛇
     */
    move() {
        // 更新方向
        this.direction = { ...this.nextDirection };
        
        // 计算新的头部位置
        const head = { ...this.body[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        // 添加新头部
        this.body.unshift(head);
        
        // 如果不需要增长，移除尾部
        if (!this.shouldGrow) {
            this.body.pop();
        } else {
            this.shouldGrow = false;
        }
    }
    
    /**
     * 让蛇增长
     */
    grow() {
        this.shouldGrow = true;
    }
    
    /**
     * 获取蛇头位置
     * @returns {Object} 蛇头坐标
     */
    getHead() {
        return this.body[0];
    }
    
    /**
     * 获取蛇身体（不包括头部）
     * @returns {Array} 蛇身体坐标数组
     */
    getBodyWithoutHead() {
        return this.body.slice(1);
    }
    
    /**
     * 检查是否撞到自己
     * @returns {boolean} 是否撞到自己
     */
    checkSelfCollision() {
        const head = this.getHead();
        const body = this.getBodyWithoutHead();
        
        return isPositionInArray(head, body);
    }
    
    /**
     * 检查是否撞到墙壁
     * @returns {boolean} 是否撞到墙壁
     */
    checkWallCollision() {
        const head = this.getHead();
        const maxX = Math.floor(GAME_CONFIG.CANVAS_WIDTH / GAME_CONFIG.GRID_SIZE) - 1;
        const maxY = Math.floor(GAME_CONFIG.CANVAS_HEIGHT / GAME_CONFIG.GRID_SIZE) - 1;
        
        return (
            head.x < 0 || 
            head.x > maxX || 
            head.y < 0 || 
            head.y > maxY
        );
    }
    
    /**
     * 检查是否发生任何碰撞
     * @returns {boolean} 是否发生碰撞
     */
    checkCollision() {
        return this.checkWallCollision() || this.checkSelfCollision();
    }
    
    /**
     * 绘制蛇
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     */
    draw(ctx) {
        this.body.forEach((segment, index) => {
            const pixel = gridToPixel(segment.x, segment.y);
            
            // 设置颜色
            if (index === 0) {
                // 蛇头
                ctx.fillStyle = GAME_CONFIG.COLORS.SNAKE_HEAD;
            } else {
                // 蛇身
                ctx.fillStyle = GAME_CONFIG.COLORS.SNAKE_BODY;
            }
            
            // 绘制圆角矩形
            this.drawRoundedRect(
                ctx, 
                pixel.x + 1, 
                pixel.y + 1, 
                GAME_CONFIG.GRID_SIZE - 2, 
                GAME_CONFIG.GRID_SIZE - 2, 
                4
            );
            
            // 如果是蛇头，添加眼睛
            if (index === 0) {
                this.drawEyes(ctx, pixel.x, pixel.y);
            }
        });
    }
    
    /**
     * 绘制圆角矩形
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @param {number} radius - 圆角半径
     */
    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }
    
    /**
     * 绘制蛇的眼睛
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     * @param {number} x - 头部X坐标
     * @param {number} y - 头部Y坐标
     */
    drawEyes(ctx, x, y) {
        ctx.fillStyle = 'white';
        const eyeSize = 3;
        const eyeOffset = 6;
        
        // 根据移动方向调整眼睛位置
        let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
        
        if (this.direction.x === 1) { // 向右
            leftEyeX = x + GAME_CONFIG.GRID_SIZE - eyeOffset;
            leftEyeY = y + eyeOffset;
            rightEyeX = x + GAME_CONFIG.GRID_SIZE - eyeOffset;
            rightEyeY = y + GAME_CONFIG.GRID_SIZE - eyeOffset;
        } else if (this.direction.x === -1) { // 向左
            leftEyeX = x + eyeOffset;
            leftEyeY = y + eyeOffset;
            rightEyeX = x + eyeOffset;
            rightEyeY = y + GAME_CONFIG.GRID_SIZE - eyeOffset;
        } else if (this.direction.y === -1) { // 向上
            leftEyeX = x + eyeOffset;
            leftEyeY = y + eyeOffset;
            rightEyeX = x + GAME_CONFIG.GRID_SIZE - eyeOffset;
            rightEyeY = y + eyeOffset;
        } else { // 向下
            leftEyeX = x + eyeOffset;
            leftEyeY = y + GAME_CONFIG.GRID_SIZE - eyeOffset;
            rightEyeX = x + GAME_CONFIG.GRID_SIZE - eyeOffset;
            rightEyeY = y + GAME_CONFIG.GRID_SIZE - eyeOffset;
        }
        
        // 绘制眼睛
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, 2 * Math.PI);
        ctx.fill();
        
        // 绘制瞳孔
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, 1, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, 1, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    /**
     * 获取蛇的长度
     * @returns {number} 蛇的长度
     */
    getLength() {
        return this.body.length;
    }
    
    /**
     * 检查指定位置是否与蛇身重叠
     * @param {Object} position - 要检查的位置
     * @returns {boolean} 是否重叠
     */
    isPositionOnSnake(position) {
        return isPositionInArray(position, this.body);
    }
}
