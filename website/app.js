'use strict';

const methodNames = {bc: 'Offline BC', hgd: 'Human-Gated DAgger', rgd: 'Robot-Gated DAgger'};
const positions = {middle: {label: 'middle position', successes: [3, 5, 9]}, 'upper-left': {label: 'upper-left position', successes: [0, 2, 4]}};
const evaluationMethods = ['bc', 'hgd', 'rgd'];

document.querySelectorAll('[data-position]').forEach(button => {
  button.addEventListener('click', () => {
    const position = button.dataset.position;
    if (button.getAttribute('aria-pressed') === 'true') return;
    document.querySelectorAll('[data-position]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    evaluationMethods.forEach((method, i) => {
      const video = document.querySelector(`#eval-${method}`);
      video.pause();
      video.src = `assets/videos/eval-${position}-${method}.mp4`;
      video.poster = `assets/posters/eval-${position}-${method}.jpg`;
      video.setAttribute('aria-label', `${methodNames[method]} — ${positions[position].label}, 15 attempts`);
      video.load();
      const successes = positions[position].successes[i];
      const rate = document.querySelector(`#rate-${method}`);
      rate.replaceChildren(document.createTextNode(`${(successes / 15 * 100).toFixed(1)}% `));
      const count = document.createElement('small');
      count.textContent = `${successes} / 15 successes`;
      rate.append(count);
    });
  });
});

document.querySelectorAll('[data-collection]').forEach(button => {
  button.addEventListener('click', () => {
    if (button.getAttribute('aria-pressed') === 'true') return;
    const key = button.dataset.collection;
    const [condition, method] = key.split('-');
    document.querySelectorAll('[data-collection]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    const video = document.querySelector('#collection-video');
    video.pause();
    video.src = `assets/videos/collection-${key}.mp4`;
    video.poster = `assets/posters/collection-${key}.jpg`;
    video.setAttribute('aria-label', `${methodNames[method]} data collection, ${condition.toUpperCase()}`);
    video.load();
    document.querySelector('#collection-caption').textContent = `${methodNames[method]} · ${condition.toUpperCase()} · full collection recording`;
  });
});

document.querySelectorAll('video').forEach(video => {
  video.addEventListener('play', () => {
    document.querySelectorAll('video').forEach(other => { if (other !== video) other.pause(); });
  });
});

document.querySelector('#copy-citation').addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText(document.querySelector('#bibtex').textContent);
    status.textContent = 'BibTeX copied.';
  } catch {
    status.textContent = 'Select the citation text to copy it, or download the .bib file.';
  }
});

const motivation = document.querySelector('#motivation-video');
const motivationChapters = [...document.querySelectorAll('[data-motivation-time]')];
motivationChapters.forEach(button => button.addEventListener('click', () => {
  motivation.currentTime = Number(button.dataset.motivationTime);
  motivation.scrollIntoView({block: 'center'});
  motivation.play().catch(() => {});
}));
motivation.addEventListener('timeupdate', () => {
  motivationChapters.forEach((button, i) => {
    const start = Number(button.dataset.motivationTime);
    const end = i + 1 < motivationChapters.length ? Number(motivationChapters[i + 1].dataset.motivationTime) : Infinity;
    if (motivation.currentTime >= start && motivation.currentTime < end) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  });
});

// Each view pairs a single visual with one short explanation.
['method', 'result'].forEach(kind => {
  const buttons = [...document.querySelectorAll(`[data-${kind}-view]`)];
  buttons.forEach(button => button.addEventListener('click', () => {
    buttons.forEach(other => {
      const selected = other === button;
      other.setAttribute('aria-pressed', String(selected));
      document.getElementById(other.getAttribute('aria-controls')).hidden = !selected;
    });
  }));
});

document.querySelectorAll('details').forEach(details => {
  details.addEventListener('toggle', () => {
    if (!details.open) details.querySelectorAll('video').forEach(video => video.pause());
  });
});
