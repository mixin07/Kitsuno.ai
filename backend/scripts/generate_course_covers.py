"""
Generate high-fidelity, editorial SVG course covers for the 9 canonical Kitsuno.ai courses.
Adheres strictly to the Kitsuno design system:
- Editorial Tech Book Cover aesthetic (Instrument Serif + Plus Jakarta Sans + JetBrains Mono)
- 16:9 aspect ratio (960 x 540 viewBox)
- Kitsuno brand palette: Warm Cream (#FFF9F2), Kitsuno Orange (#F16524), Light Orange (#FF8A4C),
  Soft Peach (#F8D9C2), Deep Orange/Brown (#8F3215), Warm Charcoal Text (#241A16), Warm Neutrals.
- Bespoke abstract technical diagrams per course (no generic stock photos).
"""

import os
from pathlib import Path

OUTPUT_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "public" / "covers"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

SHARED_SVG_HEADER = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" width="100%" height="100%">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&amp;family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;family=JetBrains+Mono:wght@400;500;600&amp;display=swap');
      .font-serif { font-family: 'Instrument Serif', Georgia, 'Times New Roman', serif; }
      .font-sans { font-family: 'Plus Jakarta Sans', Inter, system-ui, -apple-system, sans-serif; }
      .font-mono { font-family: 'JetBrains Mono', 'Fira Code', Menlo, monospace; }
    </style>
    <pattern id="dot-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="0.75" fill="#241A16" fill-opacity="0.05" />
    </pattern>
    <pattern id="fine-grid" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#241A16" stroke-width="0.5" stroke-opacity="0.04" />
    </pattern>
    <linearGradient id="warm-shading" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F8D9C2" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#F16524" stop-opacity="0.04" />
    </linearGradient>
  </defs>
"""

# =========================================================================
# 1. HTML COVER
# =========================================================================
HTML_SVG = SHARED_SVG_HEADER + """
  <!-- Background -->
  <rect width="960" height="540" fill="#FFF9F2" />
  <rect width="960" height="540" fill="url(#fine-grid)" />

  <!-- Outer Editorial Frame -->
  <rect x="24" y="24" width="912" height="492" rx="6" fill="none" stroke="#EFE5D9" stroke-width="1.5" />
  
  <!-- Corner Registration Marks -->
  <path d="M 18 24 L 30 24 M 24 18 L 24 30" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 930 24 L 942 24 M 936 18 L 936 30" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 18 516 L 30 516 M 24 510 L 24 522" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 930 516 L 942 516 M 936 510 L 936 522" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />

  <!-- Top Header Bar -->
  <g transform="translate(48, 52)">
    <!-- Kitsuno Mark -->
    <path d="M 0 0 L 8 -10 L 16 0 L 12 10 L 4 10 Z" fill="#F16524" />
    <path d="M 5 0 L 8 -6 L 11 0 L 8 6 Z" fill="#FFF9F2" />
    <text x="24" y="6" class="font-sans" font-size="12" font-weight="800" letter-spacing="3" fill="#241A16">KITSUNO.AI</text>
    <text x="145" y="6" class="font-sans" font-size="10" font-weight="600" letter-spacing="2" fill="#8F3215">·</text>
    <text x="160" y="6" class="font-sans" font-size="10" font-weight="700" letter-spacing="2" fill="#8F3215">SPECIFICATION</text>

    <!-- Right Header Badge -->
    <text x="864" y="6" text-anchor="end" class="font-mono" font-size="11" font-weight="600" letter-spacing="1.5" fill="#A89887">VOL. 01 / HTML5</text>
    <line x1="0" y1="20" x2="864" y2="20" stroke="#EFE5D9" stroke-width="1" />
  </g>

  <!-- Left: Editorial Content -->
  <g transform="translate(48, 120)">
    <!-- Eyebrow -->
    <rect x="0" y="0" width="6" height="6" fill="#F16524" />
    <text x="16" y="7" class="font-sans" font-size="11" font-weight="700" letter-spacing="2.5" fill="#F16524">SEMANTIC WEB · FOUNDATIONS</text>
    
    <!-- Title -->
    <text x="0" y="66" class="font-serif" font-size="56" fill="#241A16" letter-spacing="-0.5">HTML</text>
    <text x="0" y="104" class="font-serif" font-size="28" font-style="italic" fill="#8F3215">Document Semantics &amp; Structure</text>
    
    <!-- Description -->
    <text x="0" y="146" class="font-sans" font-size="13" font-weight="400" fill="#6B5950" line-height="1.5">
      The standard markup language of the World Wide Web.
    </text>
    <text x="0" y="168" class="font-sans" font-size="13" font-weight="400" fill="#6B5950">
      DOM tree architecture, accessibility, and modern semantic elements.
    </text>

    <!-- Tags & Code Tokens -->
    <g transform="translate(0, 210)">
      <rect x="0" y="0" width="82" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="41" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">&lt;header&gt;</text>

      <rect x="92" y="0" width="76" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="130" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">&lt;main&gt;</text>

      <rect x="178" y="0" width="86" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="221" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">&lt;article&gt;</text>

      <rect x="274" y="0" width="82" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="315" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">&lt;footer&gt;</text>
    </g>

    <!-- Editorial Dimension Line -->
    <line x1="0" y1="265" x2="360" y2="265" stroke="#EFE5D9" stroke-width="1" />
    <text x="0" y="285" class="font-mono" font-size="10" fill="#A89887">SPEC: W3C / WHATWG DOM LIVING STANDARD</text>
  </g>

  <!-- Right: Abstract Technical Document Tree Visual -->
  <g transform="translate(500, 110)">
    <!-- Giant Angle Bracket Watermark -->
    <text x="270" y="220" text-anchor="middle" class="font-mono" font-size="280" font-weight="300" fill="#F8D9C2" fill-opacity="0.25">&lt;/&gt;</text>

    <!-- Structural Document Frame -->
    <rect x="40" y="20" width="360" height="270" rx="8" fill="#FFFDF9" stroke="#E3D8CB" stroke-width="1.5" />
    
    <!-- Document Title Bar -->
    <rect x="40" y="20" width="360" height="32" rx="8" fill="#FBF3EA" />
    <circle cx="62" cy="36" r="3.5" fill="#F16524" />
    <circle cx="76" cy="36" r="3.5" fill="#E3D8CB" />
    <circle cx="90" cy="36" r="3.5" fill="#E3D8CB" />
    <text x="110" y="40" class="font-mono" font-size="10" fill="#8F3215">&lt;!DOCTYPE html&gt;</text>

    <!-- Semantic Tree Blocks -->
    <!-- Header Block -->
    <rect x="65" y="68" width="310" height="36" rx="4" fill="#F8D9C2" fill-opacity="0.5" stroke="#F16524" stroke-width="1" />
    <text x="80" y="90" class="font-mono" font-size="11" font-weight="600" fill="#8F3215">&lt;header role="banner"&gt;</text>
    <rect x="290" y="78" width="65" height="16" rx="3" fill="#FFF9F2" />
    <text x="322" y="90" text-anchor="middle" class="font-mono" font-size="9" fill="#F16524">&lt;nav&gt;</text>

    <!-- Main Content Area with Split -->
    <rect x="65" y="116" width="205" height="96" rx="4" fill="#FFF" stroke="#E3D8CB" stroke-width="1" />
    <text x="80" y="136" class="font-mono" font-size="10" font-weight="600" fill="#241A16">&lt;main role="main"&gt;</text>
    
    <!-- Nested Section Cards -->
    <rect x="80" y="148" width="175" height="26" rx="3" fill="#FBF3EA" stroke="#E8DDD0" />
    <text x="92" y="165" class="font-mono" font-size="9" fill="#8F3215">&lt;article&gt; h1, p &lt;/article&gt;</text>
    
    <rect x="80" y="180" width="175" height="22" rx="3" fill="#FBF3EA" stroke="#E8DDD0" />
    <text x="92" y="195" class="font-mono" font-size="9" fill="#8F3215">&lt;section&gt; form, input &lt;/section&gt;</text>

    <!-- Aside Sidebar -->
    <rect x="282" y="116" width="93" height="96" rx="4" fill="#FBF3EA" stroke="#E3D8CB" stroke-width="1" />
    <text x="294" y="136" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">&lt;aside&gt;</text>
    <line x1="294" y1="152" x2="360" y2="152" stroke="#E3D8CB" stroke-width="1" />
    <line x1="294" y1="166" x2="345" y2="166" stroke="#E3D8CB" stroke-width="1" />
    <line x1="294" y1="180" x2="355" y2="180" stroke="#E3D8CB" stroke-width="1" />

    <!-- Footer Block -->
    <rect x="65" y="224" width="310" height="32" rx="4" fill="#F8D9C2" fill-opacity="0.3" stroke="#E3D8CB" stroke-width="1" />
    <text x="80" y="244" class="font-mono" font-size="10" fill="#8F3215">&lt;footer role="contentinfo"&gt;</text>

    <!-- Architectural Connecting Orthogonal Lines -->
    <path d="M 50 86 L 30 86 L 30 240 L 50 240" fill="none" stroke="#F16524" stroke-width="1.2" stroke-dasharray="3 3" />
    <circle cx="30" cy="164" r="3" fill="#F16524" />
    <text x="20" y="168" text-anchor="end" class="font-mono" font-size="9" fill="#F16524">DOM</text>
  </g>

  <!-- Bottom Metadata Bar -->
  <g transform="translate(48, 480)">
    <line x1="0" y1="0" x2="864" y2="0" stroke="#EFE5D9" stroke-width="1" />
    <text x="0" y="18" class="font-sans" font-size="10" font-weight="700" letter-spacing="1.5" fill="#241A16">CATEGORY: FRONTEND FOUNDATION</text>
    <text x="280" y="18" class="font-sans" font-size="10" font-weight="600" letter-spacing="1.5" fill="#8F3215">LEVEL: BEGINNER</text>
    <text x="500" y="18" class="font-mono" font-size="10" fill="#A89887">MODULES: 03 · LESSONS: 36</text>
    
    <!-- Minimalist ISBN / Barcode Lines -->
    <g transform="translate(770, 6)">
      <line x1="0" y1="0" x2="0" y2="14" stroke="#241A16" stroke-width="2" />
      <line x1="5" y1="0" x2="5" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="10" y1="0" x2="10" y2="14" stroke="#241A16" stroke-width="3" />
      <line x1="16" y1="0" x2="16" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="22" y1="0" x2="22" y2="14" stroke="#241A16" stroke-width="2" />
      <line x1="28" y1="0" x2="28" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="34" y1="0" x2="34" y2="14" stroke="#241A16" stroke-width="2.5" />
      <line x1="42" y1="0" x2="42" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="48" y1="0" x2="48" y2="14" stroke="#241A16" stroke-width="2" />
      <text x="56" y="12" class="font-mono" font-size="9" fill="#A89887">KTS-01</text>
    </g>
  </g>
</svg>
"""

# =========================================================================
# 2. CSS COVER
# =========================================================================
CSS_SVG = SHARED_SVG_HEADER + """
  <!-- Background -->
  <rect width="960" height="540" fill="#FAF5EE" />
  <rect width="960" height="540" fill="url(#fine-grid)" />

  <!-- Outer Editorial Frame -->
  <rect x="24" y="24" width="912" height="492" rx="6" fill="none" stroke="#EADBCE" stroke-width="1.5" />
  
  <!-- Corner Registration Marks -->
  <path d="M 18 24 L 30 24 M 24 18 L 24 30" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 930 24 L 942 24 M 936 18 L 936 30" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 18 516 L 30 516 M 24 510 L 24 522" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 930 516 L 942 516 M 936 510 L 936 522" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />

  <!-- Top Header Bar -->
  <g transform="translate(48, 52)">
    <path d="M 0 0 L 8 -10 L 16 0 L 12 10 L 4 10 Z" fill="#F16524" />
    <path d="M 5 0 L 8 -6 L 11 0 L 8 6 Z" fill="#FAF5EE" />
    <text x="24" y="6" class="font-sans" font-size="12" font-weight="800" letter-spacing="3" fill="#241A16">KITSUNO.AI</text>
    <text x="145" y="6" class="font-sans" font-size="10" font-weight="600" letter-spacing="2" fill="#8F3215">·</text>
    <text x="160" y="6" class="font-sans" font-size="10" font-weight="700" letter-spacing="2" fill="#8F3215">SPECIFICATION</text>
    <text x="864" y="6" text-anchor="end" class="font-mono" font-size="11" font-weight="600" letter-spacing="1.5" fill="#A89887">VOL. 02 / CSS3</text>
    <line x1="0" y1="20" x2="864" y2="20" stroke="#EADBCE" stroke-width="1" />
  </g>

  <!-- Left: Editorial Content -->
  <g transform="translate(48, 120)">
    <rect x="0" y="0" width="6" height="6" fill="#F16524" />
    <text x="16" y="7" class="font-sans" font-size="11" font-weight="700" letter-spacing="2.5" fill="#F16524">LAYOUT SYSTEMS · STYLING</text>
    
    <text x="0" y="66" class="font-serif" font-size="56" fill="#241A16" letter-spacing="-0.5">CSS</text>
    <text x="0" y="104" class="font-serif" font-size="28" font-style="italic" fill="#8F3215">Box Model, Grid &amp; Modern Flexbox</text>
    
    <text x="0" y="146" class="font-sans" font-size="13" font-weight="400" fill="#6B5950">
      Cascading stylesheets and responsive graphic composition.
    </text>
    <text x="0" y="168" class="font-sans" font-size="13" font-weight="400" fill="#6B5950">
      Dimensional layout calculation, Flexbox axes, and 2D grid tracks.
    </text>

    <!-- CSS Selectors & Tokens -->
    <g transform="translate(0, 210)">
      <rect x="0" y="0" width="84" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="42" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">display: grid</text>

      <rect x="94" y="0" width="86" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="137" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">flex: 1 1 auto</text>

      <rect x="190" y="0" width="76" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="228" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">gap: 24px</text>

      <rect x="276" y="0" width="80" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="316" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">@media</text>
    </g>

    <line x1="0" y1="265" x2="360" y2="265" stroke="#EADBCE" stroke-width="1" />
    <text x="0" y="285" class="font-mono" font-size="10" fill="#A89887">LAYOUT: CSS GRID LEVEL 2 &amp; FLEXBOX MODULE</text>
  </g>

  <!-- Right: Abstract Technical Box Model & Grid Visualization -->
  <g transform="translate(500, 110)">
    <!-- Layered Box Model Diagram -->
    <!-- 1. Margin Outer Box (Dashed) -->
    <rect x="40" y="20" width="370" height="270" rx="8" fill="#FFF" fill-opacity="0.6" stroke="#8F3215" stroke-width="1.2" stroke-dasharray="4 4" stroke-opacity="0.5" />
    <text x="56" y="42" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">MARGIN · 24px</text>

    <!-- 2. Border Box -->
    <rect x="75" y="55" width="300" height="200" rx="6" fill="#FCEEE3" fill-opacity="0.6" stroke="#F16524" stroke-width="1.8" />
    <text x="90" y="75" class="font-mono" font-size="10" font-weight="700" fill="#F16524">BORDER · 2px solid</text>

    <!-- 3. Padding Box -->
    <rect x="110" y="90" width="230" height="130" rx="4" fill="#F8D9C2" fill-opacity="0.5" stroke="#EADBCE" stroke-width="1" stroke-dasharray="2 2" />
    <text x="125" y="110" class="font-mono" font-size="9" font-weight="600" fill="#8F3215">PADDING · 16px</text>

    <!-- 4. Content Core Box with Grid Divisions -->
    <rect x="145" y="125" width="160" height="60" rx="3" fill="#FFF9F2" stroke="#F16524" stroke-width="1.2" />
    
    <!-- Grid Tracks inside content -->
    <line x1="198" y1="125" x2="198" y2="185" stroke="#EADBCE" stroke-width="1" stroke-dasharray="2 2" />
    <line x1="252" y1="125" x2="252" y2="185" stroke="#EADBCE" stroke-width="1" stroke-dasharray="2 2" />
    <text x="225" y="152" text-anchor="middle" class="font-mono" font-size="10" font-weight="700" fill="#241A16">CONTENT</text>
    <text x="225" y="168" text-anchor="middle" class="font-mono" font-size="8" fill="#8F3215">1fr · 2fr · 1fr</text>

    <!-- Dimension Callout Arrows -->
    <path d="M 40 155 L 75 155" stroke="#8F3215" stroke-width="1" marker-end="url(#arrow)" />
    <path d="M 375 155 L 410 155" stroke="#8F3215" stroke-width="1" />
    <line x1="225" y1="20" x2="225" y2="55" stroke="#8F3215" stroke-width="1" />
    <line x1="225" y1="255" x2="225" y2="290" stroke="#8F3215" stroke-width="1" />

    <!-- Corner CSS Curly Braces Accent -->
    <text x="390" y="100" class="font-serif" font-size="64" fill="#F16524" fill-opacity="0.3">{</text>
    <text x="390" y="240" class="font-serif" font-size="64" fill="#F16524" fill-opacity="0.3">}</text>
  </g>

  <!-- Bottom Metadata Bar -->
  <g transform="translate(48, 480)">
    <line x1="0" y1="0" x2="864" y2="0" stroke="#EADBCE" stroke-width="1" />
    <text x="0" y="18" class="font-sans" font-size="10" font-weight="700" letter-spacing="1.5" fill="#241A16">CATEGORY: STYLING &amp; LAYOUTS</text>
    <text x="280" y="18" class="font-sans" font-size="10" font-weight="600" letter-spacing="1.5" fill="#8F3215">LEVEL: BEGINNER</text>
    <text x="500" y="18" class="font-mono" font-size="10" fill="#A89887">MODULES: 03 · LESSONS: 43</text>
    
    <g transform="translate(770, 6)">
      <line x1="0" y1="0" x2="0" y2="14" stroke="#241A16" stroke-width="2" />
      <line x1="6" y1="0" x2="6" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="12" y1="0" x2="12" y2="14" stroke="#241A16" stroke-width="3" />
      <line x1="18" y1="0" x2="18" y2="14" stroke="#241A16" stroke-width="1.5" />
      <line x1="24" y1="0" x2="24" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="30" y1="0" x2="30" y2="14" stroke="#241A16" stroke-width="2.5" />
      <line x1="38" y1="0" x2="38" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="44" y1="0" x2="44" y2="14" stroke="#241A16" stroke-width="2" />
      <text x="54" y="12" class="font-mono" font-size="9" fill="#A89887">KTS-02</text>
    </g>
  </g>
</svg>
"""

# =========================================================================
# 3. JAVASCRIPT COVER
# =========================================================================
JAVASCRIPT_SVG = SHARED_SVG_HEADER + """
  <!-- Background -->
  <rect width="960" height="540" fill="#FFF9F1" />
  <rect width="960" height="540" fill="url(#fine-grid)" />

  <!-- Outer Editorial Frame -->
  <rect x="24" y="24" width="912" height="492" rx="6" fill="none" stroke="#EFE2D2" stroke-width="1.5" />
  
  <!-- Corner Registration Marks -->
  <path d="M 18 24 L 30 24 M 24 18 L 24 30" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 930 24 L 942 24 M 936 18 L 936 30" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 18 516 L 30 516 M 24 510 L 24 522" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 930 516 L 942 516 M 936 510 L 936 522" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />

  <!-- Top Header Bar -->
  <g transform="translate(48, 52)">
    <path d="M 0 0 L 8 -10 L 16 0 L 12 10 L 4 10 Z" fill="#F16524" />
    <path d="M 5 0 L 8 -6 L 11 0 L 8 6 Z" fill="#FFF9F1" />
    <text x="24" y="6" class="font-sans" font-size="12" font-weight="800" letter-spacing="3" fill="#241A16">KITSUNO.AI</text>
    <text x="145" y="6" class="font-sans" font-size="10" font-weight="600" letter-spacing="2" fill="#8F3215">·</text>
    <text x="160" y="6" class="font-sans" font-size="10" font-weight="700" letter-spacing="2" fill="#8F3215">SPECIFICATION</text>
    <text x="864" y="6" text-anchor="end" class="font-mono" font-size="11" font-weight="600" letter-spacing="1.5" fill="#A89887">VOL. 03 / ECMASCRIPT</text>
    <line x1="0" y1="20" x2="864" y2="20" stroke="#EFE2D2" stroke-width="1" />
  </g>

  <!-- Left: Editorial Content -->
  <g transform="translate(48, 120)">
    <rect x="0" y="0" width="6" height="6" fill="#F16524" />
    <text x="16" y="7" class="font-sans" font-size="11" font-weight="700" letter-spacing="2.5" fill="#F16524">LOGIC &amp; INTERACTIVITY · RUNTIME</text>
    
    <text x="0" y="66" class="font-serif" font-size="56" fill="#241A16" letter-spacing="-0.5">JavaScript</text>
    <text x="0" y="104" class="font-serif" font-size="28" font-style="italic" fill="#8F3215">ECMAScript, Event Loops &amp; Async Flow</text>
    
    <text x="0" y="146" class="font-sans" font-size="13" font-weight="400" fill="#6B5950">
      Dynamic single-threaded non-blocking runtime architecture.
    </text>
    <text x="0" y="168" class="font-sans" font-size="13" font-weight="400" fill="#6B5950">
      Closures, prototype chains, microtask queues, and promises.
    </text>

    <!-- JS Tokens -->
    <g transform="translate(0, 210)">
      <rect x="0" y="0" width="86" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="43" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">async / await</text>

      <rect x="96" y="0" width="76" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="134" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">() =&gt; { }</text>

      <rect x="182" y="0" width="80" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="222" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">Promise.all</text>

      <rect x="272" y="0" width="74" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="309" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">EventLoop</text>
    </g>

    <line x1="0" y1="265" x2="360" y2="265" stroke="#EFE2D2" stroke-width="1" />
    <text x="0" y="285" class="font-mono" font-size="10" fill="#A89887">ENGINE: V8 JIT / CALL STACK &amp; WEB API QUEUE</text>
  </g>

  <!-- Right: Abstract Technical Event Loop & Stack Diagram -->
  <g transform="translate(500, 110)">
    <!-- Event Loop Circular Flow -->
    <circle cx="225" cy="155" r="115" fill="none" stroke="#EFE2D2" stroke-width="1.5" stroke-dasharray="4 4" />
    <circle cx="225" cy="155" r="115" fill="none" stroke="#F16524" stroke-width="2" stroke-dasharray="80 160" />
    
    <!-- Central Loop Hub -->
    <circle cx="225" cy="155" r="38" fill="#FFF9F1" stroke="#F16524" stroke-width="1.5" />
    <text x="225" y="152" text-anchor="middle" class="font-mono" font-size="9" font-weight="700" fill="#F16524">EVENT</text>
    <text x="225" y="164" text-anchor="middle" class="font-mono" font-size="9" font-weight="700" fill="#F16524">LOOP</text>

    <!-- Call Stack Card (Top Left) -->
    <rect x="40" y="30" width="130" height="90" rx="6" fill="#FFF" stroke="#E3D8CB" stroke-width="1.2" />
    <rect x="40" y="30" width="130" height="22" rx="6" fill="#FBF3EA" />
    <text x="50" y="45" class="font-mono" font-size="9" font-weight="700" fill="#8F3215">CALL STACK</text>
    <rect x="48" y="58" width="114" height="16" rx="3" fill="#F8D9C2" fill-opacity="0.5" stroke="#F16524" stroke-width="0.8" />
    <text x="105" y="70" text-anchor="middle" class="font-mono" font-size="8" fill="#8F3215">main()</text>
    <rect x="48" y="78" width="114" height="16" rx="3" fill="#F8D9C2" fill-opacity="0.3" />
    <text x="105" y="90" text-anchor="middle" class="font-mono" font-size="8" fill="#8F3215">computeAsync()</text>
    <rect x="48" y="98" width="114" height="14" rx="2" fill="#FAF5EE" />

    <!-- Web APIs Card (Top Right) -->
    <rect x="280" y="30" width="130" height="90" rx="6" fill="#FFF" stroke="#E3D8CB" stroke-width="1.2" />
    <rect x="280" y="30" width="130" height="22" rx="6" fill="#FBF3EA" />
    <text x="290" y="45" class="font-mono" font-size="9" font-weight="700" fill="#8F3215">WEB APIs</text>
    <text x="290" y="68" class="font-mono" font-size="8" fill="#6B5950">setTimeout()</text>
    <text x="290" y="84" class="font-mono" font-size="8" fill="#6B5950">fetch(endpoint)</text>
    <text x="290" y="100" class="font-mono" font-size="8" fill="#6B5950">DOM Events</text>

    <!-- Callback Queue (Bottom Left) -->
    <rect x="40" y="195" width="140" height="75" rx="6" fill="#FFF" stroke="#E3D8CB" stroke-width="1.2" />
    <rect x="40" y="195" width="140" height="22" rx="6" fill="#FBF3EA" />
    <text x="50" y="210" class="font-mono" font-size="9" font-weight="700" fill="#8F3215">TASK QUEUE</text>
    <circle cx="60" cy="235" r="4" fill="#F16524" />
    <text x="72" y="238" class="font-mono" font-size="8" fill="#241A16">cb_render()</text>
    <circle cx="60" cy="252" r="4" fill="#E3D8CB" />
    <text x="72" y="255" class="font-mono" font-size="8" fill="#A89887">cb_timer()</text>

    <!-- Microtasks (Bottom Right) -->
    <rect x="270" y="195" width="140" height="75" rx="6" fill="#FFF" stroke="#E3D8CB" stroke-width="1.2" />
    <rect x="270" y="195" width="140" height="22" rx="6" fill="#F8D9C2" fill-opacity="0.5" />
    <text x="280" y="210" class="font-mono" font-size="9" font-weight="700" fill="#F16524">MICROTASK QUEUE</text>
    <circle cx="290" cy="235" r="4" fill="#F16524" />
    <text x="302" y="238" class="font-mono" font-size="8" fill="#8F3215">Promise.then()</text>
    <circle cx="290" cy="252" r="4" fill="#F16524" />
    <text x="302" y="255" class="font-mono" font-size="8" fill="#8F3215">queueMicrotask</text>

    <!-- Orthogonal connecting directional arrows -->
    <path d="M 170 65 L 280 65" stroke="#F16524" stroke-width="1.2" stroke-dasharray="3 3" />
    <path d="M 345 120 L 345 195" stroke="#F16524" stroke-width="1.2" stroke-dasharray="3 3" />
    <path d="M 110 195 L 110 120" stroke="#F16524" stroke-width="1.2" stroke-dasharray="3 3" />
  </g>

  <!-- Bottom Metadata Bar -->
  <g transform="translate(48, 480)">
    <line x1="0" y1="0" x2="864" y2="0" stroke="#EFE2D2" stroke-width="1" />
    <text x="0" y="18" class="font-sans" font-size="10" font-weight="700" letter-spacing="1.5" fill="#241A16">CATEGORY: LOGIC &amp; INTERACTIVITY</text>
    <text x="280" y="18" class="font-sans" font-size="10" font-weight="600" letter-spacing="1.5" fill="#8F3215">LEVEL: INTERMEDIATE</text>
    <text x="500" y="18" class="font-mono" font-size="10" fill="#A89887">MODULES: 03 · LESSONS: 35</text>
    
    <g transform="translate(770, 6)">
      <line x1="0" y1="0" x2="0" y2="14" stroke="#241A16" stroke-width="1.5" />
      <line x1="5" y1="0" x2="5" y2="14" stroke="#241A16" stroke-width="2" />
      <line x1="11" y1="0" x2="11" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="17" y1="0" x2="17" y2="14" stroke="#241A16" stroke-width="3" />
      <line x1="25" y1="0" x2="25" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="31" y1="0" x2="31" y2="14" stroke="#241A16" stroke-width="2" />
      <line x1="37" y1="0" x2="37" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="43" y1="0" x2="43" y2="14" stroke="#241A16" stroke-width="2.5" />
      <text x="54" y="12" class="font-mono" font-size="9" fill="#A89887">KTS-03</text>
    </g>
  </g>
</svg>
"""

# =========================================================================
# 4. REACT COVER
# =========================================================================
REACT_SVG = SHARED_SVG_HEADER + """
  <!-- Background -->
  <rect width="960" height="540" fill="#FFF9F3" />
  <rect width="960" height="540" fill="url(#fine-grid)" />

  <!-- Outer Editorial Frame -->
  <rect x="24" y="24" width="912" height="492" rx="6" fill="none" stroke="#EFE5D9" stroke-width="1.5" />
  
  <!-- Corner Registration Marks -->
  <path d="M 18 24 L 30 24 M 24 18 L 24 30" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 930 24 L 942 24 M 936 18 L 936 30" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 18 516 L 30 516 M 24 510 L 24 522" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 930 516 L 942 516 M 936 510 L 936 522" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />

  <!-- Top Header Bar -->
  <g transform="translate(48, 52)">
    <path d="M 0 0 L 8 -10 L 16 0 L 12 10 L 4 10 Z" fill="#F16524" />
    <path d="M 5 0 L 8 -6 L 11 0 L 8 6 Z" fill="#FFF9F3" />
    <text x="24" y="6" class="font-sans" font-size="12" font-weight="800" letter-spacing="3" fill="#241A16">KITSUNO.AI</text>
    <text x="145" y="6" class="font-sans" font-size="10" font-weight="600" letter-spacing="2" fill="#8F3215">·</text>
    <text x="160" y="6" class="font-sans" font-size="10" font-weight="700" letter-spacing="2" fill="#8F3215">SPECIFICATION</text>
    <text x="864" y="6" text-anchor="end" class="font-mono" font-size="11" font-weight="600" letter-spacing="1.5" fill="#A89887">VOL. 04 / COMPONENT UI</text>
    <line x1="0" y1="20" x2="864" y2="20" stroke="#EFE5D9" stroke-width="1" />
  </g>

  <!-- Left: Editorial Content -->
  <g transform="translate(48, 120)">
    <rect x="0" y="0" width="6" height="6" fill="#F16524" />
    <text x="16" y="7" class="font-sans" font-size="11" font-weight="700" letter-spacing="2.5" fill="#F16524">REACTIVE INTERFACES · ARCHITECTURE</text>
    
    <text x="0" y="66" class="font-serif" font-size="56" fill="#241A16" letter-spacing="-0.5">React</text>
    <text x="0" y="104" class="font-serif" font-size="28" font-style="italic" fill="#8F3215">Component Trees, Hooks &amp; State</text>
    
    <text x="0" y="146" class="font-sans" font-size="13" font-weight="400" fill="#6B5950">
      Declarative user interface development with atomic composition.
    </text>
    <text x="0" y="168" class="font-sans" font-size="13" font-weight="400" fill="#6B5950">
      Virtual DOM reconciler, unidirectional data-flow, and custom hooks.
    </text>

    <!-- React Tokens -->
    <g transform="translate(0, 210)">
      <rect x="0" y="0" width="84" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="42" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">useState()</text>

      <rect x="94" y="0" width="86" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="137" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">useEffect()</text>

      <rect x="190" y="0" width="80" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="230" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">&lt;Context&gt;</text>

      <rect x="280" y="0" width="76" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="318" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">Fiber Tree</text>
    </g>

    <line x1="0" y1="265" x2="360" y2="265" stroke="#EFE5D9" stroke-width="1" />
    <text x="0" y="285" class="font-mono" font-size="10" fill="#A89887">PARADIGM: DECLARATIVE UI / FIBER RECONCILER</text>
  </g>

  <!-- Right: Abstract Component Tree & Orbital Geometry -->
  <g transform="translate(500, 110)">
    <!-- Subtle Harmonic Elliptical Rings (Abstract React Motif) -->
    <ellipse cx="225" cy="150" rx="170" ry="60" fill="none" stroke="#F8D9C2" stroke-width="1.2" stroke-dasharray="3 3" transform="rotate(-30 225 150)" />
    <ellipse cx="225" cy="150" rx="170" ry="60" fill="none" stroke="#F8D9C2" stroke-width="1.2" stroke-dasharray="3 3" transform="rotate(30 225 150)" />
    <ellipse cx="225" cy="150" rx="170" ry="60" fill="none" stroke="#F16524" stroke-width="1.5" stroke-opacity="0.3" />

    <!-- Root Component Node -->
    <rect x="160" y="25" width="130" height="38" rx="6" fill="#FFF" stroke="#F16524" stroke-width="1.5" />
    <circle cx="178" cy="44" r="4" fill="#F16524" />
    <text x="190" y="48" class="font-mono" font-size="10" font-weight="700" fill="#241A16">&lt;AppRoot /&gt;</text>

    <!-- Branch Connector Lines -->
    <path d="M 225 63 L 225 90 L 115 90 L 115 115" fill="none" stroke="#E3D8CB" stroke-width="1.2" />
    <path d="M 225 90 L 335 90 L 335 115" fill="none" stroke="#E3D8CB" stroke-width="1.2" />

    <!-- Child Component 1: State Provider -->
    <rect x="50" y="115" width="130" height="60" rx="6" fill="#FFFDF9" stroke="#E3D8CB" stroke-width="1.2" />
    <rect x="50" y="115" width="130" height="20" rx="6" fill="#FBF3EA" />
    <text x="60" y="129" class="font-mono" font-size="9" font-weight="700" fill="#8F3215">&lt;AuthProvider /&gt;</text>
    <text x="60" y="152" class="font-mono" font-size="8" fill="#6B5950">useContext()</text>
    <text x="60" y="165" class="font-mono" font-size="8" fill="#F16524">[user, dispatch]</text>

    <!-- Child Component 2: Layout / Router -->
    <rect x="270" y="115" width="130" height="60" rx="6" fill="#FFFDF9" stroke="#E3D8CB" stroke-width="1.2" />
    <rect x="270" y="115" width="130" height="20" rx="6" fill="#FBF3EA" />
    <text x="280" y="129" class="font-mono" font-size="9" font-weight="700" fill="#8F3215">&lt;DashboardUI /&gt;</text>
    <text x="280" y="152" class="font-mono" font-size="8" fill="#6B5950">props: { stats }</text>
    <text x="280" y="165" class="font-mono" font-size="8" fill="#8F3215">memo(CardGrid)</text>

    <!-- Leaf Level Components Connected -->
    <path d="M 335 175 L 335 200 L 260 200 L 260 215" fill="none" stroke="#E3D8CB" stroke-width="1" />
    <path d="M 335 200 L 390 200 L 390 215" fill="none" stroke="#E3D8CB" stroke-width="1" />

    <rect x="205" y="215" width="105" height="42" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-width="1" />
    <text x="215" y="234" class="font-mono" font-size="8" font-weight="600" fill="#8F3215">&lt;CourseCard /&gt;</text>
    <text x="215" y="248" class="font-mono" font-size="7" fill="#6B5950">onClick={save}</text>

    <rect x="340" y="215" width="100" height="42" rx="4" fill="#FFF" stroke="#E3D8CB" stroke-width="1" />
    <text x="350" y="234" class="font-mono" font-size="8" font-weight="600" fill="#241A16">&lt;Progress /&gt;</text>
    <text x="350" y="248" class="font-mono" font-size="7" fill="#F16524">value={85}</text>
  </g>

  <!-- Bottom Metadata Bar -->
  <g transform="translate(48, 480)">
    <line x1="0" y1="0" x2="864" y2="0" stroke="#EFE5D9" stroke-width="1" />
    <text x="0" y="18" class="font-sans" font-size="10" font-weight="700" letter-spacing="1.5" fill="#241A16">CATEGORY: FRONTEND FRAMEWORKS</text>
    <text x="280" y="18" class="font-sans" font-size="10" font-weight="600" letter-spacing="1.5" fill="#8F3215">LEVEL: BEGINNER</text>
    <text x="500" y="18" class="font-mono" font-size="10" fill="#A89887">MODULES: 03 · LESSONS: 29</text>
    
    <g transform="translate(770, 6)">
      <line x1="0" y1="0" x2="0" y2="14" stroke="#241A16" stroke-width="2.5" />
      <line x1="6" y1="0" x2="6" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="12" y1="0" x2="12" y2="14" stroke="#241A16" stroke-width="1.5" />
      <line x1="18" y1="0" x2="18" y2="14" stroke="#241A16" stroke-width="2" />
      <line x1="26" y1="0" x2="26" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="32" y1="0" x2="32" y2="14" stroke="#241A16" stroke-width="3" />
      <line x1="40" y1="0" x2="40" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="46" y1="0" x2="46" y2="14" stroke="#241A16" stroke-width="2" />
      <text x="54" y="12" class="font-mono" font-size="9" fill="#A89887">KTS-04</text>
    </g>
  </g>
</svg>
"""

# =========================================================================
# 5. FULL-STACK DEVELOPMENT COVER
# =========================================================================
FULLSTACK_SVG = SHARED_SVG_HEADER + """
  <!-- Background -->
  <rect width="960" height="540" fill="#F8F3EA" />
  <rect width="960" height="540" fill="url(#fine-grid)" />

  <!-- Outer Editorial Frame -->
  <rect x="24" y="24" width="912" height="492" rx="6" fill="none" stroke="#E6D9C8" stroke-width="1.5" />
  
  <!-- Corner Registration Marks -->
  <path d="M 18 24 L 30 24 M 24 18 L 24 30" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 930 24 L 942 24 M 936 18 L 936 30" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 18 516 L 30 516 M 24 510 L 24 522" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 930 516 L 942 516 M 936 510 L 936 522" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />

  <!-- Top Header Bar -->
  <g transform="translate(48, 52)">
    <path d="M 0 0 L 8 -10 L 16 0 L 12 10 L 4 10 Z" fill="#F16524" />
    <path d="M 5 0 L 8 -6 L 11 0 L 8 6 Z" fill="#F8F3EA" />
    <text x="24" y="6" class="font-sans" font-size="12" font-weight="800" letter-spacing="3" fill="#241A16">KITSUNO.AI</text>
    <text x="145" y="6" class="font-sans" font-size="10" font-weight="600" letter-spacing="2" fill="#8F3215">·</text>
    <text x="160" y="6" class="font-sans" font-size="10" font-weight="700" letter-spacing="2" fill="#8F3215">SPECIFICATION</text>
    <text x="864" y="6" text-anchor="end" class="font-mono" font-size="11" font-weight="600" letter-spacing="1.5" fill="#A89887">VOL. 05 / DISTRIBUTED ARCHITECTURE</text>
    <line x1="0" y1="20" x2="864" y2="20" stroke="#E6D9C8" stroke-width="1" />
  </g>

  <!-- Left: Editorial Content -->
  <g transform="translate(48, 120)">
    <rect x="0" y="0" width="6" height="6" fill="#F16524" />
    <text x="16" y="7" class="font-sans" font-size="11" font-weight="700" letter-spacing="2.5" fill="#F16524">DISTRIBUTED ARCHITECTURE · END-TO-END</text>
    
    <text x="0" y="66" class="font-serif" font-size="52" fill="#241A16" letter-spacing="-0.5">Full-Stack</text>
    <text x="0" y="104" class="font-serif" font-size="28" font-style="italic" fill="#8F3215">Client, Gateway, Server &amp; Persistence</text>
    
    <text x="0" y="146" class="font-sans" font-size="13" font-weight="400" fill="#6B5950">
      Multi-tier application architecture and complete production engineering.
    </text>
    <text x="0" y="168" class="font-sans" font-size="13" font-weight="400" fill="#6B5950">
      RESTful APIs, auth pipelines, session states, and database engines.
    </text>

    <!-- Architecture Tokens -->
    <g transform="translate(0, 210)">
      <rect x="0" y="0" width="80" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="40" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">CLIENT UI</text>

      <rect x="90" y="0" width="80" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="130" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">REST API</text>

      <rect x="180" y="0" width="80" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="220" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">SERVER</text>

      <rect x="270" y="0" width="84" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="312" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">DATABASE</text>
    </g>

    <line x1="0" y1="265" x2="360" y2="265" stroke="#E6D9C8" stroke-width="1" />
    <text x="0" y="285" class="font-mono" font-size="10" fill="#A89887">STACK: REACT · FASTAPI / NODE · POSTGRESQL · REDIS</text>
  </g>

  <!-- Right: Abstract 4-Tier Architectural Stack Diagram -->
  <g transform="translate(500, 110)">
    <!-- Layer 1: Client Tier -->
    <g transform="translate(40, 20)">
      <rect x="0" y="0" width="370" height="48" rx="6" fill="#FFF" stroke="#E3D8CB" stroke-width="1.2" />
      <rect x="0" y="0" width="6" height="48" rx="2" fill="#F16524" />
      <text x="24" y="22" class="font-mono" font-size="10" font-weight="700" fill="#241A16">TIER 1 · PRESENTATION</text>
      <text x="24" y="38" class="font-sans" font-size="9" fill="#8F3215">React SPA · Next.js · TailwindCSS · Client Cache</text>
      <text x="350" y="30" text-anchor="end" class="font-mono" font-size="9" font-weight="600" fill="#F16524">HTTP / WS</text>
    </g>

    <!-- Connector 1-2 -->
    <path d="M 225 68 L 225 84" stroke="#F16524" stroke-width="1.5" stroke-dasharray="2 2" />
    <polygon points="225,87 221,80 229,80" fill="#F16524" />

    <!-- Layer 2: API Gateway & Authentication -->
    <g transform="translate(40, 88)">
      <rect x="0" y="0" width="370" height="48" rx="6" fill="#FBF3EA" stroke="#F16524" stroke-width="1" />
      <rect x="0" y="0" width="6" height="48" rx="2" fill="#8F3215" />
      <text x="24" y="22" class="font-mono" font-size="10" font-weight="700" fill="#8F3215">TIER 2 · API GATEWAY</text>
      <text x="24" y="38" class="font-sans" font-size="9" fill="#6B5950">JWT Auth · Rate Limiting · Route Dispatcher · Validation</text>
      <text x="350" y="30" text-anchor="end" class="font-mono" font-size="9" fill="#8F3215">REST / JSON</text>
    </g>

    <!-- Connector 2-3 -->
    <path d="M 225 136 L 225 152" stroke="#8F3215" stroke-width="1.5" stroke-dasharray="2 2" />
    <polygon points="225,155 221,148 229,148" fill="#8F3215" />

    <!-- Layer 3: Application Server & Business Logic -->
    <g transform="translate(40, 156)">
      <rect x="0" y="0" width="370" height="48" rx="6" fill="#FFF" stroke="#E3D8CB" stroke-width="1.2" />
      <rect x="0" y="0" width="6" height="48" rx="2" fill="#FF8A4C" />
      <text x="24" y="22" class="font-mono" font-size="10" font-weight="700" fill="#241A16">TIER 3 · RUNTIME ENGINE</text>
      <text x="24" y="38" class="font-sans" font-size="9" fill="#8F3215">Business Logic · ORM Engine · Event Handlers · Background Jobs</text>
      <text x="350" y="30" text-anchor="end" class="font-mono" font-size="9" fill="#A89887">ASYNC</text>
    </g>

    <!-- Connector 3-4 -->
    <path d="M 225 204 L 225 220" stroke="#8F3215" stroke-width="1.5" stroke-dasharray="2 2" />
    <polygon points="225,223 221,216 229,216" fill="#8F3215" />

    <!-- Layer 4: Persistence / Database -->
    <g transform="translate(40, 224)">
      <rect x="0" y="0" width="370" height="48" rx="6" fill="#F8D9C2" fill-opacity="0.5" stroke="#F16524" stroke-width="1.2" />
      <rect x="0" y="0" width="6" height="48" rx="2" fill="#F16524" />
      <text x="24" y="22" class="font-mono" font-size="10" font-weight="700" fill="#8F3215">TIER 4 · DATA PERSISTENCE</text>
      <text x="24" y="38" class="font-sans" font-size="9" fill="#241A16">Relational Tables · ACID Transactions · Key-Value Store · Indexing</text>
      <text x="350" y="30" text-anchor="end" class="font-mono" font-size="9" font-weight="700" fill="#F16524">SQL / BSON</text>
    </g>
  </g>

  <!-- Bottom Metadata Bar -->
  <g transform="translate(48, 480)">
    <line x1="0" y1="0" x2="864" y2="0" stroke="#E6D9C8" stroke-width="1" />
    <text x="0" y="18" class="font-sans" font-size="10" font-weight="700" letter-spacing="1.5" fill="#241A16">CATEGORY: FULL-STACK ARCHITECTURE</text>
    <text x="280" y="18" class="font-sans" font-size="10" font-weight="600" letter-spacing="1.5" fill="#8F3215">LEVEL: INTERMEDIATE</text>
    <text x="500" y="18" class="font-mono" font-size="10" fill="#A89887">MODULES: 05 · LESSONS: 86</text>
    
    <g transform="translate(770, 6)">
      <line x1="0" y1="0" x2="0" y2="14" stroke="#241A16" stroke-width="3" />
      <line x1="6" y1="0" x2="6" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="12" y1="0" x2="12" y2="14" stroke="#241A16" stroke-width="2" />
      <line x1="18" y1="0" x2="18" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="24" y1="0" x2="24" y2="14" stroke="#241A16" stroke-width="1.5" />
      <line x1="30" y1="0" x2="30" y2="14" stroke="#241A16" stroke-width="2.5" />
      <line x1="38" y1="0" x2="38" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="44" y1="0" x2="44" y2="14" stroke="#241A16" stroke-width="2" />
      <text x="54" y="12" class="font-mono" font-size="9" fill="#A89887">KTS-05</text>
    </g>
  </g>
</svg>
"""

# =========================================================================
# 6. JAVA COVER
# =========================================================================
JAVA_SVG = SHARED_SVG_HEADER + """
  <!-- Background -->
  <rect width="960" height="540" fill="#FAF6F0" />
  <rect width="960" height="540" fill="url(#fine-grid)" />

  <!-- Outer Editorial Frame -->
  <rect x="24" y="24" width="912" height="492" rx="6" fill="none" stroke="#E7DDCE" stroke-width="1.5" />
  
  <!-- Corner Registration Marks -->
  <path d="M 18 24 L 30 24 M 24 18 L 24 30" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 930 24 L 942 24 M 936 18 L 936 30" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 18 516 L 30 516 M 24 510 L 24 522" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 930 516 L 942 516 M 936 510 L 936 522" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />

  <!-- Top Header Bar -->
  <g transform="translate(48, 52)">
    <path d="M 0 0 L 8 -10 L 16 0 L 12 10 L 4 10 Z" fill="#F16524" />
    <path d="M 5 0 L 8 -6 L 11 0 L 8 6 Z" fill="#FAF6F0" />
    <text x="24" y="6" class="font-sans" font-size="12" font-weight="800" letter-spacing="3" fill="#241A16">KITSUNO.AI</text>
    <text x="145" y="6" class="font-sans" font-size="10" font-weight="600" letter-spacing="2" fill="#8F3215">·</text>
    <text x="160" y="6" class="font-sans" font-size="10" font-weight="700" letter-spacing="2" fill="#8F3215">SPECIFICATION</text>
    <text x="864" y="6" text-anchor="end" class="font-mono" font-size="11" font-weight="600" letter-spacing="1.5" fill="#A89887">VOL. 06 / ENTERPRISE JVM</text>
    <line x1="0" y1="20" x2="864" y2="20" stroke="#E7DDCE" stroke-width="1" />
  </g>

  <!-- Left: Editorial Content -->
  <g transform="translate(48, 120)">
    <rect x="0" y="0" width="6" height="6" fill="#F16524" />
    <text x="16" y="7" class="font-sans" font-size="11" font-weight="700" letter-spacing="2.5" fill="#F16524">ENTERPRISE RUNTIMES · OOP</text>
    
    <text x="0" y="66" class="font-serif" font-size="56" fill="#241A16" letter-spacing="-0.5">Java</text>
    <text x="0" y="104" class="font-serif" font-size="28" font-style="italic" fill="#8F3215">Class Hierarchies, JVM &amp; Type Systems</text>
    
    <text x="0" y="146" class="font-sans" font-size="13" font-weight="400" fill="#6B5950">
      Strongly-typed object-oriented language for robust enterprise systems.
    </text>
    <text x="0" y="168" class="font-sans" font-size="13" font-weight="400" fill="#6B5950">
      Virtual machine bytecode execution, memory management, and threads.
    </text>

    <!-- Java Tokens -->
    <g transform="translate(0, 210)">
      <rect x="0" y="0" width="80" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="40" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">public static</text>

      <rect x="90" y="0" width="84" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="132" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">implements</text>

      <rect x="184" y="0" width="80" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="224" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">JVM Heap</text>

      <rect x="274" y="0" width="80" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="314" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">Generics &lt;T&gt;</text>
    </g>

    <line x1="0" y1="265" x2="360" y2="265" stroke="#E7DDCE" stroke-width="1" />
    <text x="0" y="285" class="font-mono" font-size="10" fill="#A89887">PLATFORM: OPENJDK HOTSPOT / JAVA SE STANDARD</text>
  </g>

  <!-- Right: Abstract UML Class Diagram & JVM Memory Structure -->
  <g transform="translate(500, 110)">
    <!-- Base Interface Box -->
    <rect x="135" y="20" width="180" height="48" rx="4" fill="#FFF" stroke="#E3D8CB" stroke-width="1.2" />
    <rect x="135" y="20" width="180" height="18" rx="4" fill="#FBF3EA" />
    <text x="225" y="33" text-anchor="middle" class="font-mono" font-size="8" fill="#8F3215">&lt;&lt;interface&gt;&gt;</text>
    <text x="225" y="52" text-anchor="middle" class="font-mono" font-size="10" font-weight="700" fill="#241A16">Comparable&lt;T&gt;</text>

    <!-- Inheritance Arrow Down -->
    <path d="M 225 68 L 225 96" stroke="#8F3215" stroke-width="1.2" />
    <polygon points="225,68 220,78 230,78" fill="#FFF" stroke="#8F3215" stroke-width="1.2" />

    <!-- Abstract Class Box -->
    <rect x="110" y="96" width="230" height="64" rx="4" fill="#FFF" stroke="#F16524" stroke-width="1.2" />
    <rect x="110" y="96" width="230" height="20" rx="4" fill="#F8D9C2" fill-opacity="0.4" />
    <text x="125" y="110" class="font-mono" font-size="9" font-weight="700" fill="#8F3215">abstract class TaskNode</text>
    <line x1="110" y1="116" x2="340" y2="116" stroke="#E3D8CB" stroke-width="0.8" />
    <text x="125" y="132" class="font-mono" font-size="8" fill="#6B5950"># protected UUID taskId;</text>
    <text x="125" y="146" class="font-mono" font-size="8" fill="#F16524">+ abstract void execute();</text>

    <!-- Branch Arrows to Concrete Classes -->
    <path d="M 225 160 L 225 185 L 125 185 L 125 205" fill="none" stroke="#E3D8CB" stroke-width="1.2" />
    <path d="M 225 185 L 325 185 L 325 205" fill="none" stroke="#E3D8CB" stroke-width="1.2" />

    <!-- Concrete Class 1 -->
    <rect x="50" y="205" width="150" height="60" rx="4" fill="#FFFDF9" stroke="#E3D8CB" stroke-width="1" />
    <text x="60" y="222" class="font-mono" font-size="9" font-weight="700" fill="#241A16">class BatchWorker</text>
    <line x1="50" y1="228" x2="200" y2="228" stroke="#E3D8CB" stroke-width="0.8" />
    <text x="60" y="244" class="font-mono" font-size="8" fill="#8F3215">@Override execute()</text>
    <text x="60" y="256" class="font-mono" font-size="8" fill="#A89887">synchronized(lock)</text>

    <!-- Concrete Class 2 -->
    <rect x="250" y="205" width="150" height="60" rx="4" fill="#FFFDF9" stroke="#E3D8CB" stroke-width="1" />
    <text x="260" y="222" class="font-mono" font-size="9" font-weight="700" fill="#241A16">class StreamEngine</text>
    <line x1="250" y1="228" x2="400" y2="228" stroke="#E3D8CB" stroke-width="0.8" />
    <text x="260" y="244" class="font-mono" font-size="8" fill="#8F3215">@Override execute()</text>
    <text x="260" y="256" class="font-mono" font-size="8" fill="#A89887">CompletableFuture</text>
  </g>

  <!-- Bottom Metadata Bar -->
  <g transform="translate(48, 480)">
    <line x1="0" y1="0" x2="864" y2="0" stroke="#E7DDCE" stroke-width="1" />
    <text x="0" y="18" class="font-sans" font-size="10" font-weight="700" letter-spacing="1.5" fill="#241A16">CATEGORY: OBJECT-ORIENTED PROGRAMMING</text>
    <text x="280" y="18" class="font-sans" font-size="10" font-weight="600" letter-spacing="1.5" fill="#8F3215">LEVEL: INTERMEDIATE</text>
    <text x="500" y="18" class="font-mono" font-size="10" fill="#A89887">MODULES: 02 · LESSONS: 47</text>
    
    <g transform="translate(770, 6)">
      <line x1="0" y1="0" x2="0" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="6" y1="0" x2="6" y2="14" stroke="#241A16" stroke-width="2.5" />
      <line x1="12" y1="0" x2="12" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="18" y1="0" x2="18" y2="14" stroke="#241A16" stroke-width="2" />
      <line x1="24" y1="0" x2="24" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="30" y1="0" x2="30" y2="14" stroke="#241A16" stroke-width="3" />
      <line x1="38" y1="0" x2="38" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="44" y1="0" x2="44" y2="14" stroke="#241A16" stroke-width="2" />
      <text x="54" y="12" class="font-mono" font-size="9" fill="#A89887">KTS-06</text>
    </g>
  </g>
</svg>
"""

# =========================================================================
# 7. MONGODB COVER
# =========================================================================
MONGODB_SVG = SHARED_SVG_HEADER + """
  <!-- Background -->
  <rect width="960" height="540" fill="#FFF8F0" />
  <rect width="960" height="540" fill="url(#fine-grid)" />

  <!-- Outer Editorial Frame -->
  <rect x="24" y="24" width="912" height="492" rx="6" fill="none" stroke="#EADBCE" stroke-width="1.5" />
  
  <!-- Corner Registration Marks -->
  <path d="M 18 24 L 30 24 M 24 18 L 24 30" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 930 24 L 942 24 M 936 18 L 936 30" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 18 516 L 30 516 M 24 510 L 24 522" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 930 516 L 942 516 M 936 510 L 936 522" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />

  <!-- Top Header Bar -->
  <g transform="translate(48, 52)">
    <path d="M 0 0 L 8 -10 L 16 0 L 12 10 L 4 10 Z" fill="#F16524" />
    <path d="M 5 0 L 8 -6 L 11 0 L 8 6 Z" fill="#FFF8F0" />
    <text x="24" y="6" class="font-sans" font-size="12" font-weight="800" letter-spacing="3" fill="#241A16">KITSUNO.AI</text>
    <text x="145" y="6" class="font-sans" font-size="10" font-weight="600" letter-spacing="2" fill="#8F3215">·</text>
    <text x="160" y="6" class="font-sans" font-size="10" font-weight="700" letter-spacing="2" fill="#8F3215">SPECIFICATION</text>
    <text x="864" y="6" text-anchor="end" class="font-mono" font-size="11" font-weight="600" letter-spacing="1.5" fill="#A89887">VOL. 07 / DOCUMENT STORE</text>
    <line x1="0" y1="20" x2="864" y2="20" stroke="#EADBCE" stroke-width="1" />
  </g>

  <!-- Left: Editorial Content -->
  <g transform="translate(48, 120)">
    <rect x="0" y="0" width="6" height="6" fill="#F16524" />
    <text x="16" y="7" class="font-sans" font-size="11" font-weight="700" letter-spacing="2.5" fill="#F16524">COLLECTIONS &amp; NOSQL · DATABASE</text>
    
    <text x="0" y="66" class="font-serif" font-size="56" fill="#241A16" letter-spacing="-0.5">MongoDB</text>
    <text x="0" y="104" class="font-serif" font-size="28" font-style="italic" fill="#8F3215">Document Modeling &amp; Distributed NoSQL</text>
    
    <text x="0" y="146" class="font-sans" font-size="13" font-weight="400" fill="#6B5950">
      Flexible schema BSON document storage and aggregation pipelines.
    </text>
    <text x="0" y="168" class="font-sans" font-size="13" font-weight="400" fill="#6B5950">
      Index strategies, compound keys, replica sets, and sharding topology.
    </text>

    <!-- MongoDB Tokens -->
    <g transform="translate(0, 210)">
      <rect x="0" y="0" width="84" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="42" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">ObjectId()</text>

      <rect x="94" y="0" width="76" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="132" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">$match</text>

      <rect x="180" y="0" width="76" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="218" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">$group</text>

      <rect x="266" y="0" width="84" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="308" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">BSON Store</text>
    </g>

    <line x1="0" y1="265" x2="360" y2="265" stroke="#EADBCE" stroke-width="1" />
    <text x="0" y="285" class="font-mono" font-size="10" fill="#A89887">ENGINE: WIREDTIGER CACHE / BSON DATA MODEL</text>
  </g>

  <!-- Right: Abstract JSON Document & Pipeline Stages -->
  <g transform="translate(500, 110)">
    <!-- Layered JSON Document Cards -->
    <!-- Background Document Card (Offset depth) -->
    <rect x="65" y="40" width="340" height="230" rx="8" fill="#F8D9C2" fill-opacity="0.3" stroke="#EADBCE" stroke-width="1" />
    
    <!-- Primary Foreground Document Card -->
    <rect x="45" y="20" width="340" height="230" rx="8" fill="#FFFDF9" stroke="#E3D8CB" stroke-width="1.5" />
    <rect x="45" y="20" width="340" height="26" rx="8" fill="#FBF3EA" />
    <circle cx="62" cy="33" r="3.5" fill="#F16524" />
    <text x="75" y="37" class="font-mono" font-size="9" font-weight="700" fill="#8F3215">COLLECTION: "courses" · JSON/BSON</text>

    <!-- JSON Code Lines -->
    <g transform="translate(65, 62)">
      <text x="0" y="14" class="font-mono" font-size="10" fill="#241A16">{</text>
      <text x="16" y="32" class="font-mono" font-size="10" fill="#8F3215">"_id":</text>
      <text x="56" y="32" class="font-mono" font-size="10" fill="#F16524">ObjectId("64e8a1f7...")</text>
      <text x="215" y="32" class="font-mono" font-size="10" fill="#241A16">,</text>

      <text x="16" y="52" class="font-mono" font-size="10" fill="#8F3215">"course":</text>
      <text x="74" y="52" class="font-mono" font-size="10" fill="#6B5950">"Kitsuno Mastery"</text>
      <text x="186" y="52" class="font-mono" font-size="10" fill="#241A16">,</text>

      <text x="16" y="72" class="font-mono" font-size="10" fill="#8F3215">"modules":</text>
      <text x="82" y="72" class="font-mono" font-size="10" fill="#241A16">[</text>
      <text x="96" y="72" class="font-mono" font-size="10" fill="#F16524">1, 2, 3, 4</text>
      <text x="156" y="72" class="font-mono" font-size="10" fill="#241A16">],</text>

      <text x="16" y="92" class="font-mono" font-size="10" fill="#8F3215">"metrics":</text>
      <text x="78" y="92" class="font-mono" font-size="10" fill="#241A16">{</text>
      <text x="32" y="110" class="font-mono" font-size="10" fill="#8F3215">"activeStudents":</text>
      <text x="145" y="110" class="font-mono" font-size="10" fill="#F16524">12480</text>
      <text x="16" y="128" class="font-mono" font-size="10" fill="#241A16">}</text>

      <text x="0" y="148" class="font-mono" font-size="10" fill="#241A16">}</text>
    </g>

    <!-- Aggregation Pipeline Ribbon at Bottom -->
    <g transform="translate(45, 230)">
      <rect x="0" y="0" width="340" height="34" rx="4" fill="#FBF3EA" stroke="#F16524" stroke-width="1" />
      <text x="16" y="21" class="font-mono" font-size="9" font-weight="700" fill="#8F3215">PIPELINE:</text>
      <text x="76" y="21" class="font-mono" font-size="9" fill="#F16524">$match</text>
      <text x="120" y="21" class="font-mono" font-size="9" fill="#241A16">➔</text>
      <text x="135" y="21" class="font-mono" font-size="9" fill="#F16524">$group</text>
      <text x="180" y="21" class="font-mono" font-size="9" fill="#241A16">➔</text>
      <text x="195" y="21" class="font-mono" font-size="9" fill="#F16524">$sort</text>
      <text x="235" y="21" class="font-mono" font-size="9" fill="#241A16">➔</text>
      <text x="250" y="21" class="font-mono" font-size="9" fill="#8F3215">$project</text>
    </g>
  </g>

  <!-- Bottom Metadata Bar -->
  <g transform="translate(48, 480)">
    <line x1="0" y1="0" x2="864" y2="0" stroke="#EADBCE" stroke-width="1" />
    <text x="0" y="18" class="font-sans" font-size="10" font-weight="700" letter-spacing="1.5" fill="#241A16">CATEGORY: DATABASE SYSTEMS</text>
    <text x="280" y="18" class="font-sans" font-size="10" font-weight="600" letter-spacing="1.5" fill="#8F3215">LEVEL: BEGINNER</text>
    <text x="500" y="18" class="font-mono" font-size="10" fill="#A89887">MODULES: 03 · LESSONS: 64</text>
    
    <g transform="translate(770, 6)">
      <line x1="0" y1="0" x2="0" y2="14" stroke="#241A16" stroke-width="2" />
      <line x1="6" y1="0" x2="6" y2="14" stroke="#241A16" stroke-width="1.5" />
      <line x1="12" y1="0" x2="12" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="18" y1="0" x2="18" y2="14" stroke="#241A16" stroke-width="2.5" />
      <line x1="26" y1="0" x2="26" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="32" y1="0" x2="32" y2="14" stroke="#241A16" stroke-width="2" />
      <line x1="40" y1="0" x2="40" y2="14" stroke="#241A16" stroke-width="1.5" />
      <line x1="46" y1="0" x2="46" y2="14" stroke="#241A16" stroke-width="1" />
      <text x="54" y="12" class="font-mono" font-size="9" fill="#A89887">KTS-07</text>
    </g>
  </g>
</svg>
"""

# =========================================================================
# 8. C COVER
# =========================================================================
C_SVG = SHARED_SVG_HEADER + """
  <!-- Background -->
  <rect width="960" height="540" fill="#F7F2EA" />
  <rect width="960" height="540" fill="url(#fine-grid)" />

  <!-- Outer Editorial Frame -->
  <rect x="24" y="24" width="912" height="492" rx="6" fill="none" stroke="#E5D9C8" stroke-width="1.5" />
  
  <!-- Corner Registration Marks -->
  <path d="M 18 24 L 30 24 M 24 18 L 24 30" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 930 24 L 942 24 M 936 18 L 936 30" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 18 516 L 30 516 M 24 510 L 24 522" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 930 516 L 942 516 M 936 510 L 936 522" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />

  <!-- Top Header Bar -->
  <g transform="translate(48, 52)">
    <path d="M 0 0 L 8 -10 L 16 0 L 12 10 L 4 10 Z" fill="#F16524" />
    <path d="M 5 0 L 8 -6 L 11 0 L 8 6 Z" fill="#F7F2EA" />
    <text x="24" y="6" class="font-sans" font-size="12" font-weight="800" letter-spacing="3" fill="#241A16">KITSUNO.AI</text>
    <text x="145" y="6" class="font-sans" font-size="10" font-weight="600" letter-spacing="2" fill="#8F3215">·</text>
    <text x="160" y="6" class="font-sans" font-size="10" font-weight="700" letter-spacing="2" fill="#8F3215">SPECIFICATION</text>
    <text x="864" y="6" text-anchor="end" class="font-mono" font-size="11" font-weight="600" letter-spacing="1.5" fill="#A89887">VOL. 08 / SYSTEMS PROGRAMMING</text>
    <line x1="0" y1="20" x2="864" y2="20" stroke="#E5D9C8" stroke-width="1" />
  </g>

  <!-- Left: Editorial Content -->
  <g transform="translate(48, 120)">
    <rect x="0" y="0" width="6" height="6" fill="#F16524" />
    <text x="16" y="7" class="font-sans" font-size="11" font-weight="700" letter-spacing="2.5" fill="#F16524">LOW-LEVEL SYSTEMS · MEMORY</text>
    
    <text x="0" y="66" class="font-serif" font-size="56" fill="#241A16" letter-spacing="-0.5">C Language</text>
    <text x="0" y="104" class="font-serif" font-size="28" font-style="italic" fill="#8F3215">Pointers, Memory Layout &amp; Systems Logic</text>
    
    <text x="0" y="146" class="font-sans" font-size="13" font-weight="400" fill="#6B5950">
      Deterministic procedural computation and low-level hardware control.
    </text>
    <text x="0" y="168" class="font-sans" font-size="13" font-weight="400" fill="#6B5950">
      Direct pointer referencing, stack allocation, heap heaps, and structs.
    </text>

    <!-- C Tokens -->
    <g transform="translate(0, 210)">
      <rect x="0" y="0" width="86" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="43" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">#include &lt;stdio&gt;</text>

      <rect x="96" y="0" width="76" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="134" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">*ptr = &amp;val</text>

      <rect x="182" y="0" width="76" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="220" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">malloc()</text>

      <rect x="268" y="0" width="84" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="310" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">struct Node</text>
    </g>

    <line x1="0" y1="265" x2="360" y2="265" stroke="#E5D9C8" stroke-width="1" />
    <text x="0" y="285" class="font-mono" font-size="10" fill="#A89887">STANDARD: ISO/IEC 9899 (C11/C17) / POSIX</text>
  </g>

  <!-- Right: Abstract Memory Address Space & Pointer Architecture -->
  <g transform="translate(500, 110)">
    <!-- Memory Layout Box -->
    <rect x="40" y="20" width="370" height="260" rx="8" fill="#FFF" stroke="#E3D8CB" stroke-width="1.2" />
    
    <!-- Title -->
    <rect x="40" y="20" width="370" height="24" rx="8" fill="#FBF3EA" />
    <text x="55" y="36" class="font-mono" font-size="9" font-weight="700" fill="#8F3215">MEMORY ADDRESS SPACE (VIRTUAL ADDRESSES)</text>

    <!-- Memory Partitions -->
    <!-- High Address: Stack -->
    <g transform="translate(55, 52)">
      <rect x="0" y="0" width="340" height="38" rx="3" fill="#F8D9C2" fill-opacity="0.5" stroke="#F16524" stroke-width="1" />
      <text x="12" y="18" class="font-mono" font-size="9" font-weight="700" fill="#8F3215">STACK (Local Variables, Call Frames)</text>
      <text x="12" y="30" class="font-mono" font-size="8" fill="#6B5950">sp: 0x7FFF5FBFF8C0 ➔ int counter = 42;</text>
      <text x="325" y="24" text-anchor="end" class="font-mono" font-size="8" fill="#F16524">↓ Grows down</text>
    </g>

    <!-- Unallocated Memory Void -->
    <g transform="translate(55, 96)">
      <rect x="0" y="0" width="340" height="32" rx="3" fill="#FAF5EE" stroke="#E3D8CB" stroke-dasharray="3 3" />
      <text x="170" y="20" text-anchor="middle" class="font-mono" font-size="8" fill="#A89887">--- UNMAPPED ADDRESS SPACE ---</text>
    </g>

    <!-- Low Address: Heap -->
    <g transform="translate(55, 134)">
      <rect x="0" y="0" width="340" height="38" rx="3" fill="#FFFDF9" stroke="#E3D8CB" stroke-width="1" />
      <text x="12" y="18" class="font-mono" font-size="9" font-weight="700" fill="#241A16">HEAP (Dynamic Allocations)</text>
      <text x="12" y="30" class="font-mono" font-size="8" fill="#8F3215">void *buf = malloc(sizeof(struct Node));</text>
      <text x="325" y="24" text-anchor="end" class="font-mono" font-size="8" fill="#8F3215">↑ Grows up</text>
    </g>

    <!-- Text & Data Segments -->
    <g transform="translate(55, 178)">
      <rect x="0" y="0" width="340" height="30" rx="3" fill="#FBF3EA" stroke="#E3D8CB" stroke-width="1" />
      <text x="12" y="20" class="font-mono" font-size="8" font-weight="600" fill="#8F3215">BSS &amp; DATA SEGMENT (Globals, Static Variables)</text>
    </g>

    <g transform="translate(55, 214)">
      <rect x="0" y="0" width="340" height="30" rx="3" fill="#F8D9C2" fill-opacity="0.3" stroke="#F16524" stroke-width="1" />
      <text x="12" y="20" class="font-mono" font-size="8" font-weight="700" fill="#F16524">TEXT SEGMENT (.code, Machine Instructions)</text>
      <text x="325" y="20" text-anchor="end" class="font-mono" font-size="8" fill="#8F3215">0x00400000</text>
    </g>

    <!-- Pointer Indirection Vector -->
    <path d="M 35 70 L 15 70 L 15 152 L 35 152" fill="none" stroke="#F16524" stroke-width="1.5" />
    <polygon points="35,152 28,148 28,156" fill="#F16524" />
    <text x="10" y="115" text-anchor="end" class="font-mono" font-size="8" font-weight="700" fill="#F16524">*ptr</text>
  </g>

  <!-- Bottom Metadata Bar -->
  <g transform="translate(48, 480)">
    <line x1="0" y1="0" x2="864" y2="0" stroke="#E5D9C8" stroke-width="1" />
    <text x="0" y="18" class="font-sans" font-size="10" font-weight="700" letter-spacing="1.5" fill="#241A16">CATEGORY: SYSTEMS PROGRAMMING</text>
    <text x="280" y="18" class="font-sans" font-size="10" font-weight="600" letter-spacing="1.5" fill="#8F3215">LEVEL: ADVANCED</text>
    <text x="500" y="18" class="font-mono" font-size="10" fill="#A89887">MODULES: 03 · LESSONS: 74</text>
    
    <g transform="translate(770, 6)">
      <line x1="0" y1="0" x2="0" y2="14" stroke="#241A16" stroke-width="1.5" />
      <line x1="6" y1="0" x2="6" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="12" y1="0" x2="12" y2="14" stroke="#241A16" stroke-width="3" />
      <line x1="18" y1="0" x2="18" y2="14" stroke="#241A16" stroke-width="2" />
      <line x1="26" y1="0" x2="26" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="32" y1="0" x2="32" y2="14" stroke="#241A16" stroke-width="2.5" />
      <line x1="40" y1="0" x2="40" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="46" y1="0" x2="46" y2="14" stroke="#241A16" stroke-width="2" />
      <text x="54" y="12" class="font-mono" font-size="9" fill="#A89887">KTS-08</text>
    </g>
  </g>
</svg>
"""

# =========================================================================
# 9. PYTHON COVER
# =========================================================================
PYTHON_SVG = SHARED_SVG_HEADER + """
  <!-- Background -->
  <rect width="960" height="540" fill="#FFFBF5" />
  <rect width="960" height="540" fill="url(#fine-grid)" />

  <!-- Outer Editorial Frame -->
  <rect x="24" y="24" width="912" height="492" rx="6" fill="none" stroke="#EFE5D8" stroke-width="1.5" />
  
  <!-- Corner Registration Marks -->
  <path d="M 18 24 L 30 24 M 24 18 L 24 30" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 930 24 L 942 24 M 936 18 L 936 30" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 18 516 L 30 516 M 24 510 L 24 522" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />
  <path d="M 930 516 L 942 516 M 936 510 L 936 522" stroke="#8F3215" stroke-width="1" stroke-opacity="0.3" />

  <!-- Top Header Bar -->
  <g transform="translate(48, 52)">
    <path d="M 0 0 L 8 -10 L 16 0 L 12 10 L 4 10 Z" fill="#F16524" />
    <path d="M 5 0 L 8 -6 L 11 0 L 8 6 Z" fill="#FFFBF5" />
    <text x="24" y="6" class="font-sans" font-size="12" font-weight="800" letter-spacing="3" fill="#241A16">KITSUNO.AI</text>
    <text x="145" y="6" class="font-sans" font-size="10" font-weight="600" letter-spacing="2" fill="#8F3215">·</text>
    <text x="160" y="6" class="font-sans" font-size="10" font-weight="700" letter-spacing="2" fill="#8F3215">SPECIFICATION</text>
    <text x="864" y="6" text-anchor="end" class="font-mono" font-size="11" font-weight="600" letter-spacing="1.5" fill="#A89887">VOL. 09 / IDIOMATIC PYTHON</text>
    <line x1="0" y1="20" x2="864" y2="20" stroke="#EFE5D8" stroke-width="1" />
  </g>

  <!-- Left: Editorial Content -->
  <g transform="translate(48, 120)">
    <rect x="0" y="0" width="6" height="6" fill="#F16524" />
    <text x="16" y="7" class="font-sans" font-size="11" font-weight="700" letter-spacing="2.5" fill="#F16524">DATA STRUCTURES &amp; AUTOMATION</text>
    
    <text x="0" y="66" class="font-serif" font-size="56" fill="#241A16" letter-spacing="-0.5">Python</text>
    <text x="0" y="104" class="font-serif" font-size="28" font-style="italic" fill="#8F3215">Idiomatic Logic, Comprehensions &amp; Scripts</text>
    
    <text x="0" y="146" class="font-sans" font-size="13" font-weight="400" fill="#6B5950">
      High-level expressive language designed for readability and clarity.
    </text>
    <text x="0" y="168" class="font-sans" font-size="13" font-weight="400" fill="#6B5950">
      First-class functions, generators, data models, and standard libraries.
    </text>

    <!-- Python Tokens -->
    <g transform="translate(0, 210)">
      <rect x="0" y="0" width="76" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="38" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">def main():</text>

      <rect x="88" y="0" width="86" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="131" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">[x for x in list]</text>

      <rect x="186" y="0" width="80" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="226" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">yield from</text>

      <rect x="278" y="0" width="76" height="24" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-opacity="0.3" />
      <text x="316" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#8F3215">@dataclass</text>
    </g>

    <line x1="0" y1="265" x2="360" y2="265" stroke="#EFE5D8" stroke-width="1" />
    <text x="0" y="285" class="font-mono" font-size="10" fill="#A89887">RUNTIME: CPYTHON 3.12+ / PEP 8 STYLE GUIDELINES</text>
  </g>

  <!-- Right: Abstract Indentation & Pipeline Stream Diagram -->
  <g transform="translate(500, 110)">
    <!-- Structured Indentation Blueprint Card -->
    <rect x="40" y="20" width="370" height="260" rx="8" fill="#FFF" stroke="#E3D8CB" stroke-width="1.2" />
    <rect x="40" y="20" width="370" height="24" rx="8" fill="#FBF3EA" />
    <circle cx="58" cy="32" r="3.5" fill="#F16524" />
    <text x="70" y="36" class="font-mono" font-size="9" font-weight="700" fill="#8F3215">SYNTACTIC INDENTATION MATRIX</text>

    <!-- Indentation Guides (Subtle dashed vertical lines) -->
    <line x1="95" y1="55" x2="95" y2="245" stroke="#F8D9C2" stroke-width="1" stroke-dasharray="2 2" />
    <line x1="135" y1="85" x2="135" y2="245" stroke="#F8D9C2" stroke-width="1" stroke-dasharray="2 2" />
    <line x1="175" y1="145" x2="175" y2="245" stroke="#F8D9C2" stroke-width="1" stroke-dasharray="2 2" />

    <!-- Code Block Visuals -->
    <g transform="translate(60, 56)">
      <!-- Level 0: Function def -->
      <text x="0" y="16" class="font-mono" font-size="10" font-weight="700" fill="#F16524">def</text>
      <text x="26" y="16" class="font-mono" font-size="10" font-weight="600" fill="#241A16">process_curriculum(catalog: list):</text>

      <!-- Level 1: Docstring -->
      <text x="35" y="38" class="font-mono" font-size="9" font-style="italic" fill="#A89887">\"\"\"Generate automated adaptive quiz.\"\"\"</text>

      <!-- Level 1: Variable & Generator -->
      <text x="35" y="60" class="font-mono" font-size="10" fill="#8F3215">results = []</text>
      <text x="35" y="82" class="font-mono" font-size="10" font-weight="700" fill="#F16524">for</text>
      <text x="62" y="82" class="font-mono" font-size="10" fill="#241A16">unit</text>
      <text x="92" y="82" class="font-mono" font-size="10" font-weight="700" fill="#F16524">in</text>
      <text x="110" y="82" class="font-mono" font-size="10" fill="#241A16">catalog:</text>

      <!-- Level 2: Conditional -->
      <text x="75" y="104" class="font-mono" font-size="10" font-weight="700" fill="#F16524">if</text>
      <text x="92" y="104" class="font-mono" font-size="10" fill="#241A16">unit.published:</text>

      <!-- Level 3: Comprehension Yield -->
      <rect x="115" y="116" width="210" height="28" rx="4" fill="#F8D9C2" fill-opacity="0.4" stroke="#F16524" stroke-width="1" />
      <text x="125" y="134" class="font-mono" font-size="9" fill="#8F3215">results.append(unit.score)</text>

      <!-- Level 1: Return -->
      <text x="35" y="168" class="font-mono" font-size="10" font-weight="700" fill="#F16524">return</text>
      <text x="80" y="168" class="font-mono" font-size="10" fill="#241A16">{ 'scores': results }</text>
    </g>

    <!-- Pipeline conveyor pill -->
    <g transform="translate(60, 240)">
      <rect x="0" y="0" width="330" height="26" rx="4" fill="#FBF3EA" stroke="#E3D8CB" />
      <text x="12" y="17" class="font-mono" font-size="8" font-weight="600" fill="#8F3215">STREAM: iter() ➔ filter() ➔ map() ➔ list()</text>
      <text x="315" y="17" text-anchor="end" class="font-mono" font-size="8" font-weight="700" fill="#F16524">O(N)</text>
    </g>
  </g>

  <!-- Bottom Metadata Bar -->
  <g transform="translate(48, 480)">
    <line x1="0" y1="0" x2="864" y2="0" stroke="#EFE5D8" stroke-width="1" />
    <text x="0" y="18" class="font-sans" font-size="10" font-weight="700" letter-spacing="1.5" fill="#241A16">CATEGORY: SCRIPTING &amp; AUTOMATION</text>
    <text x="280" y="18" class="font-sans" font-size="10" font-weight="600" letter-spacing="1.5" fill="#8F3215">LEVEL: BEGINNER</text>
    <text x="500" y="18" class="font-mono" font-size="10" fill="#A89887">MODULES: 03 · LESSONS: 62</text>
    
    <g transform="translate(770, 6)">
      <line x1="0" y1="0" x2="0" y2="14" stroke="#241A16" stroke-width="2" />
      <line x1="6" y1="0" x2="6" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="12" y1="0" x2="12" y2="14" stroke="#241A16" stroke-width="1.5" />
      <line x1="18" y1="0" x2="18" y2="14" stroke="#241A16" stroke-width="2.5" />
      <line x1="26" y1="0" x2="26" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="32" y1="0" x2="32" y2="14" stroke="#241A16" stroke-width="2" />
      <line x1="38" y1="0" x2="38" y2="14" stroke="#241A16" stroke-width="1" />
      <line x1="44" y1="0" x2="44" y2="14" stroke="#241A16" stroke-width="3" />
      <text x="54" y="12" class="font-mono" font-size="9" fill="#A89887">KTS-09</text>
    </g>
  </g>
</svg>
"""

COVERS = {
    "html.svg": HTML_SVG,
    "css.svg": CSS_SVG,
    "javascript.svg": JAVASCRIPT_SVG,
    "react.svg": REACT_SVG,
    "fullstack.svg": FULLSTACK_SVG,
    "java.svg": JAVA_SVG,
    "mongodb.svg": MONGODB_SVG,
    "c.svg": C_SVG,
    "python.svg": PYTHON_SVG,
}

def generate_all():
    for filename, content in COVERS.items():
        file_path = OUTPUT_DIR / filename
        file_path.write_text(content.strip(), encoding="utf-8")
        print(f"[GENERATED] {file_path} ({len(content)} bytes)")
    print(f"\nAll {len(COVERS)} covers successfully generated in {OUTPUT_DIR}!")

if __name__ == "__main__":
    generate_all()
