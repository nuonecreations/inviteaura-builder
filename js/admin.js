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
  let pendingMusicFile = null; // File selected in Admin, not yet uploaded (uploaded on Save)

  const F = {
    groomName: "#f_groomName", brideName: "#f_brideName", groomFullName: "#f_groomFullName", brideFullName: "#f_brideFullName",
    weddingDate: "#f_weddingDate", weddingTimeLabel: "#f_weddingTimeLabel", venueShort: "#f_venueShort",
    invitationText: "#f_invitationText", quote: "#f_quote", heroImage: "#f_heroImage", weddingId: "#f_weddingId",
    themePreset: "#f_themePreset", themePrimary: "#f_themePrimary", themeSecondary: "#f_themeSecondary", themeAccent: "#f_themeAccent", themeBg: "#f_themeBg",
    storySubtitle: "#f_storySubtitle", story: "#f_story",
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
    $(F.themeSecondary).value = t.secondaryColor || "#8C2A3A";
    $(F.themeAccent).value = t.accentColor || "#C9A86C";
    $(F.themeBg).value = t.background || "#FAF3E8";
    $(F.musicUrl).value = cfg.music?.url || "";
    const mp = $("#musicPreview"); if (mp && cfg.music?.url) mp.src = cfg.music.url;
    if ($("#musicFileInfo")) $("#musicFileInfo").textContent = cfg.music?.url ? "Current: " + cfg.music.url : "";
    $(F.storyTitle).value = cfg.story?.title || "";
    $(F.storySubtitle).value = cfg.story?.subtitle || "";
    $(F.story).value = (cfg.story?.milestones || []).map((m) => [m.date, m.title, m.description, m.image || ""].join(" | ")).join("\n");
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
    const base = location.origin + location.pathname.replace(/admin\.html$/, "");
    $("#slugPreview").textContent = `${base}?wedding=${slug}`;
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
    cfg.theme = { preset: $(F.themePreset).value, primaryColor: $(F.themePrimary).value, secondaryColor: $(F.themeSecondary).value, accentColor: $(F.themeAccent).value, background: $(F.themeBg).value, surface: cfg.theme?.surface || "#FFFEFB", textColor: cfg.theme?.textColor || "#3A2A1F" };
    // If a file is pending upload, keep the URL placeholder until upload succeeds on Save
    cfg.music = { ...(cfg.music || {}), url: pendingMusicFile ? (cfg.music?.url || "") : $(F.musicUrl).value };
    cfg.story = {
      ...(cfg.story || {}),
      title: $(F.storyTitle).value,
      subtitle: $(F.storySubtitle).value,
      milestones: $(F.story).value.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
        const parts = line.split("|").map((s) => s.trim());
        return { date: parts[0] || "", title: parts[1] || "", description: parts[2] || "", image: parts[3] || "" };
      }),
    };
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

  /* ---------- Publish helpers (Node backend OR GitHub Pages static) ---------- */
  function downloadJSON() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(cfg, null, 2)], { type: "application/json" }));
    a.download = cfg.weddingId + ".json"; a.click();
  }
  function saveLocally() {
    const json = JSON.stringify(cfg);
    localStorage.setItem("inviteAuraPreview_" + (cfg.weddingId || "default"), json);
    localStorage.setItem("inviteAuraPreview", json);
    localStorage.setItem("inviteAuraWedding_" + (cfg.weddingId || "default"), json);
  }
  const ghRepoVal = () => ($("#ghRepo")?.value || "nuonecreations/inviteaura-builder").trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  const ghBranchVal = () => ($("#ghBranch")?.value || "main").trim() || "main";
  const ghTokenVal = () => ($("#ghToken")?.value || "").trim();
  const b64 = (s) => btoa(unescape(encodeURIComponent(s)));

  async function publishToGitHub() {
    const repo = ghRepoVal(), branch = ghBranchVal(), token = ghTokenVal();
    if (!repo) throw new Error("GitHub repo එක දාන්න (owner/repo).");
    if (!token) throw new Error("GitHub token එකක් නෑ — පහළ box එකේ PAT එක paste කරන්න, නැත්තම් 'Download JSON' විදියට save කරන්න.");
    const path = `weddings/${cfg.weddingId}.json`;
    const headers = { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" };
    // Existing file? (update needs sha)
    let sha;
    const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`, { headers });
    if (getRes.ok) sha = (await getRes.json()).sha;
    else if (getRes.status !== 404) throw new Error(`GitHub GET failed (${getRes.status}) — token / repo එක check කරන්න.`);
    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: "PUT", headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ message: `Add wedding ${cfg.weddingId} (${cfg.groomName} & ${cfg.brideName}) via InviteAura Admin`, content: b64(JSON.stringify(cfg, null, 2)), branch, ...(sha ? { sha } : {}) }),
    });
    const putData = await putRes.json().catch(() => ({}));
    if (!putRes.ok) throw new Error(putData.message || `GitHub publish failed (${putRes.status})`);
    // Keep weddings/index.json in sync so Admin list + Load dropdown shows this wedding too
    try {
      const idxPath = "weddings/index.json";
      let idx = [], idxSha;
      const idxGet = await fetch(`https://api.github.com/repos/${repo}/contents/${idxPath}?ref=${encodeURIComponent(branch)}`, { headers });
      if (idxGet.ok) { const d = await idxGet.json(); idxSha = d.sha; try { idx = JSON.parse(decodeURIComponent(escape(atob(d.content.replace(/\s/g, ""))))); } catch { idx = []; } }
      if (!Array.isArray(idx)) idx = idx.weddings || [];
      const entry = { weddingId: cfg.weddingId, groomName: cfg.groomName, brideName: cfg.brideName };
      const at = idx.findIndex((x) => (x.weddingId || x.slug) === cfg.weddingId);
      if (at >= 0) idx[at] = entry; else idx.push(entry);
      idx.sort((a, b) => String(a.weddingId).localeCompare(String(b.weddingId)));
      await fetch(`https://api.github.com/repos/${repo}/contents/${idxPath}`, {
        method: "PUT", headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Update wedding index (${cfg.weddingId})`, content: b64(JSON.stringify(idx, null, 2) + "\n"), branch, ...(idxSha ? { sha: idxSha } : {}) }),
      });
    } catch (e) { /* index update is best-effort; wedding file itself is already published */ }
    return putData.commit?.html_url || `https://github.com/${repo}/blob/${branch}/${path}`;
  }

  /* ---------- Music upload (File -> GitHub / Backend) ---------- */
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = () => reject(new Error("File කියවන්න බෑ"));
    r.readAsDataURL(file);
  });
  const musicExt = (file) => {
    const n = (file.name || "").toLowerCase();
    if (n.endsWith(".m4a")) return "m4a"; if (n.endsWith(".ogg")) return "ogg"; if (n.endsWith(".wav")) return "wav";
    return "mp3";
  };
  async function uploadMusicToBackend(file, slug) {
    const dataBase64 = await fileToBase64(file);
    const r = await fetch("/api/music", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, filename: file.name, ext: musicExt(file), dataBase64 }) });
    if (!r.ok) throw new Error("Backend music upload failed");
    const d = await r.json();
    return d.url; // e.g. music/<slug>.mp3
  }
  async function uploadMusicToGitHub(file, slug) {
    const repo = ghRepoVal(), branch = ghBranchVal(), token = ghTokenVal();
    if (!token) throw new Error("GitHub token එකක් නෑ");
    const ext = musicExt(file);
    const destPath = `music/${slug}.${ext}`;
    const headers = { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" };
    const api = `https://api.github.com/repos/${repo}`;
    const dataBase64 = await fileToBase64(file);
    // Git Data API flow (works for larger files than Contents API)
    const refRes = await fetch(`${api}/git/refs/heads/${encodeURIComponent(branch)}`, { headers });
    if (!refRes.ok) throw new Error(`Git ref failed (${refRes.status}) — branch එක check කරන්න`);
    const refSha = (await refRes.json()).object.sha;
    const commitRes = await fetch(`${api}/git/commits/${refSha}`, { headers });
    const baseTree = (await commitRes.json()).tree.sha;
    const blobRes = await fetch(`${api}/git/blobs`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ content: dataBase64, encoding: "base64" }) });
    if (!blobRes.ok) throw new Error(`Git blob failed (${blobRes.status}) — file එක ලොකු වැඩිද බලන්න (50MB ට අඩුවෙන්)`);
    const blobSha = (await blobRes.json()).sha;
    const treeRes = await fetch(`${api}/git/trees`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ base_tree: baseTree, tree: [{ path: destPath, mode: "100644", type: "blob", sha: blobSha }] }) });
    if (!treeRes.ok) throw new Error(`Git tree failed (${treeRes.status})`);
    const newTree = (await treeRes.json()).sha;
    const newCommitRes = await fetch(`${api}/git/commits`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ message: `Add music for ${slug} (${file.name}) via InviteAura Admin`, tree: newTree, parents: [refSha] }) });
    if (!newCommitRes.ok) throw new Error(`Git commit failed (${newCommitRes.status})`);
    const newSha = (await newCommitRes.json()).sha;
    const upd = await fetch(`${api}/git/refs/heads/${encodeURIComponent(branch)}`, { method: "PATCH", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ sha: newSha }) });
    if (!upd.ok) throw new Error(`Git ref update failed (${upd.status})`);
    return destPath; // relative URL, e.g. music/gihan-chamika.mp3
  }
  function handleMusicFile(file) {
    const st = $("#musicStatus");
    if (!file) return;
    if (!file.type.startsWith("audio/") && !file.name.toLowerCase().endsWith(".mp3")) { st.textContent = "⚠️ කරුණාකරලා MP3 / audio file එකක් දාන්න."; st.className = "text-sm mt-2 font-medium text-red-700"; return; }
    if (file.size > 15 * 1024 * 1024) { st.textContent = "⚠️ File එක 15MB ට වඩා ලොකුයි. කුඩා MP3 එකක් දාන්න, නැත්තම් URL එකක් දාන්න."; st.className = "text-sm mt-2 font-medium text-amber-700"; return; }
    pendingMusicFile = file;
    const url = URL.createObjectURL(file);
    const prev = $("#musicPreview"); if (prev) { prev.src = url; prev.load(); }
    $("#musicFileInfo").textContent = `📎 ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB) — Save Wedding ඔබනකොට upload වෙනවා`;
    // Lock URL field while a file is selected so it cannot be overwritten by a Spotify/page link
    const urlInput = $("#f_musicUrl");
    urlInput.value = `music/${cfg.weddingId || "wedding"}.mp3 (upload කරන file එක)`;
    urlInput.disabled = true;
    urlInput.title = "File එකක් තෝරාගෙන තියෙනවා — URL එක වෙනස් කරන්න එපා. File එක ඉවත් කරන්න පහළ Clear ඔබන්න.";
    st.textContent = "✅ File එක තෝරාගත්තා — Preview එකෙන් අහලා, Save Wedding ඔබන්න.";
    st.className = "text-sm mt-2 font-medium text-green-700";
  }
  // Music UI wiring (init here so it works after gate unlock loads admin.js)
  (function initMusicUI() {
    const drop = $("#musicDrop"), input = $("#f_musicFile");
    if (!drop || !input) return;
    drop.addEventListener("click", () => input.click());
    drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.style.background = "#FDF8EF"; });
    drop.addEventListener("dragleave", () => { drop.style.background = ""; });
    drop.addEventListener("drop", (e) => { e.preventDefault(); drop.style.background = ""; handleMusicFile(e.dataTransfer.files?.[0]); });
    input.addEventListener("change", () => handleMusicFile(input.files?.[0]));
    $("#f_musicUrl")?.addEventListener("input", (e) => {
      const v = e.target.value.trim(), st = $("#musicStatus");
      const isDirect = v.startsWith("data:audio") || v.startsWith("blob:") || /\.(mp3|m4a|ogg|wav|webm)(\?|$)/i.test(v.split("?")[0]) || v.startsWith("music/");
      if (v && !isDirect) {
        st.textContent = "⚠️ මේක direct MP3 link එකක් නෙවෙයි (Spotify/YouTube page link එකක් වගේ) — මෙය වාදනය වෙන්නෑ. MP3 file එක Upload කරන්න, නැත්තම් direct .mp3 URL එකක් දාන්න.";
        st.className = "text-sm mt-2 font-medium text-amber-700";
        return;
      }
      if (v && !pendingMusicFile) { const p = $("#musicPreview"); if (p) { p.src = v; } st.textContent = "✅ Direct MP3 URL එකක් — Preview එකෙන් අහලා බලන්න."; st.className = "text-sm mt-2 font-medium text-green-700"; }
    });
    $("#musicClearBtn")?.addEventListener("click", () => {
      pendingMusicFile = null; input.value = "";
      const u = $("#f_musicUrl"); u.value = ""; u.disabled = false; u.title = "";
      const p = $("#musicPreview"); if (p) { p.removeAttribute("src"); p.load(); }
      $("#musicFileInfo").textContent = ""; $("#musicStatus").textContent = "Music ඉවත් කළා.";
    });
  })();

  function showHelp(html) {
    const h = $("#saveHelp");
    if (!html) { h.classList.add("hidden"); h.innerHTML = ""; return; }
    h.innerHTML = html; h.classList.remove("hidden");
  }

  $("#saveBtn").onclick = async () => {
    syncFromForm(false);
    const st = $("#saveStatus"), ghSt = $("#ghStatus");
    const slug = cfg.weddingId || "wedding";
    const liveUrl = location.origin + location.pathname.replace(/admin\.html$/, "") + "?wedding=" + slug;
    st.textContent = "💾 Saving…"; st.className = "text-sm mt-3 font-medium"; showHelp("");

    // 0) Music file upload first (so config points to the hosted file)
    if (pendingMusicFile) {
      const mSt = $("#musicStatus");
      mSt.textContent = "🎵 Music upload කරන්නේ…"; mSt.className = "text-sm mt-2 font-medium";
      let uploaded = false;
      try { cfg.music.url = await uploadMusicToBackend(pendingMusicFile, slug); uploaded = true; }
      catch (e) {
        if (ghTokenVal()) {
          try { cfg.music.url = await uploadMusicToGitHub(pendingMusicFile, slug); uploaded = true; }
          catch (ghE) { mSt.textContent = "⚠️ Music upload failed: " + ghE.message; mSt.className = "text-sm mt-2 font-medium text-red-700"; }
        }
      }
      if (uploaded) {
        const u = $("#f_musicUrl"); u.value = cfg.music.url; u.disabled = false; u.title = "";
        mSt.textContent = `✅ Music upload වුණා: ${cfg.music.url}`;
        mSt.className = "text-sm mt-2 font-medium text-green-700";
        pendingMusicFile = null;
        saveLocally();
      } else if (!ghTokenVal()) {
        // No backend + no token: download the MP3 alongside JSON in fallback below
        cfg.music.url = `music/${slug}.${musicExt(pendingMusicFile)}`;
        mSt.textContent = "🎵 Token එකක් නැති නිසා MP3 එක download වෙනවා — repo එකේ music/ folder එකට upload කරන්න.";
        mSt.className = "text-sm mt-2 font-medium text-amber-700";
      }
    }

    // 1) Node backend (local / Render / VPS)
    try {
      const r = await fetch("/api/weddings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cfg) });
      if (!r.ok) throw new Error("backend not available");
      const d = await r.json();
      st.textContent = `✅ Saved! Live at: ${liveUrl}`;
      st.className = "text-sm mt-3 font-medium text-green-700";
      showQR(liveUrl); loadWeddingList(); return;
    } catch (e) { /* static mode — fall through */ }

    // 2) GitHub Pages static: publish straight to GitHub (if token given)
    saveLocally();
    if (ghTokenVal()) {
      ghSt.textContent = "☁️ GitHub එකට publish කරන්නේ…"; ghSt.className = "text-sm mt-2 font-medium";
      try {
        const commitUrl = await publishToGitHub();
        st.textContent = `✅ Saved & published to GitHub! Live in ~1 min: ${liveUrl}`;
        st.className = "text-sm mt-3 font-medium text-green-700";
        ghSt.innerHTML = `☁️ Commit: <a class="underline" href="${commitUrl}" target="_blank" rel="noopener">${commitUrl}</a>`;
        ghSt.className = "text-sm mt-2 font-medium text-green-700";
        showQR(liveUrl); loadWeddingList(); return;
      } catch (ghErr) {
        ghSt.textContent = "⚠️ GitHub publish failed: " + ghErr.message + " — download එකක් දෙනවා.";
        ghSt.className = "text-sm mt-2 font-medium text-red-700";
      }
    }

    // 3) Static fallback: browser save + auto-download (no token / token failed)
    downloadJSON();
    let musicNote = "";
    if (pendingMusicFile) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(pendingMusicFile);
      a.download = `${slug}.${musicExt(pendingMusicFile)}`; a.click();
      pendingMusicFile = null;
      musicNote = `<br>🎵 MP3 file එකත් download වුණා — <a class="underline font-semibold" href="https://github.com/${ghRepoVal()}/tree/${ghBranchVal()}/music" target="_blank" rel="noopener">GitHub repo එකේ <b>music/</b> folder එකට</a> upload කරන්න (නම: <code class="bg-white px-1 rounded">${slug}.mp3</code>).`;
    }
    const repoLink = `https://github.com/${ghRepoVal()}/tree/${ghBranchVal()}/weddings`;
    st.textContent = `✅ Saved in this browser + ${slug}.json download වුණා.`;
    st.className = "text-sm mt-3 font-medium text-green-700";
    showHelp(`<b>🌐 Publish කරන්න (හැමෝටම live වෙන්න):</b><br>
      1) Download වුණු <code class="bg-white px-1 rounded">${slug}.json</code> file එක, <a class="underline font-semibold" href="${repoLink}" target="_blank" rel="noopener">GitHub repo එකේ <b>weddings</b> folder එකට</a> upload කරන්න (Add file → Upload files).${musicNote}<br>
      2) ~1 minute වලින් live: <a class="underline font-semibold" href="${liveUrl}" target="_blank" rel="noopener">${liveUrl}</a><br>
      <span class="opacity-70">💡 ඊළඟ වතාවල one-click publish කරගන්න: පහළ GitHub token එකක් (PAT) paste කරලා <b>Remember</b> tick කරන්න — ඊට පස්සේ Save එකෙන්ම GitHub එකට යනවා.</span><br>
      <span class="opacity-70">🖥️ Local server එකෙන් run කරනවා නම්: <code class="bg-white px-1 rounded">node server.js</code></span>`);
    showQR(liveUrl); loadWeddingList();
  };
  $("#previewBtn").onclick = () => { syncFromForm(false); pushPreview(); window.open("index.html?preview=1&wedding=" + cfg.weddingId, "_blank"); };
  $("#downloadBtn").onclick = () => { syncFromForm(false); downloadJSON(); };
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

  /* Load saved weddings: backend list, else weddings/index.json (GitHub Pages manifest), else default + local saves */
  async function loadWeddingList() {
    let list = [];
    try { const r = await fetch("/api/weddings"); if (r.ok) list = await r.json(); } catch {}
    if (!list.length) {
      // Static mode: index.json lists every published wedding (maintained on each Publish)
      try {
        const r = await fetch("weddings/index.json", { cache: "no-store" });
        if (r.ok) {
          const idx = await r.json();
          const entries = Array.isArray(idx) ? idx : (idx.weddings || []);
          // Fetch full config for each so dropdown shows correct names + Load works
          list = await Promise.all(entries.map(async (e) => {
            const slug = e.weddingId || e.slug;
            try { const fr = await fetch("weddings/" + slug + ".json", { cache: "no-store" }); if (fr.ok) { const full = await fr.json(); full.weddingId = slug; return full; } } catch {}
            return { weddingId: slug, groomName: e.groomName || "", brideName: e.brideName || "" };
          }));
        }
      } catch {}
    }
    if (!list.length) {
      try { const r = await fetch("wedding.config.json"); if (r.ok) list = [await r.json()]; } catch {}
    }
    // Locally saved (static mode) weddings so they stay loadable in this browser
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith("inviteAuraWedding_")) {
        try { const w = JSON.parse(localStorage.getItem(k)); if (w?.weddingId && !list.some((x) => x.weddingId === w.weddingId)) list.push(w); } catch {}
      }
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
    $("#rsvpTable").innerHTML = rsvps.map((r) => `<tr class="border-t border-[#E8DCC6]"><td class="p-2">${escHtml(r.name)}</td><td class="p-2">${r.attending === "yes" ? "✅ Yes" : "😔 No"}</td><td class="p-2">${escHtml(r.guests || "")}</td><td class="p-2">${escHtml(r.liquor || r.meal || "")} × ${escHtml(r.liquorCount || "")}</td><td class="p-2">${escHtml(r.phone || "")}</td></tr>`).join("") || `<tr><td colspan="5" class="p-3 text-center opacity-60">No RSVPs yet</td></tr>`;
    $("#wishAdminList").innerHTML = wishes.map((w) => `<div class="border border-[#E8DCC6] rounded-xl p-3 bg-white"><b>${escHtml(w.name)}</b> — ${escHtml(w.message)}</div>`).join("") || `<p class="opacity-60">No wishes yet</p>`;
  }
  $("#refreshRsvpBtn").onclick = refreshRsvps;
  $("#rsvpWedding").onchange = refreshRsvps;
  $("#exportCsvBtn").onclick = () => {
    const rows = [["Name", "Attending", "Guests", "Liquor", "Liquor Count", "Phone", "Message"], ...rsvpCache.map((r) => [r.name, r.attending, r.guests, r.liquor || r.meal || "", r.liquorCount || "", r.phone, (r.message || "").replace(/"/g, '""')])];
    const csv = rows.map((r) => r.map((c) => `"${c ?? ""}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "rsvps.csv"; a.click();
  };

  /* Test GitHub connection (token + repo access) */
  function setConnBadge(state, text) {
    const el = $("#ghConnStatus");
    if (!el) return;
    el.textContent = text;
    el.className = "text-sm mt-2 font-semibold " + (state === "ok" ? "text-green-700" : state === "err" ? "text-red-700" : "text-amber-700");
  }
  async function testGitHubConnection() {
    const st = $("#ghStatus"), btn = $("#testGhBtn");
    const repo = ghRepoVal(), token = ghTokenVal();
    if (!token) { st.textContent = "⚠️ Token එකක් නෑ — Step 1 එකෙන් token එකක් හදලා මෙතන paste කරන්න."; st.className = "text-sm mt-2 font-medium text-amber-700"; setConnBadge("warn", "⚪ Not connected — Step 1 → 2 කරන්න"); return; }
    if (!repo) { st.textContent = "⚠️ Repo නමක් නෑ (owner/repo)."; st.className = "text-sm mt-2 font-medium text-red-700"; return; }
    st.textContent = "🔍 Testing… GitHub එකට connect වෙන්නේ…"; st.className = "text-sm mt-2 font-medium";
    if (btn) { btn.disabled = true; btn.textContent = "Testing…"; }
    const headers = { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" };
    try {
      const userRes = await fetch("https://api.github.com/user", { headers });
      if (userRes.status === 401) throw new Error("401 — token එක වැරදි නැත්තම් expire වෙලා. අලුත් token එකක් හදන්න (Step 1).");
      if (!userRes.ok) throw new Error(`GitHub user check failed (${userRes.status})`);
      const user = await userRes.json();
      const repoRes = await fetch(`https://api.github.com/repos/${repo}`, { headers });
      if (repoRes.status === 404) throw new Error(`404 — repo "${repo}" හොයාගන්න බෑ. Repo නම වැරදිද, නැත්තම් token එකට ඒ repo එකට access නෑද බලන්න (Step 1 එකේ inviteaura-builder tick කරන්න).`);
      if (repoRes.status === 403) throw new Error("403 — token එකට ඒ repo එකට permission නෑ. Contents: Read and write දෙන්න.");
      if (!repoRes.ok) throw new Error(`Repo check failed (${repoRes.status})`);
      st.textContent = `✅ Connected as @${user.login} — "${repo}" repo එකට access තියෙනවා. දැන් Save Wedding ඔබන්න, auto publish වෙනවා!`;
      st.className = "text-sm mt-2 font-medium text-green-700";
      setConnBadge("ok", `🟢 Connected as @${user.login} — One-Click Publish සූදානම්!`);
    } catch (e) {
      st.textContent = "❌ " + e.message;
      st.className = "text-sm mt-2 font-medium text-red-700";
      setConnBadge("err", "🔴 Connection failed — ඉහළ message එක බලන්න");
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "🔍 Test Connection"; }
    }
  }
  $("#testGhBtn")?.addEventListener("click", testGitHubConnection);

  /* Init GitHub publish fields: remembered values, else auto-detect from Pages host */
  (function initGitHubFields() {
    const repoInput = $("#ghRepo"), branchInput = $("#ghBranch"), tokenInput = $("#ghToken"), remember = $("#ghRemember");
    if (!repoInput) return;
    repoInput.value = localStorage.getItem("inviteAuraGhRepo") || "";
    branchInput.value = localStorage.getItem("inviteAuraGhBranch") || "main";
    tokenInput.value = localStorage.getItem("inviteAuraGhToken") || "";
    if (tokenInput.value) remember.checked = true;
    if (!repoInput.value && location.hostname.endsWith("github.io")) {
      const owner = location.hostname.replace(/\.github\.io$/, "");
      const repo = location.pathname.split("/").filter(Boolean)[0] || "inviteaura-builder";
      repoInput.value = `${owner}/${repo}`;
    }
    if (!repoInput.value) repoInput.value = "nuonecreations/inviteaura-builder";
    const persist = () => {
      if (remember.checked) {
        localStorage.setItem("inviteAuraGhRepo", repoInput.value);
        localStorage.setItem("inviteAuraGhBranch", branchInput.value);
        localStorage.setItem("inviteAuraGhToken", tokenInput.value);
      } else {
        localStorage.removeItem("inviteAuraGhToken");
      }
    };
    [repoInput, branchInput, tokenInput].forEach((el) => el.addEventListener("change", persist));
    remember.addEventListener("change", persist);
    if (tokenInput.value) setConnBadge("warn", "🟡 Token saved — 'Test Connection' ඔබලා Connected ද බලන්න");
  })();

  renderForm(); loadWeddingList().then(refreshRsvps);
})();
