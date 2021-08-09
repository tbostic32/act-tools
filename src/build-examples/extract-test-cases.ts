import { getRuleExamples } from "../act/get-rule-examples";
import { TestCase, RulePage } from "../types";

export type TestCaseData = {
  codeSnippet: string;
  filePath: string;
  metadata: TestCase;
};

export function extractTestCases(
  { frontmatter, markdownAST, body }: RulePage,
  { baseUrl = "https://act-rules.github.io" }: { baseUrl: string }
): TestCaseData[] {
  const {
    id: ruleId,
    name: ruleName,
    accessibility_requirements: ruleAccessibilityRequirements,
  } = frontmatter;

  const ruleData = {
    ruleId,
    ruleName,
    ruleAccessibilityRequirements,
  };

  const examples = getRuleExamples({ markdownAST, body });
  return examples.map(
    ({ codeSnippet, testcaseId, expected, title, language }): TestCaseData => {
      const filePath = `testcases/${ruleId}/${testcaseId}.${language}`;
      const metadata = {
        ...ruleData,
        expected,
        testcaseId,
        testcaseTitle: title,
        relativePath: filePath,
        url: `${baseUrl}/${filePath}`,
        rulePage: `${baseUrl}/rules/${ruleId}`,
      };

      return { codeSnippet, filePath, metadata };
    }
  );
}