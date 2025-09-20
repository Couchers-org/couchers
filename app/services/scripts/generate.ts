import { execSync } from "child_process";
import { readFile, readdir } from "fs/promises";
import path from "path";
import { Project, VariableDeclarationKind } from "ts-morph";
import { fileURLToPath } from "url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const protoDir = path.resolve(dirname, "../../proto");

const sourceDir = path.resolve(dirname, "../generated/bufbuild");

const bufBinPath = path.resolve(
  dirname,
  "../../node_modules/@bufbuild/buf/bin/buf",
);

execSync(`${bufBinPath} generate ${protoDir}`);

const files = await readdir(sourceDir, { withFileTypes: true });

const project = new Project();

const file = project.createSourceFile(`generated/index.ts`, "", {
  overwrite: true,
});

const services: [string, string][] = [];

await files.reduce<Promise<void>>(async (prev, sourceFile) => {
  await prev;

  if (sourceFile.isDirectory()) {
    return;
  }

  const truncatedFileName = sourceFile.name.slice(0, -6);
  const fileContent = await readFile(
    path.resolve(sourceFile.parentPath, sourceFile.name),
    "utf-8",
  );

  const namePattern = /export const (.*): GenService<{/;
  const regexMatch = fileContent.match(namePattern);

  const serviceName = regexMatch?.[1];

  if (!serviceName) {
    return;
  }

  services.push([truncatedFileName, serviceName]);
}, Promise.resolve());

file.addImportDeclarations([
  {
    defaultImport: "createClient",
    moduleSpecifier: "../client",
  },
  {
    namedImports: ["UnauthenticatedCallback", "createAuthInterceptor"],
    moduleSpecifier: "../authInterceptor",
  },
  {
    namedImports: ["createConnectTransport"],
    moduleSpecifier: "@connectrpc/connect-web",
  },
]);

services.forEach(([truncatedFileName, serviceName]) => {
  file.addImportDeclarations([
    {
      // "defaultImport":
      namespaceImport:
        serviceName.charAt(0).toUpperCase() + serviceName.slice(1),
      // namedImports: [
      //   serviceName.charAt(0).toUpperCase() + serviceName.slice(1),
      // ],

      moduleSpecifier: `./bufbuild/${truncatedFileName}_pb`,
    },
  ]);
});

file.addVariableStatement({
  declarations: [
    {
      name: "createServiceClients",
      initializer: (writer) => {
        writer
          .write(
            "(baseUrl: string, unauthenticatedCallback: UnauthenticatedCallback, defaultTimeoutMs: number | undefined = undefined) => {",
          )
          .indent(() => {
            writer.writeLine(
              `const authInterceptor = createAuthInterceptor(unauthenticatedCallback);`,
            );

            writer.writeLine(
              `const transport = createConnectTransport({ baseUrl, defaultTimeoutMs, interceptors: [authInterceptor] });`,
            );

            services.forEach(([truncatedFileName, serviceName]) => {
              writer.writeLine(
                `const ${truncatedFileName}Client = createClient(${serviceName}.${serviceName}, transport)`,
              );
            });

            writer
              .write("return {")
              .indent(() => {
                services.forEach(([truncatedFileName]) => {
                  writer.writeLine(
                    `${truncatedFileName}: ${truncatedFileName}Client,`,
                  );
                });
              })
              .write("}");
          })
          .write("}");
      },
    },
  ],
  isExported: true,
  declarationKind: VariableDeclarationKind.Const,
});

file.addExportDeclaration({
  namedExports: services.map(([_, serviceName]) => serviceName),
});

// services.forEach(([truncatedFileName, serviceName]) => {
//   file.addStatements(
//     `export * as ${serviceName} from "./bufbuild/${truncatedFileName}_pb"`,
//   );
// });

file.saveSync();

// services.forEach(([truncatedFileName, serviceName]) => {
//   file.addImportDeclarations([
//     {
//       namedImports: [
//         serviceName.charAt(0).toUpperCase() + serviceName.slice(1),
//       ],
//       moduleSpecifier: `./bufbuild/${truncatedFileName}_pb`,
//     },
//   ]);
// });
