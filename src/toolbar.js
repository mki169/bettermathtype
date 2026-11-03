const stack = (a, b, extra = '') =>
  `<span class="mi-stack ${extra}"><span>${a}</span><span>${b}</span></span>`;

const pair = (left, right, inner = 'x') =>
  `<span class="mi-pair"><span class="mi-delim">${left}</span><span class="mi-pair-body">${inner}</span><span class="mi-delim">${right}</span></span>`;

const limits = (top, bottom) =>
  `<span class="mi-limits">${top ? `<sup>${top}</sup>` : ''}${bottom ? `<sub>${bottom}</sub>` : ''}</span>`;

const bigop = (glyph, top = '', bottom = '') =>
  `<span class="mi-bigop"><span class="mi-op-glyph">${glyph}</span>${limits(top, bottom)}</span>`;

const accent = (mark, letter = 'x') =>
  `<span class="mi-accent" data-mark="${mark}">${letter}</span>`;

const matrix = (type = 'paren', size = 2) => {
  const cells = Array.from({ length: size * size }, () => '<i></i>').join('');
  const l = type === 'bar' ? '|' : type === 'bracket' ? '[' : '(';
  const r = type === 'bar' ? '|' : type === 'bracket' ? ']' : ')';
  return `<span class="mi-matrix mi-matrix-${type}"><span class="mi-matrix-bar">${l}</span><span class="mi-grid" style="--grid:${size}">${cells}</span><span class="mi-matrix-bar">${r}</span></span>`;
};

const glyph = (content, cls = '') => `<span class="mi-glyph ${cls}">${content}</span>`;

const script = (base, sup = '', sub = '') =>
  `<span class="mi-script"><span class="mi-script-base">${base}</span>${sup ? `<span class="mi-script-sup">${sup}</span>` : ''}${sub ? `<span class="mi-script-sub">${sub}</span>` : ''}</span>`;

const icon = {
  frac: stack('a', 'b'),
  fracBig: stack('A', 'B', 'mi-stack--large'),
  slashFrac: `<span class="mi-frac-slash">a<span>/</span>b</span>`,
  mixed: `<span class="mi-mixed">1${stack('a', 'b')}</span>`,
  binom: `<span class="mi-pair mi-pair--tight"><span class="mi-delim">(</span>${stack('n', 'k')}<span class="mi-delim">)</span></span>`,
  sup: script('x', '2'),
  sub: script('x', '', '1'),
  subsup: script('x', '2', '1'),
  sqrt: `<span class="mi-root"><span class="mi-radical">√</span><span class="mi-radicand">x</span></span>`,
  nthRoot: `<span class="mi-root mi-root--indexed"><span class="mi-root-index">n</span><span class="mi-radical">√</span><span class="mi-radicand">x</span></span>`,
  parens: pair('(', ')'),
  brackets: pair('[', ']'),
  braces: pair('{', '}'),
  abs: pair('|', '|'),
  norm: pair('‖', '‖'),
  angle: pair('⟨', '⟩'),
  floor: pair('⌊', '⌋'),
  ceil: pair('⌈', '⌉'),
  integral: bigop('∫', 'b', 'a'),
  iint: bigop('∬'),
  iiint: bigop('∭'),
  oint: bigop('∮'),
  sum: bigop('∑', 'n', 'k=1'),
  product: bigop('∏', 'n', 'k=1'),
  bigcup: bigop('⋃', 'n', 'k=1'),
  bigcap: bigop('⋂', 'n', 'k=1'),
  matrix2: matrix('paren', 2),
  matrix3: matrix('paren', 3),
  matrix4: matrix('paren', 4),
  vmatrix2: matrix('bar', 2),
  bmatrix2: matrix('bracket', 2),
  cases: `<span class="mi-cases"><span class="mi-cases-brace">{</span><span class="mi-cases-rows"><span></span><span></span></span></span>`,
  hat: accent('^'),
  bar: accent('¯'),
  vector: accent('→'),
  tilde: accent('~'),
  dot: accent('·'),
  ddot: accent('¨'),
  check: accent('ˇ'),
  overline: `<span class="mi-overline">x</span>`,
  underline: `<span class="mi-underline">x</span>`,
  overbrace: `<span class="mi-brace-over">x<small>⏞</small></span>`,
  underbrace: `<span class="mi-brace-under"><small>⏟</small>x</span>`,
  overarrow: `<span class="mi-overarrow">x</span>`,
  overleftarrow: `<span class="mi-overarrow mi-overarrow--left">x</span>`,
  boxed: `<span class="mi-boxed">x</span>`,
  cancel: `<span class="mi-cancel">x</span>`,
  derivative: `<span class="mi-differential"><span>d</span><span>dx</span></span>`,
  derivative2: `<span class="mi-differential"><span>d<sup>2</sup></span><span>dx<sup>2</sup></span></span>`,
  partial: `<span class="mi-differential"><span>∂</span><span>∂x</span></span>`,
  partial2: `<span class="mi-differential"><span>∂<sup>2</sup></span><span>∂x<sup>2</sup></span></span>`,
  limit: `<span class="mi-limit">lim<span class="mi-limit-sub">x→a</span></span>`,
  limitInf: `<span class="mi-limit">lim<span class="mi-limit-sub">x→∞</span></span>`,
  log: `<span class="mi-function">log<sub>b</sub>x</span>`,
  ln: `<span class="mi-function">ln x</span>`,
  exp: `<span class="mi-function">e<sup>x</sup></span>`,
  fx: `<span class="mi-function"><i>f</i>(<i>x</i>)</span>`,
  transpose: `<span class="mi-script"><span class="mi-script-base">A</span><span class="mi-script-sup">T</span></span>`,
  inverse: `<span class="mi-script"><span class="mi-script-base">A</span><span class="mi-script-sup">−1</span></span>`,
  det: `<span class="mi-function">det</span>`,
  text: `<span class="mi-text-icon">abc</span>`,
  mathbb: `<span class="mi-font mi-font--bb">ℝ</span>`,
  mathcal: `<span class="mi-font mi-font--cal">𝒜</span>`,
  mathfrak: `<span class="mi-font mi-font--frak">𝔄</span>`,
  mathsf: `<span class="mi-font mi-font--sans">A</span>`,
  mathtt: `<span class="mi-font mi-font--mono">A</span>`,
  mathbf: `<span class="mi-font mi-font--bold">A</span>`,
  mathrm: `<span class="mi-font mi-font--roman">A</span>`,
};

const item = (label, iconHtml, latex, keywords = '') => ({
  label,
  icon: iconHtml,
  latex,
  keywords,
});

export const TABS = [
  {
    id: 'home',
    label: 'Home',
    groups: [
      {
        label: 'Fractions',
        items: [
          item('Fraction', icon.frac, '\\frac{#@}{#?}', 'fraction over divide stacked'),
          item('Display fraction', icon.fracBig, '\\dfrac{#@}{#?}', 'fraction display large stacked'),
          item('Slash fraction', icon.slashFrac, '{#@}/{#?}', 'fraction slash inline'),
          item('Binomial coefficient', icon.binom, '\\binom{#@}{#?}', 'binomial choose combination'),
        ],
      },
      {
        label: 'Scripts',
        items: [
          item('Superscript', icon.sup, '#@^{#?}', 'superscript power exponent'),
          item('Subscript', icon.sub, '#@_{#?}', 'subscript index'),
          item('Subscript and superscript', icon.subsup, '#@_{#?}^{#?}', 'subscript superscript both'),
        ],
      },
      {
        label: 'Roots',
        items: [
          item('Square root', icon.sqrt, '\\sqrt{#@}', 'root square radical'),
          item('Nth root', icon.nthRoot, '\\sqrt[#?]{#@}', 'root nth radical'),
        ],
      },
      {
        label: 'Delimiters',
        items: [
          item('Parentheses', icon.parens, '\\left(#@\\right)', 'parentheses brackets round'),
          item('Square brackets', icon.brackets, '\\left[#@\\right]', 'brackets square'),
          item('Braces', icon.braces, '\\left\\{#@\\right\\}', 'braces curly'),
          item('Absolute value', icon.abs, '\\left|#@\\right|', 'absolute value bars'),
          item('Norm', icon.norm, '\\left\\|#@\\right\\|', 'norm double bars'),
          item('Angle brackets', icon.angle, '\\left\\langle#@\\right\\rangle', 'angle brackets inner product'),
        ],
      },
      {
        label: 'Calculus',
        items: [
          item('Definite integral', icon.integral, '\\int_{#?}^{#?}#@\\,\\mathrm{d}x', 'integral definite calculus'),
          item('Double integral', icon.iint, '\\iint_{#?}^{#?}#@', 'integral double area'),
          item('Summation', icon.sum, '\\sum_{#?}^{#?}#@', 'sum summation series'),
          item('Product', icon.product, '\\prod_{#?}^{#?}#@', 'product series'),
        ],
      },
      {
        label: 'Matrices',
        items: [
          item('2 × 2 matrix', icon.matrix2, '\\begin{pmatrix}#?&#?\\\\#?&#?\\end{pmatrix}', 'matrix two by two'),
          item('Determinant', icon.vmatrix2, '\\begin{vmatrix}#?&#?\\\\#?&#?\\end{vmatrix}', 'determinant matrix bars'),
          item('Cases', icon.cases, '\\begin{cases}#?&#?\\\\#?&#?\\end{cases}', 'cases piecewise system'),
        ],
      },
      {
        label: 'Accents',
        items: [
          item('Hat', icon.hat, '\\hat{#@}', 'hat circumflex accent'),
          item('Bar', icon.bar, '\\bar{#@}', 'bar overline accent'),
          item('Vector', icon.vector, '\\vec{#@}', 'vector arrow accent'),
        ],
      },
    ],
  },
  {
    id: 'algebra',
    label: 'Algebra',
    groups: [
      {
        label: 'Fractions',
        items: [
          item('Fraction', icon.frac, '\\frac{#@}{#?}', 'fraction divide rational'),
          item('Display fraction', icon.fracBig, '\\dfrac{#@}{#?}', 'fraction display rational'),
          item('Mixed number', icon.mixed, '#?\\frac{#?}{#?}', 'mixed number fraction'),
          item('Binomial coefficient', icon.binom, '\\binom{#@}{#?}', 'binomial combination choose'),
        ],
      },
      {
        label: 'Powers & roots',
        items: [
          item('Superscript', icon.sup, '#@^{#?}', 'exponent power'),
          item('Subscript', icon.sub, '#@_{#?}', 'index subscript'),
          item('Subscript and superscript', icon.subsup, '#@_{#?}^{#?}', 'both scripts power index'),
          item('Square root', icon.sqrt, '\\sqrt{#@}', 'square root radical'),
          item('Nth root', icon.nthRoot, '\\sqrt[#?]{#@}', 'nth root radical'),
        ],
      },
      {
        label: 'Functions',
        items: [
          item('Function of x', icon.fx, 'f(#@)', 'function notation'),
          item('Logarithm', icon.log, '\\log_{#?}(#@)', 'log logarithm base'),
          item('Natural logarithm', icon.ln, '\\ln(#@)', 'ln natural log'),
          item('Exponential', icon.exp, 'e^{#@}', 'exponential e power'),
        ],
      },
      {
        label: 'Grouping',
        items: [
          item('Parentheses', icon.parens, '\\left(#@\\right)', 'parentheses group'),
          item('Absolute value', icon.abs, '\\left|#@\\right|', 'absolute value modulus'),
          item('Floor', icon.floor, '\\left\\lfloor#@\\right\\rfloor', 'floor greatest integer'),
          item('Ceiling', icon.ceil, '\\left\\lceil#@\\right\\rceil', 'ceiling least integer'),
        ],
      },
      {
        label: 'Systems',
        items: [
          item('Two-row cases', icon.cases, '\\begin{cases}#?&#?\\\\#?&#?\\end{cases}', 'cases system piecewise'),
          item('Three-row cases', icon.cases, '\\begin{cases}#?&#?\\\\#?&#?\\\\#?&#?\\end{cases}', 'cases system piecewise three'),
        ],
      },
      {
        label: 'Quick formulas',
        items: [
          item('Quadratic formula', glyph('<i>x</i>='), 'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}', 'quadratic formula roots'),
          item('Distance formula', glyph('<i>d</i>'), 'd=\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}', 'distance formula points'),
          item('Slope', glyph('<i>m</i>'), 'm=\\frac{y_2-y_1}{x_2-x_1}', 'slope line formula'),
          item('Circle equation', glyph('○'), '(x-h)^2+(y-k)^2=r^2', 'circle equation radius'),
        ],
      },
    ],
  },
  {
    id: 'calculus',
    label: 'Calculus',
    groups: [
      {
        label: 'Derivatives',
        items: [
          item('Derivative', icon.derivative, '\\frac{\\mathrm{d}#@}{\\mathrm{d}x}', 'derivative differential dx'),
          item('Second derivative', icon.derivative2, '\\frac{\\mathrm{d}^2#@}{\\mathrm{d}x^2}', 'second derivative'),
          item('Partial derivative', icon.partial, '\\frac{\\partial#@}{\\partial x}', 'partial derivative'),
          item('Second partial', icon.partial2, '\\frac{\\partial^2#@}{\\partial x^2}', 'second partial derivative'),
          item('Time derivative', icon.dot, '\\dot{#@}', 'dot derivative time'),
          item('Second time derivative', icon.ddot, '\\ddot{#@}', 'double dot derivative'),
        ],
      },
      {
        label: 'Integrals',
        items: [
          item('Integral', icon.integral, '\\int#@\\,\\mathrm{d}x', 'integral antiderivative'),
          item('Definite integral', icon.integral, '\\int_{#?}^{#?}#@\\,\\mathrm{d}x', 'integral definite bounds'),
          item('Double integral', icon.iint, '\\iint_{#?}^{#?}#@', 'double integral'),
          item('Triple integral', icon.iiint, '\\iiint_{#?}^{#?}#@', 'triple integral'),
          item('Contour integral', icon.oint, '\\oint_{#?}#@', 'contour integral loop'),
        ],
      },
      {
        label: 'Limits',
        items: [
          item('Limit', icon.limit, '\\lim_{x\\to#?}#@', 'limit approaches'),
          item('Limit at infinity', icon.limitInf, '\\lim_{x\\to\\infty}#@', 'limit infinity'),
          item('One-sided limit', icon.limit, '\\lim_{x\\to#?^-}#@', 'limit one sided'),
        ],
      },
      {
        label: 'Series',
        items: [
          item('Summation', icon.sum, '\\sum_{#?}^{#?}#@', 'sum series summation'),
          item('Product', icon.product, '\\prod_{#?}^{#?}#@', 'product series'),
          item('Union', icon.bigcup, '\\bigcup_{#?}^{#?}#@', 'union sets'),
          item('Intersection', icon.bigcap, '\\bigcap_{#?}^{#?}#@', 'intersection sets'),
        ],
      },
      {
        label: 'Notation',
        items: [
          item('Arrows to', glyph('→'), '\\to#@', 'arrow to tends'),
          item('Maps to', glyph('↦'), '\\mapsto#@', 'maps to arrow'),
          item('Approaches', glyph('≃'), '\\simeq#@', 'approximately equal approaches'),
          item('Infinity', glyph('∞'), '\\infty', 'infinity'),
        ],
      },
    ],
  },
  {
    id: 'matrices',
    label: 'Matrices',
    groups: [
      {
        label: 'Matrix sizes',
        items: [
          item('2 × 2 matrix', icon.matrix2, '\\begin{pmatrix}#?&#?\\\\#?&#?\\end{pmatrix}', 'matrix 2 by 2'),
          item('3 × 3 matrix', icon.matrix3, '\\begin{pmatrix}#?&#?&#?\\\\#?&#?&#?\\\\#?&#?&#?\\end{pmatrix}', 'matrix 3 by 3'),
          item('4 × 4 matrix', icon.matrix4, '\\begin{pmatrix}#?&#?&#?&#?\\\\#?&#?&#?&#?\\\\#?&#?&#?&#?\\\\#?&#?&#?&#?\\end{pmatrix}', 'matrix 4 by 4'),
          item('Row vector', glyph('<span class="mi-vector-row">a b c</span>'), '\\begin{pmatrix}#?&#?&#?\\end{pmatrix}', 'row vector matrix'),
          item('Column vector', glyph('<span class="mi-vector-col"><span>a</span><span>b</span><span>c</span></span>'), '\\begin{pmatrix}#?\\\\#?\\\\#?\\end{pmatrix}', 'column vector matrix'),
        ],
      },
      {
        label: 'Delimiters',
        items: [
          item('Parentheses matrix', matrix('paren', 2), '\\begin{pmatrix}#?&#?\\\\#?&#?\\end{pmatrix}', 'matrix parentheses'),
          item('Bracket matrix', matrix('bracket', 2), '\\begin{bmatrix}#?&#?\\\\#?&#?\\end{bmatrix}', 'matrix brackets'),
          item('Determinant', matrix('bar', 2), '\\begin{vmatrix}#?&#?\\\\#?&#?\\end{vmatrix}', 'determinant vertical bars'),
          item('Double bracket matrix', matrix('bracket', 2), '\\begin{Bmatrix}#?&#?\\\\#?&#?\\end{Bmatrix}', 'matrix braces curly'),
          item('Plain matrix', matrix('paren', 2), '\\begin{matrix}#?&#?\\\\#?&#?\\end{matrix}', 'matrix plain no delimiters'),
        ],
      },
      {
        label: 'Operations',
        items: [
          item('Transpose', icon.transpose, '#@^{\\mathsf{T}}', 'transpose matrix'),
          item('Inverse', icon.inverse, '#@^{-1}', 'inverse matrix'),
          item('Determinant', icon.det, '\\det(#@)', 'determinant matrix'),
          item('Trace', glyph('tr'), '\\operatorname{tr}(#@)', 'trace matrix'),
          item('Rank', glyph('rank'), '\\operatorname{rank}(#@)', 'rank matrix'),
        ],
      },
      {
        label: 'Arrays',
        items: [
          item('Two-row cases', icon.cases, '\\begin{cases}#?&#?\\\\#?&#?\\end{cases}', 'cases piecewise system'),
          item('Three-row cases', icon.cases, '\\begin{cases}#?&#?\\\\#?&#?\\\\#?&#?\\end{cases}', 'cases piecewise system'),
          item('Augmented matrix', matrix('bracket', 2), '\\left[\\begin{array}{cc|c}#?&#?&#?\\\\#?&#?&#?\\end{array}\\right]', 'augmented matrix array vertical'),
        ],
      },
    ],
  },
  {
    id: 'symbols',
    label: 'Symbols',
    groups: [
      {
        label: 'Operators',
        items: [
          item('Plus or minus', glyph('±'), '\\pm', 'plus minus'),
          item('Minus or plus', glyph('∓'), '\\mp', 'minus plus'),
          item('Times', glyph('×'), '\\times', 'times multiply cross'),
          item('Divide', glyph('÷'), '\\div', 'divide obelus'),
          item('Dot product', glyph('·'), '\\cdot', 'dot product multiply'),
          item('Asterisk', glyph('∗'), '\\ast', 'asterisk star'),
          item('Composition', glyph('∘'), '\\circ', 'composition circle'),
          item('Tensor product', glyph('⊗'), '\\otimes', 'tensor otimes'),
          item('Direct sum', glyph('⊕'), '\\oplus', 'direct sum oplus'),
          item('Infinity', glyph('∞'), '\\infty', 'infinity'),
          item('Partial', glyph('∂'), '\\partial', 'partial derivative'),
          item('Nabla', glyph('∇'), '\\nabla', 'nabla gradient'),
        ],
      },
      {
        label: 'Relations',
        items: [
          item('Not equal', glyph('≠'), '\\neq', 'not equal different'),
          item('Approximately equal', glyph('≈'), '\\approx', 'approximately equal'),
          item('Equivalent', glyph('≡'), '\\equiv', 'equivalent congruent identity'),
          item('Congruent', glyph('≅'), '\\cong', 'congruent'),
          item('Similar', glyph('∼'), '\\sim', 'similar tilde'),
          item('Proportional', glyph('∝'), '\\propto', 'proportional'),
          item('Less than or equal', glyph('≤'), '\\leq', 'less equal'),
          item('Greater than or equal', glyph('≥'), '\\geq', 'greater equal'),
          item('Much less than', glyph('≪'), '\\ll', 'much less'),
          item('Much greater than', glyph('≫'), '\\gg', 'much greater'),
          item('Not equal variant', glyph('≢'), '\\not\\equiv', 'not equivalent'),
          item('Defined as', glyph('≔'), '\\coloneqq', 'defined as colon equals'),
        ],
      },
      {
        label: 'Sets',
        items: [
          item('Element of', glyph('∈'), '\\in', 'element in belongs'),
          item('Not an element', glyph('∉'), '\\notin', 'element not in'),
          item('Subset', glyph('⊂'), '\\subset', 'subset'),
          item('Superset', glyph('⊃'), '\\supset', 'superset'),
          item('Subset or equal', glyph('⊆'), '\\subseteq', 'subset equal'),
          item('Superset or equal', glyph('⊇'), '\\supseteq', 'superset equal'),
          item('Union', glyph('∪'), '\\cup', 'union'),
          item('Intersection', glyph('∩'), '\\cap', 'intersection'),
          item('Empty set', glyph('∅'), '\\varnothing', 'empty set null'),
          item('Set minus', glyph('∖'), '\\setminus', 'set difference minus'),
          item('Natural numbers', glyph('ℕ'), '\\mathbb{N}', 'natural numbers set'),
          item('Real numbers', glyph('ℝ'), '\\mathbb{R}', 'real numbers set'),
        ],
      },
      {
        label: 'Logic',
        items: [
          item('For all', glyph('∀'), '\\forall', 'for all universal'),
          item('There exists', glyph('∃'), '\\exists', 'exists existential'),
          item('Not', glyph('¬'), '\\neg', 'not negation'),
          item('And', glyph('∧'), '\\land', 'and logical conjunction'),
          item('Or', glyph('∨'), '\\lor', 'or logical disjunction'),
          item('Therefore', glyph('∴'), '\\therefore', 'therefore'),
          item('Because', glyph('∵'), '\\because', 'because'),
          item('Implies', glyph('⟹'), '\\implies', 'implies logical'),
          item('If and only if', glyph('⟺'), '\\iff', 'if and only if'),
        ],
      },
      {
        label: 'Arrows',
        items: [
          item('Right arrow', glyph('→'), '\\rightarrow', 'arrow right'),
          item('Left arrow', glyph('←'), '\\leftarrow', 'arrow left'),
          item('Left-right arrow', glyph('↔'), '\\leftrightarrow', 'arrow both'),
          item('Implies arrow', glyph('⇒'), '\\Rightarrow', 'arrow implies right'),
          item('If arrow', glyph('⇐'), '\\Leftarrow', 'arrow left implies'),
          item('If and only if arrow', glyph('⇔'), '\\Leftrightarrow', 'arrow both implies'),
          item('Up arrow', glyph('↑'), '\\uparrow', 'arrow up'),
          item('Down arrow', glyph('↓'), '\\downarrow', 'arrow down'),
          item('Maps to', glyph('↦'), '\\mapsto', 'arrow maps to'),
          item('Long right arrow', glyph('⟶'), '\\longrightarrow', 'arrow long right'),
        ],
      },
      {
        label: 'Miscellaneous',
        items: [
          item('Ellipsis', glyph('…'), '\\ldots', 'ellipsis dots'),
          item('Centered ellipsis', glyph('⋯'), '\\cdots', 'ellipsis dots centered'),
          item('Vertical ellipsis', glyph('⋮'), '\\vdots', 'ellipsis vertical'),
          item('Diagonal ellipsis', glyph('⋱'), '\\ddots', 'ellipsis diagonal'),
          item('Aleph', glyph('ℵ'), '\\aleph', 'aleph infinity cardinal'),
          item('Planck constant', glyph('ℏ'), '\\hbar', 'hbar planck'),
          item('Ell', glyph('ℓ'), '\\ell', 'ell script l'),
          item('Weierstrass p', glyph('℘'), '\\wp', 'weierstrass p'),
        ],
      },
    ],
  },
  {
    id: 'greek',
    label: 'Greek',
    groups: [
      {
        label: 'Lowercase',
        items: [
          ['Alpha', 'α', '\\alpha'], ['Beta', 'β', '\\beta'], ['Gamma', 'γ', '\\gamma'],
          ['Delta', 'δ', '\\delta'], ['Epsilon', 'ε', '\\epsilon'], ['Zeta', 'ζ', '\\zeta'],
          ['Eta', 'η', '\\eta'], ['Theta', 'θ', '\\theta'], ['Iota', 'ι', '\\iota'],
          ['Kappa', 'κ', '\\kappa'], ['Lambda', 'λ', '\\lambda'], ['Mu', 'μ', '\\mu'],
          ['Nu', 'ν', '\\nu'], ['Xi', 'ξ', '\\xi'], ['Omicron', 'ο', 'o'],
          ['Pi', 'π', '\\pi'], ['Rho', 'ρ', '\\rho'], ['Sigma', 'σ', '\\sigma'],
          ['Tau', 'τ', '\\tau'], ['Upsilon', 'υ', '\\upsilon'], ['Phi', 'φ', '\\phi'],
          ['Chi', 'χ', '\\chi'], ['Psi', 'ψ', '\\psi'], ['Omega', 'ω', '\\omega'],
        ].map(([label, char, latex]) => item(label, glyph(char, 'mi-greek'), latex, `greek ${label.toLowerCase()}`)),
      },
      {
        label: 'Variants',
        items: [
          item('Epsilon variant', glyph('ϵ', 'mi-greek'), '\\varepsilon', 'greek epsilon variant'),
          item('Theta variant', glyph('ϑ', 'mi-greek'), '\\vartheta', 'greek theta variant'),
          item('Phi variant', glyph('ϕ', 'mi-greek'), '\\varphi', 'greek phi variant'),
          item('Pi variant', glyph('ϖ', 'mi-greek'), '\\varpi', 'greek pi variant'),
          item('Final sigma', glyph('ς', 'mi-greek'), '\\varsigma', 'greek sigma final'),
        ],
      },
      {
        label: 'Uppercase',
        items: [
          ['Gamma', 'Γ', '\\Gamma'], ['Delta', 'Δ', '\\Delta'], ['Theta', 'Θ', '\\Theta'],
          ['Lambda', 'Λ', '\\Lambda'], ['Xi', 'Ξ', '\\Xi'], ['Pi', 'Π', '\\Pi'],
          ['Sigma', 'Σ', '\\Sigma'], ['Upsilon', 'Υ', '\\Upsilon'], ['Phi', 'Φ', '\\Phi'],
          ['Psi', 'Ψ', '\\Psi'], ['Omega', 'Ω', '\\Omega'],
        ].map(([label, char, latex]) => item(label, glyph(char, 'mi-greek-upper'), latex, `greek capital ${label.toLowerCase()}`)),
      },
    ],
  },
  {
    id: 'accents',
    label: 'Accents',
    groups: [
      {
        label: 'Accents',
        items: [
          item('Hat', icon.hat, '\\hat{#@}', 'hat circumflex accent'),
          item('Bar', icon.bar, '\\bar{#@}', 'bar macron accent'),
          item('Vector', icon.vector, '\\vec{#@}', 'vector arrow accent'),
          item('Tilde', icon.tilde, '\\tilde{#@}', 'tilde accent'),
          item('Dot', icon.dot, '\\dot{#@}', 'dot accent derivative'),
          item('Double dot', icon.ddot, '\\ddot{#@}', 'double dot accent'),
          item('Check', icon.check, '\\check{#@}', 'check caron accent'),
        ],
      },
      {
        label: 'Over & under',
        items: [
          item('Overline', icon.overline, '\\overline{#@}', 'overline bar'),
          item('Underline', icon.underline, '\\underline{#@}', 'underline'),
          item('Overbrace', icon.overbrace, '\\overbrace{#@}^{#?}', 'overbrace'),
          item('Underbrace', icon.underbrace, '\\underbrace{#@}_{#?}', 'underbrace'),
          item('Over right arrow', icon.overarrow, '\\overrightarrow{#@}', 'overrightarrow'),
          item('Over left arrow', icon.overleftarrow, '\\overleftarrow{#@}', 'overleftarrow'),
        ],
      },
      {
        label: 'Decoration',
        items: [
          item('Boxed', icon.boxed, '\\boxed{#@}', 'box frame'),
          item('Cancel', icon.cancel, '\\cancel{#@}', 'cancel strike'),
          item('Back cancel', icon.cancel, '\\bcancel{#@}', 'cancel backslash'),
          item('Cross cancel', icon.cancel, '\\xcancel{#@}', 'cancel cross'),
          item('Text', icon.text, '\\text{#@}', 'text words label'),
        ],
      },
      {
        label: 'Letter styles',
        items: [
          item('Blackboard bold', icon.mathbb, '\\mathbb{#@}', 'blackboard bold double struck'),
          item('Calligraphic', icon.mathcal, '\\mathcal{#@}', 'calligraphic script'),
          item('Fraktur', icon.mathfrak, '\\mathfrak{#@}', 'fraktur gothic'),
          item('Sans serif', icon.mathsf, '\\mathsf{#@}', 'sans serif'),
          item('Monospace', icon.mathtt, '\\mathtt{#@}', 'monospace typewriter'),
          item('Bold', icon.mathbf, '\\mathbf{#@}', 'bold'),
          item('Upright', icon.mathrm, '\\mathrm{#@}', 'upright roman'),
        ],
      },
    ],
  },
];

export const EXAMPLES = [
  {
    name: 'Quadratic formula',
    latex: 'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}',
  },
  {
    name: 'Gaussian integral',
    latex: '\\int_{-\\infty}^{\\infty} e^{-x^2}\\,\\mathrm{d}x=\\sqrt{\\pi}',
  },
  {
    name: 'Normal distribution',
    latex: 'f(x)=\\frac{1}{\\sigma\\sqrt{2\\pi}}\\,e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}',
  },
  {
    name: 'Euler’s identity',
    latex: 'e^{i\\pi}+1=0',
  },
  {
    name: 'Matrix determinant',
    latex: '\\det\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}=ad-bc',
  },
  {
    name: 'Pythagorean theorem',
    latex: 'a^2+b^2=c^2',
  },
];
