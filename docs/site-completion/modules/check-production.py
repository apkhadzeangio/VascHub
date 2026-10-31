import urllib.request,urllib.error,json,re,datetime,concurrent.futures,pathlib
base='https://vasc.lithos.ge'
cases=[(p,200) for p in ['/','/events','/specialists','/centres','/library','/posts','/search','/admin/login','/site-modules-sitemap.xml','/robots.txt','/api/specialists?draft=true&depth=0&limit=1','/api/centres?draft=true&depth=0&limit=1','/api/posts?depth=0&limit=1','/api/users/me']]
cases += [(p,404) for p in ['/specialists/release-check-absent-profile','/centres/release-check-absent-centre','/posts/esvs-vgei-guidelines-2026','/posts/crest-2-asymptomatic-carotid-stenosis','/posts/basil-3-endovascular-strategies-clti','/posts/linc-2027-leipzig','/posts/esvs-clti-masterclass-november-2026','/posts/esvs-educational-travel-grant-2026']]
cases += [('/next/preview?path=/specialists',403)]
def run(case):
 path,expected=case;row={'path':path,'expected':expected}
 try:
  try:
   with urllib.request.urlopen(base+path,timeout=30) as r:status=r.status;body=r.read().decode('utf-8','replace')
  except urllib.error.HTTPError as e:status=e.code;body=e.read().decode('utf-8','replace')
  row.update(status=status,passed=status==expected)
  if '/api/' in path and status==200:
   d=json.loads(body)
   if 'docs' in d:
    row.update(total_docs=d.get('totalDocs'),returned_statuses=[v.get('_status') for v in d['docs']]);row['passed'] &= all(v.get('_status')=='published' for v in d['docs'])
   if path=='/api/users/me':row['anonymous']=d.get('user') is None;row['passed'] &= row['anonymous']
  if path=='/':
   row['module_links']=all(('href="'+p+'"') in body for p in ['/events','/specialists']);row['passed'] &= row['module_links']
  if path=='/site-modules-sitemap.xml':row['catalogues_present']=all(p+'</loc>' in body for p in ['/events','/specialists','/centres']);row['passed'] &= row['catalogues_present']
  if path=='/robots.txt':row['module_sitemap_listed']='site-modules-sitemap.xml' in body;row['passed'] &= row['module_sitemap_listed']
  if path.startswith('/next/preview'):row['app_denial']='You are not allowed' in body;row['passed'] &= row['app_denial']
  t=re.search(r'<title>(.*?)</title>',body)
  if t:row['title']=t.group(1)
 except Exception as e:row.update(error=str(e),passed=False)
 return row
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(run,cases))
result={'checked_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'mutating_requests':0,'passed':all(r['passed'] for r in rows),'checks':len(rows),'rows':rows}
p=pathlib.Path('/workspace/scratch/b18194609a61/work/modules-production-acceptance.json');p.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False))
