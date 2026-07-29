import { escapeAttribute, escapeText } from "entities";
import { Parser } from "htmlparser2";
import MarkdownIt from "markdown-it";
import githubAlerts from "markdown-it-github-alerts";
import type { RenderRule } from "markdown-it/lib/renderer.mjs";
import type { RuleBlock } from "markdown-it/lib/parser_block.mjs";
import { toRawGithubProxyUrl } from "../lib/catalog.ts";
import { translate, type SupportedLocale } from "../lib/i18n/index.ts";

const DETAILS_OPEN_RE = /^<details\b[^>]*>/i;
const DETAILS_OPEN_LINE_RE = /^<details\b[^>]*>\s*$/i;
const DETAILS_CLOSE_LINE_RE = /^<\/details>\s*$/i;
const SUMMARY_RE = /^\s*(<summary\b[^>]*>[\s\S]*?<\/summary>)([\s\S]*)$/i;

const alertIcons = {
  note: '<svg aria-hidden="true" data-is-alert-icon="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
  tip: '<svg aria-hidden="true" data-is-alert-icon="true" viewBox="0 0 24 24"><path d="M9 18h6M10 22h4M8.7 15.1a7 7 0 1 1 6.6 0c-.8.5-1.3 1.3-1.3 2.2V18h-4v-.7c0-.9-.5-1.7-1.3-2.2Z"/></svg>',
  important:
    '<svg aria-hidden="true" data-is-alert-icon="true" viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/><path d="M12 7v4M12 15h.01"/></svg>',
  warning:
    '<svg aria-hidden="true" data-is-alert-icon="true" viewBox="0 0 24 24"><path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/><path d="M12 9v4M12 17h.01"/></svg>',
  caution:
    '<svg aria-hidden="true" data-is-alert-icon="true" viewBox="0 0 24 24"><path d="M12 2 2 12l10 10 10-10Z"/><path d="M12 8v5M12 17h.01"/></svg>',
};

function getLineText(state: Parameters<RuleBlock>[0], line: number): string {
  const start = state.bMarks[line] + state.tShift[line];
  return state.src.slice(start, state.eMarks[line]);
}

function findDetailsEndLine(
  state: Parameters<RuleBlock>[0],
  startLine: number,
  endLine: number,
): number | undefined {
  let depth = 0;

  for (let line = startLine; line < endLine; line += 1) {
    const lineText = getLineText(state, line);
    if (DETAILS_OPEN_LINE_RE.test(lineText)) {
      depth += 1;
    } else if (DETAILS_CLOSE_LINE_RE.test(lineText)) {
      depth -= 1;
      if (depth === 0) {
        return line + 1;
      }
    }
  }
  return undefined;
}

const detailsBlockRule: RuleBlock = (state, startLine, endLine, silent) => {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  if (state.sCount[startLine] - state.blkIndent >= 4 || state.src.charCodeAt(start) !== 0x3c) {
    return false;
  }
  const lineText = state.src.slice(start, state.eMarks[startLine]);
  if (!DETAILS_OPEN_LINE_RE.test(lineText)) {
    return false;
  }

  const nextLine = findDetailsEndLine(state, startLine, endLine);
  if (nextLine === undefined) {
    return false;
  }
  if (silent) {
    return true;
  }

  const block = state.getLines(startLine, nextLine, state.blkIndent, true);
  const openTagMatch = DETAILS_OPEN_RE.exec(block);
  const closeTagIndex = block.toLowerCase().lastIndexOf("</details>");
  if (openTagMatch === null || closeTagIndex < 0) {
    return false;
  }

  const openTag = openTagMatch[0];
  const inner = block.slice(openTag.length, closeTagIndex);
  const summaryMatch = SUMMARY_RE.exec(inner);
  const summaryHtml = summaryMatch?.[1]?.trim();
  const bodyMarkdown = summaryMatch?.[2] ?? inner;
  state.line = nextLine;

  const detailsOpenToken = state.push("details_open", "details", 1);
  if (/\bopen(?:\s*=\s*(?:""|''|open))?\b/i.test(openTag)) {
    detailsOpenToken.attrSet("open", "");
  }
  if (summaryHtml !== undefined && summaryHtml.length > 0) {
    const summaryToken = state.push("html_block", "", 0);
    summaryToken.content = `${summaryHtml}\n`;
  }
  if (bodyMarkdown.trim().length > 0) {
    state.md.block.parse(bodyMarkdown, state.md, state.env, state.tokens);
  }
  state.push("details_close", "details", -1);
  return true;
};

function createMarkdown(locale: SupportedLocale): MarkdownIt {
  const markdown = new MarkdownIt({
    breaks: true,
    html: true,
    linkify: false,
    typographer: false,
  });

  markdown.use(githubAlerts, {
    titles: {
      note: translate(locale, "common.markdownAlerts.note"),
      tip: translate(locale, "common.markdownAlerts.tip"),
      important: translate(locale, "common.markdownAlerts.important"),
      warning: translate(locale, "common.markdownAlerts.warning"),
      caution: translate(locale, "common.markdownAlerts.caution"),
    },
    icons: alertIcons,
  });

  markdown.block.ruler.before("html_block", "details_block", detailsBlockRule, {
    alt: ["paragraph", "reference", "blockquote"],
  });
  markdown.renderer.rules.html_block = (tokens, index) =>
    sanitizeMarkdownHtml(tokens[index].content);
  markdown.renderer.rules.html_inline = (tokens, index) =>
    sanitizeMarkdownHtml(tokens[index].content);

  const defaultImageRenderer: RenderRule =
    markdown.renderer.rules.image ??
    ((tokens, index, options, _environment, renderer) =>
      renderer.renderToken(tokens, index, options));
  const defaultLinkRenderer: RenderRule =
    markdown.renderer.rules.link_open ??
    ((tokens, index, options, _environment, renderer) =>
      renderer.renderToken(tokens, index, options));

  markdown.renderer.rules.image = (tokens, index, options, environment, renderer) => {
    const baseUrl = requireBaseUrl(environment);
    const source = tokens[index].attrGet("src");
    if (source === null) {
      throw new Error("Markdown image source is undefined");
    }
    tokens[index].attrSet("src", toRawGithubProxyUrl(new URL(source, baseUrl)));
    tokens[index].attrSet("loading", "lazy");
    tokens[index].attrSet("decoding", "async");
    return defaultImageRenderer(tokens, index, options, environment, renderer);
  };

  markdown.renderer.rules.link_open = (tokens, index, options, environment, renderer) => {
    const baseUrl = requireBaseUrl(environment);
    const href = tokens[index].attrGet("href");
    if (href === null) {
      throw new Error("Markdown link target is undefined");
    }
    tokens[index].attrSet("href", resolveMarkdownLink(href, baseUrl));
    tokens[index].attrSet("target", "_blank");
    tokens[index].attrSet("rel", "noopener noreferrer");
    return defaultLinkRenderer(tokens, index, options, environment, renderer);
  };

  return markdown;
}

const markdownByLocale = {
  ja: createMarkdown("ja"),
  en: createMarkdown("en"),
} satisfies Record<SupportedLocale, MarkdownIt>;

function requireBaseUrl(environment: unknown): string {
  if (
    typeof environment !== "object" ||
    environment === null ||
    !("baseUrl" in environment) ||
    typeof environment.baseUrl !== "string"
  ) {
    throw new Error("Markdown base URL is undefined");
  }
  return environment.baseUrl;
}

function resolveMarkdownLink(href: string, baseUrl: string): string {
  const rawGithubMatch =
    /^https:\/\/raw\.githubusercontent\.com\/(?<user>[^/]+)\/(?<repo>[^/]+)\/(?<branch>[^/]+)\/(?<path>.*)$/.exec(
      baseUrl,
    );
  if (rawGithubMatch?.groups !== undefined && !/^https?:\/\//.test(href)) {
    const { user, repo, branch, path } = rawGithubMatch.groups;
    if (href.startsWith("/")) {
      return `https://github.com/${user}/${repo}/blob/${branch}${href}`;
    }
    return new URL(href, `https://github.com/${user}/${repo}/blob/${branch}/${path}`).toString();
  }
  return new URL(href, baseUrl).toString();
}

function sanitizeMarkdownHtml(html: string): string {
  const allowedTags = new Set([
    "br",
    "b",
    "i",
    "em",
    "strong",
    "a",
    "details",
    "summary",
    "dl",
    "dt",
    "dd",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
  ]);
  const discardedTags = new Set(["script", "style"]);
  const chunks: string[] = [];
  let discardedDepth = 0;

  const parser = new Parser({
    onopentag(name, attributes) {
      if (discardedDepth > 0) {
        discardedDepth += 1;
        return;
      }
      if (discardedTags.has(name)) {
        discardedDepth = 1;
        return;
      }
      if (!allowedTags.has(name)) {
        return;
      }
      const renderedAttributes: string[] = [];
      if (name === "a") {
        const href = attributes.href;
        if (href !== undefined && isAllowedHtmlLink(href)) {
          renderedAttributes.push(`href="${escapeAttribute(href)}"`);
        }
        for (const attributeName of ["target", "rel"] as const) {
          const value = attributes[attributeName];
          if (value !== undefined) {
            renderedAttributes.push(`${attributeName}="${escapeAttribute(value)}"`);
          }
        }
      } else if (name === "details" && "open" in attributes) {
        renderedAttributes.push('open=""');
      }
      const attributeSuffix =
        renderedAttributes.length > 0 ? ` ${renderedAttributes.join(" ")}` : "";
      chunks.push(`<${name}${attributeSuffix}>`);
    },
    ontext(text) {
      if (discardedDepth === 0) {
        chunks.push(escapeText(text));
      }
    },
    onclosetag(name) {
      if (discardedDepth > 0) {
        discardedDepth -= 1;
        return;
      }
      if (allowedTags.has(name) && name !== "br") {
        chunks.push(`</${name}>`);
      }
    },
  });
  parser.write(html);
  parser.end();
  return chunks.join("");
}

function isAllowedHtmlLink(href: string): boolean {
  const scheme = /^(?<scheme>[a-z][a-z\d+.-]*):/i.exec(href)?.groups?.scheme;
  if (scheme === undefined) {
    return true;
  }
  return ["http", "https", "mailto"].includes(scheme.toLowerCase());
}

function normalizeBadgeParagraphs(html: string): string {
  return html.replace(/<p>([\s\S]*?)<\/p>/g, (paragraph, content: string) => {
    const badgeLinks = content.match(/<a\b[^>]*>\s*<img\b[^>]*>\s*<\/a>/gi) ?? [];
    if (badgeLinks.length === 0) {
      return paragraph;
    }
    const remainder = content
      .replace(/<br\s*\/?>/gi, "")
      .replace(/<a\b[^>]*>\s*<img\b[^>]*>\s*<\/a>/gi, "")
      .trim();
    return remainder.length === 0
      ? `<p class="markdown-badges">${badgeLinks.join("")}</p>`
      : paragraph;
  });
}

export function renderPackageMarkdown(
  source: string,
  baseUrl: string,
  locale: SupportedLocale,
): string {
  return normalizeBadgeParagraphs(markdownByLocale[locale].render(source, { baseUrl }).trim());
}
