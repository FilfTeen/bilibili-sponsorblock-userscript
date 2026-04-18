import { gmRegisterMenuCommand } from "../platform/gm";

export interface BsbMenuController {
  openPanel(): void;
  openHelp(): void;
  clearCache(): void | Promise<void>;
}

export const BSB_MENU_LABELS = ["打开 BSB 控制台", "打开 BSB 帮助", "清理 BSB 缓存"] as const;

export function registerBsbMenuCommands(
  controller: BsbMenuController,
  registerMenuCommand: (label: string, handler: () => void) => void = gmRegisterMenuCommand
): void {
  registerMenuCommand(BSB_MENU_LABELS[0], () => controller.openPanel());
  registerMenuCommand(BSB_MENU_LABELS[1], () => controller.openHelp());
  registerMenuCommand(BSB_MENU_LABELS[2], () => {
    void controller.clearCache();
  });
}
