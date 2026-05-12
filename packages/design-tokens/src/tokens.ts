export const tokens = {
  "core": {
    "color": {
      "ink": {
        "900": "#161a1e",
        "950": "#111213"
      },
      "surface": {
        "800": "#2b2f34"
      },
      "slate": {
        "500": "#8f969e"
      },
      "sage": {
        "500": "#7a8b7c"
      },
      "cream": {
        "100": "#f3f1ec",
        "200": "#d5d3cd"
      },
      "paper": {
        "200": "#ece3cc"
      },
      "neutral": {
        "200": "#dddddd",
        "300": "#d3d3d3"
      },
      "brand": {
        "200": "#ffe891",
        "500": "#ffc935"
      },
      "info": {
        "200": "#9ee9ff",
        "500": "#00d4ff"
      },
      "accent": {
        "200": "#ff8ab4",
        "500": "#ff3e8a"
      },
      "success": {
        "500": "#31c76a"
      },
      "danger": {
        "500": "#ff5252"
      }
    },
    "font": {
      "body": "Work Sans",
      "ui": "Inter",
      "display": "Dela Gothic One"
    },
    "space": {
      "1": 4,
      "2": 8,
      "3": 12,
      "4": 16,
      "5": 20,
      "6": 24,
      "7": 28,
      "8": 32,
      "10": 40
    },
    "radius": {
      "sm": 12,
      "md": 18,
      "lg": 22,
      "xl": 28,
      "pill": 999
    }
  },
  "semantic": {
    "color": {
      "bg": {
        "canvas": "#111213",
        "canvasAlt": "#161a1e",
        "surface": "#2b2f34",
        "glass": "rgba(43, 47, 52, 0.68)"
      },
      "text": {
        "primary": "#f3f1ec",
        "secondary": "#d5d3cd",
        "muted": "#8f969e"
      },
      "border": {
        "strong": "#8f969e",
        "subtle": "rgba(143, 150, 158, 0.18)"
      },
      "focus": "#00d4ff",
      "status": {
        "success": "#31c76a",
        "danger": "#ff5252",
        "info": "#00d4ff"
      },
      "chart": {
        "groceries": "#31c76a",
        "subscriptions": "#60a5fa",
        "transport": "#f59e0b",
        "dining": "#a78bfa",
        "other": "#8f969e"
      }
    },
    "font": {
      "body": "Work Sans",
      "ui": "Inter",
      "display": "Dela Gothic One"
    },
    "shadow": {
      "soft": "0 18px 60px rgb(0 0 0 / 22%)",
      "hard": "4px 4px 0 #111213"
    }
  },
  "platform": {
    "mobile": {
      "tabBar": {
        "height": 62
      },
      "hitTarget": {
        "min": 44
      }
    },
    "web": {
      "content": {
        "maxWidth": 1120
      }
    },
    "pencil": {
      "specimen": {
        "swatchSize": 72
      }
    }
  }
} as const;

export const colors = {
  bgCanvas: tokens.semantic.color.bg.canvas,
  bgCanvasAlt: tokens.semantic.color.bg.canvasAlt,
  bgSurface: tokens.semantic.color.bg.surface,
  bgGlass: tokens.semantic.color.bg.glass,
  textPrimary: tokens.semantic.color.text.primary,
  textSecondary: tokens.semantic.color.text.secondary,
  textMuted: tokens.semantic.color.text.muted,
  borderStrong: tokens.semantic.color.border.strong,
  borderSubtle: tokens.semantic.color.border.subtle,
  focus: tokens.semantic.color.focus,
  brand: tokens.core.color.brand[500],
  sage: tokens.core.color.sage[500],
  info: tokens.semantic.color.status.info,
  success: tokens.semantic.color.status.success,
  danger: tokens.semantic.color.status.danger,
  chart: tokens.semantic.color.chart
} as const;

export const fonts = tokens.semantic.font;
export const space = tokens.core.space;
export const radius = tokens.core.radius;
export const platform = tokens.platform;
