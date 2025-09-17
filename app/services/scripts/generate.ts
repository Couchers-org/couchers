import { Project } from "ts-morph";

const project = new Project();
const file = project.createSourceFile("output.ts", "", { overwrite: true });

file.addInterface({
  name: "Person",
  isExported: true,
  properties: [
    { name: "name", type: "string" },
    { name: "age", type: "number" },
  ],
});

file.saveSync();
