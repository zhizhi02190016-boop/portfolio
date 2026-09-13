const themeMeta = document.querySelector('meta[name="theme-color"]');
const sections = document.querySelectorAll('[data-theme-color]');

if (themeMeta && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) themeMeta.content = entry.target.dataset.themeColor;
    }
  }, { threshold: 0.1, rootMargin: '10% 0px -90% 0px' });
  sections.forEach((section) => observer.observe(section));
}

document.querySelector('#year').textContent = new Date().getFullYear();

// 板块配图点击进入对应内页
const showcaseTargets = { retro: 'brand.html', handmirror: 'editorial.html', night: 'motion.html', sketch: 'poster.html', thwip: 'tbd.html' };
document.querySelectorAll('.project').forEach((section) => {
  const key = Object.keys(showcaseTargets).find((k) => section.classList.contains(k));
  const showcase = section.querySelector('.showcase');
  if (!key || !showcase) return;
  showcase.style.cursor = 'pointer';
  showcase.setAttribute('role', 'link');
  showcase.setAttribute('tabindex', '0');
  showcase.setAttribute('aria-label', '查看' + (section.querySelector('h2 .timestamp')?.textContent || '') + '作品页');
  showcase.addEventListener('click', () => { location.href = showcaseTargets[key]; });
  showcase.addEventListener('keydown', (e) => { if (e.key === 'Enter') location.href = showcaseTargets[key]; });
});
