<template>
  <div class="auto-file-reader">
    <div class="header">
      <h3>🤖 自动文件读取器</h3>
      <p class="description">自动扫描指定目录并读取文件内容</p>
    </div>

    <div class="config-section">
      <div class="input-group">
        <label for="scan-path">扫描路径:</label>
        <input 
          id="scan-path"
          v-model="scanPath" 
          type="text"
          placeholder="/Users/yourname/Documents"
          class="path-input"
        />
        <button @click="selectDirectory" class="select-btn">选择目录</button>
      </div>

      <div class="input-group">
        <label for="file-pattern">文件过滤:</label>
        <select v-model="selectedPattern" class="pattern-select">
          <option value="txt,md,json">文本文件 (.txt, .md, .json)</option>
          <option value="js,ts,vue,jsx,tsx">代码文件 (.js, .ts, .vue)</option>
          <option value="log,csv,xml">数据文件 (.log, .csv, .xml)</option>
          <option value="*">所有文件 (*.*)</option>
          <option value="custom">自定义模式</option>
        </select>
      </div>

      <div v-if="selectedPattern === 'custom'" class="input-group">
        <label for="custom-pattern">自定义扩展名:</label>
        <input 
          v-model="customExtensions" 
          placeholder="例如: pdf,docx,xlsx"
          class="pattern-input"
        />
      </div>

      <div class="options-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="autoRefresh" />
          <span>自动刷新 (每 {{ refreshInterval }}秒)</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="includeSubdirs" />
          <span>包含子目录</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="showPreview" />
          <span>显示文件预览</span>
        </label>
      </div>

      <div class="action-buttons">
        <button 
          @click="startAutoScan" 
          :disabled="isScanning || !scanPath"
          class="scan-btn primary"
        >
          {{ isScanning ? '扫描中...' : '开始自动扫描' }}
        </button>
        <button 
          @click="stopAutoScan" 
          :disabled="!isScanning"
          class="stop-btn"
        >
          停止扫描
        </button>
        <button @click="clearResults" class="clear-btn">清空结果</button>
      </div>
    </div>

    <!-- 扫描状态 -->
    <div v-if="isScanning" class="status-section">
      <div class="scanning-indicator">
        <div class="spinner"></div>
        <span>正在扫描: {{ currentScanFile }}</span>
      </div>
      <div class="progress">
        <div class="progress-bar" :style="{ width: scanProgress + '%' }"></div>
        <span class="progress-text">{{ scannedFiles }}/{{ totalFiles }} 文件</span>
      </div>
    </div>

    <!-- 文件列表 -->
    <div v-if="fileList.length > 0" class="files-section">
      <div class="section-header">
        <h4>📁 发现的文件 ({{ fileList.length }} 个)</h4>
        <div class="filter-controls">
          <input 
            v-model="searchFilter" 
            placeholder="搜索文件..."
            class="search-input"
          />
          <select v-model="sortBy" class="sort-select">
            <option value="name">按名称排序</option>
            <option value="size">按大小排序</option>
            <option value="modified">按修改时间排序</option>
            <option value="type">按类型排序</option>
          </select>
        </div>
      </div>

      <div class="files-list">
        <div 
          v-for="file in filteredFiles" 
          :key="file.path"
          class="file-item"
          :class="{ 'expanded': file.expanded }"
        >
          <div class="file-header" @click="toggleFileExpansion(file)">
            <div class="file-info">
              <span class="file-icon">{{ getFileIcon(file.extension) }}</span>
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
              <span class="file-modified">{{ formatDate(file.modified) }}</span>
            </div>
            <div class="file-actions">
              <button 
                @click.stop="readSingleFile(file)" 
                :disabled="file.isReading"
                class="read-btn"
              >
                {{ file.isReading ? '读取中...' : '读取' }}
              </button>
              <button 
                @click.stop="copyFilePath(file)"
                class="copy-btn"
              >
                📋
              </button>
              <span class="expand-icon">{{ file.expanded ? '▼' : '▶' }}</span>
            </div>
          </div>

          <!-- 文件内容预览 -->
          <div v-if="file.expanded && showPreview" class="file-content">
            <div v-if="file.content" class="content-preview">
              <div class="content-header">
                <span>文件内容预览:</span>
                <button @click="copyFileContent(file)" class="copy-content-btn">复制内容</button>
              </div>
              <pre class="content-text">{{ file.content }}</pre>
            </div>
            <div v-else-if="file.error" class="error-message">
              ❌ {{ file.error }}
            </div>
            <div v-else class="no-content">
              点击"读取"按钮来加载文件内容
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量操作 -->
    <div v-if="fileList.length > 0" class="batch-section">
      <h4>🔄 批量操作</h4>
      <div class="batch-controls">
        <button @click="readAllFiles" :disabled="isBatchReading" class="batch-btn">
          {{ isBatchReading ? '批量读取中...' : '读取所有文件' }}
        </button>
        <button @click="exportResults" class="export-btn">导出结果</button>
        <button @click="sendAllToServer" class="send-all-btn">发送到服务器</button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div v-if="statistics" class="stats-section">
      <h4>📊 统计信息</h4>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">总文件数:</span>
          <span class="stat-value">{{ statistics.totalFiles }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">已读取:</span>
          <span class="stat-value">{{ statistics.readFiles }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总大小:</span>
          <span class="stat-value">{{ formatFileSize(statistics.totalSize) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">文件类型:</span>
          <span class="stat-value">{{ statistics.fileTypes.join(', ') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'

// 响应式数据
const scanPath = ref('')
const selectedPattern = ref('txt,md,json')
const customExtensions = ref('')
const autoRefresh = ref(false)
const refreshInterval = ref(10)
const includeSubdirs = ref(true)
const showPreview = ref(false)
const searchFilter = ref('')
const sortBy = ref('name')

const isScanning = ref(false)
const isBatchReading = ref(false)
const currentScanFile = ref('')
const scanProgress = ref(0)
const scannedFiles = ref(0)
const totalFiles = ref(0)

const fileList = ref([])
const autoScanTimer = ref(null)

// 计算属性
const currentExtensions = computed(() => {
  if (selectedPattern.value === 'custom') {
    return customExtensions.value.split(',').map(ext => ext.trim()).filter(ext => ext)
  }
  if (selectedPattern.value === '*') {
    return ['*']
  }
  return selectedPattern.value.split(',')
})

const filteredFiles = computed(() => {
  let filtered = fileList.value

  // 搜索过滤
  if (searchFilter.value) {
    const search = searchFilter.value.toLowerCase()
    filtered = filtered.filter(file => 
      file.name.toLowerCase().includes(search) ||
      file.path.toLowerCase().includes(search)
    )
  }

  // 排序
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'size':
        return b.size - a.size
      case 'modified':
        return new Date(b.modified) - new Date(a.modified)
      case 'type':
        return a.extension.localeCompare(b.extension)
      default:
        return a.name.localeCompare(b.name)
    }
  })

  return filtered
})

const statistics = computed(() => {
  if (fileList.value.length === 0) return null

  const totalSize = fileList.value.reduce((sum, file) => sum + file.size, 0)
  const readFiles = fileList.value.filter(file => file.content).length
  const fileTypes = [...new Set(fileList.value.map(file => file.extension))]

  return {
    totalFiles: fileList.value.length,
    readFiles,
    totalSize,
    fileTypes: fileTypes.slice(0, 5) // 只显示前5种类型
  }
})

// 方法
async function selectDirectory() {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
      title: '选择要扫描的目录'
    })
    if (selected) {
      scanPath.value = selected
    }
  } catch (error) {
    console.error('选择目录失败:', error)
    alert('选择目录失败: ' + error.message)
  }
}

async function startAutoScan() {
  if (!scanPath.value) {
    alert('请先选择扫描路径')
    return
  }

  isScanning.value = true
  try {
    await scanDirectory()
    
    if (autoRefresh.value) {
      setupAutoRefresh()
    }
  } catch (error) {
    console.error('扫描失败:', error)
    alert('扫描失败: ' + error.message)
  } finally {
    isScanning.value = false
  }
}

function stopAutoScan() {
  isScanning.value = false
  if (autoScanTimer.value) {
    clearInterval(autoScanTimer.value)
    autoScanTimer.value = null
  }
}

async function scanDirectory() {
  currentScanFile.value = '正在扫描目录...'
  scannedFiles.value = 0
  totalFiles.value = 0
  scanProgress.value = 0

  try {
    // 调用Rust命令获取文件列表
    const result = await invoke('scan_directory', {
      path: scanPath.value,
      extensions: currentExtensions.value,
      includeSubdirs: includeSubdirs.value
    })

    fileList.value = result.map(fileInfo => ({
      ...fileInfo,
      expanded: false,
      isReading: false,
      content: null,
      error: null
    }))

    totalFiles.value = fileList.value.length
    scannedFiles.value = totalFiles.value
    scanProgress.value = 100

  } catch (error) {
    console.error('目录扫描失败:', error)
    throw error
  }
}

async function readSingleFile(file) {
  file.isReading = true
  file.error = null
  
  try {
    const content = await invoke('read_file_content', { 
      filePath: file.path 
    })
    file.content = content
    file.expanded = true
  } catch (error) {
    file.error = error.message || '读取失败'
    console.error('读取文件失败:', error)
  } finally {
    file.isReading = false
  }
}

async function readAllFiles() {
  isBatchReading.value = true
  
  for (let i = 0; i < fileList.value.length; i++) {
    const file = fileList.value[i]
    if (!file.content && !file.error) {
      currentScanFile.value = `正在读取: ${file.name}`
      scanProgress.value = (i / fileList.value.length) * 100
      
      await readSingleFile(file)
      
      // 小延迟避免过快处理
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  isBatchReading.value = false
  currentScanFile.value = ''
  scanProgress.value = 100
}

function toggleFileExpansion(file) {
  file.expanded = !file.expanded
  
  if (file.expanded && !file.content && !file.error && showPreview.value) {
    readSingleFile(file)
  }
}

function clearResults() {
  fileList.value = []
  stopAutoScan()
}

function setupAutoRefresh() {
  if (autoScanTimer.value) {
    clearInterval(autoScanTimer.value)
  }
  
  autoScanTimer.value = setInterval(() => {
    if (!isScanning.value) {
      scanDirectory()
    }
  }, refreshInterval.value * 1000)
}

async function copyFilePath(file) {
  try {
    await navigator.clipboard.writeText(file.path)
    alert('文件路径已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
  }
}

async function copyFileContent(file) {
  if (!file.content) return
  
  try {
    await navigator.clipboard.writeText(file.content)
    alert('文件内容已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
  }
}

function exportResults() {
  const results = {
    scanPath: scanPath.value,
    scannedAt: new Date().toISOString(),
    files: fileList.value.map(file => ({
      name: file.name,
      path: file.path,
      size: file.size,
      modified: file.modified,
      extension: file.extension,
      content: file.content
    }))
  }
  
  const blob = new Blob([JSON.stringify(results, null, 2)], { 
    type: 'application/json' 
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `file-scan-results-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

async function sendAllToServer() {
  // 这里可以实现发送到服务器的逻辑
  alert('发送到服务器功能待实现')
}

// 辅助函数
function getFileIcon(extension) {
  const iconMap = {
    'txt': '📄',
    'md': '📝',
    'json': '📋',
    'js': '🟨',
    'ts': '🔷',
    'vue': '💚',
    'jsx': '⚛️',
    'tsx': '🔷',
    'log': '📜',
    'csv': '📊',
    'xml': '📄',
    'pdf': '📕',
    'docx': '📘',
    'xlsx': '📗'
  }
  return iconMap[extension.toLowerCase()] || '📄'
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString()
}

// 生命周期
onMounted(() => {
  // 设置默认扫描路径
  scanPath.value = '/Users/' + (process.env.USER || 'user') + '/Documents'
})

onUnmounted(() => {
  stopAutoScan()
})

// 监听自动刷新设置
watch(autoRefresh, (newVal) => {
  if (newVal && fileList.value.length > 0) {
    setupAutoRefresh()
  } else {
    if (autoScanTimer.value) {
      clearInterval(autoScanTimer.value)
      autoScanTimer.value = null
    }
  }
})
</script>

<style scoped>
.auto-file-reader {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 24px;
}

.description {
  color: #666;
  margin: 5px 0 0 0;
}

.config-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.input-group {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  gap: 10px;
}

.input-group label {
  min-width: 80px;
  font-weight: 500;
}

.path-input, .pattern-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.select-btn, .pattern-select, .sort-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.options-group {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.scan-btn, .stop-btn, .clear-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.scan-btn.primary {
  background: #007bff;
  color: white;
}

.scan-btn:hover:not(:disabled) {
  background: #0056b3;
}

.stop-btn {
  background: #dc3545;
  color: white;
}

.clear-btn {
  background: #6c757d;
  color: white;
}

.scan-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.status-section {
  background: #e3f2fd;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.scanning-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.progress {
  position: relative;
  height: 20px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #0056b3);
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: 500;
}

.files-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h4 {
  margin: 0;
  color: #2c3e50;
}

.filter-controls {
  display: flex;
  gap: 10px;
}

.search-input {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 200px;
}

.files-list {
  max-height: 600px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}

.file-item {
  border-bottom: 1px solid #f0f0f0;
}

.file-item:last-child {
  border-bottom: none;
}

.file-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.file-header:hover {
  background-color: #f8f9fa;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.file-name {
  font-weight: 500;
  color: #2c3e50;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size, .file-modified {
  color: #666;
  font-size: 12px;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.read-btn, .copy-btn {
  padding: 4px 8px;
  border: 1px solid #007bff;
  background: white;
  color: #007bff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.read-btn:hover, .copy-btn:hover {
  background: #007bff;
  color: white;
}

.expand-icon {
  color: #666;
  font-size: 12px;
  width: 12px;
  text-align: center;
}

.file-content {
  padding: 0 15px 15px;
  background-color: #f8f9fa;
}

.content-preview {
  border: 1px solid #e9ecef;
  border-radius: 4px;
  background: white;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #e9ecef;
  border-bottom: 1px solid #ddd;
  font-size: 12px;
  font-weight: 500;
}

.copy-content-btn {
  padding: 2px 6px;
  border: 1px solid #007bff;
  background: white;
  color: #007bff;
  border-radius: 2px;
  cursor: pointer;
  font-size: 10px;
}

.content-text {
  max-height: 200px;
  overflow-y: auto;
  padding: 12px;
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  line-height: 1.4;
  white-space: pre-wrap;
}

.error-message {
  color: #dc3545;
  padding: 10px;
  font-size: 12px;
}

.no-content {
  color: #666;
  padding: 10px;
  font-size: 12px;
  font-style: italic;
}

.batch-section, .stats-section {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.batch-section h4, .stats-section h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
}

.batch-controls {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.batch-btn, .export-btn, .send-all-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}

.batch-btn {
  background: #28a745;
  color: white;
}

.export-btn {
  background: #ffc107;
  color: #212529;
}

.send-all-btn {
  background: #17a2b8;
  color: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.stat-label {
  font-weight: 500;
  color: #666;
}

.stat-value {
  font-weight: 600;
  color: #2c3e50;
}
</style>