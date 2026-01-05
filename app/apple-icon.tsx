import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default async function AppleIcon() {
  const iconResponse = await fetch(
    new URL(
      "/apple-touch-icon.png",
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    ),
    { cache: "no-store" }
  );

  const iconArrayBuffer = await iconResponse.arrayBuffer();

  return new ImageResponse(
    <img
      src={`data:image/png;base64,${Buffer.from(iconArrayBuffer).toString("base64")}`}
      width={180}
      height={180}
      alt="Apple touch icon"
    />,
    { ...size }
  );
}
