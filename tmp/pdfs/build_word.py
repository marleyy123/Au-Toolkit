import ast,re
from pathlib import Path
from html import unescape
from docx import Document
from docx.shared import Cm,Pt,RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH,WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

root=Path('D:/Au-Toolkit')
tree=ast.parse((root/'tmp/pdfs/build_report.py').read_text(encoding='utf-8'))
doc=Document()
sec=doc.sections[0]
sec.page_width=Cm(21);sec.page_height=Cm(29.7)
sec.left_margin=Cm(4);sec.right_margin=Cm(3);sec.top_margin=Cm(3);sec.bottom_margin=Cm(3)
sec.footer_distance=Cm(1.8)
sec.different_first_page_header_footer=True
for style in doc.styles:
 if style.type==1:
  style.font.name='Times New Roman';style.font.color.rgb=RGBColor(0,0,0)
  fonts=style._element.get_or_add_rPr().get_or_add_rFonts()
  for attr in list(fonts.attrib):
   if 'Theme' in attr:del fonts.attrib[attr]
  fonts.set(qn('w:eastAsia'),'Times New Roman')
  for border in list(style._element.xpath('./w:pPr/w:pBdr')):border.getparent().remove(border)
normal=doc.styles['Normal'];normal.font.size=Pt(12)
f=normal.paragraph_format
f.line_spacing=Pt(18);f.space_after=Pt(6);f.first_line_indent=Cm(1.25)
f.widow_control=True
for sn in ['Title','Heading 1','Heading 2']:
 st=doc.styles[sn];st.font.size=Pt(14 if sn in ['Title','Heading 1'] else 12);st.font.bold=True
 st.paragraph_format.first_line_indent=Cm(0)
 st.paragraph_format.space_before=Pt(5);st.paragraph_format.space_after=Pt(6)
 st.paragraph_format.line_spacing=Pt(18);st.paragraph_format.keep_with_next=True

def text(p,s):
 for part in re.split('(<i>.*?</i>)',s):
  italic=part.startswith('<i>')
  part=re.sub('<br\\s*/?>','\n',part)
  part=unescape(re.sub('<[^>]+>','',part))
  if part:p.add_run(part).italic=italic
 return p
pending_break=False
def para(s,style=None):
 global pending_break
 p=doc.add_paragraph(style=style);text(p,s)
 if pending_break:
  p.paragraph_format.page_break_before=True;pending_break=False
 p.alignment=WD_ALIGN_PARAGRAPH.JUSTIFY if style is None else WD_ALIGN_PARAGRAPH.LEFT
 return p
def gap(cm):
 p=doc.add_paragraph();p.paragraph_format.first_line_indent=Cm(0)
 p.paragraph_format.space_after=Pt(0);p.paragraph_format.space_before=Pt(0);p.paragraph_format.line_spacing=Pt(cm*28.3465)
 p.add_run(' ').font.size=Pt(1)
def chapter(s,cover=False):
 p=para(s,'Title' if cover else 'Heading 1');p.alignment=WD_ALIGN_PARAGRAPH.CENTER
 p.paragraph_format.space_after=Pt(14)
def table(rows,widths,grid=True):
 t=doc.add_table(rows=0,cols=len(widths));t.autofit=False
 for col,w in zip(t.columns,widths):col.width=Cm(w)
 for ridx,row in enumerate(rows):
  cells=t.add_row().cells
  for c,w,s in zip(cells,widths,row):
   c.width=Cm(w)
   p=c.paragraphs[0];text(p,s)
   p.paragraph_format.first_line_indent=Cm(0);p.paragraph_format.line_spacing=Pt(14)
   p.paragraph_format.space_after=Pt(5);p.paragraph_format.space_before=Pt(4)
   for r in p.runs:r.font.size=Pt(10.5)
   if grid and ridx==0:
    for r in p.runs:r.bold=True
  trpr=t.rows[-1]._tr.get_or_add_trPr();trpr.append(OxmlElement('w:cantSplit'))
  if grid and ridx==0:trpr.append(OxmlElement('w:tblHeader'))
 if grid:
  borders=OxmlElement('w:tblBorders')
  for side in ['top','left','bottom','right','insideH','insideV']:
   el=OxmlElement('w:'+side);el.set(qn('w:val'),'single');el.set(qn('w:sz'),'4');el.set(qn('w:color'),'000000');borders.append(el)
  t._tbl.tblPr.append(borders)
 return t

gap(1.3)
chapter('LAPORAN PERBANDINGAN<br/>HUKUM TATA NEGARA DARURAT<br/>INDONESIA DAN JERMAN',True)
gap(.7)
p=para('Disusun untuk memenuhi tugas mata kuliah<br/>Hukum Tata Negara Darurat');p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.first_line_indent=Cm(0)
gap(.4)
p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.first_line_indent=Cm(0)
p.paragraph_format.line_spacing=1.0
p.add_run().add_picture(str(root/'tmp/pdfs/logo-uad/logo UAD hitam.png'),width=Cm(4.5))
gap(.5)
table([['Nama',': Meisya Bunga Deta'],['NIM',': 2300024249'],['Mata kuliah',': Hukum Tata Negara Darurat'],['Kelas',': A']],[2.7,10.5],False)
gap(1.1)
p=para('2026');p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.first_line_indent=Cm(0);p.runs[0].bold=True

active=False
for node in tree.body:
 if isinstance(node,ast.Expr) and isinstance(node.value,ast.Call):
  c=node.value
  if isinstance(c.func,ast.Name):
   name=c.func.id
   if name=='page':
    pending_break=True;active=True
   elif active and name in ['p','h','chapter']:
    s=ast.literal_eval(c.args[0])
    if name=='chapter':chapter(s)
    elif name=='h':para(s,'Heading 2')
    else:para(s)
 if active and isinstance(node,ast.Assign):
  names=[x.id for x in node.targets if isinstance(x,ast.Name)]
  if 'rows' in names:table(ast.literal_eval(node.value),[2.5,5.75,5.75])
  if 'refs' in names or 'refs2' in names:
   for n,s,url in ast.literal_eval(node.value):
    p=para('['+n+'] '+s);p.paragraph_format.first_line_indent=Cm(0);p.paragraph_format.line_spacing=Pt(16)
    p=para(url);p.paragraph_format.first_line_indent=Cm(0);p.paragraph_format.line_spacing=Pt(14)
    for run in p.runs:run.font.size=Pt(10.5)
 if active and isinstance(node,ast.Expr) and isinstance(node.value,ast.Call):
  c=node.value
  if isinstance(c.func,ast.Attribute) and c.func.attr=='append' and c.args:
   a=c.args[0]
   if isinstance(a,ast.Call) and isinstance(a.func,ast.Name) and a.func.id=='Paragraph' and isinstance(a.args[0],ast.Constant):
    p=para(a.args[0].value);p.paragraph_format.first_line_indent=Cm(0)
    for r in p.runs:r.font.size=Pt(10.5)

footer=sec.footer.paragraphs[0];footer.alignment=WD_ALIGN_PARAGRAPH.CENTER;footer.paragraph_format.first_line_indent=Cm(0)
r=footer.add_run();fld=OxmlElement('w:fldSimple');fld.set(qn('w:instr'),'PAGE');r._r.addnext(fld)
num=OxmlElement('w:pgNumType');num.set(qn('w:start'),'0');sec._sectPr.append(num)
doc.core_properties.author='Meisya Bunga Deta'
doc.core_properties.title='Perbandingan Hukum Tata Negara Darurat Indonesia dan Jerman'
out=root/'output/docx/Laporan_HTN_Darurat_Meisya_Bunga_Deta.docx';out.parent.mkdir(parents=True,exist_ok=True);doc.save(out)
print(out)
