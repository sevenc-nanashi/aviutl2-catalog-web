import van, { type Element } from "mini-van-plate/van-plate";
import { resolveCatalogUrl } from "../lib/catalog.ts";
import type { PackageInfo } from "../lib/catalog.ts";
import { packageCategory, type PackageCategory } from "../lib/packageList.ts";

const { div, img } = van.tags;

function styles(
  styles: Record<string, string | number | undefined | null>,
): string {
  return Object.entries(styles)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(
      ([key, value]) =>
        `${key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}:${value}`,
    )
    .join(";");
}

const unit = 40;
const width = 1280;
const height = 640;
const font = "Noto Sans JP";

const thumbnailIconPaths = {
  core: [
    "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
    "M10 4v4M2 8h20M6 4v4",
  ],
  mod: [
    "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
    "M10 4v4M2 8h20M6 4v4",
  ],
  "input-plugin": [
    "M4 11V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1",
    "M14 2v5a1 1 0 0 0 1 1h5M2 15h10m-3 3 3-3-3-3",
  ],
  "output-plugin": [
    "M4.226 20.925A2 2 0 0 0 6 22h12a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v3.127",
    "M14 2v5a1 1 0 0 0 1 1h5M5 11l-3 3 3 3m-3-3h10",
  ],
  "general-plugin": [
    "M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0Z",
  ],
  "filter-plugin": [
    "M10 5H3m9 14H3M14 3v4m2 10v4m5-9h-9m9 7h-5m5-14h-7M8 10v4m0-2H3",
  ],
  script: [
    "M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4",
    "M14 2v4a2 2 0 0 0 2 2h4M5 12l-3 3 3 3m4 0 3-3-3-3",
  ],
  other: [
    "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4ZM12 22V12",
    "M3.29 7 12 12l8.71-5M7.5 4.27l9 5.15",
  ],
} as const satisfies Record<Exclude<PackageCategory, "all">, readonly string[]>;

function ThumbnailPlaceholder(packageInfo: PackageInfo, size: number): Element {
  const iconPaths = thumbnailIconPaths[packageCategory(packageInfo)];
  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconPaths.map((data) => `<path d="${data}"/>`).join("")}</svg>`;
  const iconSource = `data:image/svg+xml,${encodeURIComponent(iconSvg)}`;
  return div(
    {
      style: styles({
        position: "absolute",
        top: `${unit * 4}px`,
        right: `${unit * 2}px`,
        width: `${size}px`,
        height: `${size}px`,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f1f5f9",
        border: "1px solid #cbd5e1",
        borderRadius: `${unit * 0.5}px`,
        display: "flex",
      }),
    },
    div(
      {
        style: styles({
          width: `${unit * 2.5}px`,
          height: `${unit * 2.5}px`,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: `${unit * 0.5}px`,
          display: "flex",
        }),
      },
      img({
        src: iconSource,
        width: unit * 1.25,
        height: unit * 1.25,
      }),
    ),
  );
}

// export const Card = () => {};
function Card(packageInfo: PackageInfo): Element {
  const background = packageInfo.images.find((image) => image.infoImg)
    ?.infoImg?.[0];
  const rawThumbnail = packageInfo.images
    .map(({ thumbnail: source }) => source)
    .find((source) => source !== undefined && source.length > 0);
  const thumbnail =
    rawThumbnail === undefined ? undefined : resolveCatalogUrl(rawThumbnail);
  const thumbnailSize = height - unit * 8;

  return div(
    {
      style: styles({
        position: "absolute",
        width: `${width}px`,
        height: `${height}px`,
        fontFamily: font,
        fontSize: `${unit}px`,
        display: "flex",
        backgroundColor: "#f8fafc",
      }),
    },
    div({
      style: styles({
        position: "absolute",
        left: 0,
        top: 0,
        width: `${width}px`,
        height: `${height}px`,
        backgroundImage: background && `url(${resolveCatalogUrl(background)})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: 0.2,
        display: "flex",
      }),
    }),
    div(
      {
        style: styles({
          position: "absolute",
          top: `${unit * 2}px`,
          left: `${unit * 2}px`,
          padding: `${unit * 0.25}px ${unit * 0.5}px`,
          alignItems: "center",
          backgroundColor: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "9999px",
          color: "#1d4ed8",
          fontSize: `${unit * 0.5}px`,
          fontWeight: 600,
          display: "flex",
        }),
      },
      packageInfo.type,
    ),
    div(
      {
        style: styles({
          position: "absolute",
          top: `${unit * 4}px`,
          left: `${unit * 2}px`,
          right: `${unit * 3 + thumbnailSize}px`,
          fontSize: `${unit * 1.5}px`,
          display: "flex",
          flexDirection: "column",
          gap: `${unit * 0.5}px`,
          wordBreak: "break-word",
        }),
      },

      div(
        {
          style: styles({
            fontSize: `${unit * 1.5}px`,
            fontWeight: 600,
            display: "flex",
          }),
        },
        packageInfo.name.replaceAll(/(?<=[_\.])/g, /* zwsp */ "\u200B"),
      ),
      div(
        {
          style: styles({
            fontSize: `${unit * 0.75}px`,
            display: "flex",
          }),
        },
        packageInfo.summary,
      ),
    ),
    div(
      {
        style: styles({
          position: "absolute",
          bottom: `${unit * 2}px`,
          left: `${unit * 2}px`,
          fontSize: `${unit * 0.5}px`,
          display: "flex",
        }),
      },
      `${packageInfo["latest-version"]}・${packageInfo.author}・${packageInfo.id}`,
    ),
    thumbnail === undefined
      ? ThumbnailPlaceholder(packageInfo, thumbnailSize)
      : img({
          src: thumbnail.toString(),
          style: styles({
            position: "absolute",
            top: `${unit * 4}px`,
            right: `${unit * 2}px`,
            objectFit: "cover",
            borderRadius: `${unit * 0.5}px`,
            border: "2px solid #cbd5e1",
          }),
          width: thumbnailSize,
          height: thumbnailSize,
        }),
  );
}

export function renderCardHtml(packageInfo: PackageInfo) {
  return Card(packageInfo).render();
}

export async function renderCardSvg(packageInfo: PackageInfo): Promise<string> {
  const { loadGoogleFont, renderSvg } =
    await import("@sevenc-nanashi/workers-og");
  return await renderSvg(Card(packageInfo).render(), {
    width,
    height,
    fonts: [
      {
        name: "Noto Sans JP",
        data: await loadGoogleFont({ family: "Noto Sans JP", weight: 600 }),
        weight: 600,
      },
      {
        name: "Noto Sans JP",
        data: await loadGoogleFont({ family: "Noto Sans JP", weight: 400 }),
        weight: 400,
      },
    ],
  });
}

export async function renderCardImage(
  packageInfo: PackageInfo,
): Promise<Uint8Array<ArrayBuffer>> {
  const { loadGoogleFont, renderImage } =
    await import("@sevenc-nanashi/workers-og");
  return await renderImage(Card(packageInfo).render(), {
    width,
    height,
    format: "png",
    fonts: [
      {
        name: "Noto Sans JP",
        data: await loadGoogleFont({ family: "Noto Sans JP", weight: 600 }),
        weight: 600,
      },
      {
        name: "Noto Sans JP",
        data: await loadGoogleFont({ family: "Noto Sans JP", weight: 400 }),
        weight: 400,
      },
    ],
  });
}
