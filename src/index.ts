/**
 * dsh-tray 入口：apply 风格 cordis 插件。
 *
 * 技术基础（另一窗口查证，2026-08-14 简报）：
 *  - trayicon@1.2.2：Windows 托盘宿主 exe + TCP + XML，无 native 编译，win32-only
 *  - API：Tray.create({title, icon, useTempDir}, ready) → setMenu/item/separator/notify/kill
 *
 * 关键决策（对齐 event-auditor 已验证模式）：
 *  - webServer 用 ctx.inject 动态注入（headless 无此服务不阻塞，菜单降级）
 *  - 所有资源用 ctx.effect 包裹（卸载时 tray.kill() + exe 退出）
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'

import { TrayService } from './tray.js'

export const name = 'dsh-tray'

/** 全部可选依赖（webServer 动态注入）。 */
export const inject: string[] = []

export interface Config {
  enabled: boolean
  title: string
  iconPath?: string
}

export const Config: z<Config> = z.object({
  enabled: z.boolean().default(true),
  title: z.string().default('DSH'),
  iconPath: z.string().default(''),
})

/** webServer.register 兼容的最小接口（动态注入用）。 */
export interface WebServerLike {
  port: number
  host?: string
}

export function apply(ctx: Context, config?: Config): void {
  const resolved: Config = {
    enabled: config?.enabled ?? true,
    title: config?.title ?? 'DSH',
    iconPath: config?.iconPath,
  }

  if (!resolved.enabled) return

  // win32-only：非 Windows 平台直接跳过（避免 spawn exe 失败噪音）
  if (process.platform !== 'win32') {
    ctx.logger.warn('[dsh-tray] 仅支持 Windows，已跳过')
    return
  }

  const tray = new TrayService({ title: resolved.title, iconPath: resolved.iconPath })

  // 异步启动：失败不崩插件，仅记日志（如 exe 缺失/被杀）
  tray.start().catch((err: unknown) => {
    ctx.logger.warn(`[dsh-tray] 托盘启动失败: ${err instanceof Error ? err.message : String(err)}`)
  })

  // 菜单构建依赖 webServer 端口 → 动态注入；headless 无 webServer 时降级为状态/退出
  // 菜单构建依赖 webServer 端口 → 动态注入；headless 无 webServer 时降级为状态/退出
  ctx.inject(['webServer'], (sctx) => {
    const ws = (sctx as unknown as { webServer?: WebServerLike }).webServer
    if (ws === undefined) return
    tray.start()
      .then(() => {
        tray.setMenu([
          {
            label: '打开界面',
            action: () => {
              const url = `http://${ws.host ?? '127.0.0.1'}:${ws.port}`
              tray.notify('DSH', `界面地址: ${url}`)
            },
          },
          {
            label: '状态',
            action: () => {
              tray.notify('DSH', `webServer: ${ws.host ?? '127.0.0.1'}:${ws.port}`)
            },
          },
          { label: '-' },
          {
            label: '退出',
            action: () => {
              tray.dispose()
            },
          },
        ])
      })
      .catch((err: unknown) => {
        ctx.logger.warn(`[dsh-tray] 托盘启动失败: ${err instanceof Error ? err.message : String(err)}`)
      })
  })

  // 生命周期清理：插件卸载时 kill 托盘（exe 随 client 断开退出）
  ctx.effect(
    () => () => {
      tray.dispose()
    },
    'dsh-tray: cleanup',
  )
}
