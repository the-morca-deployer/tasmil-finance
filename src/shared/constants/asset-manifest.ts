import manifest from "./asset-manifest.json";

export interface AssetManifest {
  tokens: Record<string, string>;
  protocols: Record<string, string>;
}

const typedManifest: AssetManifest = manifest as AssetManifest;

export default typedManifest;
export const TOKEN_ICONS = typedManifest.tokens;
export const PROTOCOL_ICONS = typedManifest.protocols;
