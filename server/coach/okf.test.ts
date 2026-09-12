import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseOKF,okfRetrievable,okfTrust,safeConceptPath} from './okf';
test('OKF preserves extension metadata, sources and Unicode bodies',()=>{
 const value=parseOKF('policies/returns.md','---\ntype: Playbook\ntitle: Returns\ntags: [policy]\nsources:\n  - resource: /references/rules.md\ncustom:\n  owner: operations\nverified: {by: "human:reviewer", at: "2026-01-01T00:00:00Z"}\n---\nবাংলা return instructions.');
 assert.equal(value.metadata.type,'Playbook');assert.equal((value.metadata.custom as any).owner,'operations');assert.equal(okfTrust(value.metadata),'human-reviewed');assert.equal(value.body,'বাংলা return instructions.');
});
test('unknown types are accepted and minimal concepts remain unverified',()=>{const value=parseOKF('a.md','---\ntype: CustomThing\n---\n');assert.equal(okfTrust(value.metadata),'unverified');assert(okfRetrievable(value.metadata));});
test('indexes and logs are reserved and lifecycle exclusions are deterministic',()=>{assert(parseOKF('index.md','# Index').reserved);assert(parseOKF('a/log.md','# Log').reserved);assert(!okfRetrievable({status:'draft'}));assert(!okfRetrievable({status:'deprecated'}));assert(!okfRetrievable({stale_after:'2020-01-01T00:00:00Z'}));assert(okfRetrievable({status:'stable'}));});
test('unsafe paths, duplicate YAML keys, aliases and malformed concepts are rejected',()=>{
 for(const path of ['../a.md','/a.md','a/../b.md','a\\b.md'])assert.throws(()=>safeConceptPath(path));
 for(const content of ['plain text','---\ntype: [bad]\n---\nbody','---\ntype: A\ntype: B\n---\nbody','---\ntype: A\nx: &x [one]\ny: *x\n---\nbody'])assert.throws(()=>parseOKF('a.md',content));
});
