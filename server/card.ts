import van, { Element } from "mini-van-plate/van-plate";
import {
  ImageResponse,
  loadGoogleFont,
  render,
} from "@sevenc-nanashi/workers-og";
import { PackageInfo, resolveCatalogUrl } from "../lib/catalog";

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

// export const Card = () => {};
function Card(packageInfo: PackageInfo): Element {
  const background = packageInfo.images.find((image) => image.infoImg)
    ?.infoImg?.[0];
  const rawThumbnail = packageInfo.images
    .map(({ thumbnail: source }) => source)
    .find((source) => source !== undefined && source.length > 0);
  const thumbnail = rawThumbnail && resolveCatalogUrl(rawThumbnail);
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
          fontWeight: 600,
          display: "flex",
        }),
      },
      packageInfo.name,
    ),
    div(
      {
        style: styles({
          position: "absolute",
          top: `${unit * 7}px`,
          left: `${unit * 2}px`,
          right: `${unit * 3 + thumbnailSize}px`,
          fontSize: `${unit * 0.75}px`,
          display: "flex",
        }),
      },
      packageInfo.summary,
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
    img({
      src: thumbnail ? thumbnail.toString() : "",
      style: styles({
        position: "absolute",
        top: `${unit * 4}px`,
        right: `${unit * 2}px`,
        objectFit: "cover",
        borderRadius: `${unit * 0.5}px`,
      }),
      width: thumbnailSize,
      height: thumbnailSize,
    }),
  );
}

export function renderCardHtml(packageInfo: PackageInfo) {
  return Card(packageInfo).render();
}

export async function renderCardSvg(packageInfo: PackageInfo) {
  return render({
    element: Card(packageInfo).render(),
    options: {
      width,
      height,
      format: "svg",
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
    },
  });
}

export async function renderCardImage(
  packageInfo: PackageInfo,
): Promise<ImageResponse> {
  return new ImageResponse(Card(packageInfo).render(), {
    width,
    height,
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
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
