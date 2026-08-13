/**
 * trayicon 类型声明（CJS 无自带类型）。
 * 依据实际安装版 1.2.2 源码（与本地 notes/trayicon-src 一致）：
 * module.exports = { create: Tray.create }；Tray 是 EventEmitter。
 */
declare module 'trayicon' {
  export as namespace trayicon
  export interface TrayItemOptions {
    disabled?: boolean
    checked?: boolean
    bold?: boolean
    action?: () => void
  }

  export interface TrayItem {
    uid: string
    add(...items: TrayItem[]): void
  }

  export interface Tray {
    /** 渲染菜单（items 为 tray.item()/tray.separator() 产物） */
    setMenu(...items: (TrayItem | null)[]): void
    /** 气泡通知（style info/warn/error，timeout 5000） */
    notify(title: string, msg: string, action?: () => void): void
    /** 断开（需在插件卸载时调用） */
    kill(): void
    /** 创建菜单项；点击时调用 opts.action */
    item(label: string, opts?: TrayItemOptions): TrayItem
    /** 菜单分隔线 */
    separator(): TrayItem
  }

  export interface TrayCreateOptions {
    title?: string
    /** 图标 Buffer（base64 内嵌到协议）；默认 default.ico */
    icon?: Buffer
    action?: () => void
    /** 把 exe 拷到临时目录（稳定命名保钉住） */
    useTempDir?: boolean
  }

  /** 异步：resolve 在托盘 exe 连接就绪后（'connected'） */
  export function create(
    opts: TrayCreateOptions,
    ready?: (tray: Tray) => void,
  ): Promise<Tray>

  const trayicon: { create: typeof create }
  export default trayicon
}
