/* InviteAura — config-driven invitation renderer.
   Source order:
   1. ?preview=1 + localStorage (Admin live preview)
   2. ?wedding=<slug> / ?config=<url> / pretty URL last segment
   3. GET /api/config/<slug>  (Node backend, when running)
   4. fetch weddings/<slug>.json  (static hosting)
   5. fetch wedding.config.json
   6. window.DEFAULT_CONFIG (file:// fallback)
   RSVP / Wishes: POST to /api/* when backend exists, else localStorage. */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const params = new URLSearchParams(location.search);
  const API = params.get("api") || window.API_BASE || "";

  function slugFromUrl() {
    const q = params.get("wedding") || params.get("slug");
    if (q) return q.toLowerCase().replace(/[^a-z0-9-]/g, "");
    const parts = location.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    if (last && !last.includes(".") && last !== "Inviteaura-Builder") return last.toLowerCase();
    return "";
  }

  async function loadConfig() {
    const slug = slugFromUrl();
    // Admin live preview ONLY (?preview=1) uses localStorage.
    // Normal visits MUST use the published weddings/<slug>.json — otherwise the
    // owner's browser keeps showing a stale local config (e.g. old broken music URL)
    // even after a new version is published to GitHub.
    if (params.get("preview") === "1") {
      try {
        const saved = localStorage.getItem("inviteAuraPreview_" + (slug || "default"))
          || localStorage.getItem("inviteAuraWedding_" + (slug || "default"))
          || localStorage.getItem("inviteAuraPreview");
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    const candidates = [];
    if (params.get("config")) candidates.push(params.get("config"));
    if (slug) candidates.push(API + "/api/config/" + slug, "weddings/" + slug + ".json");
    candidates.push(API + "/api/config/default", "wedding.config.json");
    for (const url of candidates) {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (r.ok) return await r.json();
      } catch (e) { /* next */ }
    }
    return window.DEFAULT_CONFIG;
  }

  function deepMerge(base, over) {
    if (Array.isArray(over)) return over.length ? over : base;
    if (over && typeof over === "object") {
      const out = { ...base };
      for (const k of Object.keys(over)) {
        out[k] = over[k] && typeof over[k] === "object" && !Array.isArray(over[k]) ? deepMerge(base?.[k] || {}, over[k]) : over[k];
      }
      return out;
    }
    return over ?? base;
  }

  const fmtDate = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };
  const fmtShort = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  };

  let CFG = {};

  function applyTheme(t) {
    const preset = window.THEME_PRESETS?.[t?.preset] || {};
    const merged = { ...preset, ...t };
    const r = document.documentElement.style;
    r.setProperty("--primary", merged.primaryColor || "#5C1A2B");
    r.setProperty("--primary-2", merged.secondaryColor || "#8C2A3A");
    r.setProperty("--gold", merged.accentColor || "#C9A86C");
    r.setProperty("--bg", merged.background || "#FAF3E8");
    r.setProperty("--surface", merged.surface || "#FFFEFB");
    r.setProperty("--ink", merged.textColor || "#3A2A1F");
  }

  const EVENT_ICON = { wedding: "💍", poruwa: "🪔", homecoming: "🏡", reception: "🥂", other: "✨" };

  function render(c) {
    CFG = c;
    applyTheme(c.theme);
    const groom = c.groomName || "Groom", bride = c.brideName || "Bride";
    document.title = `${groom} & ${bride} — Wedding Invitation 💍`;
    $("#coverNames").innerHTML = `${esc(groom)}<br>&amp; ${esc(bride)}`;
    $("#coverDate").textContent = fmtShort(c.weddingDate);
    $("#guestName").textContent = params.get("to") || "Guest";
    $("#navNames").textContent = `${groom[0]} & ${bride[0]}`;
    $("#heroGroom").textContent = groom;
    $("#heroBride").textContent = bride;
    $("#heroTagline").textContent = c.tagline || "";
    $("#heroSubtitle").textContent = c.hero?.subtitle || "Are getting married";
    $("#heroDate").textContent = c.weddingTimeLabel || fmtDate(c.weddingDate);
    $("#heroVenue").textContent = c.venueShort || "";
    $("#heroImg").src = c.hero?.image || "";
    $("#invitationText").textContent = c.invitationText || "";
    $("#quoteText").textContent = c.quote ? `“${c.quote}”` : "";
    $("#quoteAuthor").textContent = c.quoteAuthor || "";
    $("#footerNames").textContent = `${groom} & ${bride}`;
    $("#footerDate").textContent = fmtShort(c.weddingDate);

    // Story
    $("#storyTitle").textContent = c.story?.title || "Our Love Story";
    $("#storySubtitle").textContent = c.story?.subtitle || "";
    $("#storyList").innerHTML = (c.story?.milestones || []).map((m, i) => `
      <div class="relative flex flex-col md:flex-row ${i % 2 ? "md:flex-row-reverse" : ""} gap-5 items-center reveal">
        <div class="absolute left-[-22px] md:left-1/2 top-6 w-4 h-4 rounded-full -translate-x-1/2 border-4 border-white shadow" style="background:var(--gold)"></div>
        <div class="md:w-1/2 ${i % 2 ? "md:pl-8 md:text-right" : "md:pr-8"} pl-4 md:pl-0">
          <span class="text-xs font-bold tracking-widest text-gold">${esc(m.date)}</span>
          <h3 class="serif text-2xl text-primary mt-1">${esc(m.title)}</h3>
          <p class="opacity-75 mt-2 leading-relaxed">${esc(m.description)}</p>
        </div>
        <div class="md:w-1/2 w-full md:pl-8 ${i % 2 ? "md:pr-8 md:pl-0" : ""} pl-4 md:pl-0">
          ${m.image ? `<img src="${esc(m.image)}" loading="lazy" class="rounded-3xl shadow-lg w-full h-56 md:h-64 object-cover" alt="${esc(m.title)}">` : ""}
        </div>
      </div>`).join("");

    // Events
    const events = c.events || [];
    $("#eventGrid").innerHTML = events.map((e) => `
      <article class="bg-surface border border-soft rounded-3xl p-6 shadow-sm hover:shadow-lg transition reveal">
        <div class="text-4xl">${EVENT_ICON[e.type] || "✨"}</div>
        <h3 class="serif text-2xl text-primary mt-3">${esc(e.title)}</h3>
        <p class="text-sm font-semibold mt-1">${esc(fmtDate(e.date))}</p>
        <p class="text-sm opacity-80">🕐 ${esc(e.time || "")}</p>
        <p class="text-sm opacity-80 mt-2">📍 <b>${esc(e.venue)}</b><br>${esc(e.address || "")}</p>
        ${e.description ? `<p class="text-sm opacity-70 mt-2">${esc(e.description)}</p>` : ""}
        ${e.dressCode ? `<p class="text-xs mt-3 px-3 py-1.5 rounded-full inline-block" style="background:var(--bg)">👗 ${esc(e.dressCode)}</p>` : ""}
        <div class="flex gap-2 mt-4">
          ${e.mapsUrl ? `<a href="${esc(e.mapsUrl)}" target="_blank" rel="noopener" class="px-4 py-2 rounded-full btn-primary text-xs font-semibold">📍 View Map</a>` : ""}
          <button class="px-4 py-2 rounded-full text-xs font-semibold border border-soft bg-white" onclick="addToCalendar('${esc(e.id || "main")}')">📅 Add to Calendar</button>
        </div>
      </article>`).join("");
    const firstDress = events.find((e) => e.dressCode)?.dressCode;
    $("#dressCodeText").textContent = firstDress || "—";
    $("#dressCodeBar").style.display = firstDress ? "" : "none";

    // Gallery
    $("#galleryGrid").innerHTML = (c.gallery || []).map((g) => `
      <button class="rounded-2xl overflow-hidden focus:outline-none group" onclick="openLightbox('${esc(g).replace(/'/g, "\\'")}')">
        <img src="${esc(g)}" loading="lazy" class="w-full h-44 md:h-56 object-cover group-hover:scale-105 transition duration-500" alt="Wedding photo">
      </button>`).join("");

    // RSVP
    $("#rsvpDeadline").textContent = c.rsvp?.deadline ? fmtShort(c.rsvp.deadline) : "soon";
    $("#rsvpNote").textContent = c.rsvp?.note || "";
    $("#rsvp").style.display = c.rsvp?.enabled === false ? "none" : "";
    $("#wishes").style.display = c.wishes?.enabled === false ? "none" : "";

    // Music — only direct audio files can play in <audio> (Spotify/YouTube page links cannot).
    // Fallback: if the configured URL is not a direct audio file, try the uploaded
    // file music/<slug>.mp3 in the repo (Admin upload) before giving up.
    window.__musicUrl = c.music?.url || "";
    window.__musicValid = isDirectAudio(window.__musicUrl);
    const a = $("#bgMusic");
    if (window.__musicValid) {
      a.src = window.__musicUrl;
      a.load();
    } else {
      const fallback = c.weddingId ? `music/${c.weddingId}.mp3` : "";
      if (fallback) {
        console.warn("[InviteAura] Music URL not direct audio (" + window.__musicUrl + "), trying uploaded file: " + fallback);
        window.__musicUrl = fallback;
        window.__musicValid = true; // try it; audio error handler will toast if it 404s
        a.src = fallback;
        a.load();
      } else if (window.__musicUrl) {
        console.warn("[InviteAura] Music URL is not a direct MP3/audio file, it will not play:", window.__musicUrl);
        setMusicUI("⚠️");
        $("#musicFab").title = "Music URL එක direct MP3 එකක් නෙවෙයි — Admin එකෙන් MP3 upload කරන්න";
      }
    }

    startCountdown(c.weddingDate);
    bindShare(c);
    observeReveals();
  }

  window.openLightbox = (src) => { $("#lightboxImg").src = src; $("#lightbox").classList.remove("hidden"); };

  /* Countdown */
  let cdTimer;
  function startCountdown(iso) {
    const target = new Date(iso).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { $("#countdown").classList.add("hidden"); $("#countdownDone").classList.remove("hidden"); clearInterval(cdTimer); return; }
      const d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24, m = Math.floor(diff / 6e4) % 60, s = Math.floor(diff / 1e3) % 60;
      $("#cdD").textContent = String(d).padStart(2, "0");
      $("#cdH").textContent = String(h).padStart(2, "0");
      $("#cdM").textContent = String(m).padStart(2, "0");
      $("#cdS").textContent = String(s).padStart(2, "0");
    };
    tick(); clearInterval(cdTimer); cdTimer = setInterval(tick, 1000);
  }

  function observeReveals() {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("in")), { threshold: 0.12 });
    $$(".reveal").forEach((el) => io.observe(el));
  }

  /* Cover + Music */
  const audio = $("#bgMusic");
  let playing = false;
  function isDirectAudio(u) {
    if (!u) return false;
    if (u.startsWith("data:audio") || u.startsWith("blob:")) return true;
    const clean = u.split("?")[0].toLowerCase();
    if (/\.(mp3|m4a|ogg|wav|webm)$/.test(clean)) return true;
    if (u.startsWith("music/")) return true; // uploaded files in repo
    return false;
  }
  window.isDirectAudio = isDirectAudio;
  function showToast(msg) {
    const t = $("#musicToast");
    if (!t) return;
    t.textContent = msg; t.style.display = "block";
    setTimeout(() => { t.style.display = "none"; }, 4500);
  }
  function setMusicUI(force) {
    const icon = force || (playing ? "⏸️" : "🎵");
    $("#musicFab").textContent = icon; $("#musicBtnNav").textContent = icon;
  }
  audio.addEventListener("error", () => {
    playing = false; setMusicUI("⚠️");
    $("#musicFab").title = "Music load වෙන්න බෑ — file එක check කරන්න";
    showToast("🎵 Music load වෙන්න බෑ — MP3 file එක / URL එක check කරන්න");
  });
  audio.addEventListener("canplay", () => { if (!playing) setMusicUI(); });
  async function toggleMusic() {
    if (!window.__musicValid || !audio.src) { showToast("🎵 Music එකක් නෑ — Admin එකෙන් MP3 upload කරන්න"); return; }
    try {
      if (playing) { audio.pause(); playing = false; }
      else { await audio.play(); playing = true; }
    } catch (e) {
      playing = false;
      showToast("🎵 Play කරන්න බෑ — music button එක ආපහු ඔබලා බලන්න");
    }
    setMusicUI();
  }
  $("#openBtn").addEventListener("click", async () => {
    const btn = $("#openBtn");
    btn.classList.add("celebrate-btn");
    // Confetti burst
    const colors = ["#C9A86C","#5C1A2B","#8C2A3A","#FFFEFB","#E8DCC6"];
    for (let i = 0; i < 70; i++) {
      const c = document.createElement("div");
      c.style.cssText = `position:fixed; top:-10vh; left:${Math.random()*100}vw; width:${6+Math.random()*8}px; height:${6+Math.random()*8}px; background:${colors[Math.floor(Math.random()*colors.length)]}; border-radius:${Math.random()>0.5?"50%":"2px"}; z-index:9999; pointer-events:none; animation:confettiFall ${1.6+Math.random()*1.6}s linear forwards; animation-delay:${Math.random()*0.3}s`;
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 3500);
    }
    const cover = $("#cover");
    setTimeout(() => { cover.style.transition = "opacity .9s, transform .9s"; cover.style.opacity = "0"; cover.style.transform = "scale(1.08)"; }, 600);
    setTimeout(() => cover.remove(), 1500);
    if (window.__musicValid && audio.src) {
      try { await audio.play(); playing = true; setMusicUI(); }
      catch (e) { playing = false; setMusicUI(); showToast("🎵 Music auto-play වෙන්න බෑ — පහළ 🎵 button එක ඔබන්න"); }
    } else if (window.__musicUrl && !window.__musicValid) {
      showToast("🎵 Music URL එක direct MP3 එකක් නෙවෙයි — Admin එකෙන් MP3 upload කරන්න");
    }
    document.body.style.overflow = "";
  });
  document.body.style.overflow = "hidden";
  $("#musicFab").addEventListener("click", toggleMusic);
  $("#musicBtnNav").addEventListener("click", toggleMusic);

  /* Share / Calendar / Copy */
  function shareText() { return `${CFG.share?.text || "You're invited! 💍"}\n${location.href.split("?")[0]}?wedding=${CFG.weddingId || ""}`; }
  window.addToCalendar = (eventId) => {
    const ev = (CFG.events || []).find((e) => e.id === eventId) || { title: `${CFG.groomName} & ${CFG.brideName} — Wedding`, date: CFG.weddingDate, venue: CFG.venueShort };
    const start = new Date(ev.date), end = new Date(start.getTime() + 4 * 36e5);
    const f = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//InviteAura//EN", "BEGIN:VEVENT",
      "UID:" + Date.now() + "@inviteAura", "DTSTAMP:" + f(new Date()), "DTSTART:" + f(start), "DTEND:" + f(end),
      "SUMMARY:" + (ev.title || "Wedding"), "LOCATION:" + (ev.venue || ""), "DESCRIPTION:Wedding Invitation",
      "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "wedding.ics"; a.click();
  };
  function bindShare(c) {
    const openWA = () => window.open("https://wa.me/?text=" + encodeURIComponent(shareText()), "_blank");
    $("#waBtnHero").onclick = openWA; $("#waBtnFooter").onclick = openWA; $("#shareBtnNav").onclick = openWA;
    $("#calendarBtn").onclick = () => window.addToCalendar("wedding");
    $("#calendarBtnFooter").onclick = () => window.addToCalendar("wedding");
    $("#copyLinkBtn").onclick = async () => {
      try { await navigator.clipboard.writeText(shareText().split("\n")[1] || location.href); $("#copyLinkBtn").textContent = "✅ Copied!"; }
      catch (e) { prompt("Copy this link:", location.href); }
      setTimeout(() => ($("#copyLinkBtn").textContent = "🔗 Copy Link"), 2000);
    };
  }

  /* RSVP data layer — API first, localStorage fallback */
  const storeKey = (k) => `inviteAura_${k}_${CFG.weddingId || "default"}`;
  async function apiOrLocal(path, payload) {
    if (API !== "" || location.protocol.startsWith("http")) {
      try {
        const r = await fetch(API + path, { method: payload ? "POST" : "GET", headers: { "Content-Type": "application/json" }, body: payload ? JSON.stringify(payload) : undefined });
        if (r.ok) return await r.json();
      } catch (e) {}
    }
    const key = storeKey(path.includes("rsvp") ? "rsvps" : "wishes");
    const list = JSON.parse(localStorage.getItem(key) || "[]");
    if (payload) { list.push({ ...payload, createdAt: new Date().toISOString() }); localStorage.setItem(key, JSON.stringify(list)); }
    return list;
  }
  async function loadLocal(path) {
    const key = storeKey(path.includes("rsvp") ? "rsvps" : "wishes");
    return JSON.parse(localStorage.getItem(key) || "[]");
  }

  async function refreshStatsAndWishes() {
    const rsvps = await apiOrLocal("/api/rsvp?weddingId=" + encodeURIComponent(CFG.weddingId || ""), null).catch(() => []);
    const list = Array.isArray(rsvps) ? rsvps : (rsvps.rsvps || []);
    $("#statYes").textContent = list.filter((r) => r.attending === "yes").length;
    $("#statNo").textContent = list.filter((r) => r.attending === "no").length;
    $("#statGuests").textContent = list.filter((r) => r.attending === "yes").reduce((a, r) => a + (parseInt(r.guests) || 0), 0);

    let wishes = await apiOrLocal("/api/wishes?weddingId=" + encodeURIComponent(CFG.weddingId || ""), null).catch(() => []);
    wishes = Array.isArray(wishes) ? wishes : (wishes.wishes || []);
    const all = [...wishes, ...(CFG.wishes?.sampleWishes || [])].slice(0, 20);
    $("#wishList").innerHTML = all.map((w) => `
      <div class="bg-surface border border-soft rounded-2xl p-4 break-inside-avoid shadow-sm">
        <p class="cormorant text-lg leading-snug">“${esc(w.message)}”</p>
        <p class="text-xs font-semibold mt-2 text-primary">— ${esc(w.name)}</p>
        ${w.date || w.createdAt ? `<p class="text-[11px] opacity-50">${esc(String(w.date || w.createdAt).slice(0, 10))}</p>` : ""}
      </div>`).join("") || `<p class="text-center opacity-60">Be the first to leave a wish ✨</p>`;
  }

  $("#rsvpForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = { weddingId: CFG.weddingId, name: f.get("name"), phone: f.get("phone"), attending: f.get("attending"), guests: f.get("guests"), liquor: f.get("liquor"), liquorCount: f.get("liquorCount"), meal: f.get("liquor"), message: f.get("message") };
    const fb = $("#rsvpFeedback");
    fb.textContent = "Sending…";
    await apiOrLocal("/api/rsvp", payload);
    fb.textContent = payload.attending === "yes" ? "🎉 Thank you! We can't wait to see you." : "💛 Thank you for your blessings. You will be missed!";
    fb.className = "text-center text-sm mt-3 font-semibold text-primary";
    e.target.reset(); refreshStatsAndWishes();
  });

  $("#wishForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    await apiOrLocal("/api/wishes", { weddingId: CFG.weddingId, name: f.get("name"), message: f.get("message") });
    $("#wishFeedback").textContent = "✨ Wish posted!";
    e.target.reset(); refreshStatsAndWishes();
  });

  loadConfig().then((c) => { render(deepMerge(window.DEFAULT_CONFIG, c)); refreshStatsAndWishes(); })
  // Hide the whole page until config is loaded & rendered, to avoid a 1-second flash of default data
  .finally(() => { document.documentElement.classList.add("inv-loaded"); })
    .catch(() => { render(window.DEFAULT_CONFIG); refreshStatsAndWishes(); });
})();
