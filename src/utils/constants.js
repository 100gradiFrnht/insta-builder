export const ASPECT_RATIOS = {
  '4:5': { width: 1080, height: 1350, label: '4:5 (Post)' },
  '1:1': { width: 1080, height: 1080, label: '1:1 (Square)' },
  '9:16': { width: 1080, height: 1920, label: '9:16 (Story)' }
};

const BASE_URL = import.meta.env.BASE_URL;

export const OVERLAY_PATHS = {
  'regular-white-4:5': `${BASE_URL}overlays/overlay-white-4-5.png`,
  'regular-white-1:1': `${BASE_URL}overlays/overlay-white-1-1.png`,
  'regular-white-9:16': `${BASE_URL}overlays/overlay-white-9-16.png`,
  'regular-black-4:5': `${BASE_URL}overlays/overlay-black-4-5.png`,
  'regular-black-1:1': `${BASE_URL}overlays/overlay-black-1-1.png`,
  'regular-black-9:16': `${BASE_URL}overlays/overlay-black-9-16.png`,
  'custom-white-4:5': `${BASE_URL}overlays/overlay-white-4-5.png`,
  'custom-white-1:1': `${BASE_URL}overlays/overlay-white-1-1.png`,
  'custom-white-9:16': `${BASE_URL}overlays/overlay-white-9-16.png`,
  'custom-black-4:5': `${BASE_URL}overlays/overlay-black-4-5.png`,
  'custom-black-1:1': `${BASE_URL}overlays/overlay-black-1-1.png`,
  'custom-black-9:16': `${BASE_URL}overlays/overlay-black-9-16.png`
};
