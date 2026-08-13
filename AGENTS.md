# AGENTS.md — dsh-tray

DSH（DeepSeek Harness）Windows 系统托盘插件（win32-only，基于 trayicon exe 宿主）。

## 仓库速览

- `src/index.ts` — cordis apply 入口（name / Config / apply；webServer 用 ctx.inject 动态注入）
- `src/tray.ts` — TrayService：trayicon 封装（start 幂等去重 / setMenu / notify / dispose）
- `src/trayicon.d.ts` — trayicon@1.2.2 类型声明（CJS 无自带类型；`export as namespace` + named exports 双用）
- `cordis.patch.yml` — insert 声明

## 开发

```sh
pnpm install
pnpm build        # tsc → lib/
```

- ESM：源码 import 带 `.js` 后缀；`"type": "module"`
- `@deepseek-ai/cordis` 仅 devDep（类型）；运行时依赖 trayicon + @deepseek-ai/schemastery
- trayicon 是 CJS（`module.exports = {create}`），`import trayicon from 'trayicon'` 经 esModuleInterop 可用

## 关键约束（踩坑记录）

- **不用 useTempDir**：`trayicon.create({useTempDir: true})` 复制 exe 到 temp 后立即 spawn → `spawn EBUSY`。直接 spawn 包内 `rsrcs/trayicon.exe`
- **start() 必须幂等**：apply 顶部和 ctx.inject(['webServer']) 里都会调 start()，不幂等会 spawn 双托盘进程。用 `starting` pending promise 去重
- **非 win32 平台跳过**：`process.platform !== 'win32'` 时直接 return（避免 spawn exe 失败噪音）
- **生命周期**：`ctx.effect(() => () => tray.dispose(), ...)` — kill() 后 client 断开 → exe 自动退出
- **API 漂移防身**：trayicon 是 npm 稳定包（1.2.2，无 rc），与本地 notes/trayicon-src 源码一致已验证；schemastery 无 `.optional()`，可选字段用 `.default('')`

## 本地验证（已通过 2026-08-14）

```sh
# web：托盘图标出现 + 单 trayicon 进程 + 首页 200
pnpm dsh plugin --profile web add link:<本插件绝对路径>
pnpm dsh --profile web
# 验证：Get-Process trayicon 计数 = 1；卸载后托盘消失

# headless：无 webServer 降级不崩
pnpm dsh plugin --profile headless add link:<本插件绝对路径>
pnpm dsh --profile headless "hi"   # 正常回复，无托盘启动报错
```
