(() => {
  'use strict';

  const KEY = 'pedaltrack-history-v1';
  const $ = (selector) => document.querySelector(selector);
  const el = {
    count: $('#progressRideCount'),
    km: $('#progressDistance'),
    longest: $('#progressLongest'),
    weeks: $('#progressWeeks'),
    milestones: $('#progressMilestones'),
    distance: $('#progressDistanceChart'),
    speed: $('#progressSpeedChart'),
    weekly: $('#progressWeeklyChart'),
    empty: $('#progressEmpty'),
    form: $('#manualRideForm'),
    toggle: $('#toggleManualRide'),
    notice: $('#progressNotice'),
    backup: $('#downloadHistory'),
    restore: $('#restoreHistory'),
    restoreFile: $('#restoreHistoryFile')
  };
  if (!el.count || !el.form) return;

  const km = (value, digits = 1) => Number(value || 0).toLocaleString('pt-BR', {minimumFractionDigits: digits, maximumFractionDigits: digits});
  const dateLabel = (date) => new Intl.DateTimeFormat('pt-BR', {day: '2-digit', month: '2-digit'}).format(date);
  const warn = (message) => {
    el.notice.textContent = message || '';
    el.notice.hidden = !message;
  };

  function readRides() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (!Array.isArray(value)) return [];
      return value.filter(ride => {
        const date = new Date(ride?.date);
        return date.getTime() > 0 && !Number.isNaN(date.getTime())
          && Number.isFinite(Number(ride.distance)) && Number(ride.distance) >= 0
          && Number.isFinite(Number(ride.seconds)) && Number(ride.seconds) >= 0;
      }).map(ride => ({
        ...ride,
        distance: Number(ride.distance),
        seconds: Number(ride.seconds),
        max: Number.isFinite(Number(ride.max)) ? Number(ride.max) : 0
      })).sort((a,b) => new Date(b.date) - new Date(a.date));
    } catch (_) {
      return [];
    }
  }
  function saveRides(rides) {
    try {
      localStorage.setItem(KEY, JSON.stringify(rides.slice(0, 300)));
      window.dispatchEvent(new Event('pedaltrack:history-change'));
      return true;
    } catch (_) {
      warn('Não foi possível salvar. Confira o espaço de armazenamento do navegador.');
      return false;
    }
  }

  function div(className, text) {
    const node = document.createElement('div');
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function chart(container, values, unit, format, maxValue) {
    container.replaceChildren();
    if (!values.length) {
      container.append(div('graph-empty', 'Os gráficos aparecem após a primeira pedalada salva.'));
      return;
    }
    const max = Math.max(maxValue || 0, ...values.map(x => x.value), 1);
    for (const data of values) {
      const col = div('graph-column');
      const number = div('graph-value', format(data.value) + unit);
      const track = div('graph-track');
      const bar = div('graph-fill');
      bar.style.height = (data.value ? Math.max(6, 100 * data.value / max) : 0) + '%';
      track.append(bar);
      const caption = div('graph-label', data.label);
      col.setAttribute('role', 'listitem');
      col.setAttribute('aria-label', data.label + ': ' + format(data.value) + unit);
      col.append(number, track, caption);
      container.append(col);
    }
  }

  function monday(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() - (d.getDay() + 6) % 7);
    return d;
  }

  function render() {
    const rides = readRides();
    const valid = rides.filter(r => r.distance > 0);
    const total = valid.reduce((sum,r) => sum + r.distance, 0) / 1000;
    const longest = valid.reduce((max,r) => Math.max(max, r.distance), 0) / 1000;
    const now = new Date();
    const since = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const activeDates = new Set(valid.filter(r => new Date(r.date) >= since && new Date(r.date) <= now)
      .map(r => new Date(r.date).toLocaleDateString('sv-SE')));

    el.count.textContent = valid.length.toLocaleString('pt-BR');
    el.km.textContent = km(total, 2);
    el.longest.textContent = km(longest, 2);
    el.weeks.textContent = activeDates.size.toLocaleString('pt-BR');
    el.empty.hidden = valid.length > 0;

    const thresholds = [8, 10, 12, 15];
    el.milestones.replaceChildren();
    for (const target of thresholds) {
      const achieved = longest + 1e-9 >= target;
      const pill = div('milestone' + (achieved ? ' achieved' : ''));
      pill.append(div('milestone-symbol', achieved ? '✓' : '○'), document.createTextNode(target + ' km'));
      pill.title = achieved ? 'Distância já registrada em uma pedalada' : 'Distância ainda não registrada em uma pedalada';
      el.milestones.append(pill);
    }

    const recent = [...valid].slice(0, 8).reverse();
    chart(el.distance, recent.map(r => ({label: dateLabel(new Date(r.date)), value: r.distance / 1000})), ' km', x => km(x, 1));
    chart(el.speed, recent.map(r => ({label: dateLabel(new Date(r.date)), value: r.seconds > 0 ? r.distance / r.seconds * 3.6 : 0})), ' km/h', x => km(x, 1));

    const currentMonday = monday(now);
    const weeks = Array.from({length: 6}, (_, index) => {
      const start = new Date(currentMonday);
      start.setDate(start.getDate() - (5 - index) * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return {
        label: dateLabel(start),
        value: valid.filter(r => {
          const date = new Date(r.date);
          return date >= start && date < end;
        }).length
      };
    });
    chart(el.weekly, weeks, '', x => String(x), Math.max(2, ...weeks.map(w => w.value)));
  }

  function localDateString() {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2,'0')].join('-');
  }
  const dateInput = el.form.elements.namedItem('date');
  if (dateInput) dateInput.value = localDateString();

  el.toggle.addEventListener('click', () => {
    const open = el.form.hidden;
    el.form.hidden = !open;
    el.toggle.setAttribute('aria-expanded', String(open));
    el.toggle.textContent = open ? 'Fechar registro manual' : '+ Registrar pedalada do Strava';
    if (open) el.form.elements.namedItem('distance').focus();
  });

  el.form.addEventListener('submit', (event) => {
    event.preventDefault();
    warn('');
    const form = el.form.elements;
    const distance = Number(String(form.namedItem('distance').value).replace(',', '.'));
    const minutes = Number(form.namedItem('minutes').value);
    const seconds = Number(form.namedItem('seconds').value || 0);
    const date = String(form.namedItem('date').value);
    const elevationRaw = String(form.namedItem('elevation').value).trim();
    const elevation = elevationRaw ? Number(elevationRaw) : null;
    const effort = String(form.namedItem('effort').value || '');
    const dateObj = new Date(date + 'T12:00:00');

    if (!(distance > 0 && distance <= 500) || !(minutes >= 1 && minutes <= 6000)
      || !Number.isInteger(minutes) || !Number.isInteger(seconds) || seconds < 0 || seconds > 59
      || Number.isNaN(dateObj.getTime()) || dateObj.getTime() > Date.now() + 86400000
      || (elevation !== null && (!Number.isFinite(elevation) || elevation < 0 || elevation > 15000))) {
      warn('Confira a distância, o tempo, a data e a elevação antes de salvar.');
      return;
    }
    const ride = {
      date: dateObj.toISOString(),
      distance: Math.round(distance * 1000),
      seconds: minutes * 60 + seconds,
      kcal: null,
      max: 0,
      source: 'Strava/manual',
      elevation,
      effort: ['leve','moderado','puxado'].includes(effort) ? effort : null
    };
    if (saveRides([ride, ...readRides()].sort((a,b) => new Date(b.date)-new Date(a.date)))) {
      el.form.reset();
      form.namedItem('date').value = localDateString();
      el.form.hidden = true;
      el.toggle.setAttribute('aria-expanded', 'false');
      el.toggle.textContent = '+ Registrar pedalada do Strava';
      warn('Pedalada adicionada! Seus gráficos já foram atualizados.');
    }
  });

  el.backup.addEventListener('click', () => {
    const rides = readRides();
    if (!rides.length) {
      warn('Ainda não há pedaladas para exportar.');
      return;
    }
    const payload = JSON.stringify({app:'PedalTrack', version:1, exportedAt:new Date().toISOString(),rides}, null, 2);
    const url = URL.createObjectURL(new Blob([payload], {type:'application/json'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pedaltrack-historico-' + localDateString() + '.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    warn('Backup criado. Guarde esse arquivo num lugar seguro.');
  });

  el.restore.addEventListener('click', () => el.restoreFile.click());
  el.restoreFile.addEventListener('change', async () => {
    const file = el.restoreFile.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      warn('O arquivo é grande demais para um histórico de pedaladas.');
      el.restoreFile.value = '';
      return;
    }
    try {
      const data = JSON.parse(await file.text());
      if (data.app !== 'PedalTrack' || !Array.isArray(data.rides)) throw Error('Formato inválido');
      const cleaned = data.rides.filter(r => r && !Number.isNaN(new Date(r.date).getTime()) &&
        Number.isFinite(Number(r.distance)) && Number(r.distance) >= 0 && Number(r.distance) <= 500000 &&
        Number.isFinite(Number(r.seconds)) && Number(r.seconds) >= 0 && Number(r.seconds) <= 360000).map(r => ({
          date: String(r.date),
          distance: Number(r.distance),
          seconds: Number(r.seconds),
          kcal: Number.isFinite(Number(r.kcal)) && r.kcal !== null ? Number(r.kcal) : null,
          max: Number.isFinite(Number(r.max)) ? Number(r.max) : 0,
          source: typeof r.source === 'string' ? r.source.slice(0,60) : null,
          elevation: Number.isFinite(Number(r.elevation)) && r.elevation !== null ? Number(r.elevation) : null,
          effort: ['leve','moderado','puxado'].includes(r.effort) ? r.effort : null
        }));
      if (!cleaned.length) throw Error('Sem registros válidos');
      const known = new Set();
      const merged = [...readRides(), ...cleaned].filter(r => {
        const key = [r.date, r.distance, r.seconds].join('|');
        if (known.has(key)) return false;
        known.add(key);
        return true;
      }).sort((a,b) => new Date(b.date)-new Date(a.date));
      if (saveRides(merged)) warn('Histórico restaurado! Foram unidos os registros sem duplicar pedaladas idênticas.');
    } catch (_) {
      warn('Não foi possível importar. Selecione um backup JSON criado pelo PedalTrack.');
    }
    el.restoreFile.value = '';
  });

  window.addEventListener('pedaltrack:history-change', render);
  window.addEventListener('storage', (event) => {if (event.key === KEY) render();});
  render();
})();