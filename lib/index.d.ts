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
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
export declare const name = "dsh-tray";
/** 全部可选依赖（webServer 动态注入）。 */
export declare const inject: string[];
export interface Config {
    enabled: boolean;
    title: string;
    iconPath?: string;
}
export declare const Config: z<Config>;
/** webServer.register 兼容的最小接口（动态注入用）。 */
export interface WebServerLike {
    port: number;
    host?: string;
}
export declare function apply(ctx: Context, config?: Config): void;
