function toggleTheme() {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      document.getElementById('theme-btn').innerText = isDark ? '☀️' : '🌙';
      try { localStorage.setItem('app-theme', isDark ? 'dark' : 'light'); } catch {}
    }

    window.onload = function() {
      let savedTheme;
      try { savedTheme = localStorage.getItem('app-theme'); } catch {}
      if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-btn').innerText = '☀️';
      }
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

    function updateSliderUI() {
      const val = parseInt(document.getElementById('count-slider').value);
      const exact = document.getElementById('count-exact').checked;
      const display = document.getElementById('count-display');
      
      if (val === 0) {
        display.innerText = 'Off';
        display.style.color = 'inherit';
      } else {
        display.innerText = exact ? `Exactly ${val}` : `${val} or more`;
        display.style.color = 'var(--accent-color)';
      }
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
        count: Number(document.getElementById('count-slider').value), exact: document.getElementById('count-exact').checked });
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
      document.getElementById('count-slider').value = 0;
      document.getElementById('count-exact').checked = false;
      updateSliderUI();
      
      buildString();
    }
