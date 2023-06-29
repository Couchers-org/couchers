import fs from "fs";
import path from "path";

function convertExportsToObject(constants: Record<string, unknown>) {
  const wantedEntries = Object.entries(constants)
    .filter(([, value]) => {
      // Keep only simple strings, as objects/functions will likely require more thoughts to
      // convert on actual usage
      return typeof value === "string";
    })
    .map(([key, value]) => [key.toLowerCase(), value]);

  return Object.fromEntries(wantedEntries);
}

function getConstantFilePaths(srcFolder: string) {
  let constantFilePaths: string[] = [];

  const folderContent = fs.readdirSync(srcFolder);

  const constantFile = folderContent.find((content) =>
    content.includes("constants")
  );
  if (constantFile) {
    constantFilePaths.push(path.join(srcFolder, constantFile));
  }

  const subFolders = folderContent
    .map((content) => path.join(srcFolder, content))
    .filter((path) => fs.statSync(path).isDirectory());
  subFolders.forEach((folder) => {
    const constantFile = getConstantFilePaths(folder);
    constantFilePaths.push(...constantFile);
  });

  return constantFilePaths;
}

async function main() {
  const featuresFoldersRoot = path.join(__dirname, "../src/features");
  const constantFilePaths = getConstantFilePaths(featuresFoldersRoot);

  await Promise.all(
    constantFilePaths.map(async (constantFile) => {
      try {
        const constants = await import(constantFile);
        const translationObject = convertExportsToObject(constants);
        const translationFilePath = path.join(
          path.dirname(constantFile),
          "locales",
          "en.json"
        );

        if (!fs.existsSync(translationFilePath)) {
          fs.mkdirSync(path.dirname(translationFilePath), { recursive: true });
          // Only create JSON resource file if it doesn't exist already
          fs.writeFileSync(
            translationFilePath,
            JSON.stringify(translationObject, null, 2),
            { encoding: "utf-8" }
          );
        }
      } catch (e) {
        console.log(`Error in ${constantFile}`);
        console.log(e);
      }
    })
  );
}

main();
