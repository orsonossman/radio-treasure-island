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

  const trailerPlayer = document.querySelector("[data-trailer-player]");
  const trailerAudio = trailerPlayer?.querySelector("[data-trailer-audio]");
  const trailerPlayButton = trailerPlayer?.querySelector("[data-trailer-play]");
  const trailerSeek = trailerPlayer?.querySelector("[data-trailer-seek]");
  const trailerTime = trailerPlayer?.querySelector("[data-trailer-time]");
  const trailerMuteButton = trailerPlayer?.querySelector("[data-trailer-mute]");
  const trailerVolume = trailerPlayer?.querySelector("[data-trailer-volume]");

  function formatAudioTime(seconds) {
    const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = Math.floor(safeSeconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  function setTrailerRangeProgress(range, percent) {
    if (!range) {
      return;
    }

    const safePercent = Math.max(0, Math.min(100, percent));
    range.style.setProperty("--range-progress", `${safePercent}%`);
  }

  function renderTrailerPlayState() {
    if (!trailerAudio || !trailerPlayer || !trailerPlayButton) {
      return;
    }

    const isTrailerPlaying = !trailerAudio.paused && !trailerAudio.ended;
    trailerPlayer.classList.toggle("is-playing", isTrailerPlaying);
    trailerPlayButton.setAttribute("aria-label", isTrailerPlaying ? "Pause trailer" : "Play trailer");
  }

  function renderTrailerProgress() {
    if (!trailerAudio || !trailerSeek) {
      return;
    }

    const duration = Number.isFinite(trailerAudio.duration) ? trailerAudio.duration : 0;
    const percent = duration > 0 ? (trailerAudio.currentTime / duration) * 100 : 0;

    trailerSeek.value = String(Math.round(percent * 10));
    setTrailerRangeProgress(trailerSeek, percent);

    if (trailerTime && duration > 0) {
      trailerTime.textContent = `${formatAudioTime(trailerAudio.currentTime)} / ${formatAudioTime(duration)}`;
    }
  }

  function renderTrailerVolume() {
    if (!trailerAudio || !trailerVolume || !trailerPlayer) {
      return;
    }

    const volume = trailerAudio.muted ? 0 : trailerAudio.volume;
    const isMuted = trailerAudio.muted || trailerAudio.volume === 0;

    trailerVolume.value = String(volume);
    setTrailerRangeProgress(trailerVolume, volume * 100);
    trailerPlayer.classList.toggle("is-muted", isMuted);

    if (trailerMuteButton) {
      trailerMuteButton.setAttribute("aria-label", isMuted ? "Unmute trailer" : "Mute trailer");
    }
  }

  if (trailerAudio && trailerPlayButton && trailerSeek) {
    renderTrailerProgress();
    renderTrailerVolume();

    trailerPlayButton.addEventListener("click", () => {
      if (trailerAudio.paused || trailerAudio.ended) {
        trailerAudio.play().catch(renderTrailerPlayState);
        return;
      }

      trailerAudio.pause();
    });

    trailerSeek.addEventListener("input", () => {
      const duration = Number.isFinite(trailerAudio.duration) ? trailerAudio.duration : 0;
      const percent = Number(trailerSeek.value) / 10;

      setTrailerRangeProgress(trailerSeek, percent);

      if (duration > 0) {
        trailerAudio.currentTime = (percent / 100) * duration;
        renderTrailerProgress();
      }
    });

    trailerMuteButton?.addEventListener("click", () => {
      if (trailerAudio.muted || trailerAudio.volume === 0) {
        trailerAudio.volume = Number(trailerAudio.dataset.previousVolume || 1);
        trailerAudio.muted = false;
      } else {
        trailerAudio.dataset.previousVolume = String(trailerAudio.volume);
        trailerAudio.muted = true;
      }

      renderTrailerVolume();
    });

    trailerVolume?.addEventListener("input", () => {
      const nextVolume = Number(trailerVolume.value);

      trailerAudio.volume = Math.max(0, Math.min(1, nextVolume));
      trailerAudio.muted = nextVolume === 0;
      if (nextVolume > 0) {
        trailerAudio.dataset.previousVolume = String(nextVolume);
      }
      renderTrailerVolume();
    });

    trailerAudio.addEventListener("loadedmetadata", renderTrailerProgress);
    trailerAudio.addEventListener("durationchange", renderTrailerProgress);
    trailerAudio.addEventListener("timeupdate", renderTrailerProgress);
    trailerAudio.addEventListener("play", renderTrailerPlayState);
    trailerAudio.addEventListener("pause", renderTrailerPlayState);
    trailerAudio.addEventListener("ended", renderTrailerPlayState);
    trailerAudio.addEventListener("volumechange", renderTrailerVolume);
  }

  const tabPanels = Array.from(document.querySelectorAll("[data-tab-panel]"));
  const tabTriggers = Array.from(document.querySelectorAll("[data-tab-target]"));
  const navTriggers = Array.from(document.querySelectorAll("nav [data-tab-target]"));
  const tabLinks = Array.from(document.querySelectorAll('[role="tab"][data-tab-target]'));
  const defaultTabId = tabPanels[0]?.id || "";
  const navMenuButton = document.querySelector("[data-nav-menu-button]");
  const navLinks = document.getElementById("site-nav-links");

  function setNavMenuOpen(isOpen) {
    if (!navMenuButton) {
      return;
    }

    navMenuButton.setAttribute("aria-expanded", String(isOpen));
    navMenuButton.setAttribute("aria-label", isOpen ? "Close site menu" : "Open site menu");
  }

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

    if (tabId !== "landing-page") {
      trailerAudio?.pause();
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
      setNavMenuOpen(false);
    });
  });

  navMenuButton?.addEventListener("click", () => {
    setNavMenuOpen(navMenuButton.getAttribute("aria-expanded") !== "true");
  });

  document.addEventListener("click", (event) => {
    if (
      navMenuButton?.getAttribute("aria-expanded") === "true" &&
      !navMenuButton.contains(event.target) &&
      !navLinks?.contains(event.target)
    ) {
      setNavMenuOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navMenuButton?.getAttribute("aria-expanded") === "true") {
      setNavMenuOpen(false);
      navMenuButton.focus();
    }
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
