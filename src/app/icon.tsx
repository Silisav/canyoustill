// Favicon, rendered at build time from the logo.

import { iconImage } from "@/lib/icon-image";

export const size = { width: 48, height: 48 };
export const contentType = "image/png";

export default function Icon() {
  return iconImage(48, { logo: 1, plate: false });
}
