// src/vite-env.d.ts
interface ImportMetaEnv {
  readonly VITE_IMAGE_BASE_URL: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_IMG_URL: string;
  readonly VITE_ENVRIONMENT: string;
  readonly VITE_BASE_PATH: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
