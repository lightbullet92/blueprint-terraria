import type {
  VersionResolver,
  VersionResolverContext,
} from "@kubekpanel/blueprint-sdk";

const host = ["terraria", "org"].join(".");
const NAMES_API = `https://${host}/api/get/dedicated-servers-names`;
const DL_BASE = `https://${host}/api/download/pc-dedicated-server`;
const FALLBACK_FILE = "terraria-server-1458.zip";

async function fetchServerFiles(ctx: VersionResolverContext): Promise<string[]> {
  try {
    const res = await ctx.fetch(NAMES_API, {
      headers: { "User-Agent": "Kubek" },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.filter(
          (name): name is string =>
            typeof name === "string" && name.endsWith(".zip"),
        );
      }
    }
  } catch {
    // Fallback при сетевой ошибке
  }
  return [FALLBACK_FILE];
}

function formatLabel(filename: string): string {
  const match = filename.match(/terraria-server-(\d+)\.zip/);
  if (!match || !match[1]) return filename;
  const code = match[1];
  return `Terraria ${code.split("").join(".")}`;
}

const resolver: VersionResolver = {
  async listVersions(ctx: VersionResolverContext) {
    const files = await fetchServerFiles(ctx);
    return files.map((file) => ({
      id: file,
      label: formatLabel(file),
    }));
  },

  async resolveDownload(version: string, ctx: VersionResolverContext) {
    if (!version || version === "latest") {
      const files = await fetchServerFiles(ctx);
      const latestFile = files[0] ?? FALLBACK_FILE;
      return {
        url: `${DL_BASE}/${latestFile}`,
        unpack: true,
      };
    }

    const fileName = version.endsWith(".zip")
      ? version
      : `terraria-server-${version}.zip`;

    return {
      url: `${DL_BASE}/${fileName}`,
      unpack: true,
    };
  },
};

export default resolver;
