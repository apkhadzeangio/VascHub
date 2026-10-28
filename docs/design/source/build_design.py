"""Build editable SVG design snapshots. Does not touch the application or database.
Run: python -m pip install -r docs/design/source/requirements.txt
     python docs/design/source/build_design.py
PNG previews require the bundled font installed in the system font directory.
"""
from pathlib import Path
from html import escape
from PIL import ImageFont
import json, re

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'
FONT=OUT/'fonts/NotoSansGeorgian.ttf'
C={'navy':'#122F40','teal':'#096B61','mint':'#E9F4EF','bg':'#F6F8F7','white':'#FFFFFF','ink':'#182F3B','muted':'#566C76','border':'#DCE5E2','soft':'#EDF1F0','gold':'#AD752B'}
TOPICS=[('აორტა','aorta'),('კაროტიდი','branch'),('პერიფერიული არტერიები','artery'),('ვენური დაავადებები','vein'),('დიალიზის მიდგომა','access'),('დიაგნოსტიკა','scan')]
RESOURCES=[{'type':'გაიდლაინების კატალოგი','title':'კაროტიდული დაავადებების მართვა','desc':'ორიგინალი წყარო და ქართული მიმოხილვა ერთ გვერდზე.','icon':'file'}, {'type':'თემატური მიმოხილვა','title':'ქვედა კიდურის არტერიული დაავადება','desc':'კლინიკური თემის მიხედვით დალაგებული მასალები.','icon':'book'},{'type':'სასწავლო რესურსი','title':'დიალიზის სისხლძარღვოვანი მიდგომა','desc':'სასწავლო მასალებისა და ვიდეოების განლაგების მაგალითი.','icon':'play'}]
EVENTS=['ულტრაბგერის პრაქტიკული ვორკშოპი','კლინიკური შემთხვევების განხილვა']
NEWS=['VascHub-ის სასწავლო სივრცე','საჭირო რესურსი — რამდენიმე ნაბიჯში']
NAV=['კლინიკური ბიბლიოთეკა','აკადემია','ღონისძიებები','პროფესიული ქსელი','სტატიები და სიახლეები','ჩვენ შესახებ / წევრობა']
ICONS={'search':'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>','arrow':'<path d="M4 12h16m-6-6 6 6-6 6"/>','chevron':'<path d="m9 5 7 7-7 7"/>','menu':'<path d="M4 6h16M4 12h16M4 18h16"/>','close':'<path d="m6 6 12 12M6 18 18 6"/>','user':'<circle cx="12" cy="8" r="3.5"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>','bookmark':'<path d="M6 3h12v18l-6-4-6 4z"/>','file':'<path d="M6 2h8l4 4v16H6zM14 2v5h4M9 12h6M9 16h6"/>','book':'<path d="M12 5v16M3 4c4-1 6-1 9 1 3-2 5-2 9-1v15c-4-1-6-1-9 1-3-2-5-2-9-1z"/>','play':'<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/>','calendar':'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18M7 14h3m4 0h3"/>','aorta':'<path d="M10 22V9a5 5 0 0 1 10 0v4M6 2v5m4-6v4m4-4v3M10 17l-6 5m6-5 6 5"/>','branch':'<path d="M12 22V12m0 1L5 6V2m7 10 7-6V2M5 6H2m17 0h3"/>','artery':'<path d="M9 2v9L5 22M15 2v9l4 11M9 8l-5 4m11-4 5 4"/>','vein':'<path d="M8 2v20M16 2v20M8 7l4 4 4-4M8 14l4 4 4-4"/>','access':'<path d="M7 2v20M17 2v20M7 9c8-8 10 1 10 4M7 15c6 4 8-4 10-6"/>','scan':'<rect x="3" y="3" width="18" height="14" rx="2"/><path d="M8 21h8m-4-4v4M5 11h3l2-4 3 7 2-3h4"/>'}
QA=[]

def font(size): return ImageFont.truetype(str(FONT),round(size*4))
def width(s,size): return font(size).getlength(s)/4

def lines(s,size,w):
    result=[]
    for paragraph in s.split('\n'):
        line=''
        for word in paragraph.split():
            candidate=(line+' '+word).strip()
            if line and width(candidate,size)>w: result.append(line);line=word
            else: line=candidate
        if line: result.append(line)
    return result

class SVG:
    def __init__(self,w,h,name):
        self.w,self.h,self.name=w,h,name;self.p=[];self.textboxes=[]
        self.p.append(f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-labelledby="title desc"><title id="title">{escape(name)}</title><desc id="desc">VascHub homepage design v1. Local editable SVG; not an export from the empty Figma destination. All content is demonstrative.</desc>')
        self.p.append('<defs>'+''.join(f'<symbol id="{k}" viewBox="0 0 24 24">{v}</symbol>' for k,v in ICONS.items())+'</defs>')
    def rect(self,x,y,w,h,fill='white',r=0,stroke=None,sw=1):
        fill=C.get(fill,fill);st=f' stroke="{C.get(stroke,stroke)}" stroke-width="{sw}"' if stroke else ''
        self.p.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"{st}/>')
    def rule(self,x,y,w,color='border'): self.p.append(f'<path d="M{x} {y}h{w}" stroke="{C.get(color,color)}"/>')
    def icon(self,name,x,y,size=22,color='teal'):
        self.p.append(f'<use xlink:href="#{name}" x="{x}" y="{y}" width="{size}" height="{size}" fill="none" stroke="{C.get(color,color)}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>')
    def text(self,s,x,y,size=14,color='ink',weight=400,w=None,lh=None):
        ll=lines(s,size,w) if w else s.split('\n');lh=lh or size*1.55
        self.p.append(f'<g data-role="editable-text" aria-label="{escape(s)}">')
        for i,line in enumerate(ll):
            self.p.append(f'<text x="{x}" y="{y+i*lh+size}" font-family="Noto Sans Georgian, DejaVu Sans, sans-serif" font-size="{size}" font-weight="{weight}" fill="{C.get(color,color)}">{escape(line)}</text>')
            self.textboxes.append({'text':line,'x':x,'y':y+i*lh,'w':width(line,size),'h':size*1.25,'containerWidth':w})
        self.p.append('</g>');return len(ll)*lh
    def badge(self,label,x,y,fill='mint',color='teal',size=11):
        w=width(label,size)+20;self.rect(x,y,w,25,fill,5);self.text(label,x+10,y+4,size,color,500);return w
    def button(self,label,x,y,w,h=44,kind='primary',icon=None):
        self.p.append('<g data-component="Button" data-state="default">')
        self.rect(x,y,w,h,'teal' if kind=='primary' else 'white',8,'teal' if kind=='outline' else None)
        tw=width(label,13);total=tw+(28 if icon else 0);tx=x+(w-total)/2
        self.text(label,tx,y+(h-20)/2-1,13,'white' if kind=='primary' else 'teal',600)
        if icon:self.icon(icon,tx+tw+10,y+(h-18)/2,18,'white' if kind=='primary' else 'teal')
        self.p.append('</g>')
    def section(self,title,x,y,w,link='ყველას ნახვა',demo=False,size=24):
        self.text(title,x,y,size,'ink',600)
        if link:self.text(link,x+w-width(link,13)-24,y+9,13,'teal',600);self.icon('arrow',x+w-17,y+10,17)
        if demo:self.text('სადემონსტრაციო ჩანაწერები',x,y+37,11,'muted')
    def save(self,filename):
        self.p.append('</svg>');p=OUT/filename;p.write_text('\n'.join(self.p))
        overflow=[b for b in self.textboxes if b['x']+b['w']>self.w+1 or b['y']+b['h']>self.h+1 or (b['containerWidth'] and b['w']>b['containerWidth']+1)]
        QA.append({'file':filename,'width':self.w,'height':self.h,'editableTextLines':len(self.textboxes),'overflow':overflow})
        return p

def logo(s,x,y,dark=False):
    s.rect(x,y,34,34,'mint' if dark else 'teal',8)
    s.p.append(f'<path d="M{x+9} {y+9}l8 18 8-18M{x+17} {y+27}v-9" fill="none" stroke="{C["teal"] if dark else C["white"]}" stroke-width="2.2" stroke-linecap="round"/>')
    s.text('VascHub',x+46,y-2,27,'white' if dark else 'navy',700)

def search(s,x,y,w,mobile=False,focused=False):
    s.p.append('<g data-component="SearchInput" data-state="'+('focus' if focused else 'default')+'">')
    if focused:s.rect(x-3,y-3,w+6,64,'mint',13,'teal',1.5)
    s.rect(x,y,w,58,'white',10,'teal' if focused else 'border',1.4)
    s.icon('search',x+18,y+18,22)
    label='მოძებნე რესურსი...' if mobile else 'მოძებნე გაიდლაინი, თემა ან კურსი'
    s.text(label,x+52,y+18,16,'muted',400)
    if mobile:s.icon('arrow',x+w-32,y+18,20)
    else:s.button('ძიება',x+w-120,y+7,112,44,icon='arrow')
    s.p.append('</g>')

def resource(s,r,x,y,w,h=228,mobile=False):
    s.p.append('<g data-component="ResourceCard">')
    s.rect(x,y,w,h,'white',12,'border')
    s.rect(x+20,y+20,38,38,'mint',8);s.icon(r['icon'],x+29,y+29,20)
    s.badge('დემო',x+w-63,y+23,'soft','muted',10)
    s.text(r['type'],x+20,y+76,11,'teal',600)
    titleh=s.text(r['title'],x+20,y+101,17 if mobile else 19,'ink',600,w-40,27)
    s.text(r['desc'],x+20,y+108+titleh,12,'muted',400,w-48,19)
    s.rule(x+20,y+h-45,w-40);s.text('რესურსის ნახვა',x+20,y+h-32,12,'teal',600);s.icon('arrow',x+w-40,y+h-31,17)
    s.p.append('</g>')

def desktop():
    s=SVG(1440,1894,'VascHub / Desktop / 1440 / v1')
    s.rect(0,0,1440,1894,'bg');s.rect(0,0,1440,28,'navy')
    s.text('პროფესიული ცოდნა • საქართველო',120,5,11,'white');s.text('სადემონსტრაციო დიზაინი',1120,5,11,'white')
    s.rect(0,28,1440,140,'white');logo(s,120,51)
    s.text('საქართველოს სისხლძარღვთა\nქირურგიის პლატფორმა',314,51,12,'muted',400,330,19)
    s.text('შესვლა',1050,61,13,'ink',500);s.button('პირადი კაბინეტი',1143,47,177,44,'outline','user')
    s.rule(120,111,1200)
    x=120
    for label in NAV:
        s.text(label,x,131,13,'muted',500);x+=width(label,13)+32
    s.text('კლინიკური ცოდნა და პროფესიული განვითარება',120,207,12,'teal',600)
    s.text('ცოდნა ყოველდღიური პრაქტიკისთვის.',120,238,40,'navy',600)
    s.text('გაიდლაინები, სასწავლო მასალები და პროფესიული შესაძლებლობები — ერთ სივრცეში.',120,306,16,'muted',400)
    search(s,120,359,1200)
    s.text('სწრაფი გადასვლა თემაზე',120,455,15,'ink',600);s.text('კლინიკური ბიბლიოთეკა',1124,457,12,'teal',500)
    for i,(label,icon) in enumerate(TOPICS):
        x=120+i*202;s.rect(x,492,190,104,'white',10,'border');s.icon(icon,x+16,507,26)
        s.text(label,x+16,550,13,'ink',500,158,20)
    s.section('ბოლო დამატებული რესურსები',120,648,1200,demo=True)
    for i,r in enumerate(RESOURCES): resource(s,r,120+i*408,715,384,254)
    s.rect(120,1022,1200,256,'navy',16)
    s.badge('აკადემია • დემო',148,1049,'mint','teal')
    s.text('ისწავლე მოკლე,\nპრაქტიკული მოდულებით.',148,1090,27,'white',600,570,40)
    s.text('ვიდეო, საკითხავი მასალა და თვითშეფასება.',148,1185,14,'#C1D6D6')
    s.button('აკადემიის დათვალიერება',148,1222,248,40,'primary','arrow')
    s.rect(828,1050,464,200,'#1C4051',12,'#355665')
    s.icon('play',850,1073,35,'#B9DFCF');s.text('გამორჩეული სასწავლო მოდული',900,1079,12,'#C1D6D6',500)
    s.text('სისხლძარღვთა ულტრაბგერითი\nდიაგნოსტიკა',850,1129,21,'white',600,410,32)
    s.text('მოდულის გვერდის სადემონსტრაციო მაგალითი',850,1207,12,'#C1D6D6')
    s.section('უახლოესი ღონისძიებები',120,1336,780,demo=True)
    for i,title in enumerate(EVENTS):
        y=1405+i*112;s.rect(120,y,780,96,'white',10,'border');s.rect(140,y+17,62,62,'mint',8);s.icon('calendar',158,y+35,26)
        s.text(title,222,y+17,16,'ink',600,570,24);s.text('თარიღი დასაზუსტებელია • დემო ღონისძიება',222,y+53,12,'muted');s.icon('arrow',860,y+37,20)
    s.section('სიახლეები',948,1336,372,link='',demo=True)
    for i,title in enumerate(NEWS):
        y=1405+i*112;s.text('პროფესიული სივრცე • დემო',948,y+4,10,'teal',600);s.text(title,948,y+29,16,'ink',600,340,25)
        s.rule(948,y+96,372)
    s.rect(0,1686,1440,208,'navy');logo(s,120,1723,True)
    s.text('საქართველოს სისხლძარღვთა ქირურგიის\nპროფესიული პლატფორმა.',120,1778,12,'#C1D6D6',400,480,21)
    s.text('ჩვენ შესახებ     კონტაქტი     კონფიდენციალურობა',824,1737,12,'white')
    s.text('© VascHub • დიზაინის კონცეფცია v1',986,1826,11,'#C1D6D6')
    return s.save('homepage-desktop.svg')

def mobile():
    s=SVG(390,3153,'VascHub / Mobile / 390 / v1');s.rect(0,0,390,3153,'bg');s.rect(0,0,390,26,'navy')
    s.text('VascHub • სადემონსტრაციო დიზაინი',20,5,10,'white')
    s.rect(0,26,390,72,'white');logo(s,20,45)
    s.rect(274,40,44,44,'white',8,'border');s.icon('user',286,51,20)
    s.rect(326,40,44,44,'white',8,'border');s.icon('menu',337,51,22)
    s.text('კლინიკური ცოდნა • პროფესიული ერთობა',20,128,11,'teal',600)
    s.text('ცოდნა ყოველდღიური\nპრაქტიკისთვის.',20,158,29,'navy',600,350,43)
    s.text('გაიდლაინები, სწავლა და პროფესიული\nშესაძლებლობები ერთ სივრცეში.',20,262,14,'muted',400,350,23)
    search(s,20,336,350,True)
    s.text('გაიდლაინები, თემები და კურსები',20,401,11,'muted')
    s.text('სწრაფი გადასვლა თემაზე',20,435,15,'ink',600)
    for i,(label,icon) in enumerate(TOPICS):
        x=20+(i%2)*181;y=465+(i//2)*84
        s.rect(x,y,169,74,'white',10,'border');s.icon(icon,x+12,y+12,22);s.text(label,x+44,y+18,12,'ink',500,113,19)
    s.section('ახალი რესურსები',20,753,350,demo=True,size=22)
    for i,r in enumerate(RESOURCES):resource(s,r,20,823+i*276,350,260,True)
    s.rect(20,1687,350,390,'navy',14);s.badge('აკადემია • დემო',42,1710)
    s.text('ისწავლე მოკლე,\nპრაქტიკული მოდულებით.',42,1759,23,'white',600,304,35)
    s.text('ვიდეო, საკითხავი მასალა\nდა თვითშეფასება.',42,1882,14,'#C1D6D6',400,280,24)
    s.icon('play',42,1958,24,'#B9DFCF');s.text('ულტრაბგერითი დიაგნოსტიკა',78,1958,13,'white',500,266,21)
    s.button('აკადემიის დათვალიერება',42,2012,306,44,'primary','arrow')
    s.section('ღონისძიებები',20,2133,350,demo=True,size=22)
    for i,title in enumerate(EVENTS):
        y=2205+i*145;s.rect(20,y,350,130,'white',10,'border');s.icon('calendar',36,y+19,24)
        s.text(title,76,y+16,15,'ink',600,270,25);s.text('თარიღი დასაზუსტებელია',76,y+81,11,'muted');s.badge('დემო',290,y+94,'soft','muted',10)
    s.section('პროფესიული სიახლეები',20,2546,350,link='',demo=True,size=22)
    for i,title in enumerate(NEWS):
        y=2620+i*103;s.text('პროფესიული სივრცე • დემო',20,y,10,'teal',600);s.text(title,20,y+26,16,'ink',600,330,26);s.rule(20,y+86,350)
    s.rect(0,2885,390,268,'navy');logo(s,20,2909,True)
    s.text('საქართველოს სისხლძარღვთა ქირურგიის\nპროფესიული პლატფორმა.',20,2969,12,'#C1D6D6',400,350,22)
    s.text('ჩვენ შესახებ     კონტაქტი',20,3044,12,'white');s.text('კონფიდენციალურობა',20,3076,12,'white')
    s.text('© VascHub • დიზაინის კონცეფცია v1',20,3115,10,'#C1D6D6')
    return s.save('homepage-mobile.svg')

def wireframe():
    s=SVG(1440,1380,'VascHub / Wireframe / Section priority')
    s.rect(0,0,1440,1380,'bg');s.text('VascHub / მთავარი გვერდის სტრუქტურა',72,38,25,'ink',600)
    for i,(h,title,desc) in enumerate([(92,'01 / ნავიგაცია','მიმართულებების აღმოჩენა • შესვლა • პირადი კაბინეტი'),(200,'02 / წარდგენა და ძიება','საჭირო რესურსის სწრაფად მოძიება'),(116,'03 / კლინიკური თემები','ერთი შეხებით გადასვლა შესაბამის მიმართულებაზე'),(222,'04 / ახალი რესურსები','მასალის ტიპი → სათაური → მოკლე აღწერა'),(170,'05 / აკადემია','ერთი გამოკვეთილი სასწავლო შესაძლებლობა'),(180,'06 / ღონისძიებები და სიახლეები','პროფესიული აქტივობისა და ახალი მასალების აღმოჩენა'),(110,'07 / Footer','საორგანიზაციო და საინფორმაციო ბმულები')]):
        y=110+sum(x[0]+18 for x in [(92,'',''),(200,'',''),(116,'',''),(222,'',''),(170,'',''),(180,'',''),(110,'','')][:i])
        s.rect(72,y,1296,h,'white',8,'border');s.text(title,96,y+18,18,'ink',600);s.text(desc,96,y+55,14,'muted')
    return s.save('homepage-wireframe.svg')

def states():
    s=SVG(1440,1010,'VascHub / Component states and demo interactions')
    s.rect(0,0,1440,1010,'bg');s.text('კომპონენტები და საჩვენებელი მდგომარეობები',48,30,25,'ink',600)
    s.text('საძიებო ველი • focus და დემო შედეგები',48,88,16,'muted',500);search(s,48,126,800,focused=True)
    s.rect(48,194,800,310,'white',12,'border');s.badge('პროტოტიპი • backend არ არის',68,213,'mint','teal')
    for i,r in enumerate(RESOURCES):
        y=258+i*74;s.icon(r['icon'],68,y+8,24);s.text(r['title'],110,y,16,'ink',600,640,24);s.text(r['type']+' • დემო',110,y+29,11,'muted');s.icon('arrow',806,y+12,18)
    s.text('ღილაკი • default / hover / focus / disabled',48,552,16,'muted',500)
    for i,label in enumerate(['Default','Hover','Focus','Disabled']):
        x=48+i*202;s.button('რესურსის ნახვა',x,603,178,44,'primary','arrow');s.text(label,x,662,12,'muted')
        if i==1:s.rect(x,603,178,44,'#084E48',8);s.text('რესურსის ნახვა',x+22,615,13,'white',600);s.icon('arrow',x+146,616,18,'white')
        if i==2:s.p.append(f'<rect x="{x-4}" y="599" width="186" height="52" rx="12" fill="none" stroke="{C["teal"]}" stroke-width="2"/>')
        if i==3:s.rect(x,603,178,44,'#C8D4D1',8);s.text('რესურსის ნახვა',x+22,615,13,'#405B56',600)
    s.text('მობილური მენიუ • ღია მდგომარეობა',932,88,16,'muted',500)
    s.rect(932,126,390,810,'white',12,'border');logo(s,952,148);s.rect(1258,143,44,44,'white',8,'border');s.icon('close',1268,153,24)
    s.rule(952,209,350)
    for i,label in enumerate(NAV):
        y=239+i*66;s.text(label,952,y,15,'ink',500,318,24);s.icon('chevron',1282,y+3,18,'muted');s.rule(952,y+48,350)
    s.button('შესვლა',952,690,350,46,'primary');s.button('პირადი კაბინეტი',952,750,350,46,'outline','user')
    s.badge('საჩვენებელი მენიუ',952,844,'mint','teal')
    s.text('ყველა ბმული და შედეგი ამ ეტაპზე მხოლოდ პროტოტიპის მაგალითია.',48,756,14,'muted',400,800,24)
    return s.save('homepage-states.svg')

if __name__=='__main__':
    OUT.mkdir(exist_ok=True,parents=True)
    files=[desktop(),mobile(),wireframe(),states()]
    (OUT/'layout-qa.json').write_text(json.dumps(QA,ensure_ascii=False,indent=2))
    import cairosvg
    for f in files:
        cairosvg.svg2png(url=str(f),write_to=str(f.with_suffix('.png')))
    print(json.dumps(QA,ensure_ascii=False,indent=2))
