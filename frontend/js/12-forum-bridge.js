// js/12-forum-bridge.js — Jembatan forum: refresh/search/reset + V.forum -> renderForum().
// Opsi A: script klasik berurutan. Urutan load di frontend/index.html. Jangan load satuan.
function refreshForum() {
  const m = $("#main");
  if (m) m.classList.add("no-enter");
  V.forum();
}

function searchForum(value) {
  ST.q = value;
  clearTimeout(window.tm);
  window.tm = setTimeout(() => {
    const box = $("#forum-results");
    if (!box) return;
    $("#main").classList.add("no-enter");
    box.innerHTML = forumResults();
    const clr = $(".fv-search-clear");
    if (clr) clr.hidden = !ST.q;
  }, 150);
}

function clearForumSearch() {
  ST.q = "";
  const input = $("#sq");
  if (input) {
    input.value = "";
    input.focus();
  }
  const box = $("#forum-results");
  if (box) {
    $("#main").classList.add("no-enter");
    box.innerHTML = forumResults();
  }
  const clr = $(".fv-search-clear");
  if (clr) clr.hidden = true;
}

function resetForumFilters() {
  ST.q = "";
  ST.fc = "";
  ST.fg = "";
  ST.fl = "";
  ST.fs = "";
  ST.ft = "";
  refreshForum();
}

// forumResults() kini ada di dashboard-ui.js

V.forum = function () {
    renderForum(); // tampilan baru: dashboard-ui.js
  };

