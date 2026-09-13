import sanitizeHtml from "sanitize-html";

const allowedTags = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "blockquote", "p", "a", "ul", "ol", "li",
  "b", "i", "strong", "em", "strike", "u", "s", "sub", "sup", "mark",
  "code", "pre", "hr", "br", "div", "span",
  "table", "thead", "caption", "tbody", "tfoot", "tr", "th", "td",
  "img", "figure", "figcaption", "iframe",
];

const allowedAttributes: Record<string, string[]> = {
  a: ["href", "name", "target", "title", "rel"],
  img: ["src", "alt", "title", "width", "height", "loading"],
  iframe: ["src", "title", "width", "height", "allowfullscreen", "frameborder"],
  code: ["class", "data-language", "data-start"],
  pre: ["class", "data-language", "data-start"],
  span: ["style", "data-type", "data-color", "data-align"],
  p: ["style", "data-align"],
  div: ["style", "data-type", "data-color", "data-tasks"],
  table: ["style"],
  th: ["style", "colspan", "rowspan", "align"],
  td: ["style", "colspan", "rowspan", "align"],
  h1: ["style"], h2: ["style"], h3: ["style"], h4: ["style"],
  h5: ["style"], h6: ["style"],
  li: ["style"],
};

const CSS_RE = {
  textAlign: [/^(left|right|center|justify)$/],
  color: [/^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|rgb\([\d\s.,%]+\)|rgba\([\d\s.,%]+\)|inherit)$/],
  "background-color": [/^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|rgb\([\d\s.,%]+\)|rgba\([\d\s.,%]+\)|inherit)$/],
  "font-weight": [/^(normal|bold|bolder|lighter|[1-9]00)$/],
  "font-style": [/^(normal|italic|oblique)$/],
  "text-decoration": [/^(none|underline|line-through|overline)$/],
  "list-style-type": [/^(disc|circle|square|decimal|lower-alpha|lower-roman)$/],
  "white-space": [/^(normal|pre-wrap|pre)$/],
  "vertical-align": [/^(top|middle|bottom|baseline)$/],
  width: [/^\d+(px|%)$/],
  height: [/^\d+(px|%)$/],
};

// NOTE: dimension styles used by the TipTap table/column layout are plain
// pixel/percent values only; anything else is stripped.
const allowedStyles: sanitizeHtml.IOptions["allowedStyles"] = {
  "*": CSS_RE,
};

function transformLink(tagName: string, attribs: Record<string, string>) {
  const href = (attribs.href || "").trim();
  const external = /^(https?:)?\/\//i.test(href) && !href.startsWith("/");
  if (href.startsWith("/") && !/^\/[/]/.test(href)) {
    // Relative link — keep as-is.
    return { tagName, attribs: { ...attribs, rel: "noopener" } };
  }
  const rel = [attribs.rel, "noopener", "noreferrer"]
    .filter(Boolean)
    .join(" ");
  const target = external ? "_blank" : attribs.target;
  return { tagName, attribs: { ...attribs, rel, target } };
}

export function sanitizePostHtml(html: string): string {
  if (!html) return html;
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes,
    allowedStyles,
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https", "data", "blob"],
      iframe: ["https"],
    },
    allowedIframeHostnames: [
      "www.youtube.com",
      "youtube.com",
      "www.youtube-nocookie.com",
      "youtube-nocookie.com",
      "player.vimeo.com",
      "vimeo.com",
    ],
    transformTags: {
      a: transformLink,
      iframe: (tagName, attribs) => {
        const { src = "" } = attribs;
        if (!/^(https:)?\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|vimeo\.com)\//i.test(src)) {
          return { tagName: "p", attribs: { style: "color: inherit" } as sanitizeHtml.Attributes };
        }
        return {
          tagName,
          attribs: {
            ...attribs,
            loading: "lazy",
            referrerpolicy: "no-referrer",
            sandbox: "allow-scripts allow-same-origin allow-presentation",
          } as sanitizeHtml.Attributes,
        };
      },
    },
    exclusiveFilter: (frame) => {
      if (frame.tag === "script" || frame.tag === "style") return true;
      return false;
    },
  });
}