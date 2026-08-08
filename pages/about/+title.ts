import type { PageContext } from "vike/types";
import { translate } from "../../lib/i18n/index.ts";

export default function title(pageContext: PageContext): string {
  return `${translate(pageContext.locale, "about.title")} | AviUtl2 Catalog Web`;
}
