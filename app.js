function updateThemeButton() {
  const button = document.getElementById('theme-btn');
  const isDark = document.body.classList.contains('dark-mode');
  button.querySelector('.material-symbols-outlined').textContent = isDark ? 'light_mode' : 'dark_mode';
  button.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
}

function toggleTheme() {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      updateThemeButton();
      try { localStorage.setItem('app-theme', isDark ? 'dark' : 'light'); } catch {}
    }

    window.onload = function() {
      let savedTheme;
      try { savedTheme = localStorage.getItem('app-theme'); } catch {}
      if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
      }
      updateThemeButton();
      initCountRuler();
      updateSliderUI();
      buildString();
    };

    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (chip.parentElement.dataset.group === 'cp') {
          document.getElementById('cp-min').value = '';
          document.getElementById('cp-max').value = '';
        }
        chip.classList.toggle('active');
        buildString();
      });
    });

    const countStepWidth = 24;
    let selectedCount = 0;
    let countScrollFrame;
    function setCount(value, align = true) {
      const number = Number(value);
      const count = Number.isFinite(number) ? Math.max(0, Math.min(100, Math.round(number))) : 0;
      selectedCount = count;
      updateSliderUI();
      buildString();
      if (align) document.getElementById('count-ruler').scrollLeft = count * countStepWidth;
    }

    function initCountRuler() {
      const ruler = document.getElementById('count-ruler');
      const track = document.getElementById('count-ruler-track');
      for (let count = 0; count <= 100; count++) {
        const tick = document.createElement('span');
        tick.className = 'count-tick' + (count % 5 === 0 ? ' major' : '') + (count === 0 || count === 100 ? ' endpoint' : '');
        tick.textContent = count % 5 === 0 ? count : '';
        tick.addEventListener('click', () => setCount(count));
        track.appendChild(tick);
      }
      let drag = null;
      let suppressClick = false;
      ruler.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'mouse' || event.button !== 0) return;
        suppressClick = false;
        drag = { id: event.pointerId, x: event.clientX, scroll: ruler.scrollLeft, moved: false };
        ruler.focus({ preventScroll: true });
      });
      ruler.addEventListener('pointermove', event => {
        if (!drag || event.pointerId !== drag.id) return;
        const distance = event.clientX - drag.x;
        if (!drag.moved && Math.abs(distance) < 4) return;
        if (!drag.moved) {
          drag.moved = true;
          ruler.classList.add('is-dragging');
          ruler.setPointerCapture(event.pointerId);
        }
        event.preventDefault();
        ruler.scrollLeft = drag.scroll - distance;
        setCount(ruler.scrollLeft / countStepWidth, false);
      });
      const finishDrag = event => {
        if (!drag || event.pointerId !== drag.id) return;
        const moved = drag.moved;
        drag = null;
        if (!moved) return;
        suppressClick = true;
        const value = Math.round(ruler.scrollLeft / countStepWidth);
        ruler.classList.remove('is-dragging');
        if (ruler.hasPointerCapture(event.pointerId)) ruler.releasePointerCapture(event.pointerId);
        setCount(value);
      };
      ruler.addEventListener('pointerup', finishDrag);
      ruler.addEventListener('pointercancel', finishDrag);
      ruler.addEventListener('lostpointercapture', finishDrag);
      ruler.addEventListener('pointerleave', event => {
        if (drag && !drag.moved) drag = null;
      });
      ruler.addEventListener('click', event => {
        if (!suppressClick) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        suppressClick = false;
      }, true);
      ruler.addEventListener('scroll', () => {
        cancelAnimationFrame(countScrollFrame);
        countScrollFrame = requestAnimationFrame(() => setCount(ruler.scrollLeft / countStepWidth, false));
      });
      ruler.addEventListener('keydown', event => {
        const value = selectedCount;
        const next = { ArrowRight: value + 1, ArrowUp: value + 1, ArrowLeft: value - 1, ArrowDown: value - 1, PageUp: value + 10, PageDown: value - 10, Home: 0, End: 100 }[event.key];
        if (next !== undefined) { event.preventDefault(); setCount(next); }
      });
      ruler.scrollLeft = selectedCount * countStepWidth;
    }

    function updateSliderUI() {
      const val = selectedCount;
      const exact = document.getElementById('count-exact').checked;
      const display = document.getElementById('count-display');
      display.innerText = val === 0 ? 'Off' : exact ? String(val) : `${val}+`;
      display.style.color = val === 0 ? 'inherit' : 'var(--accent-color)';
      const caption = document.getElementById('count-caption');
      caption.innerText = val === 0 ? 'Count filter disabled' : '';
      caption.hidden = val !== 0;
      const ruler = document.getElementById('count-ruler');
      ruler.querySelectorAll('.count-tick').forEach((tick, index) => {
        tick.classList.toggle('selected', index === val);
      });
      ruler.setAttribute('aria-valuenow', val);
      ruler.setAttribute('aria-valuetext', val === 0 ? 'Off' : exact ? `Exactly ${val}` : `${val} or more`);
      ruler.parentElement.classList.toggle('at-start', val === 0);
      ruler.parentElement.classList.toggle('at-end', val === 100);
    }

    let currentQuery = '';
    function buildString() {
      const min = document.getElementById('cp-min');
      const max = document.getElementById('cp-max');
      if (min.value || max.value || min.validity.badInput || max.validity.badInput) {
        document.querySelectorAll('[data-group="cp"] .chip').forEach(chip => chip.classList.remove('active'));
      }
      const groups = {};
      document.querySelectorAll('.chip-grid').forEach(group => {
        groups[group.dataset.group] = Array.from(group.querySelectorAll('.chip.active'), chip => chip.dataset.filter);
      });
      document.querySelectorAll('.chip').forEach(chip => chip.setAttribute('aria-pressed', chip.classList.contains('active')));
      const result = generateSearch({ groups, minCp: min.value, maxCp: max.value,
        invalidCp: min.validity.badInput || max.validity.badInput,
        count: selectedCount, exact: document.getElementById('count-exact').checked });
      currentQuery = result.query;
      document.getElementById('output-text').innerText = currentQuery || (result.errors.length ? 'Resolve the filters above to generate a search.' : 'Select filters above...');
      document.getElementById('validation-message').innerText = result.errors.join(' ');
      min.setAttribute('aria-invalid', !min.validity.valid || (min.value && max.value && Number(min.value) > Number(max.value)) ? 'true' : 'false');
      max.setAttribute('aria-invalid', !max.validity.valid || (min.value && max.value && Number(min.value) > Number(max.value)) ? 'true' : 'false');
      document.getElementById('copy-btn').disabled = !currentQuery;
      document.getElementById('copy-feedback').innerText = '';
    }

    async function copyString() {
      const query = currentQuery;
      if (!query) return;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(query);
        } else {
          const textArea = document.createElement('textarea');
          textArea.value = query;
          textArea.style.position = 'fixed';
          textArea.style.left = '-9999px';
          document.body.appendChild(textArea);
          const previousFocus = document.activeElement;
          try {
            textArea.select();
            if (!document.execCommand('copy')) throw new Error('Copy failed');
          } finally {
            textArea.remove();
            previousFocus?.focus();
          }
        }
        document.getElementById('copy-feedback').innerText = 'Copied!';
      } catch {
        document.getElementById('copy-feedback').innerText = 'Could not copy. Select the search text and copy it manually.';
      }
    }

    function resetAll() {
      document.querySelectorAll('.chip.active').forEach(chip => chip.classList.remove('active'));
      document.getElementById('cp-min').value = '';
      document.getElementById('cp-max').value = '';
      
      // Reset Slider
      selectedCount = 0;
      document.getElementById('count-ruler').scrollLeft = 0;
      document.getElementById('count-exact').checked = false;
      updateSliderUI();
      
      buildString();
    }
