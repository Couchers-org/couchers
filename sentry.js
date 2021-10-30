const SentryCli = require("@sentry/cli");

async function createReleaseAndUpload() {
  const release = process.env.NEXT_PUBLIC_VERSION;
  if (!release) {
    console.warn("NEXT_PUBLIC_VERSION is not set");
    return;
  }

  /**
   * @type import("@sentry/cli").default
   */
  const cli = new SentryCli();

  try {
    console.log(`Creating sentry release ${release}`);
    await cli.releases.new(release);
    console.log("Uploading source maps");
    await cli.releases.uploadSourceMaps(release, {
      include: ["build/static/js"],
      urlPrefix: "~/static/js",
      rewrite: false,
    });
    console.log("Finalizing release");
    await cli.releases.finalize(release);
  } catch (e) {
    console.error("Source maps uploading failed:", e);
  }
}
createReleaseAndUpload();
