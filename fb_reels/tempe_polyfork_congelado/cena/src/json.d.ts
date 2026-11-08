declare module '*.json' { const v: any; export default v; }
declare module '*.mjs' { export const createAsset: (p?: any) => import('three').Group; }
