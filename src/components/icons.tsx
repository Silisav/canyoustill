// The app's few icons, drawn for it (AGENTS.md "Stack": no icon packs). 24×24, stroked in currentColor.

import type { SVGProps } from "react";
import { externalIconPath } from "@/lib/external-link";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
    </Icon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19.5 14.6A7.8 7.8 0 0 1 9.4 4.5a7.8 7.8 0 1 0 10.1 10.1Z" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />
    </Icon>
  );
}

/** Two crossing arrows: the deck in a random order. */
export function ShuffleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 17H7l9.5-10H20.5" />
      <path d="M3.5 7H7l2.6 2.7M14 14.3l2.5 2.7h4" />
      <path d="M18 4.5 20.5 7 18 9.5M18 14.5l2.5 2.5-2.5 2.5" />
    </Icon>
  );
}

/** Lines growing in length: the deck in its own order. */
export function InOrderIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6.5h7M4 12h11M4 17.5h16" />
    </Icon>
  );
}

/** An arrow going back round: start again. */
export function ResetIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M6.2 3.2v3.9h3.9" />
    </Icon>
  );
}

/** An arrow leaving a box: share this. */
export function ShareIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5v11M8 7.2l4-3.7 4 3.7" />
      <path d="M8.5 10.5H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1.5" />
    </Icon>
  );
}


export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12.5 9.6 17 19 7.5" />
    </Icon>
  );
}

/** Opens something below: the counter's "all questions" sheet. */
export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon width="16" height="16" strokeWidth="2.6" {...props}>
      <path d="M6.5 9.5 12 15l5.5-5.5" />
    </Icon>
  );
}


/** The ↗ after a link that leaves the site; sized and nudged by the `ext` class (globals.css). */
export function ExternalIcon() {
  return (
    <svg
      className="ext"
      viewBox="0 0 12 12"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={externalIconPath} />
    </svg>
  );
}
