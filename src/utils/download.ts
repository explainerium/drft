/**
 * Saves a file from an admin export endpoint. A plain fetch skips the RTK
 * Query base query, so an expired access token is refreshed here once before
 * giving up. The file name comes from the response when the API sends one.
 */
export async function downloadFile(url: string, fallbackName: string): Promise<void> {
  let res = await fetch(url);
  if (res.status === 401) {
    const refreshed = await fetch("/api/v1/auth/refresh", { method: "POST" });
    if (refreshed.ok) res = await fetch(url);
  }
  if (!res.ok) throw new Error(`Download failed (${res.status})`);

  const name = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? fallbackName;
  const href = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = href;
  link.download = name;
  link.click();
  URL.revokeObjectURL(href);
}
