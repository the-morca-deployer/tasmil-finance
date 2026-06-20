"use client";

/**
 * Tasmil TF brand loader — RGB-split glitch on the brand mark.
 * size: px width/height of the mark (default 190).
 */
export default function TFLoader({
  size = 190,
  fullscreen = false,
}: {
  size?: number;
  fullscreen?: boolean;
}) {
  const mark = (
    <div className="tf-loader-mark" style={{ width: size, height: size }}>
      {/* biome-ignore lint/performance/noImgElement: brand glitch needs a raw img */}
      <img src="/tasmil-tf-mark.svg" alt="Loading" />
    </div>
  );
  if (!fullscreen) return mark;
  return <div className="tf-loader-stage">{mark}</div>;
}
