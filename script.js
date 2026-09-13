const themeMeta = document.querySelector('meta[name="theme-color"]');
const sections = document.querySelectorAll("[data-theme]");

if (themeMeta && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.find((entry) => entry.isIntersecting);
    if (visible) themeMeta.setAttribute("content", visible.target.dataset.theme);
  }, { threshold: 0.2, rootMargin: "-10% 0px -70%" });
  sections.forEach((section) => observer.observe(section));
}

document.querySelector("#year").textContent = new Date().getFullYear();
