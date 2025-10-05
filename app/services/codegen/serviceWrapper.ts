import { camelCase } from "change-case";
import {
  CodeBlockWriter,
  EnumDeclaration,
  Identifier,
  Node,
  Project,
  ReferenceFindableNode,
  SourceFile,
  SyntaxKind,
  TypeAliasDeclaration,
  VariableDeclaration,
  VariableDeclarationKind,
} from "ts-morph";

const generateServiceClientGenerator = (
  serviceName: string,
  file: SourceFile,
  serviceSpecDeclaration: VariableDeclaration,
) => {
  const functionSpecs = serviceSpecDeclaration
    .getChildAtIndex(2)
    .getChildAtIndex(2)
    .getChildAtIndex(0)
    .getChildAtIndex(1)
    .getChildrenOfKind(SyntaxKind.PropertySignature);

  file.addVariableStatement({
    declarations: [
      {
        name: `create${serviceName}Client`,
        initializer: (writer) => {
          writer
            .write("(transport: Transport) => {")
            .indent(() => {
              writer.writeLine(
                `const client = createClient(${serviceName}, transport)`,
              );

              functionSpecs.forEach((functionSpec) => {
                const syntaxList = functionSpec
                  .getChildAtIndex(3)
                  .getChildAtIndexIfKindOrThrow(1, SyntaxKind.SyntaxList);

                const extractFunctionSpecComponent = (
                  component: "input" | "output",
                ) => {
                  const identifier = syntaxList
                    .getChildAtIndex(component === "input" ? 1 : 2)
                    .getChildAtIndex(2)
                    .getChildAtIndexIfKindOrThrow(1, SyntaxKind.Identifier);

                  const typeName = identifier.getText().slice(0, -6);

                  if (typeName === "Empty") {
                    return undefined;
                  }

                  return typeName;
                };

                const input = extractFunctionSpecComponent("input");
                const output = extractFunctionSpecComponent("output");

                writer.writeLine(
                  `const ${functionSpec.getName()} = async (${input ? `input: ${input}` : ""}) ${output ? `: Promise<${output}>` : ""}=> {`,
                );

                writer
                  .indent(() => {
                    writer.writeLine(
                      `${output ? "return " : ""}await client.${functionSpec.getName()}(${input ? "input" : "{}"} as any) ${output ? "as any" : ""};`,
                    );
                  })
                  .writeLine("};");
              });

              writer
                .writeLine("return {")
                .indent(() => {
                  functionSpecs.forEach((spec) => {
                    writer.writeLine(`${spec.getName()},`);
                  });
                })
                .writeLine("};");
            })
            .write("}");
        },
      },
    ],
    isExported: true,
    declarationKind: VariableDeclarationKind.Const,
  });
};

const removeReferences = (referenceNode: ReferenceFindableNode) => {
  referenceNode.findReferencesAsNodes().forEach((node) => {
    const parent = node.getParent();

    switch (parent?.getKind()) {
      case SyntaxKind.TypeReference:
        {
          parent.getParentIfKind(SyntaxKind.PropertySignature)?.remove();
        }
        break;
      case SyntaxKind.ImportSpecifier:
        {
          parent.asKind(SyntaxKind.ImportSpecifier)?.remove();
        }
        break;
      default:
        break;
    }
  });
};

export const generateServiceWrapper = (
  serviceFilename: string,
  serviceName: string,
  project: Project,
) => {
  const source = project.getSourceFileOrThrow(
    `generated/bufbuild/${serviceFilename}_pb.ts`,
  );

  const file = project.createSourceFile(
    `generated/serviceWrappers/${serviceFilename}.ts`,
    "",
    {
      overwrite: true,
    },
  );

  const disabledEslintRules = [
    "@typescript-eslint/no-explicit-any",
    "@typescript-eslint/no-unsafe-argument",
    "@typescript-eslint/no-unsafe-return",
  ];

  file.addStatements(`/* eslint-disable ${disabledEslintRules.join(",")}*/`);

  const exportedDeclarations = source.getExportedDeclarations();

  const exportedEnums: EnumDeclaration[] = [];
  const exportedTypes: TypeAliasDeclaration[] = [];

  let serviceSpecDeclaration: VariableDeclaration | undefined;

  exportedDeclarations.entries().forEach(([key, val]) => {
    if (key === serviceName) {
      serviceSpecDeclaration = val[0].asKindOrThrow(
        SyntaxKind.VariableDeclaration,
      );
      return;
    }

    const enumDeclaration = val[0].asKind(SyntaxKind.EnumDeclaration);
    if (enumDeclaration) {
      exportedEnums.push(enumDeclaration);
      return;
    }

    const typeAlias = val[0].asKind(SyntaxKind.TypeAliasDeclaration);
    if (!typeAlias) {
      return;
    }

    // Filter out the 'xValid' types, which are redundant
    // TODO(FB) This could theoretically filter out poorly named non-request types,
    // consider making this more robust
    if (
      typeAlias.getName().endsWith("ReqValid") ||
      typeAlias.getName().endsWith("ResValid")
    ) {
      return;
    }

    exportedTypes.push(typeAlias);
  });

  if (!serviceSpecDeclaration) {
    throw new Error("No service spec found");
  }

  source.getImportDeclarations().forEach((importDeclaration) => {
    const structure = importDeclaration.getStructure();

    if (
      !structure.moduleSpecifier.endsWith("_pb") ||
      structure.moduleSpecifier.startsWith("./google/api/")
    ) {
      return;
    }

    structure.moduleSpecifier = structure.moduleSpecifier.slice(0, -3);

    const newImports = importDeclaration
      .getNamedImports()
      .filter((i) => !i.getName().startsWith("file_"))
      .map((i) => {
        const structure = i.getStructure();

        if (structure.name.endsWith("Schema")) {
          structure.name = structure.name.slice(0, -6);
        }

        return structure;
      });

    if (!newImports.length) {
      return;
    }

    structure.namedImports = newImports;

    file.addImportDeclaration(structure);
  });

  file.addImportDeclaration({
    moduleSpecifier: `../bufbuild/${serviceFilename}_pb`,
    namedImports: [serviceName],
  });

  exportedEnums.forEach((enumDeclaration) => {
    const enumStructure = enumDeclaration.getStructure();

    enumStructure.members?.forEach((member) => {
      member.name = camelCase(member.name);
    });

    const underscoreIndex = enumStructure.name.lastIndexOf("_");

    if (underscoreIndex !== -1) {
      const newName = enumStructure.name.substring(underscoreIndex + 1);

      enumStructure.name = newName;
      enumDeclaration.rename(newName);
    }

    file.addEnum(enumStructure);
  });

  const reconstructType = (typeAlias: TypeAliasDeclaration) => {
    const structure = typeAlias.getStructure();

    const intersectionType = typeAlias.getChildAtIndexIfKind(
      5,
      SyntaxKind.IntersectionType,
    );

    if (!intersectionType) {
      // We only care about messages, which are always intersection types
      return;
    }

    const typeNode = intersectionType.getTypeNodes()[1];

    const objProps = intersectionType
      .getTypeNodes()[1]
      .getChildAtIndexIfKind(1, SyntaxKind.SyntaxList);

    if (!objProps) {
      return;
    }

    const props = objProps.getChildrenOfKind(SyntaxKind.PropertySignature);

    if (!props.length) {
      // Don't create empty message types
      return;
    }

    const newTypeWriter = new CodeBlockWriter();

    const writeTypeStringRecursive = (node: Node, depth: number) => {
      const children = node.getChildren();

      switch (node.getKind()) {
        case SyntaxKind.SyntaxList:
        case SyntaxKind.TypeLiteral:
        case SyntaxKind.UnionType:
        case SyntaxKind.PropertySignature:
          break;
        case SyntaxKind.JSDoc:
          return;
        default:
          newTypeWriter.write(node.getFullText());
          return;
      }

      children.forEach((child) => {
        writeTypeStringRecursive(child, depth + 1);
      });

      return;
    };

    writeTypeStringRecursive(typeNode, 0);

    file.addTypeAlias({
      ...structure,
      type: newTypeWriter.toString(),
    });
  };

  // Filter out all empty message types
  exportedTypes.forEach((type) => {
    // Get only intersection types (messages are always intersection types), then get the second type of the intersection
    // (the actual message properties) and count the properties it has
    const addedPropertyCount = type
      .getChildAtIndexIfKind(5, SyntaxKind.IntersectionType)
      ?.getTypeNodes()[1]
      .getChildAtIndexIfKind(1, SyntaxKind.SyntaxList)
      ?.getChildrenOfKind(SyntaxKind.PropertySignature).length;

    if (addedPropertyCount === 0) {
      removeReferences(type);
    }
  });

  exportedTypes.forEach(reconstructType);

  generateServiceClientGenerator(serviceName, file, serviceSpecDeclaration);

  file.fixMissingImports();
  file.fixUnusedIdentifiers();

  file.getImportDeclarations().forEach((importDeclaration) => {
    importDeclaration.getNamedImports().forEach((nameImport) => {
      if (
        nameImport.getNameNode().getSymbol()?.getAliasedSymbol()?.getName() ===
        "unknown"
      ) {
        removeReferences(nameImport.getNameNode() as Identifier);
      }
    });
  });

  file.formatText();
  file.saveSync();
};
