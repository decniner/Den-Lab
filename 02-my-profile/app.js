(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const navLinks = [...document.querySelectorAll(".primary-nav a")];
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window && navLinks.length) {
    const activeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const active = link.getAttribute("href") === `#${entry.target.id}`;
          if (active) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-25% 0px -65% 0px" });

    sections.forEach((section) => activeObserver.observe(section));
  }

  if (!reduceMotion && "IntersectionObserver" in window) {
    const revealItems = [...document.querySelectorAll(
      ".section-heading, .about-copy, .capability-layout, .project-card, .lab-group, .agent-note, .principle-list, .contact-section"
    )];
    let revealObserver;

    try {
      revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px 48px 0px", threshold: 0.08 });

      revealItems.forEach((item) => item.setAttribute("data-reveal", ""));
      document.documentElement.classList.add("js-motion");
      revealItems.forEach((item) => revealObserver.observe(item));
    } catch {
      if (revealObserver) revealObserver.disconnect();
      document.documentElement.classList.remove("js-motion");
      revealItems.forEach((item) => {
        item.removeAttribute("data-reveal");
        item.classList.remove("is-visible");
      });
    }
  }
})();
