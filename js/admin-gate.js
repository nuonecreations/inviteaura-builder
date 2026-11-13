/* InviteAura Admin Gate — password protection for the static Admin panel.
   - Admin UI (admin.js) is NOT loaded until login succeeds.
   - Session lives in sessionStorage only (tab close = logged out).
   - Failed attempts are slowed down (800ms delay + lockout after 5 tries).
   - This is a client-side gate for a static site: it stops casual access.
     Real protection of the live site = GitHub token secrecy (Publish needs it).
     For server-enforced security, put the Admin behind a backend login
     (e.g. Cloudflare Access / Render + auth) — see README. */
(function () {
  "use strict";
  const KEY = "inviteAuraAdminAuth";
  const ATTEMPTS = "inviteAuraAdminAttempts";
  const $ = (s) => document.querySelector(s);

  async function sha256Hex(text) {
    if (!crypto?.subtle) throw new Error("Secure context required (https:// or localhost)");
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Show/hide via BOTH the hidden attribute AND inline display.
  // (Previously: classList.remove("hidden") did NOT remove the hidden *attribute*
  //  on #adminApp, so the builder stayed display:none = white page after login.)
  function showGate() {
    const g = $("#adminGate"); if (!g) return;
    g.removeAttribute("hidden"); g.classList.remove("hidden"); g.style.display = "flex";
    const a = $("#adminApp"); if (!a) return;
    a.setAttribute("hidden", ""); a.classList.add("hidden"); a.style.display = "none";
  }
  function unlock() {
    const g = $("#adminGate"); if (g) { g.setAttribute("hidden", ""); g.classList.add("hidden"); g.style.display = "none"; }
    const a = $("#adminApp"); if (a) { a.removeAttribute("hidden"); a.classList.remove("hidden"); a.style.display = "block"; }
    if (!document.querySelector('script[src="js/admin.js?v=4"]')) {
      const s = document.createElement("script");
      s.src = "js/admin.js?v=4";
      document.body.appendChild(s);
    }
  }

  // Already logged in this tab?
  try {
    const ts = parseInt(sessionStorage.getItem(KEY + "_ts") || "0", 10);
    if (sessionStorage.getItem(KEY) === "1" && Date.now() - ts < 2 * 36e5) { unlock(); return; }
  } catch (e) {}

  showGate();

  $("#gateForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pwd = $("#gatePassword").value || "";
    const msg = $("#gateMsg");
    const attempts = parseInt(sessionStorage.getItem(ATTEMPTS) || "0", 10);
    if (attempts >= 5) { msg.textContent = "⛔ Too many tries. 60 seconds wait කරන්න, ඊට පස්සේ ආපහු try කරන්න."; return; }
    msg.textContent = "🔍 Checking…";
    await new Promise((r) => setTimeout(r, 800)); // slow down brute-force
    try {
      const hash = await sha256Hex(pwd);
      if (hash === (window.ADMIN_AUTH?.passwordHash || "")) {
        sessionStorage.setItem(KEY, "1");
        sessionStorage.setItem(KEY + "_ts", String(Date.now()));
        sessionStorage.removeItem(ATTEMPTS);
        $("#gatePassword").value = "";
        unlock();
      } else {
        sessionStorage.setItem(ATTEMPTS, String(attempts + 1));
        msg.textContent = `❌ Wrong password. (${attempts + 1}/5 tries)`;
        $("#gatePassword").value = "";
      }
    } catch (err) {
      msg.textContent = "⚠️ " + err.message + " — admin එක https:// (GitHub Pages) වලින් open කරන්න.";
    }
  });

  $("#gatePassword")?.focus();
  $("#lockBtn")?.addEventListener("click", () => {
    try { sessionStorage.removeItem(KEY); sessionStorage.removeItem(KEY + "_ts"); } catch (e) {}
    location.reload();
  });
})();
