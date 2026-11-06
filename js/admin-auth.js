/* InviteAura Admin — password hash (NOT the password itself).
   The real password is never stored in code. Only its SHA-256 hash lives here.
   Changing the password:
     1. Pick a strong new password (16+ chars, mixed case + numbers).
     2. Compute its SHA-256 hex, e.g. in browser console:
          await crypto.subtle.digest("SHA-256", new TextEncoder().encode("YOUR_NEW_PASSWORD"))
            .then(b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2,"0")).join(""))
     3. Replace passwordHash below with that hex, commit & push.
   Note: GitHub Pages is static — this gate stops casual access.
   Live-site changes additionally require the owner's GitHub token (see Admin → Publish),
   so opening the Admin alone cannot change the published invitation. */
window.ADMIN_AUTH = {
  passwordHash: "488c14336c552097e10c6c021df5ecc0e90e6f81197790f131de3b09c105bc2d"
};
