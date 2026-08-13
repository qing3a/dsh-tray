# dsh-tray

DeepSeek Harness Windows 系统托盘插件：托盘图标 + 菜单（打开界面 / 状态 / 退出）+ 气泡通知。

> 基于 `trayicon@1.2.2`（exe 宿主进程 + TCP + XML 协议，无 native 编译）。win32-only。
> 状态：✅ 已在本地 DSH 源码环境验证（web 单托盘进程 + headless 降级，2026-08-14）。

## 功能

- 系统托盘图标（默认 default.ico，可配置 iconPath）
- 菜单：打开界面（读 webServer.port 动态拼接 URL）/ 状态 / 退出
- 气泡通知（info 风格）
- **headless 兼容**：无 webServer 时自动降级（不崩、不阻塞加载）

## 安装

```bash
# 生产安装（npm，agent 可直接执行）
pnpm dsh plugin --profile web add @qing3a/dsh-tray
pnpm dsh --profile web
# Windows 任务栏应出现 DSH 托盘图标

# 开发模式（需 Node >= 22 + pnpm）
git clone https://github.com/qing3a/dsh-tray.git
cd dsh-tray && pnpm install && pnpm build
cd <path-to-deepseek-harness>
pnpm dsh plugin --profile web add link:$(pwd)/dsh-tray
```

## 卸载

```bash
pnpm dsh plugin --profile web remove @qing3a/dsh-tray
```

## 配置

| 键 | 默认 | 说明 |
|---|---|---|
| `enabled` | `true` | 总开关 |
| `title` | `DSH` | 托盘标题（决定 temp 命名） |
| `iconPath` | 空 | 自定义图标路径（.ico/.png Buffer）；留空用 default.ico |

## 已知实现要点

- **不用 trayicon 的 useTempDir**：复制 exe 到 temp 后立即 spawn 在 Windows 会 `spawn EBUSY`（文件句柄未释放），直接 spawn 包内 exe 无此问题
- **并发去重**：`start()` 幂等（pending promise 共享），避免 apply 与 inject 并发调用导致双托盘
- **非 win32 平台自动跳过**（`process.platform !== 'win32'`）
- webServer 用 `ctx.inject` 动态注入（headless 无此服务不阻塞）

## 许可

MIT
