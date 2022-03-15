import * as path from "path";
import { pathExistsSync, readFileSync } from "fs-extra";
import { getRulePages, getDefinitionPages } from "./utils/get-page-data";
import { createFile } from "./utils";
import { createMatrixFile } from "./rule-transform/create-matrix-file";
import { getRuleContent } from "./rule-transform/get-rule-content";
import { DefinitionPage, RulePage } from "./types";
import { createWcagMapping } from "./rule-transform/create-wcag-mapping";
import { isEqualExcludingDates } from "./utils/is-equal-excluding-dates";

export type RuleTransformOptions = Partial<{
  rulesDir: string;
  glossaryDir: string;
  outDir: string;
  ruleIds: string[];
  proposed: boolean;
  noExampleLinks: boolean;
  matrix: boolean;
}>;

export async function ruleTransform({
  rulesDir = ".",
  glossaryDir = ".",
  ruleIds = [],
  outDir = ".",
  proposed = false,
  noExampleLinks = false,
  matrix = true,
}: RuleTransformOptions): Promise<void> {
  const options = { proposed, matrix, noExampleLinks };
  const rulesData = getRulePages(rulesDir, ruleIds);
  const glossary = getDefinitionPages(glossaryDir);

  for (const ruleData of rulesData) {
    const { content } = buildTfRuleFile(ruleData, glossary, options, rulesData);
    const ruleId = ruleData.frontmatter.id;
    const fileName = path.join(ruleId, `${proposed ? "proposed" : "index"}.md`);
    const absolutePath = path.resolve(outDir, "content", "rules", fileName);
    saveRuleFileIfChanged(absolutePath, content);

    if (options.matrix) {
      await createMatrixFile(outDir, ruleData.frontmatter?.id, proposed);
    }
  }

  const wcagMappingPath = path.resolve(outDir, "wcag-mapping.json");
  await createWcagMapping(wcagMappingPath, rulesData, options);
  console.log(`Updated ${wcagMappingPath}`);
}

function buildTfRuleFile(
  ruleData: RulePage,
  glossary: DefinitionPage[],
  options: Record<string, boolean | undefined>,
  rulesData: RulePage[]
) {
  return {
    filepath: ruleData.filename,
    content: getRuleContent(ruleData, glossary, options, rulesData),
  };
}

async function saveRuleFileIfChanged(
  absolutePath: string,
  newContent: string
): Promise<void> {
  let contentChanged = true;
  if (pathExistsSync(absolutePath)) {
    const currentContent = readFileSync(absolutePath, "utf8");
    contentChanged = !isEqualExcludingDates(currentContent, newContent);
  }

  if (contentChanged) {
    await createFile(absolutePath, newContent);
    console.log(`Updated ${absolutePath}`);
  } else {
    console.log(`Skipped ${absolutePath}, no changes`);
  }
}
