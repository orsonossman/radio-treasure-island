document.addEventListener("DOMContentLoaded", () => {
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }

  const revealItems = document.querySelectorAll(".fade-up");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12 },
    );

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("visible"));
  }

  const playBtn = document.getElementById("playBtn");
  const progressFill = document.getElementById("progressFill");
  const playerTitle = document.getElementById("playerTitle");
  const playerSub = document.getElementById("playerSub");
  const playerTime = document.getElementById("playerTime");
  const progressBar = document.getElementById("progressBar");
  const episodeItems = document.querySelectorAll(".episode-item");

  let isPlaying = false;
  let progress = 0;
  let animFrame;
  let currentDuration = Number(episodeItems[0]?.dataset.seconds || 204);

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  function renderProgress() {
    const elapsed = (progress / 100) * currentDuration;

    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }

    if (playerTime) {
      playerTime.textContent = `${formatTime(elapsed)} / ${formatTime(currentDuration)}`;
    }

    if (progressBar) {
      progressBar.setAttribute("aria-valuenow", String(Math.round(progress)));
    }
  }

  function setPlaying(nextIsPlaying) {
    isPlaying = nextIsPlaying;

    if (playBtn) {
      playBtn.classList.toggle("playing", isPlaying);
      playBtn.setAttribute("aria-pressed", String(isPlaying));
    }

    if (!isPlaying && animFrame) {
      cancelAnimationFrame(animFrame);
    }
  }

  function tick() {
    if (!isPlaying) {
      return;
    }

    progress = Math.min(progress + 0.4, 100);
    renderProgress();

    if (progress >= 100) {
      progress = 0;
      setPlaying(false);
      return;
    }

    animFrame = requestAnimationFrame(tick);
  }

  function startPlayer() {
    setPlaying(true);
    if (animFrame) {
      cancelAnimationFrame(animFrame);
    }
    animFrame = requestAnimationFrame(tick);
  }

  if (playBtn) {
    playBtn.setAttribute("aria-pressed", "false");
    playBtn.addEventListener("click", () => {
      setPlaying(!isPlaying);
      if (isPlaying) {
        startPlayer();
      }
    });
  }

  if (progressBar) {
    const seek = (clientX) => {
      const rect = progressBar.getBoundingClientRect();
      progress = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      renderProgress();
    };

    progressBar.addEventListener("click", (event) => {
      seek(event.clientX);
    });

    progressBar.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        event.preventDefault();
        progress = Math.max(0, progress - 5);
        renderProgress();
      }

      if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        event.preventDefault();
        progress = Math.min(100, progress + 5);
        renderProgress();
      }
    });
  }

  episodeItems.forEach((item) => {
    item.addEventListener("click", () => {
      episodeItems.forEach((episode) => episode.classList.remove("active"));
      item.classList.add("active");

      if (playerTitle) {
        playerTitle.textContent = item.dataset.title || "";
      }

      if (playerSub) {
        playerSub.textContent = item.dataset.sub || "";
      }

      currentDuration = Number(item.dataset.seconds || currentDuration);
      progress = 0;
      renderProgress();
      startPlayer();
    });
  });

  const tabPanels = Array.from(document.querySelectorAll("[data-tab-panel]"));
  const tabTriggers = Array.from(document.querySelectorAll("[data-tab-target]"));
  const navTriggers = Array.from(document.querySelectorAll("nav [data-tab-target]"));
  const tabLinks = Array.from(document.querySelectorAll('[role="tab"][data-tab-target]'));
  const defaultTabId = tabPanels[0]?.id || "";

  function tabExists(tabId) {
    return tabPanels.some((panel) => panel.id === tabId);
  }

  function getHashTab() {
    const hash = window.location.hash.replace("#", "");
    return tabExists(hash) ? hash : "";
  }

  function getTriggerTab(trigger) {
    if (trigger.dataset.tabTarget) {
      return trigger.dataset.tabTarget;
    }

    return trigger.hash ? trigger.hash.replace("#", "") : "";
  }

  function updateHash(tabId, shouldReplace) {
    const nextHash = `#${tabId}`;

    if (window.location.hash === nextHash) {
      return;
    }

    if (shouldReplace) {
      window.history.replaceState(null, "", nextHash);
      return;
    }

    window.history.pushState(null, "", nextHash);
  }

  function resetScrollTop() {
    const scroller = document.scrollingElement || document.documentElement;

    scroller.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  function forceScrollTop() {
    const root = document.documentElement;
    const body = document.body;
    const previousRootScrollBehavior = root.style.scrollBehavior;
    const previousBodyScrollBehavior = body.style.scrollBehavior;

    root.style.scrollBehavior = "auto";
    body.style.scrollBehavior = "auto";

    resetScrollTop();

    window.setTimeout(resetScrollTop, 0);
    requestAnimationFrame(() => {
      resetScrollTop();

      requestAnimationFrame(() => {
        resetScrollTop();
        root.style.scrollBehavior = previousRootScrollBehavior;
        body.style.scrollBehavior = previousBodyScrollBehavior;
      });
    });
  }

  function activateTab(tabId, options = {}) {
    if (!tabExists(tabId)) {
      return;
    }

    const shouldUpdateHash = options.updateHash !== false;
    const shouldReplace = options.replace === true;
    const shouldScroll = options.scroll !== false;

    document.body.classList.add("tabs-ready");

    tabPanels.forEach((panel) => {
      const isActive = panel.id === tabId;
      panel.hidden = !isActive;
      panel.classList.toggle("active", isActive);
      panel.setAttribute("aria-hidden", String(!isActive));
    });

    navTriggers.forEach((trigger) => {
      trigger.classList.toggle("active", getTriggerTab(trigger) === tabId);
    });

    tabLinks.forEach((link) => {
      const isActive = getTriggerTab(link) === tabId;
      link.setAttribute("aria-selected", String(isActive));
      link.setAttribute("tabindex", isActive ? "0" : "-1");
    });

    if (tabId !== "listen-now") {
      setPlaying(false);
    }

    if (shouldUpdateHash) {
      updateHash(tabId, shouldReplace);
    }

    if (shouldScroll) {
      requestAnimationFrame(forceScrollTop);
    }

    if (options.focusPanel) {
      const activePanel = tabPanels.find((panel) => panel.id === tabId);
      activePanel?.focus({ preventScroll: true });
    }
  }

  tabTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      const tabId = getTriggerTab(trigger);

      if (!tabExists(tabId)) {
        return;
      }

      event.preventDefault();
      activateTab(tabId, {
        focusPanel: trigger.getAttribute("role") !== "tab" && !trigger.classList.contains("nav-logo"),
      });
    });
  });

  tabLinks.forEach((link, index) => {
    link.addEventListener("keydown", (event) => {
      const keyMap = {
        ArrowDown: index + 1,
        ArrowRight: index + 1,
        ArrowLeft: index - 1,
        ArrowUp: index - 1,
      };

      if (!(event.key in keyMap)) {
        return;
      }

      event.preventDefault();
      const nextIndex = (keyMap[event.key] + tabLinks.length) % tabLinks.length;
      const nextLink = tabLinks[nextIndex];
      nextLink.focus();
      activateTab(getTriggerTab(nextLink));
    });
  });

  window.addEventListener("hashchange", () => {
    activateTab(getHashTab() || defaultTabId, { updateHash: false });
  });

  window.addEventListener("popstate", () => {
    activateTab(getHashTab() || defaultTabId, { updateHash: false });
  });

  activateTab(getHashTab() || defaultTabId, { updateHash: false });
});
