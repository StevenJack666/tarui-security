# Copilot Instructions for Tauri + Vue 3 Desktop App

## Architecture Overview

This is a **Tauri v2** desktop application with a **Vue 3 + Vite** frontend. The architecture follows Tauri's separation pattern:

- **Frontend**: Vue 3 SFC components in `src/` using `<script setup>` syntax
- **Backend**: Rust code in `src-tauri/src/` with Tauri commands for frontend-backend communication
- **Entry Points**: `src-tauri/src/main.rs` (binary) calls `src-tauri/src/lib.rs` (library with `run()` function)

## Critical Development Workflows

### Development Server
```bash
# Start both frontend (Vite) and backend (Tauri) in development mode
npm run tauri dev
# OR use the tauri CLI directly
npx tauri dev
```

### Building
```bash
# Build for production (creates platform-specific bundles)
npm run tauri build
```

### Frontend Only
```bash
npm run dev      # Vite dev server (port 1420)
npm run build    # Frontend build to dist/
```

## Project-Specific Patterns

### Tauri Commands (Rust ↔ JavaScript Bridge)
- **Rust side**: Use `#[tauri::command]` macro in `src-tauri/src/lib.rs`
- **Register commands**: Add to `invoke_handler(tauri::generate_handler![command_name])` in `run()` function
- **Frontend side**: Import `invoke` from `@tauri-apps/api/core` and call with `await invoke("command_name", { params })`
- **Example**: See `greet` command implementation

### Library Structure (Critical)
- Main binary (`main.rs`) calls `my_tauri_demo_lib::run()` from the library crate
- Library name in `Cargo.toml` is `my_tauri_demo_lib` to avoid Windows naming conflicts
- Crate types: `["staticlib", "cdylib", "rlib"]` for different build targets

### Configuration Files
- **`src-tauri/tauri.conf.json`**: Main Tauri configuration (window settings, security, build commands)
- **`src-tauri/capabilities/default.json`**: Permission system for security (v2 feature)
- **Frontend build integration**: `beforeDevCommand: "npm run dev"`, `devUrl: "http://localhost:1420"`

### Vite Configuration
- Fixed port **1420** for Tauri integration (critical - don't change)
- Ignores `src-tauri/` directory in watch mode to prevent rebuild loops
- `clearScreen: false` to show Rust compilation errors

### Plugin System
- Plugins added in `Cargo.toml` dependencies AND `tauri.conf.json` capabilities
- Example: `tauri-plugin-opener` for opening URLs/files
- Register in `lib.rs`: `.plugin(tauri_plugin_opener::init())`

## File Organization Conventions

- **Tauri commands**: Define in `src-tauri/src/lib.rs` (or separate modules)
- **Vue components**: Standard SFC structure with `<script setup>`
- **Assets**: Static files in `public/`, imported assets in `src/assets/`
- **Icons**: Platform-specific icons in `src-tauri/icons/`

## Security & Permissions (Tauri v2)
- Capabilities-based security model in `src-tauri/capabilities/`
- Each window gets specific permissions via capability files
- Core permissions: `core:default`, plugin permissions: `plugin-name:default`

## Common Integration Points
- **Error handling**: Rust `Result` types map to JavaScript Promise rejections
- **Data serialization**: Uses `serde` for Rust structs ↔ JavaScript objects
- **Window management**: Configure in `tauri.conf.json` app.windows array
- **Build hooks**: `beforeDevCommand` and `beforeBuildCommand` coordinate frontend/backend builds