/**
 * TrayService：trayicon 封装——托盘生命周期管理（create/setMenu/notify/kill）。
 * 纯业务封装，不直接触碰 ctx（便于测试与复用）。
 */
import trayicon from 'trayicon';
export class TrayService {
    tray = null;
    title;
    iconPath;
    /** 并发去重：start() 被多次调用时共享同一个 pending promise */
    starting = null;
    constructor(options = {}) {
        this.title = options.title ?? 'DSH';
        this.iconPath = options.iconPath;
    }
    /** 创建托盘并等待 exe 连接就绪。幂等：已启动或启动中直接返回。 */
    start() {
        if (this.tray !== null)
            return Promise.resolve();
        if (this.starting !== null)
            return this.starting;
        this.starting = this.startImpl().finally(() => {
            this.starting = null;
        });
        return this.starting;
    }
    async startImpl() {
        let icon;
        if (this.iconPath) {
            const { readFileSync } = await import('node:fs');
            icon = readFileSync(this.iconPath);
        }
        this.tray = await trayicon.create({
            title: this.title,
            icon,
            // ⚠️ 不用 useTempDir：复制 exe 到 temp 后立即 spawn 在 Windows 上会 EBUSY
            //（文件句柄未释放）。直接用包内 rsrcs/trayicon.exe 无复制步骤。
        });
    }
    /** 渲染菜单：打开界面 / 状态 / 分隔 / 退出。 */
    setMenu(items) {
        if (this.tray === null)
            return;
        const built = items.map((it) => it.label === '-'
            ? this.tray.separator()
            : this.tray.item(it.label, {
                action: it.action,
                disabled: it.disabled,
            }));
        this.tray.setMenu(...built);
    }
    /** 气泡通知。 */
    notify(title, msg, action) {
        this.tray?.notify(title, msg, action);
    }
    /** 断开并清理（插件卸载时调用）。 */
    dispose() {
        if (this.tray !== null) {
            this.tray.kill();
            this.tray = null;
        }
    }
    get running() {
        return this.tray !== null;
    }
}
