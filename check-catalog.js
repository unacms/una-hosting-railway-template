const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, "una-neo.template.json"), "utf8"));
const source = fs.readFileSync(path.join(root, ".railway", "railway.ts"), "utf8");
const failures = [];

function fail(message) {
    failures.push(message);
}

const services = catalog.services;
if (!services || typeof services !== "object")
    fail("catalog is missing services");

const declared = [...source.matchAll(/^\s*const \w+ = service\("([^"]+)"/gm)].map(match => match[1]);
const images = [
    ...[...source.matchAll(/trackedImage\("([^"]+)", "(?:semver|sha)"\)/g)].map(match => match[1]),
    ...[...source.matchAll(/\bimage\("([^"]+)"\)/g)].map(match => match[1]),
];
const catalogNames = Object.keys(services || {});

if (typeof catalog.repo !== "string" || !source.includes(`"${catalog.repo}"`))
    fail("IaC is missing the catalog repo");
if (typeof catalog.branch !== "string" || !source.includes(`branch: "${catalog.branch}"`))
    fail("IaC is missing the catalog branch");
if (/^\s*start:/m.test(source))
    fail("boot logic belongs in railway/services/*/scripts, not a start command");

// Catalog roots are paths in the public template repo. That repo's root is
// this railway/ directory, so /services/una is railway/services/una here.
function envKeys(source, serviceName) {
    const start = source.search(new RegExp(`service\\("${serviceName}"`));
    if (start < 0)
        return [];
    const next = source.slice(start + 1).search(/\bservice\("/);
    const region = source.slice(start, next < 0 ? source.length : start + 1 + next);
    const envAt = region.search(/\benv\s*:/);
    if (envAt < 0)
        return [];
    const brace = region.indexOf("{", envAt);
    let depth = 0;
    let end = brace;
    for (; end < region.length; end++) {
        if (region[end] === "{")
            depth++;
        else if (region[end] === "}") {
            depth--;
            if (depth === 0) {
                end++;
                break;
            }
        }
    }
    const body = region.slice(brace + 1, end - 1);
    const keys = [];
    depth = 0;
    for (const line of body.split("\n")) {
        if (depth === 0) {
            const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:/);
            if (match)
                keys.push(match[1]);
        }
        depth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
    }
    return keys;
}

function serviceFile(rootDir, ...parts) {
    const rel = String(rootDir || "").replace(/^\//, "");
    return path.join(__dirname, rel, ...parts);
}

function dockerfileBase(rootDir) {
    const file = serviceFile(rootDir, "Dockerfile");
    let text;
    try {
        text = fs.readFileSync(file, "utf8");
    } catch (err) {
        fail(`${rootDir} Dockerfile is missing`);
        return "";
    }
    const args = {};
    for (const match of text.matchAll(/^ARG\s+([A-Za-z_][A-Za-z0-9_]*)=(\S+)/gm))
        args[match[1]] = match[2];
    const from = text.match(/^FROM\s+(\S+)/m);
    if (!from) {
        fail(`${rootDir} Dockerfile has no FROM`);
        return "";
    }
    return from[1].replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_, name) => args[name] || "");
}

for (const name of catalogNames) {
    if (!declared.includes(name))
        fail(`IaC is missing service ${name}`);
}
for (const name of declared) {
    if (!catalogNames.includes(name))
        fail(`IaC has service ${name} that is not in the catalog`);
}

if (!source.includes('const replicas = { "us-west2": 1 }'))
    fail('IaC replicas must stay { "us-west2": 1 }, matching catalog scale us-west: 1');

const blocks = [...source.matchAll(/\/\/ catalog: default=(true|false) public=(true|false) scale=us-west:(\d+)\n\s*const \w+ = service\("([^"]+)"/g)];
const documented = new Map(blocks.map(match => [match[4], {
    default: match[1] === "true",
    public: match[2] === "true",
    scale: Number(match[3]),
}]));

for (const [name, spec] of Object.entries(services || {})) {
    if (spec.root) {
        if (!source.includes(`"${spec.root}"`))
            fail(`IaC is missing rootDirectory ${spec.root} for ${name}`);
        const entrypoint = serviceFile(spec.root, "scripts", "railway-entrypoint.sh");
        if (!fs.existsSync(entrypoint))
            fail(`${name} is missing scripts/railway-entrypoint.sh`);
        const base = dockerfileBase(spec.root);
        if (base !== spec.image)
            fail(`Dockerfile for ${name} is FROM ${base}; catalog image is ${spec.image}`);
    } else if (!images.includes(spec.image)) {
        fail(`IaC is missing image ${spec.image} for ${name}`);
    }
    if (!Array.isArray(spec.variables))
        fail(`${name} variables must be an array`);
    const env = envKeys(source, name);
    const listed = spec.variables || [];
    if (env.join("\n") !== listed.join("\n")) {
        const missing = env.filter(key => !listed.includes(key));
        const extra = listed.filter(key => !env.includes(key));
        const details = [];
        if (missing.length)
            details.push(`missing ${missing.join(", ")}`);
        if (extra.length)
            details.push(`extra ${extra.join(", ")}`);
        fail(`${name} variables do not match the IaC env keys${details.length ? `: ${details.join("; ")}` : ""}`);
    }
    const note = documented.get(name);
    if (!note) {
        fail(`IaC is missing a catalog comment for ${name}`);
        continue;
    }
    if (note.default !== spec.default)
        fail(`${name} default is ${spec.default} in the catalog and ${note.default} in IaC`);
    if (note.public !== spec.public)
        fail(`${name} public is ${spec.public} in the catalog and ${note.public} in IaC`);
    const scale = spec.scale || {};
    if (Object.keys(scale).length !== 1 || scale["us-west"] !== note.scale)
        fail(`${name} scale must be us-west: ${note.scale} to match the IaC replicas`);
}

if (documented.size !== catalogNames.length)
    fail("catalog comments do not cover every service");

if (failures.length) {
    for (const message of failures)
        console.error(message);
    process.exit(1);
}

console.log(`Railway catalog matches IaC (${catalogNames.length} services)`);
