/**
 * TrayService：trayicon 封装——托盘生命周期管理（create/setMenu/notify/kill）。
 * 纯业务封装，不直接触碰 ctx（便于测试与复用）。
 */
export interface TrayMenuAction {
    /** 菜单项文本 */
    label: string;
    /** 点击回调 */
    action?: () => void;
    disabled?: boolean;
}
export interface TrayServiceOptions {
    title?: string;
    iconPath?: string;
}
export declare class TrayService {
    private tray;
    private readonly title;
    private readonly iconPath?;
    /** 并发去重：start() 被多次调用时共享同一个 pending promise */
    private starting;
    constructor(options?: TrayServiceOptions);
    /** 创建托盘并等待 exe 连接就绪。幂等：已启动或启动中直接返回。 */
    start(): Promise<void>;
    private startImpl;
    /** 渲染菜单：打开界面 / 状态 / 分隔 / 退出。 */
    setMenu(items: TrayMenuAction[]): void;
    /** 气泡通知。 */
    notify(title: string, msg: string, action?: () => void): void;
    /** 断开并清理（插件卸载时调用）。 */
    dispose(): void;
    get running(): boolean;
}
