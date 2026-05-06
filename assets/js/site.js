document.addEventListener("DOMContentLoaded", () => {
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

  const notifyForm = document.getElementById("notifyForm");
  const emailSuccess = document.getElementById("emailSuccess");
  const notifyFootnote = document.getElementById("notifyFootnote");

  if (notifyFootnote) {
    const messages = [
      "No barnacles. Unsubscribe any time.",
      "No bilge water. Unsubscribe any time.",
      "No scurvy spam. Unsubscribe any time.",
      "No sea-dogs at the door. Unsubscribe any time.",
      "No krakens in your inbox. Unsubscribe any time.",
      "No plundering. Unsubscribe any time.",
      "No walking the plank. Unsubscribe any time.",
      "No hornswoggling. Unsubscribe any time.",
      "No mutiny on our part. Unsubscribe any time.",
      "No doubloons required. Unsubscribe any time.",
      "No keelhauling. Unsubscribe any time.",
    ];

    notifyFootnote.textContent = messages[Math.floor(Math.random() * messages.length)];
  }

  if (notifyForm && emailSuccess) {
    notifyForm.addEventListener("submit", (event) => {
      event.preventDefault();
      notifyForm.style.display = "none";
      emailSuccess.style.display = "block";
    });
  }
});
