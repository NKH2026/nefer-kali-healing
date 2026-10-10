/**
 * The panel over Jyotisha Loka: the Jyotish lessons to read at each site's
 * stations, each site's key terms and open questions at its shrine, and anything
 * else the world shows (the orrery, the altars). Reading only — no accounts, no
 * quizzes. Close sits outside the card, pinned to the corner, so nothing in a
 * panel can cover it.
 */
import { el } from './dom.js';
import jyotish from './engine/content/jyotish.json';
import nakshatras from './engine/content/nakshatras.json';
import panchanga from './engine/content/panchanga.json';
import course from './engine/content/course.json';

/** The three modules, by id: the course written for the world. */
export const MODULES = Object.fromEntries([jyotish, nakshatras, panchanga].map((m) => [m.id, m]));
export const COURSE = course;

/** How each statement is to be held, as the course grades it. */
const GRADES = {
  established: 'Established',
  supported: 'Supported',
  emerging: 'Emerging',
  preliminary: 'Preliminary',
  hypothesis: 'Hypothesis',
  traditional: 'Traditional knowledge',
  spiritual: 'Spiritual teaching',
};

function claims(list) {
  return el('ul', { class: 'jl-claims' }, (list || []).map((c) => el('li', { class: 'jl-claim' },
    el('span', { class: `jl-grade jl-grade--${c.evidence}`, text: GRADES[c.evidence] || c.evidence }),
    el('p', { text: c.text }),
  )));
}

export function createPanel({ onOpen, onClose }) {
  const root = el('div', { class: 'pa-world-panel jl-panel', hidden: true, role: 'dialog', 'aria-modal': 'true' });
  const card = el('div', { class: 'pa-world-card' });
  const body = el('div', { class: 'pa-world-body' });
  const close = el('button', { type: 'button', class: 'jl-ctl pa-world-close', onclick: () => hide() }, 'Close');
  card.append(body);
  root.append(close, card);
  document.body.append(root);
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });

  let isOpen = false;
  function show(nodes) {
    body.replaceChildren(...nodes.filter(Boolean));
    root.hidden = false;
    body.scrollTop = 0;
    if (!isOpen) { isOpen = true; onOpen?.(); }
    close.focus();
  }
  function hide() {
    if (!isOpen) return;
    root.hidden = true;
    isOpen = false;
    onClose?.();
  }
  const kicker = (text) => el('p', { class: 'my-lesson-kicker', text });
  const title = (text) => el('h2', { class: 'my-field-title', text });

  /** A station: one lesson to read, with the way on to the next. */
  function openLesson(moduleId, index) {
    const m = MODULES[moduleId];
    const lesson = m?.lessons?.[index];
    if (!lesson) return;
    const next = m.lessons[index + 1];
    show([
      kicker(`${m.name} · Lesson ${index + 1} of ${m.lessons.length}`),
      title(lesson.title),
      lesson.objectives?.length ? el('ul', { class: 'jl-objectives' }, lesson.objectives.map((o) => el('li', { text: o }))) : null,
      claims(lesson.body),
      el('div', { class: 'jl-actions' },
        next ? el('button', { type: 'button', class: 'jl-ctl jl-ctl--primary', onclick: () => openLesson(moduleId, index + 1) }, `Next: ${next.title}`) : null),
    ]);
  }

  /** A site's shrine: what the module is, its key terms, and what is debated. */
  function openShrine(moduleId) {
    const m = MODULES[moduleId];
    if (!m) return;
    show([
      kicker(`${m.icon || ''} The shrine`),
      title(m.name),
      el('p', { class: 'jl-lede', text: m.oneLine }),
      m.definition?.length ? claims(m.definition) : null,
      m.keyTerms?.length ? el('h3', { class: 'jl-h', text: 'Key terms' }) : null,
      m.keyTerms?.length ? el('dl', { class: 'jl-terms' }, m.keyTerms.flatMap((t) => [el('dt', { text: t.term }), el('dd', { text: t.gloss })])) : null,
      m.contested?.length ? el('h3', { class: 'jl-h', text: 'What is debated or unproven' }) : null,
      m.contested?.length ? claims(m.contested) : null,
    ]);
  }

  return { openLesson, openShrine, openCustom: (nodes) => show(nodes), hide, get isOpen() { return isOpen; }, root };
}
