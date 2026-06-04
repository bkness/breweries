// ============================================================
//  INLINE NOTE DRAWER  (My Pubs)
//  One card button with three states:
//    no note   -> "+ Add note"   -> opens EDIT mode
//    has note  -> "📝 View note" -> opens READ mode (note + Edit btn)
//    editing   -> textarea + Save/Cancel -> save returns to READ
//
//  Talks to the existing  PUT /api/breweries/:id  route. No backend change.
//  Load AFTER app.js:  <script src='/js/mypubs-comments.js'></script>
// ============================================================
(function () {
  const q = (sel, root = document) => root.querySelector(sel);
  const drawerFor = (id) => q(`.comment-drawer[data-id='${id}']`);
  const toggleFor = (id) => q(`.js-comment-toggle[data-id='${id}']`);

  function showMode(id, mode /* 'read' | 'edit' */) {
    const drawer = drawerFor(id);
    if (!drawer) return;
    const read = q('.js-comment-read', drawer);
    const edit = q('.js-comment-edit-pane', drawer);
    if (read) read.classList.toggle('is-hidden', mode !== 'read');
    if (edit) edit.classList.toggle('is-hidden', mode !== 'edit');
  }

  function hasNote(id) {
    return toggleFor(id)?.dataset.hasNote === '1';
  }

  function openDrawer(id) {
    const drawer = drawerFor(id);
    const btn = toggleFor(id);
    if (!drawer) return;

    // Close others — one drawer open at a time keeps the grid calm
    document.querySelectorAll('.comment-drawer.is-open').forEach((d) => {
      if (d !== drawer) closeDrawer(d.dataset.id);
    });

    // Pick initial mode based on whether a note exists
    showMode(id, hasNote(id) ? 'read' : 'edit');

    drawer.classList.add('is-open');
    btn?.classList.add('is-open');
    btn?.setAttribute('aria-expanded', 'true');

    if (!hasNote(id)) {
      const ta = q('.js-comment-input', drawer);
      ta?.focus();
      if (ta) ta.setSelectionRange(ta.value.length, ta.value.length);
    }
  }

  function closeDrawer(id) {
    const drawer = drawerFor(id);
    const btn = toggleFor(id);
    drawer?.classList.remove('is-open');
    btn?.classList.remove('is-open');
    btn?.setAttribute('aria-expanded', 'false');
    // Reset to read mode for next open if a note exists
    if (drawer && hasNote(id)) showMode(id, 'read');
  }

  function toggleDrawer(id) {
    const drawer = drawerFor(id);
    if (!drawer) return;
    drawer.classList.contains('is-open') ? closeDrawer(id) : openDrawer(id);
  }

  function enterEdit(id) {
    const drawer = drawerFor(id);
    showMode(id, 'edit');
    const ta = q('.js-comment-input', drawer);
    ta?.focus();
    if (ta) ta.setSelectionRange(ta.value.length, ta.value.length);
  }

  async function saveComment(id) {
    const drawer = drawerFor(id);
    const ta = q('.js-comment-input', drawer);
    const saveBtn = q('.js-comment-save', drawer);
    const flash = q('.js-comment-flash', drawer);
    if (!ta) return;

    const comment = ta.value.trim();
    const original = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';

    try {
      const res = await fetch(`/api/breweries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      });
      if (!res.ok) throw new Error('Save failed');

      // Update toggle state + label
      const btn = toggleFor(id);
      if (btn) {
        btn.dataset.hasNote = comment ? '1' : '0';
        btn.textContent = comment ? '📝 View note' : '+ Add note';
      }

      // Update the read view text (textContent — no HTML injection possible)
      const noteText = q('.js-note-text', drawer);
      if (noteText) noteText.textContent = comment;

      saveBtn.textContent = original;
      saveBtn.disabled = false;

      if (flash) {
        flash.classList.add('show');
        setTimeout(() => flash.classList.remove('show'), 1400);
      }

      // If note now exists, show read view briefly then close; else just close
      if (comment) {
        showMode(id, 'read');
        setTimeout(() => closeDrawer(id), 600);
      } else {
        setTimeout(() => closeDrawer(id), 450);
      }
    } catch (err) {
      console.error(err);
      saveBtn.textContent = original;
      saveBtn.disabled = false;
      if (typeof showToast === 'function') showToast('❌ Could not save note');
    }
  }

  function cancelEdit(id) {
    const drawer = drawerFor(id);
    // Restore textarea to the saved value (read view text is the source of truth)
    const ta = q('.js-comment-input', drawer);
    const saved = q('.js-note-text', drawer)?.textContent || '';
    if (ta) ta.value = saved;
    if (hasNote(id)) showMode(id, 'read');
    else closeDrawer(id);
  }

  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('.js-comment-toggle');
    if (toggle) return toggleDrawer(toggle.dataset.id);

    const edit = e.target.closest('.js-comment-edit');
    if (edit) return enterEdit(edit.dataset.id);

    const save = e.target.closest('.js-comment-save');
    if (save) return saveComment(save.dataset.id);

    const cancel = e.target.closest('.js-comment-cancel');
    if (cancel) return cancelEdit(cancel.dataset.id);
  });

  // Cmd/Ctrl+Enter inside the textarea saves
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      const ta = e.target.closest('.js-comment-input');
      if (!ta) return;
      const drawer = ta.closest('.comment-drawer');
      saveComment(drawer.dataset.id);
    }
  });
})();
