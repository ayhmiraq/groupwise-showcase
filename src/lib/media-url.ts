/**
 * Normalizes media URLs coming from the admin panel.
 *
 * - Internal uploads (`/api/public/media/...`) are returned as-is.
 * - Common "share page" links (Google Drive, Dropbox, GitHub blob) are rewritten
 *   to their direct-file equivalents.
 * - Any other external http(s) URL is routed through our own proxy so that
 *   hotlink protection, missing CORS headers or mixed-content blocking on the
 *   remote host cannot break the image/video in the UI.
 */
export function mediaUrl(raw?: string | null): string {
  const url = (raw ?? "").trim();
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) return url; // relative / internal path

  const direct = toDirectLink(url);

  try {
    const parsed = new URL(direct);
    // Assets that are already served from our own origin need no proxy.
    if (typeof window !== "undefined" && parsed.origin === window.location.origin) {
      return direct;
    }
  } catch {
    return direct;
  }

  return `/api/public/remote?url=${encodeURIComponent(direct)}`;
}

function toDirectLink(url: string): string {
  const drive = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/i);
  if (drive?.[1]) return `https://drive.google.com/uc?export=download&id=${drive[1]}`;

  if (/dropbox\.com/i.test(url)) {
    return url.replace(/([?&])dl=0/i, "$1raw=1").replace(/\?$/, "");
  }

  const gh = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/i);
  if (gh) return `https://raw.githubusercontent.com/${gh[1]}/${gh[2]}/${gh[3]}`;

  return url;
}
