import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default async function Icon() {
  const iconResponse = await fetch(
    new URL("/favicon-32x32.png", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    { cache: "no-store" }
  );

  const iconArrayBuffer = await iconResponse.arrayBuffer();

  return new ImageResponse(
    <img
      src={`data:image/png;base64,${Buffer.from(iconArrayBuffer).toString("base64")}`}
      width={32}
      height={32}
      alt="App icon"
    />,
    { ...size }
  );
}
