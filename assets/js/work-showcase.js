(function () {
  "use strict";

  const projects = Array.isArray(window.PORTFOLIO_PROJECTS) ? window.PORTFOLIO_PROJECTS : [];
  const categoryLabels = {
    platform: "منصة رقمية",
    ai: "ذكاء اصطناعي",
    dashboard: "لوحة تشغيل",
    experience: "تجربة تفاعلية",
    industry: "حل صناعي",
    health: "صحة رقمية",
    mobile: "تطبيق موبايل"
  };
  const deckClasses = ["deck-card--far-prev", "deck-card--prev", "deck-card--active", "deck-card--next", "deck-card--far-next"];
  const deckOffsets = [-2, -1, 0, 1, 2];
  const wideCards = new Set([0, 5, 8, 13, 18, 22]);
  const tallCards = new Set([2, 7, 11, 16, 20]);

  const heroDeck = document.getElementById("heroDeck");
  const projectGrid = document.getElementById("projectGrid");
  const lensScreen = document.querySelector(".lens-screen");
  const copyToast = document.getElementById("copyToast");
  let selectedIndex = 0;
  let toastTimer = 0;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    })[character]);
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function projectImage(project) {
    return project.image || "assets/projects/optimized/barnda-reference.jpg";
  }

  function categoryFor(project) {
    return categoryLabels[project.category] || "منتج رقمي";
  }

  function renderDeck() {
    heroDeck.innerHTML = deckOffsets.map((offset, position) => {
      const index = (selectedIndex + offset + projects.length) % projects.length;
      const project = projects[index];
      const active = offset === 0;
      return `
        <button class="deck-card ${deckClasses[position]}" type="button" data-project-id="${escapeHtml(project.id)}" aria-label="اعرض مشروع ${escapeHtml(project.title)}" aria-pressed="${active}">
          <img src="${escapeHtml(projectImage(project))}" alt="واجهة مشروع ${escapeHtml(project.title)}" loading="${active ? "eager" : "lazy"}" decoding="async">
          <span class="deck-card__label"><strong>${escapeHtml(project.title)}</strong><span>${pad(index + 1)} / ${escapeHtml(categoryFor(project))}</span></span>
        </button>`;
    }).join("");
  }

  function renderGrid() {
    projectGrid.innerHTML = projects.map((project, index) => {
      const layoutClass = wideCards.has(index) ? "project-card--wide" : tallCards.has(index) ? "project-card--tall" : "";
      return `
        <article class="project-card ${layoutClass} ${index === selectedIndex ? "is-active" : ""} reveal">
          <button class="project-card__select" type="button" data-project-id="${escapeHtml(project.id)}" aria-label="اعرض مشروع ${escapeHtml(project.title)} في المسرح" aria-pressed="${index === selectedIndex}"></button>
          <span class="project-card__visual">
            <img src="${escapeHtml(projectImage(project))}" alt="واجهة مشروع ${escapeHtml(project.title)}" loading="lazy" decoding="async">
            <span class="project-card__index">${pad(index + 1)}</span>
          </span>
          <span class="project-card__body">
            <span>
              <span class="project-card__category">${escapeHtml(categoryFor(project))}</span>
              <span class="project-card__title">${escapeHtml(project.title)}</span>
              <span class="project-card__description">${escapeHtml(project.description)}</span>
              <a class="project-card__live" href="${escapeHtml(project.live)}" target="_blank" rel="noopener noreferrer" aria-label="افتح مشروع ${escapeHtml(project.title)}">تجربة مباشرة <span>↗</span></a>
            </span>
            <span class="project-card__stack">${project.tech.slice(0, 4).map((technology) => `<span>${escapeHtml(technology)}</span>`).join("")}</span>
          </span>
        </article>`;
    }).join("");
  }

  function updateGridSelection() {
    projectGrid.querySelectorAll("[data-project-id]").forEach((card) => {
      const active = card.dataset.projectId === projects[selectedIndex].id;
      card.closest(".project-card")?.classList.toggle("is-active", active);
      card.setAttribute("aria-pressed", String(active));
    });
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function updateSelectedProject(options = {}) {
    if (!projects.length) return;
    const project = projects[selectedIndex];
    const image = projectImage(project);
    const indexLabel = pad(selectedIndex + 1);

    setText("heroCurrent", indexLabel);
    setText("heroKicker", project.kicker);
    setText("heroProjectTitle", project.title);
    setText("heroDescription", project.description);
    const heroLive = document.getElementById("heroLive");
    heroLive.href = project.live;
    heroLive.setAttribute("aria-label", `افتح مشروع ${project.title}`);
    document.getElementById("heroBackdrop").src = image;
    document.getElementById("heroTech").innerHTML = project.tech.slice(0, 6).map((technology) => `<span>${escapeHtml(technology)}</span>`).join("");

    setText("lensNumber", `المشروع / ${indexLabel}`);
    setText("lensKicker", project.kicker);
    setText("lensProjectTitle", project.title);
    setText("lensDescription", project.description);
    setText("lensBrowserLabel", `${project.title} / ${categoryFor(project)}`);
    setText("lensImageCaption", project.title);
    const lensLive = document.getElementById("lensLive");
    lensLive.href = project.live;
    lensLive.setAttribute("aria-label", `زيارة مشروع ${project.title}`);
    document.getElementById("lensTech").innerHTML = project.tech.map((technology) => `<span>${escapeHtml(technology)}</span>`).join("");
    document.getElementById("lensSpecs").innerHTML = [
      [project.metrics.pages, "شاشة ومسار"],
      [project.metrics.components, "مكوّن واجهة"],
      [project.metrics.files, "ملفًا في المنتج"],
      [project.tech.length, "تقنيات أساسية"]
    ].map(([value, label]) => `<div><strong>${Number(value).toLocaleString("en-US")}</strong><span>${label}</span></div>`).join("");

    const lensImage = document.getElementById("lensImage");
    lensScreen.classList.add("is-changing");
    lensImage.onload = () => lensScreen.classList.remove("is-changing");
    lensImage.src = image;
    lensImage.alt = `واجهة مشروع ${project.title}`;
    if (lensImage.complete) lensScreen.classList.remove("is-changing");

    renderDeck();
    updateGridSelection();

    if (options.focusLens) {
      document.getElementById("projectLens").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function selectProject(projectId, options = {}) {
    const index = projects.findIndex((project) => project.id === projectId);
    if (index < 0 || index === selectedIndex) return;
    selectedIndex = index;
    updateSelectedProject(options);
  }

  function stepProject(direction) {
    selectedIndex = (selectedIndex + direction + projects.length) % projects.length;
    updateSelectedProject();
  }

  function handleProjectClick(event) {
    const trigger = event.target.closest("[data-project-id]");
    if (!trigger) return;
    selectProject(trigger.dataset.projectId);
  }

  function setupReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: .06, rootMargin: "0px 0px -4%" });

    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

    function revealVisible() {
      document.querySelectorAll(".reveal:not(.is-visible)").forEach((element) => {
        const rectangle = element.getBoundingClientRect();
        if (rectangle.top < window.innerHeight * .96 && rectangle.bottom > 0) {
          element.classList.add("is-visible");
          observer.unobserve(element);
        }
      });
    }

    window.addEventListener("scroll", revealVisible, { passive: true });
    requestAnimationFrame(revealVisible);
    window.setTimeout(revealVisible, 400);
  }

  function showCopyToast() {
    window.clearTimeout(toastTimer);
    copyToast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => copyToast.classList.remove("is-visible"), 1800);
  }

  async function copyPhoneNumber() {
    const phone = "+966508424401";
    try {
      await navigator.clipboard.writeText(phone);
    } catch (_) {
      const temporaryInput = document.createElement("textarea");
      temporaryInput.value = phone;
      temporaryInput.setAttribute("readonly", "");
      temporaryInput.style.position = "fixed";
      temporaryInput.style.opacity = "0";
      document.body.appendChild(temporaryInput);
      temporaryInput.select();
      document.execCommand("copy");
      temporaryInput.remove();
    }
    showCopyToast();
  }

  document.addEventListener("click", (event) => {
    const scrollButton = event.target.closest("[data-scroll-target]");
    if (scrollButton) {
      const target = document.querySelector(scrollButton.dataset.scrollTarget);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  heroDeck.addEventListener("click", handleProjectClick);
  projectGrid.addEventListener("click", handleProjectClick);
  document.getElementById("heroPrev").addEventListener("click", () => stepProject(-1));
  document.getElementById("heroNext").addEventListener("click", () => stepProject(1));
  document.getElementById("copyPhone").addEventListener("click", copyPhoneNumber);

  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowLeft") stepProject(1);
    if (event.key === "ArrowRight") stepProject(-1);
  });

  renderGrid();
  updateSelectedProject();
  setupReveal();

  window.setTimeout(() => {
    projects.forEach((project) => {
      const preview = new Image();
      preview.src = projectImage(project);
    });
  }, 1200);
})();
