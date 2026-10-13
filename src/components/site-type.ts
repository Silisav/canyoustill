// The layout and text styles shared by the pages around the game (home, About), so they read as
// one site (AGENTS.md "Layout"). The home page sets them; the rest follow.

/** Desktop: the copy column and the card's column (400–560px), as on home. One column below. */
export const siteColumns =
  "grid grid-cols-1 desktop:grid-cols-[minmax(0,1fr)_clamp(400px,42vw,560px)] desktop:items-start desktop:gap-x-[clamp(40px,5vw,80px)]";

/**
 * The logo and name in the header (and the 404's copy of it). One line at any width: below 360px
 * both shrink a little (17px and 38px at 320px) so the name fits beside the header's buttons,
 * GitHub included; full size from 360px.
 */
export const wordmark =
  "flex items-center gap-2.5 whitespace-nowrap text-[length:clamp(17px,12.5vw_-_23px,22px)] font-extrabold tracking-headline desktop:gap-3.5 desktop:text-[28px]";
export const wordmarkLogo = "size-[clamp(38px,20vw_-_26px,46px)] shrink-0 desktop:size-16";

/** Where the copy starts below the header. */
export const copyTop = "mt-10 desktop:mt-0 desktop:pt-[9vh]";

export const headline = "text-headline font-black tracking-headline text-balance";
export const lead = "text-[clamp(18px,2.3vw,21px)] leading-[1.45] font-medium text-mute";
export const sectionTitle = "text-[clamp(28px,4vw,40px)] leading-[1.05] font-black tracking-headline";
export const body = "text-[17px] leading-[1.6] text-mute";
export const textLink = "font-semibold text-fg underline underline-offset-2";
