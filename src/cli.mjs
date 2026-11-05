import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { loadInputs, validateConfig, ROOT } from './config.mjs';
import { makeWorlds, ensembleDescription } from './worlds.mjs';
import { search } from './search.mjs';
import { evaluate, rankEvaluations } from './evaluate.mjs';
import { writeReports } from './report.mjs';

function parseArgs(args) {
  const options = { quick: false, output: null, config: null, seed: null };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--quick') options.quick = true;
    else if (['--output', '--config', '--seed'].includes(arg)) {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`${arg} needs a value`);
      options[arg.slice(2)] = value;
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log('Kalipolis simulation\n\nnode src/cli.mjs [--quick] [--config path.json] [--seed integer] [--output directory]\n\n--quick: smaller smoke-study, separate results-quick output by default.\n--config: partial override of config/default.json. Unknown settings are rejected.\n--seed: reproducible unsigned 32-bit integer.\n--output: project subdirectory; named report files are replaced on rerun.\n\nAll numerical effects are illustrative assumptions, not calibrated predictions.');
    return;
  }
  const start = performance.now();
  const inputs = await loadInputs(options.config, options.quick);
  if (options.seed !== null) inputs.config.search.seed = Number(options.seed);
  validateConfig(inputs.config);
  const output = resolve(ROOT, options.output || (options.quick ? 'results-quick' : 'results'));
  const seed = inputs.config.search.seed;
  const ensembles = {
    screening: makeWorlds(inputs.config, inputs.assumptions, inputs.config.search.screenWorlds, seed ^ 0x13579BDF, 'screening'),
    validation: makeWorlds(inputs.config, inputs.assumptions, inputs.config.search.validationWorlds, seed ^ 0x2468ACE0, 'validation'),
    audit: makeWorlds(inputs.config, inputs.assumptions, inputs.config.search.auditWorlds, seed ^ 0x5A5A5A5A, 'audit')
  };
  console.log('Kalipolis: ILLUSTRATIVE, UNCALIBRATED structural simulation');
  console.log(`Seed ${seed}; ${inputs.config.city.years} years; ${inputs.catalog.government.length} government categories; ${options.quick ? 'QUICK' : 'FULL'} study.`);
  const run = search(inputs, ensembles.screening, event => {
    if (event.generation === inputs.config.search.generations) console.log(`Search: ${event.government}; ${event.completed}/${event.requested} candidates evaluated.`);
  });
  const validation = [];
  const audit = [];
  // All selection happens after this validation stage. Audit never guides search.
  for (let i = 0; i < run.finalists.length; i++) {
    validation.push(evaluate(run.finalists[i], inputs, ensembles.validation));
    if ((i + 1) % inputs.config.search.finalistsPerGovernment === 0) console.log(`Validation: ${i + 1}/${run.finalists.length} finalists.`);
  }
  const fixedSelection = rankEvaluations(validation)[0].id;
  for (let i = 0; i < run.finalists.length; i++) {
    audit.push(evaluate(run.finalists[i], inputs, ensembles.audit));
    if ((i + 1) % inputs.config.search.finalistsPerGovernment === 0) console.log(`Independent audit: ${i + 1}/${run.finalists.length} finalists.`);
  }
  const result = await writeReports(output, inputs, run, ensembles, validation, audit);
  if (result.overallSelection !== fixedSelection) throw new Error('Audit unexpectedly changed the validation selection');
  console.log(`\n${validation.filter(row => row.feasible).length}/${validation.length} finalists pass validation thresholds; ${audit.filter(row => row.feasible).length}/${audit.length} pass audit thresholds.`);
  console.log(`Validation-selected candidate: ${fixedSelection}.`);
  console.log(`Reports: ${resolve(output, 'SUMMARY.md')}`);
  console.log(`Elapsed: ${((performance.now() - start) / 1000).toFixed(1)} seconds.`);
  console.log(`Audit ensemble: ${JSON.stringify(ensembleDescription(ensembles.audit))}`);
}

main().catch(error => {
  console.error(`Simulation failed: ${error.message}`);
  process.exitCode = 1;
});
