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

const canonicalPage = (url) => {
  const parsed = new URL(url, location.href);
  const path = parsed.pathname.replace(/\/index(?:\.html)?$/, '/').replace(/\.html$/, '');
  return `${path}${parsed.search}`;
};
const pageProgressKey = `portfolioPageProgress:${canonicalPage(location.href)}`;
const pendingNavigationKey = 'portfolioPendingNavigation';
const returnProgressKey = 'portfolioReturnProgress';
const readStoredJson = (key) => {
  try { return JSON.parse(sessionStorage.getItem(key)); } catch (_) { return null; }
};
const savePageProgress = () => {
  try { sessionStorage.setItem(pageProgressKey, String(window.scrollY)); } catch (_) { /* Private browsing may block storage. */ }
};
const rememberNavigation = (destination) => {
  const target = new URL(destination, location.href);
  if (target.origin !== location.origin || canonicalPage(target.href) === canonicalPage(location.href)) return;
  savePageProgress();
  try {
    sessionStorage.setItem(pendingNavigationKey, JSON.stringify({
      destination: canonicalPage(target.href),
      source: location.href,
      scrollY: window.scrollY,
      parentReturn: history.state?.portfolioReturn || null,
      savedAt: Date.now(),
    }));
  } catch (_) { /* Browser history remains the fallback. */ }
};

const pendingNavigation = readStoredJson(pendingNavigationKey);
if (pendingNavigation?.destination === canonicalPage(location.href) && Date.now() - pendingNavigation.savedAt < 300000) {
  history.replaceState({ ...history.state, portfolioReturn: pendingNavigation }, '');
  sessionStorage.removeItem(pendingNavigationKey);
}

const restoreScroll = (scrollY) => {
  if (!Number.isFinite(scrollY)) return;
  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  window.scrollTo(0, scrollY);
  requestAnimationFrame(() => {
    window.scrollTo(0, scrollY);
    requestAnimationFrame(() => { root.style.scrollBehavior = previousBehavior; });
  });
};

window.addEventListener('pagehide', savePageProgress);
window.addEventListener('pageshow', (event) => {
  const returnProgress = readStoredJson(returnProgressKey);
  const isExplicitReturn = returnProgress?.destination === canonicalPage(location.href);
  const navigation = performance.getEntriesByType('navigation')[0];
  if (!isExplicitReturn && !event.persisted && navigation?.type !== 'back_forward') return;
  if (isExplicitReturn) {
    sessionStorage.removeItem(returnProgressKey);
    if (returnProgress.parentReturn) history.replaceState({ ...history.state, portfolioReturn: returnProgress.parentReturn }, '');
  }
  const storedScrollY = isExplicitReturn ? returnProgress.scrollY : sessionStorage.getItem(pageProgressKey);
  if (storedScrollY === null || storedScrollY === undefined) return;
  const savedScrollY = Number(storedScrollY);
  requestAnimationFrame(() => restoreScroll(savedScrollY));
});

document.querySelectorAll('[data-history-back]').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const source = history.state?.portfolioReturn;
    if (source?.source && new URL(source.source).origin === location.origin) {
      event.preventDefault();
      try {
        sessionStorage.setItem(returnProgressKey, JSON.stringify({
          destination: canonicalPage(source.source), scrollY: source.scrollY,
          parentReturn: source.parentReturn,
        }));
      } catch (_) { /* The source URL still works without stored scroll. */ }
      location.replace(source.source);
      return;
    }
    let canGoBack = false;
    try {
      canGoBack = Boolean(document.referrer) && new URL(document.referrer).origin === location.origin && history.length > 1;
    } catch (_) { canGoBack = false; }
    if (!canGoBack) return;
    event.preventDefault();
    history.back();
  });
});

document.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('a[href]');
  if (!link || link.hasAttribute('data-history-back') || link.target === '_blank' || link.hasAttribute('download')) return;
  rememberNavigation(link.href);
});

const posterProjects = [
  ['城市漫游节', '高对比数字与重复网格，呈现城市行走的节奏。'],
  ['潮水有信', '深蓝与水母的轻盈形态，描绘潮汐中的来信。'],
  ['飞燕', '红色飞燕与颗粒纹理，捕捉掠过纸面的速度。'],
  ['中原回声', '纵向折叠的文字，传达城市声音的回响。'],
  ['织网为戒，和美为归', '用网状海马的形态，关注海洋中的废弃渔网。'],
  ['城市梦境', '倾斜堆叠的字母与撞色，制造鲜明的城市能量。'],
  ['Nuclear Matter', '深蓝液态造型与金属字，形成冷冽的视觉张力。'],
  ['鸢尾', '蓝紫色花卉与纤细文字，组成轻盈的双语海报。'],
  ['河流记忆', '倾斜字形与荧光黄底，呈现河流记忆的流动感。'],
  ['未归档', '重复字形围出留白，让信息在边框内生长。'],
  ['织网为戒，和美为归', '用渔网织成鱼的形态，回应海洋保护的主题。'],
  ['异想之翼', '粉色羽翼与暖黄底色，展开想象力的飞行。'],
  ['I am Clam', '彩色字形与交错线条，呈现自由的字体实验。'],
  ['潮汐来信', '明黄与粉色水母碰撞，写一封轻快的潮汐来信。'],
  ['MOVE', '街景人物与涂鸦轨迹，定格跃动的一瞬。'],
  ['塑缚龟命', '吸管与龟壳符号，传达减少塑料的主张。'],
  ['关于生命·古建', '古建影像与信息分栏，连接历史纹理和当代排版。'],
  ['塑料袋与鱼', '把文字折成塑料袋的形状，讨论废弃物的去向。'],
  ['DON’T BE A SILLY CAT', '蓝底与猫咪剪贴，拼出俏皮的手写宣言。'],
  ['Just Groove It', '萨克斯与橙蓝线条，让音乐节奏跃上纸面。'],
  ['城市崛起', '黑白竖向文字与节奏条，勾勒城市向上的轮廓。'],
  ['IDEA', '墨色在字体下方扩散，呈现灵感生成的瞬间。'],
  ['织网为戒，和美为归', '以网格构成龙虾，延续海洋保护的视觉主题。'],
  ['九命', '霓虹蓝紫包围猫的目光，营造夜行般的神秘感。'],
  ['绽放', '花朵、蓝色字块与拼贴质感，构成蓬勃的生命力。'],
  ['纸页呼吸', '细字与斜线分割留白，让文字成为画面的呼吸。'],
  ['关于生命·石狮', '石狮影像与细线排版，呈现古老形象的生命力。'],
  ['Golden Hour', '水母轮廓与暖橙颗粒，记录光线沉入海面的时刻。'],
  ['地层回声', '字形压在锈蚀纹理上，呈现时间留下的痕迹。'],
  ['拒犀', '犀牛剪影与大面积留白，留下关于保护的提问。'],
].map(([title, summary], index) => {
  const id = String(index + 1).padStart(2, '0');
  return {
    id,
    title,
    summary,
    href: `poster-detail.html?id=${id}`,
    thumb: `images/posters/${id}-thumb.jpg`,
    full: `images/posters/${id}-full.jpg`,
  };
});

function createPosterFace(project, extraClass = '', fullSize = false) {
  const face = document.createElement('span');
  face.className = `poster-card-face poster-image-face ${extraClass}`.trim();
  const image = document.createElement('img');
  image.src = fullSize ? project.full : project.thumb;
  image.alt = fullSize ? `${project.title}海报` : '';
  image.loading = fullSize ? 'eager' : 'lazy';
  image.decoding = 'async';
  image.draggable = false;
  face.append(image);
  return face;
}

function initPosterSphere() {
  const sphere = document.querySelector('[data-poster-sphere]');
  if (!sphere) return;

  const stage = sphere.querySelector('[data-sphere-stage]');
  const rotor = sphere.querySelector('[data-sphere-rotor]');
  const radius = 170;
  const sphereStateKey = 'portfolioPosterSphereState';
  const goldenAngle = 137.507764;
  const sphereItems = [];
  const totalPoints = posterProjects.length + 1;
  const unitPoints = Array.from({ length: totalPoints }, (_, index) => {
    const y = 1 - (2 * (index + 0.5)) / totalPoints;
    const ringRadius = Math.sqrt(1 - y * y);
    const angle = index * goldenAngle * Math.PI / 180;
    return { x: ringRadius * Math.sin(angle), y: -y, z: ringRadius * Math.cos(angle) };
  });
  const hubPointIndex = unitPoints.reduce((best, point, index, points) => point.z > points[best].z ? index : best, 0);
  const hubPoint = unitPoints[hubPointIndex];
  const alignY = -Math.atan2(hubPoint.x, hubPoint.z);
  const cosAlignY = Math.cos(alignY);
  const sinAlignY = Math.sin(alignY);
  const hubAfterY = {
    x: hubPoint.x * cosAlignY + hubPoint.z * sinAlignY,
    y: hubPoint.y,
    z: -hubPoint.x * sinAlignY + hubPoint.z * cosAlignY,
  };
  const alignX = Math.atan2(hubAfterY.y, hubAfterY.z);
  const cosAlignX = Math.cos(alignX);
  const sinAlignX = Math.sin(alignX);
  const alignedPoints = unitPoints.map((point) => {
    const x = point.x * cosAlignY + point.z * sinAlignY;
    const z = -point.x * sinAlignY + point.z * cosAlignY;
    return {
      x,
      y: point.y * cosAlignX - z * sinAlignX,
      z: point.y * sinAlignX + z * cosAlignX,
    };
  });
  const posterPoints = alignedPoints.filter((_, index) => index !== hubPointIndex);

  const addSphereItem = (element, point, itemRadius) => {
    sphereItems.push({
      element,
      x: itemRadius * point.x,
      y: itemRadius * point.y,
      z: itemRadius * point.z,
    });
  };

  posterProjects.forEach((project, index) => {
    const link = document.createElement('a');
    link.className = 'sphere-poster';
    link.href = project.href;
    link.draggable = false;
    link.setAttribute('aria-label', `查看${project.title}`);
    link.append(createPosterFace(project));
    rotor.append(link);
    addSphereItem(link, posterPoints[index], radius);
  });

  const hub = document.createElement('a');
  hub.className = 'sphere-poster sphere-hub';
  hub.href = 'poster.html';
  hub.draggable = false;
  hub.setAttribute('aria-label', '查看海报与字体实验作品总览');
  hub.innerHTML = '<span class="sphere-hub-face"><strong>04</strong><small>VIEW ALL</small></span>';
  rotor.append(hub);
  addSphereItem(hub, alignedPoints[hubPointIndex], radius + 10);

  let savedSphereState = null;
  try {
    savedSphereState = JSON.parse(sessionStorage.getItem(sphereStateKey));
  } catch (_) {
    savedSphereState = null;
  }
  let rotateX = Number.isFinite(savedSphereState?.rotateX) ? savedSphereState.rotateX % 360 : 0;
  let rotateY = Number.isFinite(savedSphereState?.rotateY) ? savedSphereState.rotateY % 360 : 0;
  let dragging = false;
  let dragged = false;
  let activePointerId = null;
  let captureElement = null;
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
      element.style.transform = `translate3d(${rotatedX.toFixed(2)}px, ${rotatedY.toFixed(2)}px, ${finalZ.toFixed(2)}px)`;
      element.style.zIndex = String(Math.round(finalZ + 300));
      element.style.opacity = '1';
      element.style.filter = 'none';
    });
  };

  const stopInertia = () => cancelAnimationFrame(inertiaFrame);
  const saveSphereState = () => {
    sessionStorage.setItem(sphereStateKey, JSON.stringify({ rotateX, rotateY }));
    savePageProgress();
  };
  const runInertia = () => {
    velocityX *= 0.935;
    velocityY *= 0.935;
    rotateX = (rotateX + velocityX) % 360;
    rotateY = (rotateY + velocityY) % 360;
    render();
    if (Math.abs(velocityX) + Math.abs(velocityY) > 0.04) {
      inertiaFrame = requestAnimationFrame(runInertia);
    }
  };

  stage.addEventListener('pointerdown', (event) => {
    if (activePointerId !== null || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    stopInertia();
    activePointerId = event.pointerId;
    captureElement = event.target.closest?.('a') || stage;
    captureElement.setPointerCapture(event.pointerId);
    dragging = true;
    dragged = false;
    startX = lastX = event.clientX;
    startY = lastY = event.clientY;
    velocityX = velocityY = 0;
    stage.classList.add('is-dragging');
  });

  stage.addEventListener('pointermove', (event) => {
    if (!dragging || event.pointerId !== activePointerId) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    if (Math.hypot(event.clientX - startX, event.clientY - startY) > 6) {
      dragged = true;
    }
    rotateY = (rotateY + dx * 0.32) % 360;
    rotateX = (rotateX - dy * 0.24) % 360;
    velocityY = dx * 0.18;
    velocityX = -dy * 0.14;
    lastX = event.clientX;
    lastY = event.clientY;
    render();
  });

  const release = (event) => {
    if (!dragging || event.pointerId !== activePointerId) return;
    dragging = false;
    activePointerId = null;
    stage.classList.remove('is-dragging');
    if (captureElement?.hasPointerCapture(event.pointerId)) captureElement.releasePointerCapture(event.pointerId);
    captureElement = null;
    if (dragged && event.type === 'pointerup') runInertia();
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  stage.addEventListener('lostpointercapture', (event) => {
    if (event.pointerId !== activePointerId) return;
    dragging = false;
    activePointerId = null;
    captureElement = null;
    stage.classList.remove('is-dragging');
  });
  stage.addEventListener('dragstart', (event) => event.preventDefault());
  stage.addEventListener('selectstart', (event) => event.preventDefault());
  stage.addEventListener('click', (event) => {
    if (!dragged) return;
    event.preventDefault();
    event.stopPropagation();
    dragged = false;
  }, true);
  stage.addEventListener('click', (event) => {
    if (event.target.closest('a')) saveSphereState();
  });

  stage.addEventListener('keydown', (event) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') rotateY = (rotateY - 12) % 360;
    if (event.key === 'ArrowRight') rotateY = (rotateY + 12) % 360;
    if (event.key === 'ArrowUp') rotateX = (rotateX - 10) % 360;
    if (event.key === 'ArrowDown') rotateX = (rotateX + 10) % 360;
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
    const title = document.createElement('strong');
    title.textContent = project.title;
    label.append(title);
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
  const summary = page.querySelector('[data-poster-summary]');
  const art = page.querySelector('[data-poster-art]');
  if (title) title.textContent = project.title;
  if (summary) summary.textContent = project.summary;
  if (art) art.append(createPosterFace(project, 'poster-detail-art', true));
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
    rememberNavigation(showcaseTargets[key]);
    location.href = showcaseTargets[key];
  });
  showcase.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    rememberNavigation(showcaseTargets[key]);
    location.href = showcaseTargets[key];
  });
});
