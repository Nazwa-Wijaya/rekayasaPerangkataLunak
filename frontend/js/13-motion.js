// js/13-motion.js — Boot render() + polish gerak non-fungsional.
// Opsi A: script klasik berurutan. Urutan load di frontend/index.html. Jangan load satuan.
// Initial Run
render();

/* Motion enhancement only: no API, storage, or business logic is changed. */
(() => {
  const installMotion = () => {
    if (!document.body || !("IntersectionObserver" in window)) return;
    const reveal = (root) => {
      const selectors = ".tw, .stat, .head, #main > .card";
      const nodes = [];
      if (root.matches && root.matches(selectors)) nodes.push(root);
      if (root.querySelectorAll)
        nodes.push(...root.querySelectorAll(selectors));
      nodes.forEach((el, i) => {
        if (el.dataset.motionReady) return;
        el.dataset.motionReady = "1";
        if (el.closest(".no-enter")) return;
        el.classList.add("motion-reveal");
        el.style.setProperty("--motion-delay", `${Math.min(i % 8, 7) * 55}ms`);
        observer.observe(el);
      });
    };
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const t = entry.target;
            t.classList.add("motion-visible");
            observer.unobserve(t);
            // Lepas kelas animasi setelah selesai agar tidak mengganggu efek hover.
            setTimeout(
              () => t.classList.remove("motion-reveal", "motion-visible"),
              900,
            );
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -24px 0px" },
    );
    installMotion.observer = observer;
    reveal(document.body);
    new MutationObserver((records) =>
      records.forEach((record) =>
        record.addedNodes.forEach((node) => {
          if (node.nodeType === 1) reveal(node);
        }),
      ),
    ).observe(document.getElementById("root") || document.body, {
      childList: true,
      subtree: true,
    });
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", installMotion, {
      once: true,
    });
  else installMotion();
})();

/* Small interaction polish: image previews and one-time count-up for numeric dashboard values. */
(() => {
  const initEnhancements = () => {
    const root = document.getElementById("root");
    if (!root) return;
    const previewFile = (input) => {
      if (
        !input ||
        input.dataset.previewBound ||
        input.type !== "file" ||
        input.hasAttribute("onchange")
      )
        return;
      input.dataset.previewBound = "1";
      input.addEventListener("change", () => {
        const file = input.files && input.files[0];
        if (!file || !file.type.startsWith("image/")) return;
        let preview =
          input.parentElement &&
          input.parentElement.querySelector(".motion-image-preview");
        if (!preview) {
          preview = document.createElement("img");
          preview.className = "motion-image-preview";
          preview.alt = "Pratinjau gambar yang dipilih";
          preview.style.cssText =
            "display:block;max-width:180px;max-height:140px;object-fit:cover;border-radius:12px;margin-top:10px;box-shadow:0 6px 18px rgba(16,45,70,.12);animation:content-arrive .28s ease both";
          input.insertAdjacentElement("afterend", preview);
        }
        if (preview.dataset.objectUrl)
          URL.revokeObjectURL(preview.dataset.objectUrl);
        preview.dataset.objectUrl = URL.createObjectURL(file);
        preview.src = preview.dataset.objectUrl;
      });
    };
    const scan = (node) => {
      if (node.nodeType !== 1) return;
      if (node.matches && node.matches('input[type="file"]')) previewFile(node);
      node.querySelectorAll &&
        node.querySelectorAll('input[type="file"]').forEach(previewFile);
    };
    scan(root);
    new MutationObserver((records) =>
      records.forEach((record) => record.addedNodes.forEach(scan)),
    ).observe(root, { childList: true, subtree: true });
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initEnhancements, {
      once: true,
    });
  else initEnhancements();
})();

/* v11: cursor-aware highlight for buttons. Delegated so dynamically rendered
   buttons also work; does not intercept clicks or change application state. */
(() => {
  if (
    window.matchMedia &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  ) {
    document.addEventListener(
      "pointermove",
      (event) => {
        const button =
          event.target.closest && event.target.closest(".btn:not(:disabled)");
        if (!button) return;
        const rect = button.getBoundingClientRect();
        button.style.setProperty(
          "--v11-mx",
          `${((event.clientX - rect.left) / rect.width) * 100}%`,
        );
        button.style.setProperty(
          "--v11-my",
          `${((event.clientY - rect.top) / rect.height) * 100}%`,
        );
      },
      { passive: true },
    );
  }
})();
