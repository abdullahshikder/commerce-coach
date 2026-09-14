import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const productionDirectory = resolve(root, 'deploy/production');
const namespace = 'commerce-coach';
const renderOnly = process.argv.includes('--render');

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required. Start from deploy/production.env.example.`);
  return value;
}

function dnsLabel(value: string, name: string) {
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(value)) throw new Error(`${name} must be a Kubernetes DNS label.`);
  return value;
}

function hostname(value: string) {
  if (value.length > 253 || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(value)) {
    throw new Error('COACH_DOMAIN must be a lowercase DNS hostname.');
  }
  return value;
}

function ipv4Cidr(value: string, name: string) {
  const [address, prefix, extra] = value.split('/');
  if (extra !== undefined || isIP(address) !== 4 || !/^\d{1,2}$/.test(prefix ?? '') || Number(prefix) > 32) {
    throw new Error(`${name} must be an IPv4 CIDR such as 10.40.0.0/16.`);
  }
  return value;
}

function run(command: string, args: string[], input?: string) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    input,
    stdio: input === undefined ? ['inherit', 'pipe', 'pipe'] : ['pipe', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    if (result.stdout) process.stderr.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    throw new Error(`${command} ${args.join(' ')} failed.`);
  }
  return result.stdout.trim();
}

const image = required('COACH_IMAGE');
if (!/^[a-z0-9]+(?:[._:-][a-z0-9]+)*(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)+@sha256:[a-f0-9]{64}$/.test(image)) {
  throw new Error('COACH_IMAGE must be a valid registry reference pinned to an immutable sha256 digest.');
}
const domain = hostname(required('COACH_DOMAIN'));
const tlsSecret = dnsLabel(required('COACH_TLS_SECRET'), 'COACH_TLS_SECRET');
const ingressClass = dnsLabel(required('INGRESS_CLASS'), 'INGRESS_CLASS');
const ingressNamespace = dnsLabel(required('INGRESS_NAMESPACE'), 'INGRESS_NAMESPACE');
const databaseCidr = ipv4Cidr(required('DATABASE_EGRESS_CIDR'), 'DATABASE_EGRESS_CIDR');
const databasePort = Number(required('DATABASE_EGRESS_PORT'));
if (!Number.isInteger(databasePort) || databasePort < 1 || databasePort > 65535) throw new Error('DATABASE_EGRESS_PORT must be between 1 and 65535.');
const trustedProxies = required('TRUSTED_PROXIES').split(',').map(value => ipv4Cidr(value.trim(), 'TRUSTED_PROXIES')).join(',');
const googleSsoEnabled = required('GOOGLE_SSO_ENABLED');
if (!['true', 'false'].includes(googleSsoEnabled)) throw new Error('GOOGLE_SSO_ENABLED must be true or false.');
const digest = image.slice(image.lastIndexOf(':') + 1);
const googleRedirectUri = googleSsoEnabled === 'true' ? `https://${domain}/api/auth/google/callback` : '';
const configHash = createHash('sha256').update(JSON.stringify({ domain, tlsSecret, ingressClass, ingressNamespace, databaseCidr, databasePort, trustedProxies, googleRedirectUri })).digest('hex').slice(0, 16);

const replacements = new Map([
  ['registry.example.com/commerce-coach@sha256:0000000000000000000000000000000000000000000000000000000000000000', image],
  ['COACH_DOMAIN_PLACEHOLDER', domain],
  ['COACH_TLS_SECRET_PLACEHOLDER', tlsSecret],
  ['INGRESS_CLASS_PLACEHOLDER', ingressClass],
  ['INGRESS_NAMESPACE_PLACEHOLDER', ingressNamespace],
  ['TRUSTED_PROXIES_PLACEHOLDER', trustedProxies],
  ['GOOGLE_REDIRECT_URI_PLACEHOLDER', googleRedirectUri],
  ['DATABASE_CIDR_PLACEHOLDER', databaseCidr],
  ['DATABASE_PORT_PLACEHOLDER', String(databasePort)],
  ['RELEASE_ID_PLACEHOLDER', digest.slice(0, 16)],
  ['CONFIG_HASH_PLACEHOLDER', configHash],
]);

function render(source: string) {
  let result = source;
  for (const [placeholder, value] of replacements) result = result.replaceAll(placeholder, value);
  if (/PLACEHOLDER|registry\.example\.com/.test(result)) throw new Error('The production manifest contains an unresolved placeholder.');
  return result;
}

const application = render(run('kustomize', ['build', productionDirectory]));
const migration = render(readFileSync(resolve(productionDirectory, 'migration-job.yaml'), 'utf8'));

if (renderOnly) {
  process.stdout.write(`# Inspection output only. Use npm run production:deploy to preserve migration ordering.\n${migration}\n---\n${application}\n`);
} else {
  const context = required('KUBE_CONTEXT');
  if (run('kubectl', ['config', 'current-context']) !== context) throw new Error(`Current kubectl context does not match KUBE_CONTEXT=${context}.`);
  if (process.env.CONFIRM_PRODUCTION !== `commerce-coach:${context}`) {
    throw new Error(`Set CONFIRM_PRODUCTION=commerce-coach:${context} to authorize this production rollout.`);
  }
  const kubectl = (args: string[], input?: string) => run('kubectl', ['--context', context, ...args], input);

  kubectl(['apply', '-f', resolve(productionDirectory, 'namespace.yaml')]);
  kubectl(['apply', '-f', resolve(productionDirectory, 'service-account.yaml')]);
  const expectedSecretKeys = new Map([
    ['commerce-coach-runtime-database', ['database-url', 'auth-database-url']],
    ['commerce-coach-migration-database', ['migration-database-url']],
    ['commerce-coach-providers', ['openrouter-api-key', 'gemini-api-key', 'google-client-id', 'google-client-secret']],
    [tlsSecret, ['tls.crt', 'tls.key']],
  ]);
  const keyTemplate = 'go-template={{range $key, $value := .data}}{{$key}}{{"\\n"}}{{end}}';
  for (const [secret, requiredKeys] of expectedSecretKeys) {
    const keys = new Set(kubectl(['get', 'secret', secret, '-n', namespace, '-o', keyTemplate]).split('\n').filter(Boolean));
    const missing = requiredKeys.filter(key => !keys.has(key));
    if (missing.length) throw new Error(`Secret ${secret} is missing keys: ${missing.join(', ')}.`);
  }
  if (kubectl(['get', 'secret', tlsSecret, '-n', namespace, '-o', 'jsonpath={.type}']) !== 'kubernetes.io/tls') throw new Error(`Secret ${tlsSecret} must have type kubernetes.io/tls.`);

  // Keep the currently healthy release serving if a schema upgrade cannot complete.
  const job = kubectl(['create', '-f', '-', '-o', 'name'], migration);
  process.stdout.write(`Created ${job}; waiting for migrations.\n`);
  try {
    kubectl(['wait', '--for=condition=complete', job, '-n', namespace, '--timeout=10m']);
  } catch (error) {
    try { process.stderr.write(`${kubectl(['logs', job, '-n', namespace, '--tail=200'])}\n`); } catch {}
    throw error;
  }

  kubectl(['apply', '-f', '-'], application);
  kubectl(['rollout', 'status', 'deployment/commerce-coach', '-n', namespace, '--timeout=10m']);
  process.stdout.write(`${kubectl(['get', 'deployment,pods,hpa,ingress', '-n', namespace])}\n`);
  process.stdout.write(`Production rollout complete: https://${domain}\n`);
}
