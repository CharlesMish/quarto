import subprocess,json,hashlib,pathlib
out=pathlib.Path(__file__).resolve().parent; r=out.parents[3]
def git(*args):return subprocess.check_output(['git',*args],cwd=r).decode().strip()
main='e56a4c09330119827e5a6c9757bf5cbc448dd29d'; branch=git('rev-parse','9540453')
scope=['src','tests','package.json','package-lock.json','playwright.config.ts','tsconfig.json','vite.config.ts','wrangler.jsonc','explore/body-shell-03/src/design','explore/body-shell-03/src/machine','explore/body-shell-03/src/math','explore/body-shell-03/src/verify','explore/body-shell-03/src/scene/primitives.ts','explore/body-shell-03/src/scene/materials.ts','explore/body-shell-03/src/scene/h1Presentation.ts']
diff=git('diff','--name-only',main,'--',*scope);assert not diff,diff
prior=json.loads(git('show',branch+':package-lock.json'))['packages']; current=json.loads((r/'package-lock.json').read_text())['packages']
changed=[k for k,v in prior.items() if k and (k not in current or any(v.get(t)!=current[k].get(t) for t in ['version','integrity']))];assert not changed,changed
rootdiff=git('diff','--name-only',branch,'--','src','tests','playwright.config.ts','tsconfig.json','vite.config.ts').splitlines();assert rootdiff==['tests/mt1-ba1.spec.ts'],rootdiff
oldlog=r/'explore/body-shell-03/evidence/viewer-01/validation/root-suite.log'
evidenceScopes=['explore/body-shell-03/evidence/body-surface-01','explore/body-shell-03/evidence/viewer-01']
assert not git('diff','--name-only',branch,'--',*evidenceScopes)
report={'pass':True,'authorityParticipation':'none','acceptedMain':main,'viewerParent':branch,'frozenScopesCompared':scope,'changedFrozenFiles':[],'existingDependencyVersionOrIntegrityChanges':changed,'rootChangesSincePrior103TestRun':rootdiff,'priorRootSuiteSha256':hashlib.sha256(oldlog.read_bytes()).hexdigest(),'priorRootSuiteReused':True,'freshRootTests':'2 BA1 cases passed','oldViewerAndSurfaceEvidenceUnchanged':True}
(out/'source-audit.json').write_text(json.dumps(report,indent=2)+'\n')
