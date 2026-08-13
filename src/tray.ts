/**
 * TrayService：trayicon 封装——托盘生命周期管理（create/setMenu/notify/kill）。
 * 纯业务封装，不直接触碰 ctx（便于测试与复用）。
 */

import trayicon from 'trayicon'
import type * as TrayiconNS from 'trayicon'

export interface TrayMenuAction {
  /** 菜单项文本 */
  label: string
  /** 点击回调 */
  action?: () => void
  disabled?: boolean
}

export interface TrayServiceOptions {
  title?: string
  iconPath?: string
}

export class TrayService {
  private tray: TrayiconNS.Tray | null = null
  private readonly title: string
  private readonly iconPath?: string
  /** 并发去重：start() 被多次调用时共享同一个 pending promise */
  private starting: Promise<void> | null = null

  constructor(options: TrayServiceOptions = {}) {
    this.title = options.title ?? 'DSH'
    this.iconPath = options.iconPath
  }

  /** 创建托盘并等待 exe 连接就绪。幂等：已启动或启动中直接返回。 */
  start(): Promise<void> {
    if (this.tray !== null) return Promise.resolve()
    if (this.starting !== null) return this.starting
    this.starting = this.startImpl().finally(() => {
      this.starting = null
    })
    return this.starting
  }

  private async startImpl(): Promise<void> {
    let icon: Buffer | undefined
    if (this.iconPath) {
      const { readFileSync } = await import('node:fs')
      icon = readFileSync(this.iconPath)
    }
    this.tray = await trayicon.create({
      title: this.title,
      icon,
      // ⚠️ 不用 useTempDir：复制 exe 到 temp 后立即 spawn 在 Windows 上会 EBUSY
      //（文件句柄未释放）。直接用包内 rsrcs/trayicon.exe 无复制步骤。
    })
  }

  /** 渲染菜单：打开界面 / 状态 / 分隔 / 退出。 */
  setMenu(items: TrayMenuAction[]): void {
    if (this.tray === null) return
    const built = items.map((it) =>
      it.label === '-'
        ? this.tray!.separator()
        : this.tray!.item(it.label, {
            action: it.action,
            disabled: it.disabled,
          }),
    )
    this.tray.setMenu(...built)
  }

  /** 气泡通知。 */
  notify(title: string, msg: string, action?: () => void): void {
    this.tray?.notify(title, msg, action)
  }

  /** 断开并清理（插件卸载时调用）。 */
  dispose(): void {
    if (this.tray !== null) {
      this.tray.kill()
      this.tray = null
    }
  }

  get running(): boolean {
    return this.tray !== null
  }
}
