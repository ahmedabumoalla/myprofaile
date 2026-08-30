(function () {
  "use strict";

  const projects = Array.isArray(window.PORTFOLIO_PROJECTS) ? window.PORTFOLIO_PROJECTS : [];
  const featuredProjectIds = ["project-01", "project-02", "project-08", "project-09"];
  const categoryLabels = {
    platform: "منصة رقمية",
    ai: "ذكاء اصطناعي",
    dashboard: "لوحة تشغيل",
    experience: "تجربة تفاعلية",
    industry: "حل صناعي",
    health: "صحة رقمية",
    mobile: "تطبيق موبايل"
  };
  const statusLabels = {
    live: "منشور",
    source: "موثّق من المصدر",
    concept: "في مرحلة مبكرة"
  };
  const featuredStage = document.getElementById("featuredStage");
  const archiveList = document.getElementById("archiveList");
  const projectFocus = document.getElementById("projectFocus");
  const visibleCount = document.getElementById("visibleCount");
  const emptyResult = document.getElementById("emptyResult");
  const search = document.getElementById("projectSearch");
  const filterList = document.getElementById("filterList");
  const modal = document.getElementById("projectModal");
  const modalPanel = modal.querySelector(".project-modal__panel");

  let activeFilter = "all";
  let visibleProjects = projects.slice();
  let selectedProject = projects.find((project) => project.id === "project-01") || projects[0] || null;
  let activeModalIndex = -1;
  let lastFocused = null;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    })[char]);
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function projectVisual(project, kind) {
    if (project.image) {
      return `<img src="${escapeHtml(project.image)}" alt="واجهة مشروع ${escapeHtml(project.title)}" loading="${kind === "hero" ? "eager" : "lazy"}" decoding="async">`;
    }

    const stack = project.tech.slice(0, 4);
    return `<div class="tech-visual" aria-hidden="true"><div class="tech-visual__code"><b>${escapeHtml(project.title)}</b><span>system.compose(modules)</span><span>stack [${stack.map((item) => escapeHtml(item)).join(" / ")}]</span><span>routes ${project.metrics.pages} / source ${project.metrics.source}</span></div></div>`;
  }

  function renderFeatured() {
    const selected = featuredProjectIds.map((projectId) => projects.find((project) => project.id === projectId)).filter(Boolean);
    featuredStage.innerHTML = selected.map((project, index) => `
      <article class="selected-card ${index === 0 ? "selected-card--lead" : "selected-card--small"} reveal" tabindex="0" role="button" data-open-project="${escapeHtml(project.id)}" aria-label="عرض تفاصيل ${escapeHtml(project.title)}">
        <div class="selected-card__visual">${projectVisual(project, index === 0 ? "hero" : "card")}</div>
        <span class="selected-card__number">${pad(index + 1)}</span>
        <div class="selected-card__content">
          <span>${escapeHtml(categoryLabels[project.category] || project.kicker)}</span>
          <h3>${escapeHtml(project.title)}</h3>
          <p>${escapeHtml(project.description)}</p>
          <div class="selected-card__meta">${project.tech.slice(0, 4).map((tech) => `<span>${escapeHtml(tech)}</span>`).join("")}</div>
        </div>
        <span class="selected-card__arrow" aria-hidden="true">↗</span>
      </article>`).join("");
  }

  function renderArchive() {
    const term = search.value.trim().toLocaleLowerCase("ar");
    visibleProjects = projects.filter((project) => {
      const matchesFilter = activeFilter === "all" || project.category === activeFilter;
      const searchable = [project.title, project.kicker, project.description, ...project.tech].join(" ").toLocaleLowerCase("ar");
      return matchesFilter && (!term || searchable.includes(term));
    });

    visibleCount.textContent = visibleProjects.length;
    emptyResult.hidden = visibleProjects.length !== 0;
    archiveList.hidden = visibleProjects.length === 0;

    if (visibleProjects.length && !visibleProjects.includes(selectedProject)) {
      selectedProject = visibleProjects[0];
    }

    archiveList.innerHTML = visibleProjects.map((project) => {
      const index = projects.indexOf(project);
      return `<button class="archive-row ${project === selectedProject ? "is-active" : ""}" type="button" data-select-project="${escapeHtml(project.id)}" aria-pressed="${project === selectedProject ? "true" : "false"}">
        <span class="archive-row__number">${pad(index + 1)}</span>
        <span class="archive-row__title">${escapeHtml(project.title)}</span>
        <span class="archive-row__category">${escapeHtml(categoryLabels[project.category] || project.kicker)}</span>
        <span class="archive-row__status">${escapeHtml(statusLabels[project.status])}</span>
        <span class="archive-row__arrow" aria-hidden="true">←</span>
      </button>`;
    }).join("");

    renderProjectFocus();
  }

  function renderProjectFocus() {
    if (!selectedProject) {
      projectFocus.innerHTML = "";
      return;
    }

    const project = selectedProject;
    const index = projects.indexOf(project);
    const primaryAction = project.live
      ? `<a href="${escapeHtml(project.live)}" target="_blank" rel="noreferrer">فتح النسخة المنشورة <span>↗</span></a>`
      : "";

    projectFocus.innerHTML = `
      <div class="focus-copy">
        <span class="focus-copy__number">المشروع / ${pad(index + 1)}</span>
        <p class="focus-copy__kicker">${escapeHtml(project.kicker)}</p>
        <h2>${escapeHtml(project.title)}</h2>
        <p class="focus-copy__description">${escapeHtml(project.description)}</p>
        <div class="focus-details">
          <div><small>الحالة</small><strong>${escapeHtml(statusLabels[project.status])}</strong></div>
          <div><small>النوع</small><strong>${escapeHtml(categoryLabels[project.category] || "منتج رقمي")}</strong></div>
          <div><small>الشاشات والمسارات</small><strong>${project.metrics.pages.toLocaleString("en-US")}</strong></div>
          <div><small>ملفات المصدر</small><strong>${project.metrics.source.toLocaleString("en-US")}</strong></div>
        </div>
        <div class="focus-actions">
          <button type="button" data-open-project="${escapeHtml(project.id)}">دراسة المشروع <span>←</span></button>
          ${primaryAction}
        </div>
      </div>
      <div class="focus-visual">
        <div class="focus-visual__frame">
          ${projectVisual(project, "hero")}
          <span class="focus-visual__badge">${escapeHtml(statusLabels[project.status])}</span>
        </div>
        <div class="focus-thumbs">
          <span>${project.image ? `<img src="${escapeHtml(project.image)}" alt="معاينة مصغرة لمشروع ${escapeHtml(project.title)}">` : "UI"}</span>
          ${project.tech.slice(0, 4).map((tech) => `<span>${escapeHtml(tech)}</span>`).join("")}
        </div>
      </div>`;
  }

  function selectProject(projectId) {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;
    selectedProject = project;
    archiveList.querySelectorAll("[data-select-project]").forEach((row) => {
      const active = row.dataset.selectProject === projectId;
      row.classList.toggle("is-active", active);
      row.setAttribute("aria-pressed", String(active));
    });
    renderProjectFocus();
  }

  function renderModal(project) {
    const projectIndex = projects.indexOf(project);
    document.getElementById("modalVisual").innerHTML = projectVisual(project, "hero");
    document.getElementById("modalIndex").textContent = `المشروع / ${pad(projectIndex + 1)}`;
    document.getElementById("modalPosition").textContent = `${pad(projectIndex + 1)} / ${pad(projects.length)}`;
    document.getElementById("modalKicker").textContent = project.kicker;
    document.getElementById("modalTitle").textContent = project.title;
    document.getElementById("modalDescription").textContent = project.description;
    document.getElementById("modalStatus").innerHTML = `<span>${escapeHtml(statusLabels[project.status])}</span><span>${escapeHtml(categoryLabels[project.category] || "منتج رقمي")}</span>`;
    document.getElementById("modalMetrics").innerHTML = [
      [project.metrics.files, "ملف"],
      [project.metrics.source, "ملف مصدر"],
      [project.metrics.pages, "شاشة ومسار"],
      [project.metrics.components, "مكوّن واجهة"]
    ].map(([value, label]) => `<div><strong>${Number(value).toLocaleString("en-US")}</strong><small>${label}</small></div>`).join("");
    document.getElementById("modalTech").innerHTML = project.tech.map((tech) => `<span>${escapeHtml(tech)}</span>`).join("");

    const actions = [];
    if (project.live) actions.push(`<a href="${escapeHtml(project.live)}" target="_blank" rel="noreferrer">فتح النسخة المنشورة <span>↗</span></a>`);
    actions.push(`<a href="https://wa.me/966508424401?text=${encodeURIComponent(`مرحبًا شاهدت مشروع ${project.title} وأرغب في مناقشة مشروع مشابه`)}" target="_blank" rel="noreferrer">اطلب مشروعًا مشابهًا <span>↗</span></a>`);
    document.getElementById("modalActions").innerHTML = actions.join("");
  }

  function openModal(projectId, shouldUpdateHash = true) {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;
    lastFocused = document.activeElement;
    activeModalIndex = projects.indexOf(project);
    renderModal(project);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    if (shouldUpdateHash) history.replaceState(null, "", `#project=${encodeURIComponent(project.id)}`);
    requestAnimationFrame(() => modalPanel.focus());
  }

  function closeModal(shouldUpdateHash = true) {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    activeModalIndex = -1;
    if (shouldUpdateHash && location.hash.startsWith("#project=")) history.replaceState(null, "", "#archive");
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  function stepModal(direction) {
    if (activeModalIndex < 0) return;
    activeModalIndex = (activeModalIndex + direction + projects.length) % projects.length;
    const project = projects[activeModalIndex];
    renderModal(project);
    history.replaceState(null, "", `#project=${encodeURIComponent(project.id)}`);
    modalPanel.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openProjectInteraction(event) {
    const trigger = event.target.closest("[data-open-project]");
    if (!trigger) return;
    if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") return;
    if (event.type === "keydown") event.preventDefault();
    openModal(trigger.dataset.openProject);
  }

  featuredStage.addEventListener("click", openProjectInteraction);
  featuredStage.addEventListener("keydown", openProjectInteraction);
  projectFocus.addEventListener("click", openProjectInteraction);

  archiveList.addEventListener("click", (event) => {
    const row = event.target.closest("[data-select-project]");
    if (!row) return;
    selectProject(row.dataset.selectProject);
  });

  filterList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    activeFilter = button.dataset.filter;
    filterList.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
    renderArchive();
  });

  search.addEventListener("input", renderArchive);
  document.getElementById("resetFilters").addEventListener("click", () => {
    activeFilter = "all";
    search.value = "";
    filterList.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("is-active", item.dataset.filter === "all"));
    renderArchive();
  });

  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-modal]")) closeModal();
  });
  document.getElementById("modalPrev").addEventListener("click", () => stepModal(-1));
  document.getElementById("modalNext").addEventListener("click", () => stepModal(1));
  document.addEventListener("keydown", (event) => {
    if (!modal.classList.contains("is-open")) return;
    if (event.key === "Escape") closeModal();
    if (event.key === "ArrowLeft") stepModal(1);
    if (event.key === "ArrowRight") stepModal(-1);
  });

  renderFeatured();
  renderArchive();

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .08, rootMargin: "0px 0px -5%" });

  document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

  function revealVisibleElements() {
    document.querySelectorAll(".reveal:not(.is-visible)").forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight * .96 && rect.bottom > 0) {
        element.classList.add("is-visible");
        revealObserver.unobserve(element);
      }
    });
  }

  window.addEventListener("scroll", revealVisibleElements, { passive: true });
  requestAnimationFrame(revealVisibleElements);
  window.setTimeout(revealVisibleElements, 500);

  function openProjectFromHash() {
    const hashMatch = window.location.hash.match(/^#project=(.+)$/);
    if (hashMatch) openModal(decodeURIComponent(hashMatch[1]), false);
  }

  window.addEventListener("hashchange", openProjectFromHash);
  openProjectFromHash();
})();
