import { q, qa, reveal, revealLines } from '../utils.js';

export default function init() {
  const section = q('#facilities');
  if (!section) return;
  revealLines(q('#facilities-h'));
  reveal([q('.facilities__all')], { trigger: q('.facilities__head'), start: 'top 80%' });
  reveal(qa('.fac', section), { trigger: q('#facilities-cards'), start: 'top 80%', stagger: 0.1 });
  reveal([q('#facilities-quote')], { start: 'top 85%' });
}
