import type { PackageInfo } from "./catalog";

/**
 * パッケージ詳細ページで直接ダウンロードを優先するかを判定します。
 *
 * 直接ダウンロードを有効にしたいパッケージの条件を、後からここへ追加してください。
 */
export function shouldShowDirectDownload(_packageInfo: PackageInfo): boolean {
  return false;
}
