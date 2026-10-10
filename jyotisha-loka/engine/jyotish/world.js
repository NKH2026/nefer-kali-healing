/**
 * Jyotisha Loka: what makes the Jyotish course's world more than its three study
 * sites. The live sky (scene.js, from sky.js), the panchanga card, travelling in
 * time to watch the grahas move, and three places to walk up to:
 *
 *   the orrery      the nine grahas now: sign, mansion, retrograde, and what the
 *                   tradition says each signifies
 *   Moon's altar    the 27 Mansions collection: collect the mansion the real Moon
 *                   is in, once a day or so, for a lunar month
 *   birth altar     find your birth star, worked out on this device; only the
 *                   nakshatra is kept
 *
 * The world kit's boot (worlds/boot.js) calls this for a recipe with
 * `special: 'jyotish'`, and asks it what is in reach.
 */
import { el } from '../../dom.js';
import { GRAHAS, NAKSHATRAS, grahaPositions, panchanga, nextMansionChange, birthStar, birthStarFromDay, dms } from './sky.js';
import { createZodiacWheel, createGrahas, createOrrery, createAltar } from './scene.js';
import { loadMansions, saveMansions, collectMansion, loadBirthStar, saveBirthStar, forgetBirthStar, isBirthStarDay } from './collection.js';
import { PALETTE } from '../style.js';

const DAY_MS = 86_400_000;
/** How often the live sky is recomputed, seconds. The Moon moves ~0.5° an hour. */
const REFRESH = 20;

/** What the tradition says each graha signifies: offered as tradition. */
const SIGNIFIES = {
  surya: 'the soul, the father, authority and vitality',
  chandra: 'the mind, the mother, feeling and nourishment',
  mangala: 'courage, energy, drive and siblings',
  budha: 'speech, learning, wit and trade',
  guru: 'the teacher, wisdom, dharma and blessing',
  shukra: 'beauty, love, the arts and refinement',
  shani: 'time, discipline, endurance and service',
  rahu: 'longing, the new and the foreign, obsession',
  ketu: 'release, the past, insight and liberation',
};

const fmtDate = (d) => d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = (d) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
const grahaName = (id) => GRAHAS.find((g) => g.id === id)?.name ?? id;

/**
 * @param {{scene: THREE.Scene, recipe: object, heightAt: Function, panel: object,
 *          toast: Function, touchMode: boolean, quality: string, sky?: {setTint?: Function}}} opts
 */
export function createJyotishWorld({ scene, recipe, heightAt, panel, toast, touchMode, quality = 'high', sky = null, hud = document.body }) {
  const wheel = createZodiacWheel({ quality });
  const grahas = createGrahas({ quality });
  const orrery = createOrrery(recipe.centerpiece, heightAt);
  const moonAltar = createAltar(recipe.altars.moon, heightAt, { colour: PALETTE.glyph.cyan, emblem: 'moon' });
  const birthAltar = createAltar(recipe.altars.birth, heightAt, { colour: PALETTE.life.magenta, emblem: 'star' });
  scene.add(wheel.group, grahas.group, orrery.group, moonAltar.group, birthAltar.group);

  const collected = loadMansions();
  let birth = loadBirthStar();
  let offsetDays = 0;
  let positions = [];
  let today = null;
  let sinceRefresh = REFRESH;
  let greetedBirthDay = false;

  const when = () => new Date(Date.now() + offsetDays * DAY_MS);
  const live = () => offsetDays === 0;

  // ---- the panchanga card, top left
  const card = el('section', { class: 'pa-jyotish-card', 'aria-live': 'polite' });
  const cardTitle = el('p', { class: 'pa-jyotish-kicker' });
  const cardBody = el('div', { class: 'pa-jyotish-lines' });
  const back = el('button', { type: 'button', class: 'pa-jyotish-step', 'aria-label': 'One day back', onclick: () => travel(-1) }, '◀');
  const nowBtn = el('button', { type: 'button', class: 'pa-jyotish-step', onclick: () => travel(0) }, 'Now');
  const fwd = el('button', { type: 'button', class: 'pa-jyotish-step', 'aria-label': 'One day on', onclick: () => travel(1) }, '▶');
  const hint = el('p', { class: 'pa-jyotish-hint', text: touchMode ? 'Travel in time to watch the grahas move.' : '[ and ] travel a day · \\ returns to now' });
  // On a phone the card starts compact — the tithi and the Moon's mansion — and
  // opens for the rest.
  const more = el('button', { type: 'button', class: 'pa-jyotish-more', 'aria-expanded': 'false' }, 'more ▾');
  const compactStart = touchMode || globalThis.matchMedia?.('(max-width: 700px)')?.matches;
  card.classList.toggle('compact', Boolean(compactStart));
  const syncMore = () => {
    const compact = card.classList.contains('compact');
    more.textContent = compact ? 'more ▾' : 'less ▴';
    more.setAttribute('aria-expanded', String(!compact));
  };
  more.addEventListener('click', () => { card.classList.toggle('compact'); syncMore(); });
  syncMore();
  card.append(el('div', { class: 'pa-jyotish-head' }, cardTitle, more), cardBody, el('div', { class: 'pa-jyotish-steps' }, back, nowBtn, fwd), hint);
  hud.append(card);

  function line(label, value) {
    return el('p', {}, el('span', { class: 'pa-jyotish-label', text: label }), ' ', value);
  }

  function refresh() {
    const date = when();
    positions = grahaPositions(date);
    today = panchanga(date);
    grahas.setPositions(positions, { varaGraha: today.vara.graha?.id });
    orrery.setPositions(positions);
    wheel.highlight(today.nakshatra.index);
    sky?.setTint?.(today.vara.graha?.colour ?? PALETTE.life.violet);
    const t = today.tithi;
    cardTitle.textContent = live() ? `Panchanga · now · ${fmtTime(date)}` : `Panchanga · travelling ${offsetDays > 0 ? '+' : ''}${offsetDays} day${Math.abs(offsetDays) === 1 ? '' : 's'}`;
    cardBody.replaceChildren(
      line('Date', fmtDate(date)),
      line('Tithi', `${t.paksha === 'śukla' ? 'Śukla' : 'Kṛṣṇa'} ${t.name} (${t.index} of 30) · Moon ${Math.round(today.illumination * 100)}% lit`),
      line('Nakshatra', `${today.nakshatra.icon} ${today.nakshatra.name}, pada ${today.nakshatra.pada}`),
      line('Vāra', `${today.vara.name} — the day of ${today.vara.graha?.name ?? ''}`),
      line('Yoga', today.yoga.name),
      line('Karaṇa', today.karana.name),
    );
    card.classList.toggle('travelling', !live());
    // The altars: the Moon's glows while a mansion waits to be collected; the
    // birth altar on the Moon's return to the member's birth star.
    const waiting = live() && !collected.has(today.nakshatra.id);
    moonAltar.setGlow(waiting ? 1 : 0.25);
    const homeDay = isBirthStarDay(birth, today.nakshatra.index);
    birthAltar.setGlow(homeDay ? 1 : birth ? 0.45 : 0.3);
    if (homeDay && live() && !greetedBirthDay) {
      greetedBirthDay = true;
      toast(`The Moon is home in ${birth.name} today, your birth star. Welcome back.`, 6);
    }
  }

  function travel(days) {
    offsetDays = days === 0 ? 0 : offsetDays + days;
    sinceRefresh = REFRESH;
    refresh();
  }

  // ---- the panels, in the world's own study panel
  const kicker = (text) => el('p', { class: 'my-lesson-kicker', text });
  const title = (text) => el('h2', { class: 'my-field-title', text });
  const note = (text) => el('p', { class: 'my-note', text });

  function openGrahaGuide() {
    const rows = positions.map((p) => el('tr', {},
      el('td', {}, el('span', { class: 'pa-jyotish-glyph', style: `color:#${p.graha.colour.toString(16).padStart(6, '0')}`, text: p.graha.glyph }), ' ', el('strong', { text: p.graha.name }), el('br'), el('small', { text: p.graha.english })),
      el('td', { text: `${p.rashiName} ${dms(p.degree)}` }),
      el('td', { text: `${p.nakshatra.name} · ${p.pada}` }),
      el('td', { text: p.graha.shadow ? 'always ℞' : p.retrograde ? '℞ retrograde' : 'direct' }),
    ));
    const meanings = GRAHAS.map((g) => el('li', {}, el('strong', { text: `${g.name}: ` }), SIGNIFIES[g.id]));
    panel.openCustom([
      kicker(live() ? 'The nine grahas, now' : `The nine grahas, ${fmtDate(when())}`),
      title('The orrery'),
      note('Sidereal (Lahiri) positions, computed on your device from the real sky. ℞ means a graha appears to move backwards against the stars.'),
      el('div', { class: 'pa-jyotish-table-wrap' }, el('table', { class: 'pa-jyotish-table' },
        el('thead', {}, el('tr', {}, el('th', { text: 'Graha' }), el('th', { text: 'Rāśi' }), el('th', { text: 'Nakshatra · pada' }), el('th', { text: 'Motion' }))),
        el('tbody', {}, rows),
      )),
      kicker('What the tradition says each signifies'),
      el('ul', { class: 'pa-jyotish-meanings' }, meanings),
      note('These are teachings of the Jyotish tradition, offered as tradition — not as predictions about your life.'),
    ]);
  }

  /** One graha, close up: reached by flying to it on the carpet. */
  function openGraha(id) {
    const p = positions.find((x) => x.id === id);
    if (!p) return;
    const g = p.graha;
    const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][g.day];
    panel.openCustom([
      kicker(live() ? 'A graha, up close' : `A graha, ${fmtDate(when())}`),
      title(`${g.glyph} ${g.name} · ${g.english}`),
      el('p', {}, `In ${p.rashiName} (${p.rashiEnglish}) at ${dms(p.degree)}, in the nakshatra ${p.nakshatra.name}, pada ${p.pada}. `,
        g.shadow ? 'A shadow graha: always moving backwards round the zodiac.' : p.retrograde ? 'Retrograde: it appears to move backwards against the stars just now.' : 'Moving directly through the zodiac.'),
      g.shadow
        ? note(g.id === 'rahu' ? 'Rāhu is the Moon’s ascending node: where its path crosses the Sun’s going north. Eclipses happen near it.' : 'Ketu is the Moon’s descending node, always opposite Rāhu. Eclipses happen near it.')
        : note(day ? `${g.name} rules ${day}.` : ''),
      kicker('In the tradition'),
      el('p', { text: `${g.name} signifies ${SIGNIFIES[g.id]}.` }),
      note('A teaching of the Jyotish tradition, offered as tradition.'),
    ]);
  }

  function mansionGrid() {
    return el('div', { class: 'pa-jyotish-mansions' }, NAKSHATRAS.map((n, i) => el('div', {
      class: `pa-jyotish-mansion${collected.has(n.id) ? ' got' : ''}${today?.nakshatra.index === i ? ' now' : ''}`,
      title: n.name,
    }, el('span', { text: collected.has(n.id) ? n.icon : '·' }), el('small', { text: n.name }))));
  }

  function openMoonAltar() {
    const n = today.nakshatra;
    const change = live() ? nextMansionChange(when()) : null;
    const got = collected.has(n.id);
    const collect = el('button', { type: 'button', class: 'my-ctl my-ctl--primary', disabled: !live() || got }, got ? 'Collected' : live() ? `Collect ${n.name}` : 'Return to now to collect');
    collect.addEventListener('click', () => {
      const r = collectMansion(collected, n.index, { live: live() });
      if (!r.ok) return;
      saveMansions(collected);
      toast(r.complete ? 'All twenty-seven mansions! A full lunar month, kept.' : `${n.name} collected — ${r.count} of 27`, 4);
      refresh();
      openMoonAltar();
    });
    panel.openCustom([
      kicker(`The Moon's mansion · ${collected.size} of 27 collected`),
      title(`${n.icon} ${n.name}`),
      el('p', {}, `The Moon is in ${n.name}, pada ${n.pada}. Its deity is ${n.deity}; its symbol, ${n.symbol}; its lord, ${grahaName(n.lord)}.`),
      change ? note(`It moves on to ${change.nakshatra.name} at about ${fmtTime(change.at)}${change.at.getDate() !== new Date().getDate() ? ' tomorrow' : ''}.`) : null,
      collect,
      note('A mansion can be collected only while the real Moon is in it. Come back as the Moon moves: all twenty-seven take about a lunar month.'),
      mansionGrid(),
    ]);
  }

  function openBirthAltar() {
    const date = el('input', { type: 'date', class: 'my-input', 'aria-label': 'Birth date' });
    const time = el('input', { type: 'time', class: 'my-input', 'aria-label': 'Birth time (optional)' });
    const out = el('div', { class: 'pa-jyotish-out', 'aria-live': 'polite' });
    const find = el('button', { type: 'button', class: 'my-ctl my-ctl--primary' }, 'Find my birth star');
    find.addEventListener('click', () => {
      const [y, m, d] = (date.value || '').split('-').map(Number);
      if (!y || !m || !d) { out.replaceChildren(note('Choose a birth date first.')); return; }
      let result;
      if (time.value) {
        const [hh, mm] = time.value.split(':').map(Number);
        result = birthStar(new Date(y, m - 1, d, hh, mm));
      } else {
        const day = birthStarFromDay(y, m, d, new Date(y, m - 1, d).getTimezoneOffset());
        if (!day.settled) {
          out.replaceChildren(note(`On that day the Moon moved from ${day.first.nakshatra.name} into ${day.last.nakshatra.name}. Add your birth time to tell which.`));
          return;
        }
        result = day.first;
      }
      // The birth details go no further than this function: only the star is kept.
      date.value = '';
      time.value = '';
      birth = result.nakshatra;
      saveBirthStar(birth);
      greetedBirthDay = false;
      refresh();
      showBirth(out, result.nearBoundary);
    });
    const forget = el('button', { type: 'button', class: 'my-ctl' }, 'Forget my birth star');
    forget.addEventListener('click', () => { forgetBirthStar(); birth = null; refresh(); openBirthAltar(); });
    if (birth) showBirth(out, false);
    panel.openCustom([
      kicker('Janma nakṣatra'),
      title('Your birth star'),
      el('p', { text: 'The mansion the Moon held at the moment you were born. Your birth date is often enough; near a boundary, the time decides it.' }),
      el('label', { class: 'pa-jyotish-field' }, 'Birth date ', date),
      el('label', { class: 'pa-jyotish-field' }, 'Birth time (optional) ', time),
      note(`Times are read in this device's time zone. Worked out here, on your device: only the nakshatra is kept, never your birth date or time.`),
      find,
      out,
      birth ? forget : null,
    ]);
  }

  function showBirth(out, nearBoundary) {
    const n = birth;
    const home = today && isBirthStarDay(birth, today.nakshatra.index);
    out.replaceChildren(
      el('h3', { class: 'pa-jyotish-birth', text: `${n.icon} ${n.name}` }),
      el('p', {}, `Deity: ${n.deity}. Symbol: ${n.symbol}. Lord: ${grahaName(n.lord)}.`),
      nearBoundary ? note('The Moon was within half a degree of the next mansion, so an exact birth time matters here.') : null,
      note(home ? 'The Moon is in your birth star right now.' : 'Each lunar month the Moon returns to your birth star, and this altar glows to welcome you.'),
      note('In the tradition the birth star is said to colour one’s nature; that is offered here as tradition, not as a finding.'),
    );
  }

  // ---- what is in reach, for the boot's E / action button
  const grahaSpots = grahas.items.map((it) => ({
    inFlight: true,
    // Close enough to read it: within a few metres of its surface, in three dimensions.
    distance: (p) => it.body.group.position.distanceTo(p) - (it.g.size + 7),
    label: () => {
      const pos = positions.find((x) => x.id === it.g.id);
      return pos ? `${it.g.name} (${it.g.english}) · ${pos.rashiName} ${dms(pos.degree)}` : it.g.name;
    },
    act: () => openGraha(it.g.id),
  }));
  const spots = [
    ...grahaSpots,
    { x: orrery.at.x, z: orrery.at.z, radius: recipe.centerpiece.radius + 2.5, label: () => 'The orrery: the grahas now', act: openGrahaGuide },
    { x: recipe.altars.moon.x, z: recipe.altars.moon.z, radius: 3.2, label: () => (live() && today && !collected.has(today.nakshatra.id) ? `Collect ${today.nakshatra.name}` : "The Moon's mansion"), act: openMoonAltar },
    { x: recipe.altars.birth.x, z: recipe.altars.birth.z, radius: 3.2, label: () => (birth ? `Your birth star: ${birth.name}` : 'Find your birth star'), act: openBirthAltar },
  ];

  refresh();

  return {
    spots,
    get today() { return today; },
    get positions() { return positions; },
    get offsetDays() { return offsetDays; },
    collected,
    get birth() { return birth; },
    travel,
    openGrahaGuide,
    openGraha,
    /** Where a graha is drawn right now (for tests and tinkering). */
    grahaPosition: (id) => grahas.items.find((it) => it.g.id === id)?.body.group.position.clone() ?? null,
    openMoonAltar,
    openBirthAltar,
    /** Keys the world answers to; returns true if it used the key. */
    onKey(code) {
      if (code === 'BracketLeft') { travel(-1); return true; }
      if (code === 'BracketRight') { travel(1); return true; }
      if (code === 'Backslash') { travel(0); return true; }
      return false;
    },
    update(dt, t) {
      sinceRefresh += dt;
      if (sinceRefresh >= REFRESH) { sinceRefresh = 0; refresh(); }
      grahas.update(dt, t);
      wheel.update(t);
      orrery.update(t);
      moonAltar.update(t);
      birthAltar.update(t);
    },
    setVisible(on) { card.hidden = !on; },
  };
}
