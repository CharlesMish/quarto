from pathlib import Path
import subprocess, hashlib, json, os, datetime
root=Path('/home/cmish/MECHA/MT1')
def git(*args): return subprocess.check_output(['git',*args],cwd=root)
def rev(name): return git('rev-parse',name).decode().strip()
refs={'acceptedMain':rev('9321de4'),'priorViewer':rev('3780e02'),'head':rev('HEAD'),'main':rev('main')}
root_configs={'.gitignore','index.html','package.json','package-lock.json','playwright.config.ts','tsconfig.app.json','tsconfig.json','vite.config.ts'}
shell='explore/body-shell-03/'
shell_config={shell+p for p in ['index.html','package-lock.json','playwright.config.ts','tsconfig.app.json','tsconfig.json','vite.config.ts']}
shared={shell+'src/scene/'+p for p in ['primitives.ts','materials.ts','h1Presentation.ts']}
excluded=shell+'evidence/body-surface-01/'
def groups(p):
    out=[]
    if p.startswith('src/'):out.append('root_source')
    if p.startswith('tests/'):out.append('root_tests')
    if p in root_configs:out.append('root_build_and_test_config')
    if any(p.startswith(shell+'src/'+d+'/') for d in ['design','machine','math','verify','study']):out.append('shell_frozen_engineering')
    if p in shared:out.append('shell_shared_primitives_materials_H1')
    if p in shell_config:out.append('shell_build_config_and_lockfile')
    if p.startswith(shell+'baseline-03/'):out.append('preserved_BODY_SHELL_03_baseline')
    if (p.startswith('evidence/') or '/evidence/' in p) and not p.startswith(excluded):out.append('historical_evidence')
    if ('/' not in p and p.startswith('MT1')) or p in ['AGENTS.md','docs/NOMENCLATURE.md'] or (p.startswith('explore/body-shell-') and Path(p).name.startswith('BODY_') and p.endswith('.md')):out.append('frozen_contracts_and_historical_reports')
    return out

def tree(ref):
    result={}
    for item in git('ls-tree','-rz','--full-tree',ref).split(b'\0'):
        if not item:continue
        meta,rawpath=item.split(b'\t',1);mode,kind,oid=meta.decode().split();p=rawpath.decode()
        if kind=='blob' and groups(p):result[p]={'gitMode':mode,'gitBlob':oid}
    return result
accepted=tree(refs['acceptedMain']);prior=tree(refs['priorViewer']);trees={'acceptedMain':accepted,'priorViewer':prior}
tracked=git('ls-files','-z').decode().split('\0');untracked=git('ls-files','--others','--exclude-standard','-z').decode().split('\0')
ignored_scope=['src','tests','evidence',shell+'src/design',shell+'src/machine',shell+'src/math',shell+'src/verify',shell+'src/study',shell+'evidence',shell+'baseline-03','explore/body-shell-01/evidence','explore/body-shell-02/evidence']
ignored=git('ls-files','--others','--ignored','--exclude-standard','-z','--',*ignored_scope).decode().split('\0')
paths=sorted({p for p in tracked+untracked+ignored+list(accepted)+list(prior) if p and groups(p)})
cat=subprocess.Popen(['git','cat-file','--batch'],cwd=root,stdin=subprocess.PIPE,stdout=subprocess.PIPE)
blob_hashes={}
for oid in sorted({item['gitBlob'] for t in trees.values() for item in t.values()}):
    cat.stdin.write((oid+'\n').encode());cat.stdin.flush();header=cat.stdout.readline().decode().strip().split();size=int(header[2]);h=hashlib.sha256();remaining=size
    while remaining:
        chunk=cat.stdout.read(min(remaining,1024*1024));h.update(chunk);remaining-=len(chunk)
    assert cat.stdout.read(1)==b'\n';blob_hashes[oid]={'sha256':h.hexdigest(),'bytes':size}
cat.stdin.close();cat.wait()
def current_record(p):
    path=root/p
    if not path.exists() and not path.is_symlink():return None
    raw=os.readlink(path).encode() if path.is_symlink() else path.read_bytes()
    mode='120000' if path.is_symlink() else ('100755' if path.stat().st_mode & 0o111 else '100644')
    return {'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'gitMode':mode}
files=[]
for p in paths:
    entry={'path':p,'groups':groups(p),'current':current_record(p)}
    for name,t in trees.items():entry[name]=({**t[p],**blob_hashes[t[p]['gitBlob']]} if p in t else None)
    files.append(entry)
comparisons={}
for name,t in trees.items():
    modified=[];deleted=[];added=[]
    for row in files:
        old=row[name];now=row['current'];p=row['path']
        if old and not now:deleted.append(p)
        elif old and (old['sha256']!=now['sha256'] or old['gitMode']!=now['gitMode']):modified.append(p)
        elif now and not old:added.append(p)
    inherited=[p for p in added if name=='acceptedMain' and p in prior and 'historical_evidence' in groups(p)]
    unexpected=[p for p in added if p not in inherited]
    group_counts={g:sum(1 for row in files if g in row['groups'] and row[name]) for g in sorted({g for row in files for g in row['groups']})}
    def digest(field):
        manifest=''.join(f"{r[field]['sha256']} {r[field]['gitMode']} {r['path']}\n" for r in files if r[name] and r[field])
        return hashlib.sha256(manifest.encode()).hexdigest()
    comparisons[name]={'ref':refs[name],'checkedExistingFiles':len(t),'groupFileCounts':group_counts,'modifiedPaths':modified,'deletedPaths':deleted,'addedPaths':added,'historicalEvidenceAddedByPriorViewer':inherited,'unexpectedAddedFrozenPaths':unexpected,'referenceManifestSha256':digest(name),'currentManifestForReferenceFilesSha256':digest('current'),'pass':not(modified or deleted or unexpected)}
archive_log=shell+'evidence/viewer-01/validation/root-suite.log';log_source=Path('/tmp/quarto-viewer-root-validation.test.log');log=(root/archive_log).read_bytes();oldlog=log_source.read_bytes()
ansi_re=__import__('re').compile(r'\x1b\[[0-9;]*[A-Za-z]');plain=ansi_re.sub('',log.decode(errors='replace'));summary=next((l.strip() for l in reversed(plain.splitlines()) if '103 passed' in l),None)
prior_log_blob=prior[archive_log]['gitBlob'];prior_log_hash=blob_hashes[prior_log_blob]['sha256']
status={name:git('diff','--name-status',refs[name],'--').decode().splitlines() for name in ['acceptedMain','priorViewer']}
out={'kind':'body-surface-frozen-equivalence','generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'repository':str(root),'branch':git('branch','--show-current').decode().strip(),'refs':refs,'method':'SHA-256 of raw Git blob bytes compared with current filesystem bytes, plus executable/symlink mode; tracked, untracked and ignored additions enumerated in checked frozen paths. No authority, build or browser invoked.','scopePolicy':{'includedGroups':sorted({g for row in files for g in row['groups']}),'excludedNewCandidateEvidencePrefix':excluded,'allowedHistoricalAddition':'Only prior-viewer historical evidence absent from accepted main is an allowed addition in the main comparison. No frozen source addition is allowed.','currentShellPackageJson':'Authorized test-runner changes; shown in informational worktree changes, not claimed byte-identical. Shell package-lock/config files are checked.','groupCountsOverlap':'Files such as baseline evidence belong to multiple groups; checkedExistingFiles and files use unique paths.','informationalChanges':'Non-frozen worktree changes and untracked paths are a point-in-time inventory; ongoing candidate evidence packaging can add paths after this audit.'},'comparisons':comparisons,'uniqueCurrentCheckedFiles':sum(r['current'] is not None for r in files),'files':files,'informationalWorktreeChanges':status,'informationalUntrackedPaths':sorted(p for p in untracked if p),'ignoredFilesInCheckedScope':sorted(p for p in ignored if p and groups(p)),'priorRootRegressionReuse':{'reused':True,'rerunForThisAudit':False,'archivedLogPath':archive_log,'archivedLogSha256':hashlib.sha256(log).hexdigest(),'originalTemporaryLogPath':str(log_source),'originalTemporaryLogSha256':hashlib.sha256(oldlog).hexdigest(),'logBytes':len(log),'priorViewerLogBlob':prior_log_blob,'priorViewerLogSha256':prior_log_hash,'sameBytesAsOriginalAndPriorCommit':log==oldlog and hashlib.sha256(log).hexdigest()==prior_log_hash,'observedSummary':summary,'resultClaim':'Prior root regression:103 passed; reused because root source/tests/build-and-test configuration and lockfile remain byte-identical. This is not a fresh regression run and does not validate changed shell surfaces.','prerequisitesPass':all(not any(p.startswith(('src/','tests/')) or p in root_configs for p in c['modifiedPaths']+c['deletedPaths']+c['unexpectedAddedFrozenPaths']) for c in comparisons.values())},'authorityParticipation':'none','testsRun':[],'evidenceAddedOrRegeneratedInRepository':[],'remainingUnknowns':['No runtime, build, browser, or authority validation is performed by this equivalence audit. Changed shell surface behavior requires its separate current validation.']}
out['refsStableDuringAudit']=all(rev(k if k in ['HEAD','main'] else k)==v for k,v in [('9321de4',refs['acceptedMain']),('3780e02',refs['priorViewer']),('HEAD',refs['head']),('main',refs['main'])])
out['pass']=all(c['pass'] for c in comparisons.values()) and out['priorRootRegressionReuse']['sameBytesAsOriginalAndPriorCommit'] and summary is not None and out['refsStableDuringAudit']
path=Path('/tmp/quarto-body-surface-frozen-equivalence.json');path.write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'output':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'pass':out['pass'],'comparisons':{k:{n:v for n,v in c.items() if n not in ['addedPaths','historicalEvidenceAddedByPriorViewer']} for k,c in comparisons.items()},'priorRootRegressionReuse':out['priorRootRegressionReuse']},indent=2))
