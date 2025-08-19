/**
 * 食物类 - 管理食物的生成和绘制
 */
class Food {
    constructor() {
        this.position = { x: 0, y: 0 };
        this.type = 'normal'; // 食物类型：normal, special
        this.value = 10; // 食物分值
        this.animationFrame = 0; // 动画帧计数
    }
    
    /**
     * 生成新的食物位置
     * @param {Snake} snake - 蛇对象，用于避免食物生成在蛇身上
     */
    generate(snake) {
        let newPosition;
        let attempts = 0;
        const maxAttempts = 100; // 防止无限循环
        
        do {
            newPosition = getRandomGridPosition();
            attempts++;
        } while (snake.isPositionOnSnake(newPosition) && attempts < maxAttempts);
        
        // 如果尝试次数过多，说明游戏区域几乎被蛇占满
        if (attempts >= maxAttempts) {
            // 寻找第一个空位置
            const maxX = Math.floor(GAME_CONFIG.CANVAS_WIDTH / GAME_CONFIG.GRID_SIZE);
            const maxY = Math.floor(GAME_CONFIG.CANVAS_HEIGHT / GAME_CONFIG.GRID_SIZE);
            
            for (let y = 0; y < maxY; y++) {
                for (let x = 0; x < maxX; x++) {
                    const testPosition = { x, y };
                    if (!snake.isPositionOnSnake(testPosition)) {
                        newPosition = testPosition;
                        break;
                    }
                }
                if (newPosition) break;
            }
        }
        
        this.position = newPosition;
        this.generateType();
        this.animationFrame = 0;
    }
    
    /**
     * 生成食物类型和分值
     */
    generateType() {
        // 10% 概率生成特殊食物
        if (Math.random() < 0.1) {
            this.type = 'special';
            this.value = 50;
        } else {
            this.type = 'normal';
            this.value = 10;
        }
    }
    
    /**
     * 检查蛇是否吃到食物
     * @param {Snake} snake - 蛇对象
     * @returns {boolean} 是否吃到食物
     */
    checkCollision(snake) {
        const head = snake.getHead();
        return isSamePosition(head, this.position);
    }
    
    /**
     * 绘制食物
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     */
    draw(ctx) {
        const pixel = gridToPixel(this.position.x, this.position.y);
        
        // 更新动画帧
        this.animationFrame += 0.1;
        
        if (this.type === 'special') {
            this.drawSpecialFood(ctx, pixel.x, pixel.y);
        } else {
            this.drawNormalFood(ctx, pixel.x, pixel.y);
        }
    }
    
    /**
     * 绘制普通食物
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    drawNormalFood(ctx, x, y) {
        const centerX = x + GAME_CONFIG.GRID_SIZE / 2;
        const centerY = y + GAME_CONFIG.GRID_SIZE / 2;
        const radius = GAME_CONFIG.GRID_SIZE / 3;
        
        // 添加轻微的脉动效果
        const pulseScale = 1 + Math.sin(this.animationFrame) * 0.1;
        const adjustedRadius = radius * pulseScale;
        
        // 绘制食物主体（圆形）
        ctx.fillStyle = GAME_CONFIG.COLORS.FOOD;
        ctx.beginPath();
        ctx.arc(centerX, centerY, adjustedRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        // 添加高光效果
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(centerX - adjustedRadius * 0.3, centerY - adjustedRadius * 0.3, adjustedRadius * 0.3, 0, 2 * Math.PI);
        ctx.fill();
        
        // 绘制食物的装饰点
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const dotSize = 1;
        ctx.beginPath();
        ctx.arc(centerX + adjustedRadius * 0.2, centerY + adjustedRadius * 0.2, dotSize, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    /**
     * 绘制特殊食物
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    drawSpecialFood(ctx, x, y) {
        const centerX = x + GAME_CONFIG.GRID_SIZE / 2;
        const centerY = y + GAME_CONFIG.GRID_SIZE / 2;
        const size = GAME_CONFIG.GRID_SIZE * 0.8;
        
        // 旋转动画
        const rotation = this.animationFrame * 0.5;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);
        
        // 绘制星形特殊食物
        this.drawStar(ctx, 0, 0, 5, size / 2, size / 4);
        
        ctx.restore();
        
        // 绘制闪烁效果
        const alpha = (Math.sin(this.animationFrame * 2) + 1) / 2 * 0.5 + 0.3;
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 3, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    /**
     * 绘制星形
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     * @param {number} cx - 中心X坐标
     * @param {number} cy - 中心Y坐标
     * @param {number} spikes - 星形尖角数量
     * @param {number} outerRadius - 外半径
     * @param {number} innerRadius - 内半径
     */
    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        
        // 渐变填充
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerRadius);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.5, '#FFA500');
        gradient.addColorStop(1, '#FF8C00');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 描边
        ctx.strokeStyle = '#FF6B00';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    /**
     * 获取食物位置
     * @returns {Object} 食物位置坐标
     */
    getPosition() {
        return { ...this.position };
    }
    
    /**
     * 获取食物分值
     * @returns {number} 食物分值
     */
    getValue() {
        return this.value;
    }
    
    /**
     * 获取食物类型
     * @returns {string} 食物类型
     */
    getType() {
        return this.type;
    }
    
    /**
     * 检查食物是否在指定位置
     * @param {Object} position - 要检查的位置
     * @returns {boolean} 是否在指定位置
     */
    isAtPosition(position) {
        return isSamePosition(this.position, position);
    }
}
