import type { PageContext } from "vike/types";

export default function lang(pageContext: PageContext): string {
  return pageContext.locale;
}
