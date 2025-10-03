import { camelCase } from "change-case";
import {
  CodeBlockWriter,
  EnumDeclaration,
  ExportedDeclarations,
  ImportSpecifierStructure,
  Node,
  OptionalKind,
  Project,
  PropertySignature,
  SyntaxKind,
  TypeAliasDeclaration,
} from "ts-morph";

const emptyTypeName = "_Empty";

export const generateServiceWrapper = (
  serviceFilename: string,
  serviceName: string,
  project: Project,
) => {
  const source = project.getSourceFile(
    `generated/bufbuild/${serviceFilename}_pb.ts`,
  );

  if (!source) {
    console.log("Failed to load file!");
    return;
  }

  const file = project.createSourceFile(
    `generated/serviceWrappers/${serviceFilename}.ts`,
    "",
    {
      overwrite: true,
    },
  );

  const exportedDeclarations = source.getExportedDeclarations();

  const extractServiceFunctions = (exports: ExportedDeclarations[]) => {
    exports.forEach((decl) => {
      const l = decl.getChildAtIndex(2);

      const typeRef = l.asKind(SyntaxKind.TypeReference);

      if (!typeRef) {
        return;
      }

      const syntaxList = typeRef
        .getChildAtIndex(2)
        .asKind(SyntaxKind.SyntaxList);

      if (!syntaxList) {
        return;
      }

      const typeLiteral = syntaxList
        .getChildAtIndex(0)
        .asKind(SyntaxKind.TypeLiteral);

      if (!typeLiteral) {
        return;
      }

      const syntaxList2 = typeLiteral
        .getChildAtIndex(1)
        .asKind(SyntaxKind.SyntaxList);

      if (!syntaxList2) {
        return;
      }

      syntaxList2.getChildren().forEach((child) => {
        const sig = child.asKind(SyntaxKind.PropertySignature);

        if (!sig) {
          return;
        }

        // const funcName = sig.getName();

        const syntaxList = sig
          .getChildAtIndex(3)
          .asKind(SyntaxKind.TypeLiteral)
          ?.getChildAtIndex(1)
          .asKind(SyntaxKind.SyntaxList);

        if (!syntaxList) {
          return;
        }

        const extractFunctionSignature = (signature: PropertySignature) => {
          const t = signature
            .getChildAtIndex(2)
            .getChildAtIndex(1)
            .asKind(SyntaxKind.Identifier);

          // console.log(t?.getText());
        };

        const input = syntaxList
          .getChildAtIndex(1)
          .asKind(SyntaxKind.PropertySignature);
        const output = syntaxList
          .getChildAtIndex(2)
          .asKind(SyntaxKind.PropertySignature);

        if (input) {
          extractFunctionSignature(input);
        }

        // extractFunctionSignature(output);

        // console.log(`Input: ${input?.getText()}, Output: ${output?.getText()}`);
        // syntaxList.getChildren().forEach((child) => {
        //   console.log(child.getKindName());

        //   // console.log(child.getChildAtIndex(2).getKindName());

        //   // const input = child
        //   //   .getChildAtIndex(1)
        //   //   .asKind(SyntaxKind.PropertySignature);

        //   // console.log(input?.getKindName());
        //   // const output = child
        //   //   .getChildAtIndex(2)
        //   //   .asKind(SyntaxKind.PropertySignature);

        //   // console.log(
        //   //   `Input: ${input?.getName()}, Output: ${output?.getName()}`,
        //   // );
        // });

        // funcSchema.getChildren().forEach((child) => {
        //   console.log(child.getKind());
        // });

        // console.log(sig.getName());

        // sig.getChildren().forEach((child) => {
        //   console.log(child.getKind());
        // });

        // console.log(child.getKind());
      });

      // syntaxList.getChildren().forEach((child) => {
      //   console.log(child.getKind());
      // });
      // console.log(syntaxList.getText());

      // syntaxList.getChildren().forEach((child) => {
      //   console.log(child);
      // });

      // typeRef.getChildren().forEach((child) => {
      //   console.log(`Child! ${child.getKind()}`);
      // });

      // console.log(typeRef.getFullText());

      // l.asKind(SyntaxKind.)

      // decl.forEachChild((child) => {
      //   console.log("_________");
      //   console.log(child.getText());
      //   console.log("_________\n\n");
      // });

      // console.log("decl");

      // console.log(decl.getKind());

      // // console.log(decl)

      // if (decl.isKind(SyntaxKind.FunctionDeclaration)) {
      //   console.log(`Func`);
      // }

      // if (decl.isKind(SyntaxKind.ExportAssignment)) {
      //   console.log("Export ass!");
      // }
    });
  };

  const exportedEnums: EnumDeclaration[] = [];
  const exportedTypes: TypeAliasDeclaration[] = [];

  exportedDeclarations.entries().forEach(([key, val]) => {
    if (key === serviceName) {
      extractServiceFunctions(val);
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
    // TODO(FB) This could technically filter out poorly named non-request types,
    // consider making this more robust
    if (
      typeAlias.getName().endsWith("ReqValid") ||
      typeAlias.getName().endsWith("ResValid")
    ) {
      return;
    }

    exportedTypes.push(typeAlias);
  });

  source.getImportDeclarations().forEach((importDeclaration) => {
    const structure = importDeclaration.getStructure();

    if (!structure.moduleSpecifier.endsWith("_pb")) {
      return;
    }

    structure.moduleSpecifier = structure.moduleSpecifier.slice(0, -3);

    const newNamedImports = (
      structure.namedImports as OptionalKind<ImportSpecifierStructure>[]
    ).filter(
      (namedImport) =>
        !namedImport.name.startsWith("file_") &&
        !namedImport.name.endsWith("Schema"),
    );

    const importFile = importDeclaration.getModuleSpecifierSourceFile();

    if (!importFile) {
      // TODO(FB) Handle properly
      throw new Error();
    }

    const exportedDeclarations = importFile.getExportedDeclarations();

    importDeclaration.getNamedImports().forEach((namedImport) => {
      // namedImport.

      const exportedType = exportedDeclarations
        .get(namedImport.getName())?.[0]
        .asKind(SyntaxKind.TypeAliasDeclaration);

      if (!exportedType) {
        return;
      }

      const intersectionType = exportedType.getChildrenOfKind(
        SyntaxKind.IntersectionType,
      )[0];

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!intersectionType) {
        return;
      }

      const propertyCount = intersectionType
        .getTypeNodes()[1]
        .getChildAtIndexIfKind(1, SyntaxKind.SyntaxList)
        ?.getChildrenOfKind(SyntaxKind.PropertySignature).length;

      if (propertyCount === undefined) {
        return;
      }

      if (!propertyCount) {
        const importIdentifier = namedImport.getChildAtIndexIfKind(
          0,
          SyntaxKind.Identifier,
        );

        if (!importIdentifier) {
          return;
        }

        newNamedImports.splice(
          newNamedImports.findIndex((i) => i.name === namedImport.getName()),
          1,
        );

        importIdentifier.findReferencesAsNodes().forEach((node) => {
          node.replaceWithText(emptyTypeName);
        });
      }
    });

    if (!newNamedImports.length) {
      return;
    }

    structure.namedImports = newNamedImports;

    file.addImportDeclaration(structure);
  });

  file.addImportDeclaration({
    moduleSpecifier: "../..",
    namedImports: ["Timestamp", "Duration"],
    isTypeOnly: true,
  });

  exportedEnums.forEach((enumDeclaration) => {
    const enumStructure = enumDeclaration.getStructure();

    enumStructure.members?.forEach((member) => {
      member.name = camelCase(member.name);
    });

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

        // case SyntaxKind.TypeReference:
        //   if (node.getText() === "Timestamp") {
        //     // Convert timestamps to dates
        //     newTypeWriter.write("Date");
        //   } else {
        //     newTypeWriter.write(node.getFullText());
        //   }
        //   return;

        case SyntaxKind.JSDoc:
          return;

        default:
          newTypeWriter.write(node.getFullText());
          return;
      }

      // Remove all references to empty types
      if (
        children.find(
          (child) =>
            child.getKind() === SyntaxKind.TypeReference &&
            child.getText() === emptyTypeName,
        )
      ) {
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

  // Filter out all empty message types and replace references to them with '_Empty'
  exportedTypes.forEach((type) => {
    const intersectionType = type.getChildAtIndexIfKind(
      5,
      SyntaxKind.IntersectionType,
    );

    if (!intersectionType) {
      // We only care about messages, which are always intersection types
      return;
    }

    const objProps = intersectionType
      .getTypeNodes()[1]
      .getChildAtIndexIfKind(1, SyntaxKind.SyntaxList);

    if (!objProps) {
      return;
    }

    const props = objProps.getChildrenOfKind(SyntaxKind.PropertySignature);

    if (!props.length) {
      type.findReferencesAsNodes().forEach((node) => {
        node.replaceWithText(emptyTypeName);
      });
    }
  });

  exportedTypes.forEach(reconstructType);

  file.formatText();
  file.saveSync();
};
