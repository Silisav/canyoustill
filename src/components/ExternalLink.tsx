// A link that leaves the site (AGENTS.md "External links").

import { NEW_TAB, splitLastWord } from "@/lib/external-link";
import { ExternalIcon } from "./icons";

export function ExternalLink({ href, className, children }: { href: string; className?: string; children: string }) {
  const [head, last] = splitLastWord(children);
  return (
    <a href={href} target="_blank" rel="noopener" className={className}>
      {head}
      <span className="whitespace-nowrap">
        {last}
        <ExternalIcon />
      </span>
      <span className="sr-only">{NEW_TAB}</span>
    </a>
  );
}
