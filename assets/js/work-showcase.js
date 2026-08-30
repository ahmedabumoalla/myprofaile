(function () {
  "use strict";

  const projects = Array.isArray(window.GITHUB_PROJECTS) ? window.GITHUB_PROJECTS : [];
  const featuredRepos = ["serein-mobile", "modawat", "branda"];
  const categoryLabels = {
    platform: "منصة رقمية",
    ai: "ذكاء اصطناعي",
    dashboard: "لوحة تشغيل",
    experience: "تجربة رقمية",
    industry: "حل صناعي",
    health: "صحة رقمية",
    mobile: "تطبيق موبايل",
    concept: "نواة مبكرة"
  };
  const statusLabels = {
    live: "LIVE SYSTEM",
    source: "SOURCE VERIFIED",
    concept: "EARLY CONCEPT"
  };

  const grid = document.getElementById("projectGrid");
  const featuredStage = document.getElementById("featuredStage");
  const visibleCount = document.getElementById("visibleCount");
  const emptyResult = document.getElementById("emptyResult");
  const search = document.getElementById("projectSearch");
  const filterList = document.getElementById("filterList");
  const modal = document.getElementById("projectModal");
  const modalPanel = modal.querySelector(".project-modal__panel");
  let activeFilter = "all";
  let visibleProjects = projects.slice();
  let activeModalIndex = -1;
  let lastFocused = null;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[char]);
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function projectVisual(project, kind) {
    if (project.image) {
      return `<img src="${escapeHtml(project.image)}" alt="واجهة مشروع ${escapeHtml(project.title)}" loading="${kind === "featured" ? "eager" : "lazy"}" decoding="async">`;
    }
    const stack = project.tech.slice(0, 4);
    const state = project.status === "concept" ? "repository.awaiting(firstCommit)" : "system.compose(modules)";
    return `<div class="tech-visual" aria-hidden="true"><div class="tech-visual__code"><b>${escapeHtml(project.repo)}</b><span>const system = <em>${escapeHtml(state)}</em>;</span><span>stack: [${stack.map((item) => `"${escapeHtml(item)}"`).join(", ")}]</span><span>routes: ${project.metrics.pages} / source: ${project.metrics.source}</span></div></div>`;
  }

  function renderFeatured() {
    const selected = featuredRepos.map((repo) => projects.find((item) => item.repo === repo)).filter(Boolean);
    featuredStage.innerHTML = selected.map((project, index) => `
      <article class="featured-card reveal" tabindex="0" role="button" data-repo="${escapeHtml(project.repo)}" aria-label="عرض تفاصيل ${escapeHtml(project.title)}">
        ${projectVisual(project, "featured")}
        <div class="featured-card__top"><span>CASE / ${pad(index + 1)}</span><span>${escapeHtml(statusLabels[project.status])}</span></div>
        <div class="featured-card__content">
          <h3>${escapeHtml(project.title)}</h3>
          <p>${escapeHtml(project.description)}</p>
          <div class="featured-card__meta">${project.tech.slice(0, 5).map((tech) => `<span>${escapeHtml(tech)}</span>`).join("")}</div>
        </div>
      </article>`).join("");
  }

  function renderGrid() {
    const term = search.value.trim().toLocaleLowerCase("ar");
    visibleProjects = projects.filter((project) => {
      const matchesFilter = activeFilter === "all" || project.category === activeFilter;
      const haystack = [project.title, project.repo, project.kicker, project.description, ...project.tech].join(" ").toLocaleLowerCase("ar");
      return matchesFilter && (!term || haystack.includes(term));
    });

    visibleCount.textContent = visibleProjects.length;
    emptyResult.hidden = visibleProjects.length !== 0;
    grid.hidden = visibleProjects.length === 0;
    grid.innerHTML = visibleProjects.map((project) => {
      const trueIndex = projects.indexOf(project);
      const statusClass = project.status === "live" ? "live" : project.status === "source" ? "source" : "concept";
      return `<article class="project-card ${project.status === "concept" ? "project-card--concept" : ""}" tabindex="0" role="button" data-repo="${escapeHtml(project.repo)}" aria-label="عرض تفاصيل ${escapeHtml(project.title)}">
        <div class="project-card__visual">
          ${projectVisual(project, "card")}
          <span class="project-card__badge project-card__badge--${statusClass}"><i></i>${escapeHtml(statusLabels[project.status])}</span>
        </div>
        <div class="project-card__content">
          <div class="project-card__index"><span>PROJECT / ${pad(trueIndex + 1)}</span><span>${escapeHtml(categoryLabels[project.category] || project.kicker)}</span></div>
          <h3>${escapeHtml(project.title)}</h3>
          <p class="project-card__repo">github.com/ahmedabumoalla/${escapeHtml(project.repo)}</p>
          <p class="project-card__description">${escapeHtml(project.description)}</p>
          <div class="project-card__footer">
            <span class="project-card__open" aria-hidden="true">↗</span>
            <div class="project-card__stack">${project.tech.slice(0, 5).map((tech) => `<span>${escapeHtml(tech)}</span>`).join("")}</div>
          </div>
        </div>
      </article>`;
    }).join("");
  }

  function renderModal(project) {
    const projectIndex = projects.indexOf(project);
    const image = document.getElementById("modalVisual");
    image.innerHTML = projectVisual(project, "modal");
    document.getElementById("modalIndex").textContent = `CASE / ${pad(projectIndex + 1)} — ${project.repo}`;
    document.getElementById("modalPosition").textContent = `${pad(projectIndex + 1)} / ${pad(projects.length)}`;
    document.getElementById("modalKicker").textContent = project.kicker;
    document.getElementById("modalTitle").textContent = project.title;
    document.getElementById("modalDescription").textContent = project.description;
    document.getElementById("modalStatus").innerHTML = `<span>${escapeHtml(statusLabels[project.status])}</span><span>${project.visibility === "private" ? "PRIVATE REPOSITORY" : "PUBLIC REPOSITORY"}</span><span>${escapeHtml(categoryLabels[project.category] || "DIGITAL SYSTEM")}</span>`;
    document.getElementById("modalMetrics").innerHTML = [
      [project.metrics.files, "ملفًا"], [project.metrics.source, "ملف مصدر"], [project.metrics.pages, "شاشة / مسار"], [project.metrics.components, "مكوّنًا"]
    ].map(([value, label]) => `<div><strong>${Number(value).toLocaleString("en-US")}</strong><small>${label}</small></div>`).join("");
    document.getElementById("modalTech").innerHTML = project.tech.map((tech) => `<span>${escapeHtml(tech)}</span>`).join("");

    const actions = [];
    if (project.live) actions.push(`<a href="${escapeHtml(project.live)}" target="_blank" rel="noreferrer">فتح النسخة المنشورة <span>↗</span></a>`);
    if (project.github) actions.push(`<a href="${escapeHtml(project.github)}" target="_blank" rel="noreferrer">عرض المستودع <span>↗</span></a>`);
    actions.push(`<a href="https://wa.me/966508424401?text=${encodeURIComponent(`مرحبًا شاهدت مشروع ${project.title} وأرغب في مناقشة مشروع مشابه`)}" target="_blank" rel="noreferrer">اطلب نظامًا مشابهًا <span>↗</span></a>`);
    document.getElementById("modalActions").innerHTML = actions.join("");
  }

  function openModal(repo, shouldUpdateHash = true) {
    const project = projects.find((item) => item.repo === repo);
    if (!project) return;
    lastFocused = document.activeElement;
    activeModalIndex = projects.indexOf(project);
    renderModal(project);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    if (shouldUpdateHash) history.replaceState(null, "", `#project=${encodeURIComponent(project.repo)}`);
    requestAnimationFrame(() => modalPanel.focus?.());
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
    renderModal(projects[activeModalIndex]);
    history.replaceState(null, "", `#project=${encodeURIComponent(projects[activeModalIndex].repo)}`);
    modalPanel.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cardInteraction(event) {
    const card = event.target.closest("[data-repo]");
    if (!card) return;
    if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") return;
    if (event.type === "keydown") event.preventDefault();
    openModal(card.dataset.repo);
  }

  featuredStage.addEventListener("click", cardInteraction);
  featuredStage.addEventListener("keydown", cardInteraction);
  grid.addEventListener("click", cardInteraction);
  grid.addEventListener("keydown", cardInteraction);
  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-modal]")) closeModal();
  });
  document.getElementById("modalPrev").addEventListener("click", () => stepModal(-1));
  document.getElementById("modalNext").addEventListener("click", () => stepModal(1));
  document.addEventListener("keydown", (event) => {
    if (!modal.classList.contains("is-open")) return;
    if (event.key === "Escape") closeModal();
    if (event.key === "ArrowLeft") stepModal(-1);
    if (event.key === "ArrowRight") stepModal(1);
  });

  filterList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    activeFilter = button.dataset.filter;
    filterList.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
    renderGrid();
  });
  search.addEventListener("input", renderGrid);
  document.getElementById("resetFilters").addEventListener("click", () => {
    activeFilter = "all";
    search.value = "";
    filterList.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("is-active", item.dataset.filter === "all"));
    renderGrid();
  });

  renderFeatured();
  renderGrid();

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -5%" });
  document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

  const hashMatch = location.hash.match(/^#project=(.+)$/);
  if (hashMatch) openModal(decodeURIComponent(hashMatch[1]), false);
})();
