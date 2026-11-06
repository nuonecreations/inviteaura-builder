/* InviteAura Admin — onboarding builder.
   Fill the form -> live preview (iframe + localStorage) -> Save (POST /api/weddings)
   or Download JSON -> drop into weddings/<slug>.json for static hosting. */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const slugify = (s) => String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "wedding";
  const clone = (o) => JSON.parse(JSON.stringify(o));
  let cfg = clone(window.DEFAULT_CONFIG);
  let rsvpCache = [];

  const F = {
    groomName: "#f_groomName", brideName: "#f_brideName", groomFullName: "#f_groomFullName", brideFullName: "#f_brideFullName",
    weddingDate: "#f_weddingDate", weddingTimeLabel: "#f_weddingTimeLabel", venueShort: "#f_venueShort",
    invitationText: "#f_invitationText", quote: "#f_quote", heroImage: "#f_heroImage", weddingId: "#f_weddingId",
    themePreset: "#f_themePreset", themePrimary: "#f_themePrimary", themeAccent: "#f_themeAccent", themeBg: "#f_themeBg",
    musicUrl: "#f_musicUrl", storyTitle: "#f_storyTitle", gallery: "#f_gallery", whatsapp: "#f_whatsapp",
  };

  function toLocalInput(iso) {
    const d = new Date(iso); if (isNaN(d)) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function renderForm() {
    $(F.groomName).value = cfg.groomName || ""; $(F.brideName).value = cfg.brideName || "";
    $(F.groomFullName).value = cfg.groomFullName || ""; $(F.brideFullName).value = cfg.brideFullName || "";
    $(F.weddingDate).value = toLocalInput(cfg.weddingDate);
    $(F.weddingTimeLabel).value = cfg.weddingTimeLabel || "";
    $(F.venueShort).value = cfg.venueShort || "";
    $(F.invitationText).value = cfg.invitationText || "";
    $(F.quote).value = cfg.quote || "";
    $(F.heroImage).value = cfg.hero?.image || "";
    $(F.weddingId).value = cfg.weddingId || "";
    const t = { ...(window.THEME_PRESETS[cfg.theme?.preset] || {}), ...(cfg.theme || {}) };
    $(F.themePreset).value = cfg.theme?.preset || "burgundy-gold";
    $(F.themePrimary).value = t.primaryColor || "#5C1A2B";
    $(F.themeAccent).value = t.accentColor || "#C9A86C";
    $(F.themeBg).value = t.background || "#FAF3E8";
    $(F.musicUrl).value = cfg.music?.url || "";
    $(F.storyTitle).value = cfg.story?.title || "";
    $(F.gallery).value = (cfg.gallery || []).join("\n");
    $(F.whatsapp).value = cfg.contact?.whatsapp || "";
    renderEvents();
    $("#jsonBox").value = JSON.stringify(cfg, null, 2);
    updateSlugPreview();
  }

  function renderEvents() {
    $("#eventEditor").innerHTML = (cfg.events || []).map((e, i) => `
      <div class="border border-[#E8DCC6] rounded-xl p-3 mb-2 bg-white">
        <div class="flex justify-between items-center"><b class="text-sm">${i + 1}. ${escHtml(e.title || "Event")}</b>
        <button class="text-red-600 text-sm" data-del-event="${i}">✕ Remove</button></div>
        <div class="grid grid-cols-2 gap-2">
          <input data-ev="${i}" data-k="title" value="${escHtml(e.title || "")}" placeholder="Title e.g. The Wedding">
          <select data-ev="${i}" data-k="type">${["wedding", "poruwa", "homecoming", "reception", "other"].map((t) => `<option ${e.type === t ? "selected" : ""}>${t}</option>`).join("")}</select>
          <input data-ev="${i}" data-k="date" type="datetime-local" value="${toLocalInput(e.date)}">
          <input data-ev="${i}" data-k="time" value="${escHtml(e.time || "")}" placeholder="9.00 AM onwards">
          <input data-ev="${i}" data-k="venue" value="${escHtml(e.venue || "")}" placeholder="Venue">
          <input data-ev="${i}" data-k="mapsUrl" value="${escHtml(e.mapsUrl || "")}" placeholder="Google Maps URL">
        </div>
      </div>`).join("");
    $$q("[data-del-event]").forEach((b) => b.onclick = () => { cfg.events.splice(+b.dataset.delEvent, 1); syncFromForm(); });
    $$q("[data-ev]").forEach((el) => el.addEventListener("input", () => syncFromForm(false)));
  }
  const $$q = (s) => [...document.querySelectorAll(s)];
  const escHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function updateSlugPreview() {
    const slug = slugify($(F.weddingId).value || `${$(F.groomName).value || "groom"}-${$(F.brideName).value || "bride"}`);
    $("#slugPreview").textContent = `yourdomain.com/${slug}`;
  }

  function syncFromForm(refresh = true) {
    cfg.groomName = $(F.groomName).value; cfg.brideName = $(F.brideName).value;
    cfg.groomFullName = $(F.groomFullName).value; cfg.brideFullName = $(F.brideFullName).value;
    cfg.weddingDate = $(F.weddingDate).value ? new Date($(F.weddingDate).value).toISOString() : cfg.weddingDate;
    cfg.weddingTimeLabel = $(F.weddingTimeLabel).value;
    cfg.venueShort = $(F.venueShort).value;
    cfg.invitationText = $(F.invitationText).value;
    cfg.quote = $(F.quote).value;
    cfg.hero = { ...(cfg.hero || {}), image: $(F.heroImage).value };
    cfg.weddingId = slugify($(F.weddingId).value || `${cfg.groomName}-${cfg.brideName}`);
    cfg.theme = { preset: $(F.themePreset).value, primaryColor: $(F.themePrimary).value, accentColor: $(F.themeAccent).value, background: $(F.themeBg).value, secondaryColor: cfg.theme?.secondaryColor || "#8C2A3A", surface: cfg.theme?.surface || "#FFFEFB", textColor: cfg.theme?.textColor || "#3A2A1F" };
    cfg.music = { ...(cfg.music || {}), url: $(F.musicUrl).value };
    cfg.story = { ...(cfg.story || {}), title: $(F.storyTitle).value };
    cfg.gallery = $(F.gallery).value.split("\n").map((s) => s.trim()).filter(Boolean);
    cfg.contact = { ...(cfg.contact || {}), whatsapp: $(F.whatsapp).value };
    cfg.share = { text: `You're invited to ${cfg.groomName} & ${cfg.brideName}'s wedding! 💍` };
    // Events from DOM
    $$q("[data-ev]").forEach((el) => {
      const i = +el.dataset.ev, k = el.dataset.k;
      if (!cfg.events[i]) return;
      cfg.events[i][k] = k === "date" && el.value ? new Date(el.value).toISOString() : el.value;
    });
    $("#jsonBox").value = JSON.stringify(cfg, null, 2);
    updateSlugPreview();
    pushPreview();
    if (refresh) renderEvents();
  }

  let deb;
  function pushPreview() {
    clearTimeout(deb);
    deb = setTimeout(() => {
      localStorage.setItem("inviteAuraPreview_" + (cfg.weddingId || "default"), JSON.stringify(cfg));
      localStorage.setItem("inviteAuraPreview", JSON.stringify(cfg));
      $("#previewFrame").src = "index.html?preview=1&wedding=" + encodeURIComponent(cfg.weddingId || "default");
    }, 400);
  }

  Object.values(F).forEach((sel) => $(sel).addEventListener("input", () => syncFromForm(false)));
  $("#addEventBtn").onclick = () => { cfg.events = cfg.events || []; cfg.events.push({ id: "event-" + Date.now(), type: "other", title: "New Event", date: cfg.weddingDate, time: "", venue: "", address: "", mapsUrl: "", dressCode: "", description: "" }); syncFromForm(); };
  $("#applyJsonBtn").onclick = () => { try { cfg = JSON.parse($("#jsonBox").value); renderForm(); pushPreview(); } catch (e) { alert("Invalid JSON: " + e.message); } };

  $("#saveBtn").onclick = async () => {
    syncFromForm(false);
    const st = $("#saveStatus");
    try {
      const r = await fetch("/api/weddings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cfg) });
      if (!r.ok) throw new Error((await r.json()).error || "save failed");
      const d = await r.json();
      st.textContent = `✅ Saved! Live at: ${location.origin}/?wedding=${d.slug}  (pretty: ${location.origin}/${d.slug})`;
      st.className = "text-sm mt-3 font-medium text-green-700";
      showQR(location.origin + "/?wedding=" + d.slug);
      loadWeddingList();
    } catch (e) {
      st.textContent = "⚠️ Backend not running (static mode). Use 'Download JSON' and put the file in weddings/" + cfg.weddingId + ".json — or run: node server.js";
      st.className = "text-sm mt-3 font-medium text-amber-700";
    }
  };
  $("#previewBtn").onclick = () => { syncFromForm(false); pushPreview(); window.open("index.html?preview=1&wedding=" + cfg.weddingId, "_blank"); };
  $("#downloadBtn").onclick = () => {
    syncFromForm(false);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(cfg, null, 2)], { type: "application/json" }));
    a.download = cfg.weddingId + ".json"; a.click();
  };
  $("#copyLinkBtn").onclick = async () => {
    syncFromForm(false);
    const link = location.origin + "/?wedding=" + cfg.weddingId;
    try { await navigator.clipboard.writeText(link); $("#saveStatus").textContent = "🔗 Link copied: " + link; } catch { prompt("Copy:", link); }
    showQR(link);
  };
  function showQR(link) {
    $("#qrBox").classList.remove("hidden");
    $("#qrImg").src = "https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=" + encodeURIComponent(link);
  }

  /* Load saved weddings */
  async function loadWeddingList() {
    let list = [];
    try { const r = await fetch("/api/weddings"); if (r.ok) list = await r.json(); } catch {}
    if (!list.length) {
      try { const r = await fetch("wedding.config.json"); if (r.ok) list = [await r.json()]; } catch {}
    }
    const opts = list.map((w) => `<option value="${escHtml(w.weddingId)}">${escHtml(w.groomName)} &amp; ${escHtml(w.brideName)} (${escHtml(w.weddingId)})</option>`).join("");
    $("#loadSelect").innerHTML = `<option value="">— Load saved wedding —</option>` + opts;
    $("#rsvpWedding").innerHTML = opts;
    return list;
  }
  $("#loadBtn").onclick = async () => {
    const slug = $("#loadSelect").value; if (!slug) return;
    try {
      let cfgData = null;
      const r = await fetch("/api/config/" + slug); if (r.ok) cfgData = await r.json();
      if (!cfgData) { const r2 = await fetch("weddings/" + slug + ".json"); if (r2.ok) cfgData = await r2.json(); }
      if (cfgData) { cfg = cfgData; renderForm(); pushPreview(); }
    } catch {}
  };

  /* RSVP viewer */
  async function refreshRsvps() {
    const id = $("#rsvpWedding").value || cfg.weddingId || "default";
    let rsvps = [], wishes = [];
    try { const r = await fetch("/api/rsvp?weddingId=" + encodeURIComponent(id)); if (r.ok) rsvps = await r.json(); } catch {}
    try { const r = await fetch("/api/wishes?weddingId=" + encodeURIComponent(id)); if (r.ok) wishes = await r.json(); } catch {}
    if (!rsvps.length && !wishes.length) {
      rsvps = JSON.parse(localStorage.getItem("inviteAura_rsvps_" + id) || "[]");
      wishes = JSON.parse(localStorage.getItem("inviteAura_wishes_" + id) || "[]");
    }
    rsvpCache = rsvps;
    const yes = rsvps.filter((r) => r.attending === "yes"), no = rsvps.filter((r) => r.attending === "no");
    $("#rsvpSummary").innerHTML = `<span class="px-3 py-1.5 rounded-full bg-white border border-[#E8DCC6]">✅ ${yes.length} attending</span><span class="px-3 py-1.5 rounded-full bg-white border border-[#E8DCC6]">😔 ${no.length} regret</span><span class="px-3 py-1.5 rounded-full bg-white border border-[#E8DCC6]">👥 ${yes.reduce((a, r) => a + (parseInt(r.guests) || 0), 0)} guests</span>`;
    $("#rsvpTable").innerHTML = rsvps.map((r) => `<tr class="border-t border-[#E8DCC6]"><td class="p-2">${escHtml(r.name)}</td><td class="p-2">${r.attending === "yes" ? "✅ Yes" : "😔 No"}</td><td class="p-2">${escHtml(r.guests || "")}</td><td class="p-2">${escHtml(r.phone || "")}</td></tr>`).join("") || `<tr><td colspan="4" class="p-3 text-center opacity-60">No RSVPs yet</td></tr>`;
    $("#wishAdminList").innerHTML = wishes.map((w) => `<div class="border border-[#E8DCC6] rounded-xl p-3 bg-white"><b>${escHtml(w.name)}</b> — ${escHtml(w.message)}</div>`).join("") || `<p class="opacity-60">No wishes yet</p>`;
  }
  $("#refreshRsvpBtn").onclick = refreshRsvps;
  $("#rsvpWedding").onchange = refreshRsvps;
  $("#exportCsvBtn").onclick = () => {
    const rows = [["Name", "Attending", "Guests", "Phone", "Meal", "Message"], ...rsvpCache.map((r) => [r.name, r.attending, r.guests, r.phone, r.meal, (r.message || "").replace(/"/g, '""')])];
    const csv = rows.map((r) => r.map((c) => `"${c ?? ""}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "rsvps.csv"; a.click();
  };

  renderForm(); loadWeddingList().then(refreshRsvps);
})();
