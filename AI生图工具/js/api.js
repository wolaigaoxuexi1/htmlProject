/**
 * 硅基流动API调用模块
 */

class SiliconFlowAPI {
  constructor() {
    this.baseURL = 'https://api.siliconflow.cn/v1';
    this.model = 'Kwai-Kolors/Kolors';
  }

  /**
   * 获取API密钥
   */
  getApiKey() {
    return Storage.getApiKey();
  }

  /**
   * 验证API密钥
   */
  async validateApiKey(apiKey) {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  /**
   * 生成图片
   */
  async generateImage(params) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('请先配置API密钥');
    }

    // 验证参数
    this.validateParams(params);

    // 构建请求体
    const requestBody = {
      model: this.model,
      prompt: params.prompt,
      image_size: params.image_size || '1024x1024',
      batch_size: params.batch_size || 1,
      num_inference_steps: params.num_inference_steps || 20,
      guidance_scale: params.guidance_scale || 7.5
    };

    // 添加可选参数
    if (params.negative_prompt && params.negative_prompt.trim()) {
      requestBody.negative_prompt = params.negative_prompt.trim();
    }

    if (params.seed && params.seed > 0) {
      requestBody.seed = parseInt(params.seed);
    }

    try {
      const response = await fetch(`${this.baseURL}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(this.getErrorMessage(response.status, errorData));
      }

      const data = await response.json();
      return this.processResponse(data, params);
    } catch (error) {
      console.error('Image generation failed:', error);
      throw error;
    }
  }

  /**
   * 验证参数
   */
  validateParams(params) {
    if (!params.prompt || !params.prompt.trim()) {
      throw new Error('请输入提示词');
    }

    if (params.prompt.trim().length > 1000) {
      throw new Error('提示词长度不能超过1000个字符');
    }

    if (params.negative_prompt && params.negative_prompt.length > 500) {
      throw new Error('负面提示词长度不能超过500个字符');
    }

    if (!this.isValidImageSize(params.image_size)) {
      throw new Error('不支持的图片尺寸');
    }

    if (!Validator.isInRange(params.batch_size, 1, 4)) {
      throw new Error('生成数量必须在1-4之间');
    }

    if (!Validator.isInRange(params.num_inference_steps, 1, 100)) {
      throw new Error('推理步数必须在1-100之间');
    }

    if (!Validator.isInRange(params.guidance_scale, 0, 20)) {
      throw new Error('引导系数必须在0-20之间');
    }

    if (params.seed && !Validator.isInRange(params.seed, 0, 9999999999)) {
      throw new Error('随机种子必须在0-9999999999之间');
    }
  }

  /**
   * 验证图片尺寸
   */
  isValidImageSize(size) {
    const validSizes = [
      '1024x1024',
      '960x1280',
      '768x1024',
      '720x1440',
      '720x1280'
    ];
    return validSizes.includes(size);
  }

  /**
   * 处理API响应
   */
  processResponse(data, originalParams) {
    if (!data.images || !Array.isArray(data.images)) {
      throw new Error('API响应格式错误');
    }

    return {
      images: data.images.map((image, index) => ({
        id: Random.uuid(),
        url: image.url,
        prompt: originalParams.prompt,
        negative_prompt: originalParams.negative_prompt || '',
        parameters: {
          image_size: originalParams.image_size,
          num_inference_steps: originalParams.num_inference_steps,
          guidance_scale: originalParams.guidance_scale,
          seed: originalParams.seed || null
        },
        created_at: new Date().toISOString(),
        index: index
      })),
      usage: data.usage || null
    };
  }

  /**
   * 获取错误消息
   */
  getErrorMessage(status, errorData) {
    const errorMessages = {
      400: '请求参数错误',
      401: 'API密钥无效或已过期',
      402: '账户余额不足',
      403: '访问被拒绝',
      404: '请求的资源不存在',
      429: '请求过于频繁，请稍后再试',
      500: '服务器内部错误',
      502: '服务暂时不可用',
      503: '服务暂时不可用',
      504: '请求超时'
    };

    let message = errorMessages[status] || '未知错误';

    // 尝试从错误数据中获取更详细的信息
    if (errorData.error && errorData.error.message) {
      message += ': ' + errorData.error.message;
    } else if (errorData.message) {
      message += ': ' + errorData.message;
    }

    return message;
  }

  /**
   * 获取支持的图片尺寸列表
   */
  getSupportedSizes() {
    return [
      { value: '1024x1024', label: '1024x1024 (1:1 正方形)', ratio: '1:1' },
      { value: '960x1280', label: '960x1280 (3:4 竖屏)', ratio: '3:4' },
      { value: '768x1024', label: '768x1024 (3:4 竖屏)', ratio: '3:4' },
      { value: '720x1440', label: '720x1440 (1:2 长竖屏)', ratio: '1:2' },
      { value: '720x1280', label: '720x1280 (9:16 手机竖屏)', ratio: '9:16' }
    ];
  }

  /**
   * 获取模型信息
   */
  getModelInfo() {
    return {
      name: 'Kwai-Kolors/Kolors',
      description: '快手可图大模型，支持中英文提示词，擅长生成高质量的图像',
      maxPromptLength: 1000,
      maxNegativePromptLength: 500,
      supportedFeatures: [
        '中英文提示词',
        '负面提示词',
        '自定义种子',
        '多种尺寸',
        '批量生成'
      ]
    };
  }

  /**
   * 估算生成时间
   */
  estimateGenerationTime(params) {
    const baseTime = 10; // 基础时间（秒）
    const stepMultiplier = 0.2; // 每步增加的时间
    const batchMultiplier = 1.5; // 批量生成的时间倍数
    
    let estimatedTime = baseTime;
    estimatedTime += (params.num_inference_steps - 20) * stepMultiplier;
    estimatedTime *= Math.pow(batchMultiplier, params.batch_size - 1);
    
    return Math.max(5, Math.round(estimatedTime)); // 最少5秒
  }

  /**
   * 获取使用统计
   */
  async getUsageStats() {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return null;
    }

    try {
      // 注意：这个端点可能不存在，需要根据实际API文档调整
      const response = await fetch(`${this.baseURL}/usage`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to fetch usage stats:', error);
    }

    return null;
  }
}

// 创建API实例
const api = new SiliconFlowAPI();

// 导出API实例（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}
