import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import { globSync } from "glob";
import { createRequire } from "module";
import path from "path";
import { RollupOptions, rollup } from "rollup";
import { Project } from "ts-morph";
import { fileURLToPath } from "url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const protoDir = path.resolve(dirname, "../proto");
const tempDir = path.resolve(dirname, "../temp");
const outDir = path.resolve(dirname, "../dist");

const grpcClientSuffixWithoutExtension = "_grpc_web_pb";
const grpcClientSuffix = `${grpcClientSuffixWithoutExtension}.js`;

const inputFiles = globSync(path.resolve(protoDir, "*.js")).filter((path) =>
  path.endsWith(grpcClientSuffix),
);

const project = new Project({
  tsConfigFilePath: path.resolve(dirname, "../tsconfig.json"),
});

const require = createRequire(import.meta.url);

const tempFiles = (
  await Promise.all(
    inputFiles.map(async (file) => {
      const filenameWithoutExtension = path.basename(file, path.extname(file));
      const serviceName = path.basename(file, grpcClientSuffix);
      const outFileBasename = `${serviceName}_pb.js`;
      const outFilePath = path.resolve(tempDir, outFileBasename);
      const outFilePath2 = path.resolve(
        tempDir,
        `${serviceName}_grpc_web_pb.js`,
      );

      const exports = (await require(file)) as Record<string, unknown>;

      const wrapper = project.createSourceFile(outFilePath, "", {
        overwrite: true,
      });

      const relativePathToSource = path.relative(
        tempDir,
        path.resolve(protoDir, filenameWithoutExtension),
      );

      wrapper.addImportDeclarations([
        {
          moduleSpecifier: relativePathToSource,
          namespaceImport: "mod",
        },
      ]);

      Object.keys(exports).forEach((key) => {
        wrapper.addVariableStatement({
          isExported: true,
          declarations: [
            {
              name: key,
              initializer: `mod.${key}`,
            },
          ],
        });
      });

      wrapper.saveSync();

      wrapper.copy(outFilePath2, { overwrite: true }).saveSync();

      return [outFilePath, outFilePath2];
    }),
  )
).flat();

const rollupInput = Object.fromEntries(
  tempFiles.map((filePath) => [
    path.basename(filePath, path.extname(filePath)),
    filePath,
  ]),
);

const rollupOptions: RollupOptions = {
  input: rollupInput,
  plugins: [
    resolve(),
    commonjs({
      defaultIsModuleExports: "auto",
    }),
  ],
};

const bundle = await rollup(rollupOptions);

await bundle.write({
  dir: path.resolve(outDir, "esm"),
  format: "esm",
});

await bundle.write({
  dir: path.resolve(outDir, "cjs"),
  format: "commonjs",
});
