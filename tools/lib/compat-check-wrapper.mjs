import { checkVault } from '../check-vault.mjs';

export function runCompatibilityCheck(commandName, root = process.cwd()) {
  console.warn(`DEPRECATED: ${commandName} is a compatibility wrapper around checkVault. Use \`npm run check\` for the full gate, including tests.`);
  const result = checkVault(root);

  if (result.warnings.length) {
    console.warn(`Vault check warnings (${result.warnings.length}):`);
    for (const warning of result.warnings) console.warn(`- ${warning}`);
  }

  if (!result.ok) {
    console.error(`Vault check failed (${result.errors.length}):`);
    for (const error of result.errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return result;
  }

  console.log(`Vault check passed: ${result.metrics.audited} audited pages, ${result.metrics.knowledge} active knowledge pages, ${result.metrics.edges} resolved edges, ${result.metrics.undirectedComponents} undirected component.`);
  return result;
}
