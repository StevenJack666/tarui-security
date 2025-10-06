# Tauri + Vue 3

This template should help get you started developing with Tauri + Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## 添加桌面程序图标

### 方法一：替换现有图标文件
1. 准备你的图标文件（PNG格式，推荐1024x1024像素）
2. 使用在线工具或图像编辑软件生成不同尺寸：
   - `32x32.png` - 小图标
   - `128x128.png` - 中等图标  
   - `128x128@2x.png` - 高分辨率图标
   - `icon.png` - 主图标
   - `icon.icns` - macOS图标（可用工具转换）
   - `icon.ico` - Windows图标（可用工具转换）

3. 替换 `src-tauri/icons/` 目录中的对应文件

### 方法二：使用Tauri图标生成器
```bash
# 安装Tauri CLI工具
npm install -g @tauri-apps/cli

# 从单个PNG文件生成所有尺寸的图标
npx tauri icon path/to/your/icon.png
```

### 图标配置
图标在 `src-tauri/tauri.conf.json` 中配置：
```json
{
  "bundle": {
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png", 
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

### 注意事项
- 图标文件需要在构建前准备好
- macOS需要.icns格式，Windows需要.ico格式
- 建议使用简洁、高对比度的设计
- 重新构建应用程序后图标才会生效

## 代码报错执行：cd src-tauri && cargo clean && cargo build
    修改依赖项之后
    系统异常关闭或中断编译过程后
    切换分支或合并代码后
    清理缓存 + 重新构建 + 重启分析器