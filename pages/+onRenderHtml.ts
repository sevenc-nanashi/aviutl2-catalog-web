export { onRenderHtml };

import { onRenderHtml as onRenderHtmlVike } from "vike-vue/__internal/integration/onRenderHtml";
import type { OnRenderHtmlAsync } from "vike/types";
import type { InjectFilterEntry } from "vike/types";

const onRenderHtml: OnRenderHtmlAsync = async function (pageContext) {
  const result = await onRenderHtmlVike(pageContext);

  return {
    ...result,
    injectFilter(assets: InjectFilterEntry[]) {
      for (const asset of assets) {
        if (asset.assetType === "font") {
          asset.inject = false;
        }
      }
    },
  };
};
