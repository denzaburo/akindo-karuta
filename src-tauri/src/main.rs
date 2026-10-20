// あきんどカルタ 週めくりカレンダー — デスクトップウィジェット
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use std::process::Command;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{Manager, PhysicalSize};

// ---------------- Windows 起動時の自動起動 ----------------
// HKCU\...\Run に登録するだけなので、管理者権限も追加の依存も不要です。

const RUN_KEY: &str = r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run";
const RUN_NAME: &str = "AkindoKaruta";

/// コンソール窓を一瞬たりとも出さずにコマンドを実行する
fn quiet(program: &str) -> Command {
    let cmd = Command::new(program);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        let mut cmd = cmd;
        cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
        return cmd;
    }
    #[cfg(not(windows))]
    cmd
}

fn autostart_enabled() -> bool {
    if !cfg!(windows) {
        return false;
    }
    quiet("reg")
        .args(["query", RUN_KEY, "/v", RUN_NAME])
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

fn autostart_set(on: bool) -> Result<(), String> {
    if !cfg!(windows) {
        return Ok(());
    }
    if on {
        let exe = std::env::current_exe().map_err(|e| e.to_string())?;
        let value = format!("\"{}\"", exe.display());
        quiet("reg")
            .args(["add", RUN_KEY, "/v", RUN_NAME, "/t", "REG_SZ", "/d", &value, "/f"])
            .status()
            .map_err(|e| e.to_string())?;
    } else {
        let _ = quiet("reg")
            .args(["delete", RUN_KEY, "/v", RUN_NAME, "/f"])
            .status();
    }
    Ok(())
}

/// 起動のたびに登録内容を今の場所で上書きする。
/// exe を移動しても自動起動が切れないようにするための処理。
/// 値を読み取らず書き直すだけなので、日本語を含むパスでも問題は起きない。
fn autostart_refresh() {
    if autostart_enabled() {
        let _ = autostart_set(true);
    }
}

fn autostart_label(on: bool) -> String {
    if on {
        "✓ Windows起動時に開く".into()
    } else {
        "　 Windows起動時に開く".into()
    }
}

// ---------------- 保存 ----------------
// %APPDATA%\jp.denzaburo.akindo-karuta\<name>.json

fn state_path(app: &tauri::AppHandle, name: &str) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("保存先が取得できません: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("保存先が作成できません: {e}"))?;
    Ok(dir.join(format!("{name}.json")))
}

#[tauri::command]
fn load_state(app: tauri::AppHandle, name: String) -> Result<String, String> {
    let p = state_path(&app, &name)?;
    if !p.exists() {
        return Ok("{}".into());
    }
    fs::read_to_string(&p).map_err(|e| format!("読み込みに失敗しました: {e}"))
}

#[tauri::command]
fn save_state(app: tauri::AppHandle, name: String, json: String) -> Result<(), String> {
    let p = state_path(&app, &name)?;
    fs::write(&p, json).map_err(|e| format!("保存に失敗しました: {e}"))
}

// ---------------- ウィンドウ操作 ----------------

/// バーをつかんでウィンドウを動かす
#[tauri::command]
fn start_drag(window: tauri::Window) -> Result<(), String> {
    window.start_dragging().map_err(|e| e.to_string())
}

#[tauri::command]
fn set_always_on_top(window: tauri::Window, v: bool) -> Result<(), String> {
    window.set_always_on_top(v).map_err(|e| e.to_string())?;
    // 最前面を切り替えた直後にドラッグが効かなくなるのを防ぐ
    let _ = window.set_focus();
    Ok(())
}

/// 中身の大きさに合わせてウィンドウを伸縮させる
#[tauri::command]
fn fit_window(window: tauri::Window, w: f64, h: f64) -> Result<(), String> {
    let scale = window.scale_factor().unwrap_or(1.0);
    let size = PhysicalSize::new(
        (w * scale).round().max(120.0) as u32,
        (h * scale).round().max(80.0) as u32,
    );
    window.set_size(size).map_err(|e| e.to_string())
}

/// ✕ は終了せず、通知領域へしまう
#[tauri::command]
fn hide_window(window: tauri::Window) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

/// 既定のブラウザでURLを開く（YouTubeリンクなど）
#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    if !(url.starts_with("https://") || url.starts_with("http://")) {
        return Err("不正なURLです".into());
    }
    #[cfg(windows)]
    {
        quiet("cmd")
            .args(["/C", "start", "", &url])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(not(windows))]
    {
        Command::new("xdg-open").arg(&url).spawn().map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ---------------- 起動 ----------------

fn main() {
    tauri::Builder::default()
        // ウィンドウの位置・大きさを終了時に覚え、次回そこに開く
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .setup(|app| {
            // 前回登録した場所と今の場所がずれていても自動で追従させる
            autostart_refresh();

            let show = MenuItem::with_id(app, "show", "カレンダーを表示", true, None::<&str>)?;
            let auto = MenuItem::with_id(
                app,
                "auto",
                autostart_label(autostart_enabled()),
                true,
                None::<&str>,
            )?;
            let quit = MenuItem::with_id(app, "quit", "終了", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &auto, &quit])?;

            let auto_item = auto.clone();
            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("あきんどカルタ 週めくりカレンダー")
                .menu(&menu)
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "auto" => {
                        let next = !autostart_enabled();
                        let _ = autostart_set(next);
                        let _ = auto_item.set_text(autostart_label(autostart_enabled()));
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_state,
            save_state,
            start_drag,
            set_always_on_top,
            fit_window,
            hide_window,
            open_url
        ])
        .run(tauri::generate_context!())
        .expect("アプリの起動に失敗しました");
}
