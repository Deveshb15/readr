import { htmlToText, parseSnippet, queryTerms, SNIPPET_CLOSE, SNIPPET_OPEN, toFtsQuery } from '../search';

describe('toFtsQuery', () => {
  it('ANDs words and prefix-matches the last one (search as you type)', () => {
    expect(toFtsQuery('reading at alti')).toBe('"reading" "at" "alti"*');
  });
  it('neutralises FTS syntax and punctuation', () => {
    expect(toFtsQuery('AND OR "NEAR"( -x*')).toBe('"and" "or" "near" "x"*');
  });
  it('folds accents and ignores empty input', () => {
    expect(toFtsQuery('Café')).toBe('"cafe"*');
    expect(toFtsQuery('   ')).toBeNull();
    expect(toFtsQuery('!!!')).toBeNull();
  });
});

describe('htmlToText', () => {
  it('drops tags, figures and scripts; decodes entities; keeps paragraph breaks', () => {
    const text = htmlToText(
      '<p>Hello &amp; welcome&nbsp;to <em>Readr</em>.</p><figure><img src="x"><figcaption>cap</figcaption></figure><script>x()</script><p>Second &#8212; para</p>',
    );
    expect(text).toBe('Hello & welcome to Readr.\nSecond — para');
  });
  it('drops citation marks and keeps table cells apart', () => {
    expect(htmlToText('<p>is called <a href="#">literacy</a><sup class="reference"><a href="#c5">[5]</a></sup>.</p>')).toBe(
      'is called literacy.',
    );
    expect(htmlToText('<table><tr><td>one</td><td>two</td></tr></table>')).toBe('one two');
  });
});

describe('parseSnippet', () => {
  it('splits marked snippets into match / non-match segments', () => {
    const s = `…the ${SNIPPET_OPEN}pilot${SNIPPET_CLOSE} said ${SNIPPET_OPEN}hello${SNIPPET_CLOSE}`;
    expect(parseSnippet(s)).toEqual([
      { text: '…the ', match: false },
      { text: 'pilot', match: true },
      { text: ' said ', match: false },
      { text: 'hello', match: true },
    ]);
  });
});

describe('queryTerms', () => {
  it('returns highlightable words (2+ chars)', () => {
    expect(queryTerms('a reading list!')).toEqual(['reading', 'list']);
  });
});
