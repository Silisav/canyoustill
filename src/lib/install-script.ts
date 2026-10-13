// Server-safe half of the install offer (src/lib/install.ts): the inline <head> script and the
// storage key they share.

export const INSTALL_DONE = "install"; // localStorage: "declined" | "installed"

/**
 * Inlined in <head>: the browser fires its install event early, often before React runs, and
 * catching it is the only way to stop Chrome's own banner showing at a moment we didn't choose.
 */
export const installScript = `addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__installPrompt=e;dispatchEvent(new Event("installprompt"))});addEventListener("appinstalled",function(){try{localStorage.setItem("${INSTALL_DONE}","installed")}catch(e){}});`;
