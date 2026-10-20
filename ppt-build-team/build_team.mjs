import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { FileBlob, PresentationFile } from "file:///C:/Users/akshita%20sharda/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const workspaceDir = "C:/Users/akshita sharda/Documents/ChatGPT/STUDYFORGE_AI";
const skillDir = "C:/Users/akshita sharda/.codex/plugins/cache/openai-primary-runtime/presentations/26.909.12148/skills/presentations";
const runtimePython = "C:/Users/akshita sharda/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe";
const sourcePath = path.join(workspaceDir, "ppt-output", "StudyForge_Midterm_Visual_Edition.pptx");
const finalPath = path.join(workspaceDir, "ppt-output-team", "StudyForge_Team_Presentation_3D_v2.pptx");
const stagingDir = path.join(workspaceDir, ".codex-finalizer-team");
const { resolvePresentationFont, finalizePresentation } = await import(pathToFileURL(
  path.join(skillDir, "container_tools", "artifact_tool_utils.mjs"),
).href);

await fs.mkdir(stagingDir, { recursive: true });
await fs.mkdir(path.dirname(finalPath), { recursive: true });
const presentation = await PresentationFile.importPptx(await FileBlob.load(sourcePath));

// Cover slide: list the four actual team members without assigning unverified roles.
presentation.resolve("sh/ul4vaxgb").text = "Akshita";
presentation.resolve("sh/vmdcj2xw").text = "Aasveer Singh";
presentation.resolve("sh/4r6dg7et").text = "Manik Jasrotia";
presentation.resolve("sh/5sfepcfe").text = "Team member";
presentation.resolve("sh/ipovexwn").text = "Aryan Rampal";

const candidatePath = path.join(stagingDir, "candidate.pptx");
await (await PresentationFile.exportPptx(presentation)).save(candidatePath);

const result = await finalizePresentation({
  explicitTotalSlideCount: 14,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
  workspaceDir,
  candidatePath,
  finalPath,
  pythonExecutable: runtimePython,
  integrityValidatorPath: path.join(skillDir, "container_tools", "inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(skillDir, "container_tools", "inspect_presentation_layout_geometry.py"),
  layoutArgs: ["--expected-slide-size-emu", "12192000,6858000", "--validate-bullet-geometry", "--validate-heading-fit"],
  fontPolicy: { basis: "design", families: [resolvePresentationFont()] },
  verifyArtifactToolImport: true,
  receiptPath: path.join(stagingDir, "StudyForge_Team_Presentation_3D_v2.validation.json"),
});
console.log(JSON.stringify(result, null, 2));
