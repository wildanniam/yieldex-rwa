#!/usr/bin/env python3
"""Offline checks for documentation/schema artifacts, not product correctness tests."""
import json
import re
import random
import sys
from pathlib import Path
from urllib.parse import unquote

try:
    from jsonschema import Draft202012Validator, FormatChecker
    from referencing import Registry, Resource
except ImportError:
    raise SystemExit('Need jsonschema==4.25.1. Run: uv run --with jsonschema==4.25.1 python scripts/check_specs.py')

ROOT = Path(__file__).resolve().parents[1]
CHANGE = ROOT / 'openspec/changes/build-rwa-income-rights'
errors = []
counts = {}

def require(ok, message):
    if not ok:
        errors.append(message)

def walk_refs(value):
    if isinstance(value, dict):
        if '$ref' in value:
            yield value['$ref']
        for v in value.values():
            yield from walk_refs(v)
    elif isinstance(value, list):
        for v in value:
            yield from walk_refs(v)

def schema_checks():
    schema_files = sorted((ROOT / 'schemas').glob('*.schema.json'))
    require(bool(schema_files), 'No schemas found')
    schemas = {p: json.loads(p.read_text()) for p in schema_files}
    registry = Registry().with_resources((s['$id'], Resource.from_contents(s)) for s in schemas.values())
    require(len({s['$id'] for s in schemas.values()}) == len(schemas), 'Duplicate schema $id')
    ref_count = 0
    for p, s in schemas.items():
        Draft202012Validator.check_schema(s)
        for ref in walk_refs(s):
            ref_count += 1
            try:
                registry.resolver(s['$id']).lookup(ref)
            except Exception as e:
                errors.append(f'{p.relative_to(ROOT)} unresolved local ref {ref}: {e}')
    manifest = json.loads((ROOT / 'examples/manifest.json').read_text())
    case_count = 0
    for case in manifest['cases'] + manifest.get('semanticCases', []):
        p = ROOT / case['file']
        schema = schemas[ROOT / case['schema']]
        ref = schema['$id'] + case.get('schemaRef', '')
        validator = Draft202012Validator({'$ref': ref}, registry=registry, format_checker=FormatChecker())
        data = json.loads(p.read_text())
        issues = list(validator.iter_errors(data))
        expected = case.get('valid', case.get('schemaValid'))
        require((not issues) == expected, f"Fixture {case['file']} expected schema-valid={expected}; errors={[e.message[:170] for e in issues[:3]]}")
        case_count += 1
    counts.update(schemas=len(schemas), schema_refs=ref_count, schema_fixture_cases=case_count,
                  semantic_cases_deferred=len(manifest.get('semanticCases', [])))
    common = schemas[ROOT/'schemas/common.schema.json']
    numeric_checks = 0
    rng = random.Random(20261008)
    for name, bits, minimum in [('Uint256', 256, 0), ('PositiveUint256', 256, 1), ('Uint64', 64, 0)]:
        maximum = (1 << bits)-1
        validator = Draft202012Validator({'$ref': common['$id']+'#/$defs/'+name}, registry=registry)
        values = [-1, 0, 1, maximum-1, maximum, maximum+1, maximum*2]
        values += [rng.getrandbits(bits+1) for _ in range(500)]
        for value in values:
            numeric_checks += 1
            require(validator.is_valid(str(value)) == (minimum <= value <= maximum), f'{name} bound mismatch {value}')
        for value in ['01', '+1', '-0', '1e3', '1.0', '', ' 1', '1 ', 1, 0.5, True]:
            numeric_checks += 1
            require(not validator.is_valid(value), f'{name} accepted noncanonical value {value!r}')
    counts['numeric_boundary_checks'] = numeric_checks

def document_checks():
    for name in ['proposal.md', 'design.md', 'tasks.md', '.openspec.yaml']:
        require((CHANGE / name).is_file(), f'Missing OpenSpec artifact {name}')
    require((ROOT/'openspec/config.yaml').is_file(), 'Missing config.yaml')
    capabilities = set()
    req_ids = []
    scenario_count = 0
    capability_counts = {}
    for path in sorted((CHANGE/'specs').glob('*/spec.md')):
        capabilities.add(path.parent.name)
        text = path.read_text()
        require('## ADDED Requirements' in text, f'{path} missing delta heading')
        blocks = re.split(r'^### Requirement:\s*', text, flags=re.M)[1:]
        capability_counts[path.parent.name] = len(blocks)
        for block in blocks:
            match = re.match(r'([A-Z]+-\d+)\b', block)
            require(match is not None, f'{path}: requirement needs stable ID: {block[:70]}')
            if match:
                req_ids.append(match[1])
            require(bool(re.search(r'\b(SHALL|MUST)\b', block)), f'{path}: missing normative SHALL/MUST')
            scenarios = re.split(r'^#### Scenario:\s*', block, flags=re.M)[1:]
            require(bool(scenarios), f'{path}: missing scenario in {block[:60]}')
            for scenario in scenarios:
                require('WHEN' in scenario and 'THEN' in scenario, f'{path}: missing WHEN/THEN: {scenario[:65]}')
            scenario_count += len(scenarios)
    require(bool(req_ids), 'No requirements')
    require(len(set(req_ids)) == len(req_ids), 'Duplicate requirement IDs')
    coverage_path = ROOT/'docs/spec/coverage.md'
    require(coverage_path.is_file(), 'Missing requirement-to-task coverage table')
    if coverage_path.is_file():
        covered = re.findall(r'^\| ([A-Z]+-\d+)\b', coverage_path.read_text(), re.M)
        require(set(covered) == set(req_ids) and len(covered) == len(req_ids), 'Coverage table must map every requirement exactly once')
    proposal = (CHANGE/'proposal.md').read_text()
    proposal_caps = set(re.findall(r'^- `([a-z-]+)`:', proposal, re.M))
    require(proposal_caps == capabilities, f'Proposal/capability mismatch: {proposal_caps ^ capabilities}')
    task_text = (CHANGE/'tasks.md').read_text()
    tasks = re.findall(r'^- \[([ xX])\] (\d+\.\d+) ', task_text, re.M)
    require(bool(tasks), 'No task checkboxes')
    require(len({id for _, id in tasks}) == len(tasks), 'Duplicate task IDs')
    task_ids = {id for _, id in tasks}
    dependencies = {}
    for line in task_text.splitlines():
        task = re.match(r'^- \[([ xX])\] (\d+\.\d+) ', line)
        if not task:
            continue
        state, task_id = task.groups()
        if state.lower() == 'x':
            evidence = re.search(r'Evidence: ([\w./-]+\.md)', line)
            require(evidence is not None and (ROOT/evidence[1]).is_file(),
                    f'Completed task {task_id} needs a local Evidence markdown path')
        part = re.search(r'Depends: (.*?)\. (?:Scope:|Acceptance:)', line)
        require(part is not None, f'Task {task_id} lacks explicit dependency and acceptance')
        deps = []
        if part and part[1] != 'none':
            for token in part[1].split(','):
                token = token.strip()
                if '–' in token:
                    start, end = token.split('–')
                    group, low = map(int, start.split('.'))
                    end_group, high = map(int, end.split('.'))
                    require(group == end_group and low <= high, f'Invalid dependency range {token}')
                    deps.extend(f'{group}.{i}' for i in range(low, high+1))
                else:
                    deps.append(token)
        for dep in deps:
            require(dep in task_ids, f'Task {task_id} references missing dependency {dep}')
        dependencies[task_id] = deps
    visited, active = set(), set()
    def visit(id):
        if id in active:
            errors.append(f'Task dependency cycle involving {id}')
            return
        if id in visited:
            return
        active.add(id)
        for dep in dependencies.get(id, []):
            visit(dep)
        active.remove(id)
        visited.add(id)
    for id in dependencies:
        visit(id)
    require(not list((ROOT/'openspec/specs').glob('*/spec.md')), 'Unbuilt baseline unexpectedly in main specs')
    link_count = 0
    for p in ROOT.rglob('*.md'):
        if any(part in {'.git', 'node_modules'} for part in p.parts) or p.name == 'TEAM-CONTEXT.md':
            continue
        # Fenced examples are not actual links.
        text = re.sub(r'```.*?```', '', p.read_text(), flags=re.S)
        for raw in re.findall(r'!?\[[^\]\n]*\]\(([^)\n]+)\)', text):
            target = raw.strip().strip('<>')
            if re.match(r'^[a-z][a-z0-9+.-]*:', target, re.I) or target.startswith('#'):
                continue
            target = unquote(target.split('#', 1)[0])
            if not target:
                continue
            link_count += 1
            require((p.parent/target).exists(), f'Broken local link {p.relative_to(ROOT)} -> {target}')
    counts.update(capabilities=len(capabilities), requirements=len(req_ids), scenarios=scenario_count,
                  implementation_tasks=len(tasks),
                  unchecked_implementation_tasks=sum(state == ' ' for state, _ in tasks),
                  completed_tasks=sum(state.lower() == 'x' for state, _ in tasks),
                  local_links=link_count, requirements_by_capability=capability_counts)
    counts['task_dependency_edges'] = sum(map(len, dependencies.values()))

schema_checks()
document_checks()
report = {'status': 'passed' if not errors else 'failed', 'checks': counts, 'errors': errors,
          'limits': ['Schema syntax/fixtures and documentation structure only.',
                     'Semantic fixture errors are described for future implementation; schema-valid does not mean semantically valid.',
                     'No contract, API, wallet, model, provider runtime or production proof.']}
print(json.dumps(report, indent=2))
sys.exit(bool(errors))
