import sharp from "sharp";

const WIDTH = 1200;
const HEIGHT = 630;

const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(270, 45%, 12%)" />
      <stop offset="100%" stop-color="hsl(270, 40%, 8%)" />
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="hsl(270, 75%, 60%)" />
      <stop offset="100%" stop-color="hsl(270, 60%, 50%)" />
    </linearGradient>
    <linearGradient id="barGrad" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="hsl(270, 75%, 55%)" />
      <stop offset="100%" stop-color="hsl(270, 75%, 70%)" />
    </linearGradient>
    <linearGradient id="circleGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3B82F6" />
      <stop offset="100%" stop-color="#2563EB" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />

  <!-- Subtle glow -->
  <circle cx="900" cy="200" r="300" fill="hsl(270, 75%, 55%)" opacity="0.08" />
  <circle cx="200" cy="500" r="250" fill="hsl(270, 75%, 60%)" opacity="0.05" />

  <!-- Top accent line -->
  <rect x="0" y="0" width="${WIDTH}" height="4" fill="url(#accent)" />

  <!-- Logo icon -->
  <g transform="translate(80, 180) scale(0.55)">
    <circle cx="100" cy="100" r="85" stroke="url(#circleGrad)" stroke-width="12" stroke-linecap="round" stroke-dasharray="400 80" stroke-dashoffset="50" fill="none" />
    <rect x="70" y="115" width="20" height="45" rx="3" fill="url(#barGrad)" />
    <rect x="100" y="95" width="20" height="65" rx="3" fill="url(#barGrad)" />
    <rect x="130" y="75" width="20" height="85" rx="3" fill="url(#barGrad)" />
  </g>

  <!-- Brand name -->
  <text x="170" y="260" font-family="system-ui, -apple-system, Arial, sans-serif" font-size="48" font-weight="700" fill="white" letter-spacing="-1">Vault</text>

  <!-- Headline -->
  <text x="80" y="360" font-family="system-ui, -apple-system, Arial, sans-serif" font-size="56" font-weight="700" fill="white" letter-spacing="-1.5">Preveja seu caixa</text>
  <text x="80" y="430" font-family="system-ui, -apple-system, Arial, sans-serif" font-size="56" font-weight="700" fill="hsl(270, 75%, 65%)" letter-spacing="-1.5">antes do aperto.</text>

  <!-- Subtitle -->
  <text x="80" y="490" font-family="system-ui, -apple-system, Arial, sans-serif" font-size="24" fill="hsl(250, 15%, 65%)" letter-spacing="0">Copiloto financeiro com IA para MEIs e pequenos negócios</text>

  <!-- URL -->
  <text x="80" y="570" font-family="system-ui, -apple-system, Arial, sans-serif" font-size="20" fill="hsl(270, 75%, 60%)" font-weight="600" letter-spacing="0.5">vault.tec.br</text>

  <!-- Right side — mini chart -->
  <g transform="translate(750, 140)">
    <!-- Chart container -->
    <rect x="0" y="0" width="370" height="200" rx="16" fill="hsl(270, 40%, 15%)" stroke="hsl(270, 30%, 25%)" stroke-width="1" />

    <!-- Grid lines -->
    <line x1="30" y1="50" x2="340" y2="50" stroke="hsl(270, 20%, 22%)" stroke-width="0.5" stroke-dasharray="4 4" />
    <line x1="30" y1="100" x2="340" y2="100" stroke="hsl(270, 20%, 22%)" stroke-width="0.5" stroke-dasharray="4 4" />
    <line x1="30" y1="150" x2="340" y2="150" stroke="hsl(270, 20%, 22%)" stroke-width="0.5" stroke-dasharray="4 4" />

    <!-- Area -->
    <path d="M30,140 C70,130 110,100 150,80 C190,60 210,55 230,65 C260,78 290,60 340,50 L340,170 L30,170 Z" fill="hsl(270, 75%, 55%)" opacity="0.15" />

    <!-- Line -->
    <path d="M30,140 C70,130 110,100 150,80 C190,60 210,55 230,65" stroke="hsl(270, 75%, 60%)" stroke-width="3" fill="none" stroke-linecap="round" />

    <!-- Projected -->
    <path d="M230,65 C260,78 290,60 340,50" stroke="hsl(270, 75%, 60%)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-dasharray="6 4" opacity="0.5" />

    <!-- Current dot -->
    <circle cx="230" cy="65" r="5" fill="hsl(270, 75%, 60%)" />
    <circle cx="230" cy="65" r="9" fill="hsl(270, 75%, 60%)" opacity="0.25" />

    <!-- Label -->
    <text x="30" y="25" font-family="system-ui, Arial, sans-serif" font-size="12" fill="hsl(250, 15%, 55%)" font-weight="600">PROJEÇÃO DE CAIXA</text>

    <!-- X labels -->
    <text x="30" y="190" font-family="system-ui, Arial, sans-serif" font-size="10" fill="hsl(250, 15%, 45%)">Sem 1</text>
    <text x="130" y="190" font-family="system-ui, Arial, sans-serif" font-size="10" fill="hsl(250, 15%, 45%)">Sem 2</text>
    <text x="220" y="190" font-family="system-ui, Arial, sans-serif" font-size="10" fill="hsl(270, 75%, 60%)" font-weight="600">Hoje</text>
    <text x="300" y="190" font-family="system-ui, Arial, sans-serif" font-size="10" fill="hsl(250, 15%, 45%)">Sem 4</text>
  </g>

  <!-- Stats boxes -->
  <g transform="translate(750, 370)">
    <rect x="0" y="0" width="175" height="70" rx="12" fill="hsl(270, 40%, 15%)" stroke="hsl(270, 30%, 25%)" stroke-width="1" />
    <text x="16" y="28" font-family="system-ui, Arial, sans-serif" font-size="11" fill="hsl(250, 15%, 55%)" font-weight="600">SALDO ATUAL</text>
    <text x="16" y="55" font-family="system-ui, Arial, sans-serif" font-size="22" fill="white" font-weight="700">R$ 4.230</text>

    <rect x="195" y="0" width="175" height="70" rx="12" fill="hsl(270, 40%, 15%)" stroke="hsl(270, 30%, 25%)" stroke-width="1" />
    <text x="211" y="28" font-family="system-ui, Arial, sans-serif" font-size="11" fill="hsl(250, 15%, 55%)" font-weight="600">RECEITA</text>
    <text x="211" y="55" font-family="system-ui, Arial, sans-serif" font-size="22" fill="hsl(142, 76%, 46%)" font-weight="700">R$ 8.500</text>
  </g>
</svg>
`;

await sharp(Buffer.from(svg)).png({ quality: 95 }).toFile("public/og-image.png");
console.log("✓ og-image.png generated (1200x630)");

// Also generate JPG for backwards compat
await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile("public/og-image.jpg");
console.log("✓ og-image.jpg generated (1200x630)");
