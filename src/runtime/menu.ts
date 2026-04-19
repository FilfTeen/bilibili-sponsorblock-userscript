import { gmRegisterMenuCommand } from "../platform/gm";

export interface QolCoreMenuController {
  openPanel(): void;
  openHelp(): void;
  clearCache(): void | Promise<void>;
}

export const QOL_CORE_MENU_LABELS = ["打开 QoL Core 控制台", "打开 QoL Core 帮助", "清理 QoL Core 缓存"] as const;

export function registerQolCoreMenuCommands(
  controller: QolCoreMenuController,
  registerMenuCommand: (label: string, handler: () => void) => void = gmRegisterMenuCommand
): void {
  registerMenuCommand(QOL_CORE_MENU_LABELS[0], () => controller.openPanel());
  registerMenuCommand(QOL_CORE_MENU_LABELS[1], () => controller.openHelp());
  registerMenuCommand(QOL_CORE_MENU_LABELS[2], () => {
    void controller.clearCache();
  });
}
