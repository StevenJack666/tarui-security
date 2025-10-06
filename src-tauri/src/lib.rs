use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Local};

// 文件信息结构体
#[derive(Serialize, Deserialize, Clone)]
struct FileInfo {
    name: String,
    path: String,
    size: u64,
    modified: String,
    extension: String,
}

// 系统信息结构体
#[derive(Serialize, Deserialize, Clone)]
struct SystemInfo {
    os: String,
    arch: String,
    hostname: String,
    username: String,
    app_path: String,
    timestamp: String,
    memory_info: String,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// 读取文件内容的命令 - 简化版本，只返回内容
#[tauri::command]
fn read_file_content(file_path: String) -> Result<String, String> {
    match fs::read_to_string(&file_path) {
        Ok(content) => {
            println!("成功读取文件: {}", file_path);
            Ok(content)
        },
        Err(e) => {
            eprintln!("读取文件失败: {}", e);
            Err(format!("读取文件失败: {}", e))
        }
    }
}

// 扫描目录并返回文件列表
#[tauri::command]
fn scan_directory(path: String, extensions: Vec<String>, include_subdirs: bool) -> Result<Vec<FileInfo>, String> {
    let dir_path = Path::new(&path);
    
    if !dir_path.exists() {
        return Err(format!("目录不存在: {}", path));
    }
    
    if !dir_path.is_dir() {
        return Err(format!("路径不是目录: {}", path));
    }
    
    let mut files = Vec::new();
    
    match scan_directory_recursive(dir_path, &extensions, include_subdirs, &mut files) {
        Ok(_) => {
            println!("扫描完成，找到 {} 个文件", files.len());
            Ok(files)
        },
        Err(e) => {
            eprintln!("扫描目录失败: {}", e);
            Err(format!("扫描目录失败: {}", e))
        }
    }
}

// 递归扫描目录的辅助函数
fn scan_directory_recursive(
    dir: &Path, 
    extensions: &[String], 
    include_subdirs: bool, 
    files: &mut Vec<FileInfo>
) -> Result<(), Box<dyn std::error::Error>> {
    let entries = fs::read_dir(dir)?;
    
    for entry in entries {
        let entry = entry?;
        let path = entry.path();
        
        if path.is_file() {
            // 检查文件扩展名
            if should_include_file(&path, extensions) {
                match create_file_info(&path) {
                    Ok(file_info) => files.push(file_info),
                    Err(e) => eprintln!("处理文件失败 {}: {}", path.display(), e),
                }
            }
        } else if path.is_dir() && include_subdirs {
            // 递归扫描子目录
            if let Err(e) = scan_directory_recursive(&path, extensions, include_subdirs, files) {
                eprintln!("扫描子目录失败 {}: {}", path.display(), e);
            }
        }
    }
    
    Ok(())
}

// 检查文件是否应该包含在结果中
fn should_include_file(path: &Path, extensions: &[String]) -> bool {
    // 如果扩展名列表包含 "*"，则包含所有文件
    if extensions.contains(&"*".to_string()) {
        return true;
    }
    
    // 获取文件扩展名
    if let Some(ext) = path.extension() {
        if let Some(ext_str) = ext.to_str() {
            return extensions.iter().any(|allowed_ext| 
                ext_str.to_lowercase() == allowed_ext.to_lowercase()
            );
        }
    }
    
    false
}

// 创建文件信息结构体
fn create_file_info(path: &Path) -> Result<FileInfo, Box<dyn std::error::Error>> {
    let metadata = fs::metadata(path)?;
    let modified = metadata.modified()?;
    let modified_str = format!("{:?}", modified);
    
    let name = path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Unknown")
        .to_string();
    
    let extension = path.extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_string();
    
    let path_str = path.to_string_lossy().to_string();
    
    Ok(FileInfo {
        name,
        path: path_str,
        size: metadata.len(),
        modified: modified_str,
        extension,
    })
}

// 获取系统信息的命令
#[tauri::command]
fn get_system_info() -> Result<SystemInfo, String> {
    use std::env;
    
    let os = if cfg!(target_os = "macos") {
        "macOS".to_string()
    } else if cfg!(target_os = "windows") {
        "Windows".to_string()
    } else if cfg!(target_os = "linux") {
        "Linux".to_string()
    } else {
        "Unknown".to_string()
    };
    
    let arch = if cfg!(target_arch = "x86_64") {
        "x86_64".to_string()
    } else if cfg!(target_arch = "aarch64") {
        "ARM64".to_string()
    } else {
        env::consts::ARCH.to_string()
    };
    
    let hostname = env::var("HOSTNAME")
        .or_else(|_| env::var("COMPUTERNAME"))
        .unwrap_or_else(|_| "Unknown".to_string());
    
    let username = env::var("USER")
        .or_else(|_| env::var("USERNAME"))
        .unwrap_or_else(|_| "Unknown".to_string());
    
    let app_path = env::current_exe()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|_| "Unknown".to_string());
    
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs().to_string())
        .unwrap_or_else(|_| "Unknown".to_string());
    
    // 获取内存信息（简化版）
    let memory_info = if cfg!(target_os = "macos") {
        "macOS Memory Info Available".to_string()
    } else {
        "Memory info not available".to_string()
    };
    
    Ok(SystemInfo {
        os,
        arch,
        hostname,
        username,
        app_path,
        timestamp,
        memory_info,
    })
}

// 写入日志文件的命令
#[tauri::command]
fn write_log(message: String) -> Result<String, String> {
    use std::fs::OpenOptions;
    use std::io::Write;
    use std::env;
    // 获取用户目录
    let user = env::var("USER").unwrap_or_else(|_| "unknown".to_string());
    let log_dir = format!("/Users/{}/.system_logs", user);
    
    // 创建日志目录（如果不存在）
    if let Err(e) = std::fs::create_dir_all(&log_dir) {
        return Err(format!("创建日志目录失败: {}", e));
    }
    
    // 日志文件路径
    let log_file = format!("{}/activity.log", log_dir);
    
    // 添加时间戳到消息 - 格式化为年月日 时分秒
    let now: DateTime<Local> = Local::now();
    let formatted_timestamp = now.format("%Y-%m-%d %H:%M:%S").to_string();
    
    let formatted_message = format!("[{}] {}\n", formatted_timestamp, message);
    
    // 写入日志文件
    match OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file) {
        Ok(mut file) => {
            if let Err(e) = file.write_all(formatted_message.as_bytes()) {
                Err(format!("写入日志失败: {}", e))
            } else {
                Ok(format!("日志已写入: {}", log_file))
            }
        },
        Err(e) => Err(format!("打开日志文件失败: {}", e))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![greet, 
            read_file_content, 
            scan_directory,
            get_system_info, 
            write_log])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
