<script setup>
import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { fetch } from "@tauri-apps/plugin-http";

const greetMsg = ref("");
const name = ref("");
const fileContent = ref("");
const isReading = ref(false);
const isSending = ref(false);
const serverUrl = ref("http://localhost:3000/api/upload"); // 修改为你的服务器地址
const sendResult = ref("");

// GET请求相关状态
const isGetting = ref(false);
const getUrl = ref("https://jsonplaceholder.typicode.com/posts/1"); // 示例GET请求URL
const getResult = ref("");

async function greet() {
  // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
  greetMsg.value = await invoke("greet", { name: name.value });
}

async function readFile() {
  try {
    isReading.value = true;
    
    // 打开文件选择对话框
    const filePath = await open({
      title: "选择要读取的文件",
      multiple: false,
      filters: [
        {
          name: "文本文件",
          extensions: ["txt", "md", "json", "js", "ts", "vue", "rs", "toml"]
        },
        {
          name: "所有文件",
          extensions: ["*"]
        }
      ]
    });

    if (filePath) {
      // 调用Rust命令读取文件
      const content = await invoke("read_file_content", { filePath });
      fileContent.value = content;
      
      // 显示成功消息
      alert("文件已成功读取并显示在下方！");
    }
  } catch (error) {
    console.error("读取文件出错:", error);
    alert(`读取文件失败: ${error}`);
  } finally {
    isReading.value = false;
  }
}

// 发送文件内容到服务器 (POST请求)
async function sendToServer() {
  if (!fileContent.value) {
    alert("请先读取文件内容！");
    return;
  }

  if (!serverUrl.value) {
    alert("请输入服务器URL！");
    return;
  }

  try {
    isSending.value = true;
    sendResult.value = "";

    // 准备发送的数据
    const payload = {
      content: fileContent.value,
      timestamp: new Date().toISOString(),
      source: "tauri-app"
    };

    console.log("发送数据到:", serverUrl.value);

    // 使用Tauri HTTP客户端发送POST请求
    const response = await fetch(serverUrl.value, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    });
    

    if (response.ok) {
      const result = await response.text();
      sendResult.value = `✅ 发送成功！服务器响应: ${result}`;
      alert("文件内容已成功发送到服务器！");
    } else {
      sendResult.value = `❌ 发送失败: HTTP ${response.status} - ${response.statusText}`;
      alert(`发送失败: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error("发送到服务器出错:", error);
    sendResult.value = `❌ 发送失败: ${error.message || error}`;
    alert(`发送失败: ${error.message || error}`);
  } finally {
    isSending.value = false;
  }
}

// 发送GET请求
async function sendGetRequest() {
  if (!getUrl.value) {
    alert("请输入GET请求URL！");
    return;
  }

  try {
    isGetting.value = true;
    getResult.value = "";

    console.log("发送GET请求到:", getUrl.value);

    // 使用Tauri HTTP客户端发送GET请求
    const response = await fetch('https://www.baidu.com/', {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Tauri-App/1.0"
      }
    });

    if (response.ok) {
      const contentType = response.headers.get("content-type");
      let result;
      
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
        getResult.value = `✅ GET请求成功！\n响应状态: ${response.status}\n响应数据:\n${JSON.stringify(result, null, 2)}`;
      } else {
        result = await response.text();
        getResult.value = `✅ GET请求成功！\n响应状态: ${response.status}\n响应内容:\n${result}`;
      }
      
      alert("GET请求成功完成！");
    } else {
      getResult.value = `❌ GET请求失败: HTTP ${response.status} - ${response.statusText}`;
      alert(`GET请求失败: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error("GET请求出错:", error);
    getResult.value = `❌ GET请求失败: ${error.message || error}`;
    alert(`GET请求失败: ${error.message || error}`);
  } finally {
    isGetting.value = false;
  }
}
</script>

<template>
  <main class="container">
    <h1>mm_test</h1>

    <div class="row">
      <a href="https://vite.dev" target="_blank">
        <img src="/vite.svg" class="logo vite" alt="Vite logo" />
      </a>
      <a href="https://tauri.app" target="_blank">
        <img src="/tauri.svg" class="logo tauri" alt="Tauri logo" />
      </a>
      <a href="https://vuejs.org/" target="_blank">
        <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
      </a>
    </div>

    <!-- 问候功能 -->
    <div class="section">
      <h3>请输入用户名</h3>
      <form class="row" @submit.prevent="greet">
        <input id="greet-input" v-model="name" placeholder="Enter a name..." />
        <button type="submit">Greet</button>
      </form>
      <p>{{ greetMsg }}</p>
    </div>

    <!-- 文件读取功能 -->
    <div class="section">
      <h3>文件读取功能</h3>
      <div class="row">
        <button @click="readFile" :disabled="isReading" class="file-button">
          {{ isReading ? '读取中...' : '选择并读取文件' }}
        </button>
      </div>
      
      <!-- 文件内容显示区域 -->
      <div v-if="fileContent" class="file-content">
        <h4>文件内容:</h4>
        <pre>{{ fileContent }}</pre>
      </div>
    </div>

    <!-- GET请求功能 -->
    <div class="section">
      <h3>GET请求功能</h3>
      <div class="server-config">
        <label for="get-url">GET请求URL:</label>
        <input 
          id="get-url" 
          v-model="getUrl" 
          type="url" 
          placeholder="https://jsonplaceholder.typicode.com/posts/1"
          class="server-input"
        />
      </div>
      <div class="row">
        <button @click="sendGetRequest" :disabled="isGetting" class="get-button">
          {{ isGetting ? '请求中...' : '发送GET请求' }}
        </button>
      </div>
      
      <!-- GET请求结果显示区域 -->
      <div v-if="getResult" class="get-result">
        <h4>GET响应结果:</h4>
        <pre>{{ getResult }}</pre>
      </div>
    </div>

    <!-- 服务器发送功能 (POST) -->
    <div v-if="fileContent" class="section">
      <h3>POST发送到服务器</h3>
      <div class="server-config">
        <label for="server-url">服务器URL:</label>
        <input 
          id="server-url" 
          v-model="serverUrl" 
          type="url" 
          placeholder="http://localhost:3000/api/upload"
          class="server-input"
        />
      </div>
      <div class="row">
        <button @click="sendToServer" :disabled="isSending" class="send-button">
          {{ isSending ? '发送中...' : '发送文件到服务器' }}
        </button>
      </div>
      
      <!-- 发送结果显示区域 -->
      <div v-if="sendResult" class="send-result">
        <p>{{ sendResult }}</p>
      </div>
    </div>
  </main>
</template>

<style scoped>
.logo.vite:hover {
  filter: drop-shadow(0 0 2em #747bff);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #249b73);
}

.section {
  margin: 20px 0;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.section h3 {
  margin-top: 0;
  color: #333;
}

.file-button {
  background-color: #24c8db;
  color: white;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: bold;
}

.file-button:hover {
  background-color: #1ea8bd;
}

.file-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.file-content {
  margin-top: 20px;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f9f9f9;
  padding: 10px;
}

.file-content pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
}

.server-config {
  margin-bottom: 15px;
  text-align: left;
}

.server-config label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.server-input {
  width: 100%;
  max-width: 400px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.send-button {
  background-color: #28a745;
  color: white;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: bold;
}

.send-button:hover:not(:disabled) {
  background-color: #218838;
}

.send-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.send-result {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  text-align: left;
}

.send-result p {
  margin: 0;
  font-family: monospace;
  font-size: 14px;
}

.get-button {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: bold;
}

.get-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.get-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.get-result {
  margin-top: 20px;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #007bff;
  border-radius: 4px;
  background: #f8f9ff;
  padding: 10px;
  text-align: left;
}

.get-result h4 {
  margin-top: 0;
  color: #007bff;
}

.get-result pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  background: #ffffff;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #e0e6ff;
}

</style>
<style>
:root {
  font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;

  color: #0f0f0f;
  background-color: #f6f6f6;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

.container {
  margin: 0;
  padding-top: 10vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: 0.75s;
}

.logo.tauri:hover {
  filter: drop-shadow(0 0 2em #24c8db);
}

.row {
  display: flex;
  justify-content: center;
}

a {
  font-weight: 500;
  color: #646cff;
  text-decoration: inherit;
}

a:hover {
  color: #535bf2;
}

h1 {
  text-align: center;
}

input,
button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  color: #0f0f0f;
  background-color: #ffffff;
  transition: border-color 0.25s;
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.2);
}

button {
  cursor: pointer;
}

button:hover {
  border-color: #396cd8;
}
button:active {
  border-color: #396cd8;
  background-color: #e8e8e8;
}

input,
button {
  outline: none;
}

#greet-input {
  margin-right: 5px;
}

@media (prefers-color-scheme: dark) {
  :root {
    color: #f6f6f6;
    background-color: #2f2f2f;
  }

  a:hover {
    color: #24c8db;
  }

  input,
  button {
    color: #ffffff;
    background-color: #0f0f0f98;
  }
  button:active {
    background-color: #0f0f0f69;
  }
}

</style>
