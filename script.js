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

const yearNode = document.querySelector('#year');
if (yearNode) yearNode.textContent = new Date().getFullYear();

const posterProjects = Array.from({ length: 30 }, (_, index) => {
  const id = String(index + 1).padStart(2, '0');
  return {
    id,
    title: `作品 ${id}`,
    href: `poster-detail.html?id=${id}`,
    tone: `poster-tone-${(index % 6) + 1}`,
  };
});

function createPosterFace(project, extraClass = '') {
  const face = document.createElement('span');
  face.className = `poster-card-face ${project.tone} ${extraClass}`.trim();
  face.innerHTML = `<span class="poster-card-kicker">POSTER</span><strong>${project.id}</strong><i></i>`;
  return face;
}

function initPosterSphere() {
  const sphere = document.querySelector('[data-poster-sphere]');
  if (!sphere) return;

  const stage = sphere.querySelector('[data-sphere-stage]');
  const rotor = sphere.querySelector('[data-sphere-rotor]');
  const radius = 194;
  const goldenAngle = 137.507764;
  const sphereItems = [];

  const addSphereItem = (element, latitude, longitude, itemRadius) => {
    const lat = latitude * Math.PI / 180;
    const lon = longitude * Math.PI / 180;
    sphereItems.push({
      element,
      x: itemRadius * Math.cos(lat) * Math.sin(lon),
      y: -itemRadius * Math.sin(lat),
      z: itemRadius * Math.cos(lat) * Math.cos(lon),
    });
  };

  posterProjects.forEach((project, index) => {
    const y = 1 - (2 * (index + 0.5)) / posterProjects.length;
    let latitude = Math.asin(y) * 180 / Math.PI;
    let longitude = (index * goldenAngle + 54) % 360;
    const signedLongitude = longitude > 180 ? longitude - 360 : longitude;
    if (Math.abs(signedLongitude) < 30 && Math.abs(latitude) < 24) longitude += 42;

    const link = document.createElement('a');
    link.className = 'sphere-poster';
    link.href = project.href;
    link.draggable = false;
    link.setAttribute('aria-label', `查看${project.title}`);
    link.append(createPosterFace(project));
    rotor.append(link);
    addSphereItem(link, latitude, longitude, radius);
  });

  const hub = document.createElement('a');
  hub.className = 'sphere-poster sphere-hub';
  hub.href = 'poster.html';
  hub.draggable = false;
  hub.setAttribute('aria-label', '查看海报与字体实验作品总览');
  hub.innerHTML = '<span class="sphere-hub-face"><strong>04</strong><small>VIEW ALL</small></span>';
  rotor.append(hub);
  addSphereItem(hub, 0, 0, radius + 10);

  let rotateX = -7;
  let rotateY = 0;
  let dragging = false;
  let dragged = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let velocityX = 0;
  let velocityY = 0;
  let inertiaFrame = 0;

  const render = () => {
    const xAngle = rotateX * Math.PI / 180;
    const yAngle = rotateY * Math.PI / 180;
    const cosX = Math.cos(xAngle);
    const sinX = Math.sin(xAngle);
    const cosY = Math.cos(yAngle);
    const sinY = Math.sin(yAngle);

    sphereItems.forEach(({ element, x, y, z }) => {
      const rotatedX = x * cosY + z * sinY;
      const rotatedZ = -x * sinY + z * cosY;
      const rotatedY = y * cosX - rotatedZ * sinX;
      const finalZ = y * sinX + rotatedZ * cosX;
      const depth = Math.max(0, Math.min(1, (finalZ / radius + 1) / 2));
      element.style.transform = `translate3d(${rotatedX.toFixed(2)}px, ${rotatedY.toFixed(2)}px, ${finalZ.toFixed(2)}px)`;
      element.style.zIndex = String(Math.round(finalZ + 300));
      element.style.opacity = (0.66 + depth * 0.34).toFixed(3);
      element.style.filter = `blur(${((1 - depth) * 0.48).toFixed(2)}px)`;
    });
  };

  const stopInertia = () => cancelAnimationFrame(inertiaFrame);
  const runInertia = () => {
    velocityX *= 0.935;
    velocityY *= 0.935;
    rotateX = Math.max(-70, Math.min(70, rotateX + velocityX));
    rotateY += velocityY;
    render();
    if (Math.abs(velocityX) + Math.abs(velocityY) > 0.04) {
      inertiaFrame = requestAnimationFrame(runInertia);
    }
  };

  stage.addEventListener('pointerdown', (event) => {
    stopInertia();
    dragging = true;
    dragged = false;
    startX = lastX = event.clientX;
    startY = lastY = event.clientY;
    velocityX = velocityY = 0;
    stage.classList.add('is-dragging');
  });

  stage.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    if (Math.hypot(event.clientX - startX, event.clientY - startY) > 6) {
      dragged = true;
      if (!stage.hasPointerCapture(event.pointerId)) stage.setPointerCapture(event.pointerId);
    }
    rotateY += dx * 0.32;
    rotateX = Math.max(-70, Math.min(70, rotateX - dy * 0.24));
    velocityY = dx * 0.18;
    velocityX = -dy * 0.14;
    lastX = event.clientX;
    lastY = event.clientY;
    render();
  });

  const release = (event) => {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('is-dragging');
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    runInertia();
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  stage.addEventListener('click', (event) => {
    if (!dragged) return;
    event.preventDefault();
    event.stopPropagation();
    dragged = false;
  }, true);

  stage.addEventListener('keydown', (event) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') rotateY -= 12;
    if (event.key === 'ArrowRight') rotateY += 12;
    if (event.key === 'ArrowUp') rotateX = Math.max(-70, rotateX - 10);
    if (event.key === 'ArrowDown') rotateX = Math.min(70, rotateX + 10);
    render();
  });

  render();
}

function initPosterGrid() {
  const grid = document.querySelector('[data-poster-grid]');
  if (!grid) return;
  posterProjects.forEach((project) => {
    const link = document.createElement('a');
    link.className = 'poster-wall-card';
    link.href = project.href;
    link.setAttribute('aria-label', `查看${project.title}`);
    link.append(createPosterFace(project, 'poster-wall-art'));
    const label = document.createElement('span');
    label.className = 'poster-wall-label';
    label.innerHTML = `<strong>${project.title}</strong><small>详情待补充</small>`;
    link.append(label);
    grid.append(link);
  });
}

function initPosterDetail() {
  const page = document.querySelector('[data-poster-detail]');
  if (!page) return;
  const requestedId = new URLSearchParams(location.search).get('id') || '01';
  const project = posterProjects.find((item) => item.id === requestedId) || posterProjects[0];
  const title = page.querySelector('[data-poster-title]');
  const art = page.querySelector('[data-poster-art]');
  if (title) title.textContent = project.title;
  if (art) art.append(createPosterFace(project, 'poster-detail-art'));
  document.title = `${project.title}｜海报与字体实验 — 张子文`;
}

initPosterSphere();
initPosterGrid();
initPosterDetail();

// 板块配图点击进入对应内页
const showcaseTargets = { retro: 'brand.html', handmirror: 'editorial.html', night: 'motion.html', thwip: 'tbd.html' };
document.querySelectorAll('.project').forEach((section) => {
  const key = Object.keys(showcaseTargets).find((k) => section.classList.contains(k));
  const showcase = section.querySelector('.showcase');
  if (!key || !showcase) return;
  showcase.style.cursor = 'pointer';
  showcase.setAttribute('role', 'link');
  showcase.setAttribute('tabindex', '0');
  showcase.setAttribute('aria-label', '查看' + (section.querySelector('h2 .timestamp')?.textContent || '') + '作品页');
  showcase.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    location.href = showcaseTargets[key];
  });
  showcase.addEventListener('keydown', (e) => { if (e.key === 'Enter') location.href = showcaseTargets[key]; });
});
