import type { PackageInfo } from "./catalog";
const allowedCopyDestinations: {
  from: string;
  to: string;
}[] = [
  { from: "Script", to: "{scriptsDir}" },
  { from: "Plugin", to: "{pluginsDir}" },
  { from: "Script", to: "{dataDir}/Script" },
  { from: "Plugin", to: "{dataDir}/Plugin" },
  { from: "Language", to: "{dataDir}/Language" },
  { from: "Alias", to: "{dataDir}/Alias" },
  { from: "Figure", to: "{dataDir}/Figure" },
  { from: "Transition", to: "{dataDir}/Transition" },
  { from: "Preset", to: "{dataDir}/Preset" },
  { from: "Default", to: "{dataDir}/Default" },
];

function isWithinDirectory(path: string, directory: string): boolean {
  return path === directory || path.startsWith(`${directory}/`);
}

/**
 * 直接ダウンロードするかどうか。
 *
 * au2pkgっぽいパッケージ、または1ファイルで完結するパッケージは直接ダウンロード可能とする。
 * ただしboothは提供不可なのでそれは無条件で除外する。
 *
 * 流石にau2pkgじゃないのにau2pkg形式の構造にしている人はいないでしょう...
 */
export function shouldShowDirectDownload(packageInfo: PackageInfo): string | null {
  if ("booth" in packageInfo.installer.source) {
    return null;
  }

  const downloadUrl = `/api/package/${encodeURIComponent(packageInfo.id)}/download`;

  if (packageInfo.installer.install.length > 2) {
    const isFirstActionDownload = packageInfo.installer.install[0].action === "download";
    const isSecondActionExtract = packageInfo.installer.install[1].action === "extract";
    const areCopiesAu2pkgLike = packageInfo.installer.install.slice(2).every((action) => {
      if (action.action !== "copy") {
        return false;
      }
      for (const allowed of allowedCopyDestinations) {
        if (
          isWithinDirectory(action.from, "{tmp}/" + allowed.from) &&
          isWithinDirectory(action.to, allowed.to)
        ) {
          return true;
        }
      }
      return false;
    });

    if (isFirstActionDownload && isSecondActionExtract && areCopiesAu2pkgLike) {
      return downloadUrl;
    }
  }

  const [downloadAction, copyAction] = packageInfo.installer.install;
  if (
    packageInfo.installer.install.length === 2 &&
    downloadAction.action === "download" &&
    copyAction.action === "copy" &&
    allowedCopyDestinations.some((allowed) => isWithinDirectory(copyAction.to, allowed.to))
  ) {
    return downloadUrl;
  }

  return null;
}
