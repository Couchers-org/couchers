// The dev-only shared flags file (../feature-flags/feature-flags.dev.json, mapped via tsconfig
// paths) is absent in production docker builds, where webpack also compiles the import out. This
// ambient declaration keeps tsc passing there; when the file exists, its real types win.
declare module "feature-flags.dev.json" {
  const flags: Record<string, boolean>;
  export default flags;
}
