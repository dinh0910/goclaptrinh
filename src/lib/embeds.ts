export function embedUrlsToIframes(html: string): string {
  return html
    .replace(
      /<p>\s*(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[\w-]+(?:&[\w-=]*)?)\s*<\/p>/gi,
      (_, url) => {
        const videoId = new URL(url).searchParams.get("v");
        if (!videoId) return _;
        return `<div class="relative w-full aspect-video my-6 rounded-xl overflow-hidden"><iframe src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="absolute inset-0 w-full h-full" /></div>`;
      }
    )
    .replace(
      /<p>\s*(https?:\/\/(?:www\.)?youtube\.com\/shorts\/[\w-]+(?:\?[\w-=]*)?)\s*<\/p>/gi,
      (_, url) => {
        const match = url.match(/\/shorts\/([\w-]+)/);
        if (!match) return _;
        return `<div class="relative w-full aspect-[9/16] max-h-[600px] my-6 mx-auto max-w-sm rounded-xl overflow-hidden"><iframe src="https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1&playsinline=1" title="YouTube Short" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="absolute inset-0 w-full h-full" /></div>`;
      }
    )
    .replace(
      /<p>\s*(https?:\/\/(?:www\.)?youtu\.be\/[\w-]+(?:\?[\w-=]*)?)\s*<\/p>/gi,
      (_, url) => {
        const match = url.match(/youtu\.be\/([\w-]+)/);
        if (!match) return _;
        return `<div class="relative w-full aspect-video my-6 rounded-xl overflow-hidden"><iframe src="https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1&playsinline=1" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="absolute inset-0 w-full h-full" /></div>`;
      }
    )
    .replace(
      /<p>\s*(https?:\/\/(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+(?:\?[\w-=]*)?)\s*<\/p>/gi,
      (_, url) => {
        const videoIdMatch = url.match(/\/video\/(\d+)/);
        if (!videoIdMatch) return _;
        return `<div class="my-6"><blockquote class="tiktok-embed" cite="${url}" data-video-id="${videoIdMatch[1]}" style="max-width:605px;"><section></section></blockquote><script async src="https://www.tiktok.com/embed.js"><\/script></div>`;
      }
    )
    .replace(
      /<p>\s*(https?:\/\/(?:vt\.)?tiktok\.com\/[\w]+(?:\?[\w-=]*)?)\s*<\/p>/gi,
      (_, url) => {
        return `<div class="my-6"><blockquote class="tiktok-embed" cite="${url}" style="max-width:605px;"><section></section></blockquote><script async src="https://www.tiktok.com/embed.js"><\/script></div>`;
      }
    );
}

export function youtubeThumbnailUrl(url: string): string | null {
  let videoId: string | null = null;
  const watchMatch = url.match(/[?&]v=([\w-]+)/);
  if (watchMatch) videoId = watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([\w-]+)/);
  if (shortMatch) videoId = shortMatch[1];
  const shortsMatch = url.match(/\/shorts\/([\w-]+)/);
  if (shortsMatch) videoId = shortsMatch[1];
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export type VideoEmbed =
  | { type: "youtube"; embedUrl: string; thumbnail: string }
  | { type: "tiktok"; url: string }
  | { type: "file"; url: string }
  | { type: "none" };

/** Resolves a standalone video URL (lesson.videoUrl) to a renderable embed. */
export function getVideoEmbed(url: string): VideoEmbed {
  if (!url) return { type: "none" };
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return { type: "none" };

  const youtubeId = trimmed.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/i
  )?.[1];
  if (youtubeId) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&playsinline=1`,
      thumbnail: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
    };
  }

  if (/(?:tiktok\.com)\//i.test(trimmed)) {
    return { type: "tiktok", url: trimmed };
  }

  if (/\.(mp4|webm|ogv|ogg|mov|m4v)(\?.*)?$/i.test(trimmed)) {
    return { type: "file", url: trimmed };
  }

  return { type: "none" };
}

export function insertVideoLink(
  textarea: HTMLTextAreaElement,
  url: string,
  setter: (val: string) => void
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const before = text.slice(0, start);
  const after = text.slice(end);
  const insertion = `\n${url}\n`;
  const newText = before + insertion + after;
  setter(newText);
  setTimeout(() => {
    textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
    textarea.focus();
  }, 0);
}
