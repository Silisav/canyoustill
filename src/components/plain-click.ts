/** Plain clicks get the app's transitions; modified ones (new tab, new window) keep the link's own behaviour. */
export const isPlainClick = (e: { metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; button: number }) =>
  !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0;
