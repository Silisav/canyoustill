// Home-screen icon for iOS (it rounds the corners itself), rendered at build time.

import { iconImage } from "@/lib/icon-image";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return iconImage(180);
}
