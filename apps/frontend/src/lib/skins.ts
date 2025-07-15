// Image filter definitions for use in the editor and anywhere else
// Each filter has a name, a CSS filter string, and an optional preview style

export interface ImageFilter {
  name: string
  css: string // CSS filter string
  previewStyle?: React.CSSProperties // Optional: for preview thumbnails
}

export const IMAGE_FILTERS: ImageFilter[] = [
  {
    name: 'None',
    css: 'none',
  },
  {
    name: 'Paris',
    css: 'brightness(1.1) contrast(1.2) saturate(1.3) sepia(0.1)',
  },
  {
    name: 'Aden',
    css: 'brightness(1.15) contrast(0.9) sepia(0.2) saturate(1.2)',
  },
  {
    name: 'Vignette',
    css: 'brightness(0.9) contrast(1.1) grayscale(0.1)',
  },
  {
    name: 'Lark',
    css: 'brightness(1.1) contrast(1.05) saturate(1.2)',
  },
  {
    name: 'Moon',
    css: 'grayscale(1) contrast(1.1) brightness(1.1)',
  },
  {
    name: 'Juno',
    css: 'hue-rotate(-10deg) brightness(1.15) contrast(1.1) saturate(1.3)',
  },
  {
    name: 'Gingham',
    css: 'contrast(1.1) brightness(1.05) grayscale(0.04)',
  },
  {
    name: 'Clarendon',
    css: 'contrast(1.2) saturate(1.35) brightness(1.05)',
  },
  {
    name: 'Slumber',
    css: 'brightness(1.05) contrast(0.9) saturate(0.85) sepia(0.2)',
  },
  {
    name: 'Crema',
    css: 'brightness(1.04) contrast(1.05) sepia(0.08)',
  },
  // Add more filters as needed
]
