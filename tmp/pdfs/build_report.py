from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT=Path('D:/Au-Toolkit')
OUT=ROOT/'output/pdf/Laporan_HTN_Darurat_Meisya_Bunga_Deta.pdf'
OUT.parent.mkdir(parents=True,exist_ok=True)
for name,file in [('TNR','times.ttf'),('TNR-Bold','timesbd.ttf'),('TNR-Italic','timesi.ttf')]:
    pdfmetrics.registerFont(TTFont(name,'C:/Windows/Fonts/'+file))
pdfmetrics.registerFontFamily('TNR',normal='TNR',bold='TNR-Bold',italic='TNR-Italic',boldItalic='TNR-Bold')
body=ParagraphStyle('Body',fontName='TNR',fontSize=12,leading=18,alignment=TA_JUSTIFY,firstLineIndent=1.25*cm,spaceAfter=6,textColor='black')
head=ParagraphStyle('Head',parent=body,fontName='TNR-Bold',alignment=TA_LEFT,firstLineIndent=0,spaceBefore=5,spaceAfter=6,keepWithNext=True)
title=ParagraphStyle('Title',parent=head,alignment=TA_CENTER,fontSize=14,leading=20,spaceAfter=14)
small=ParagraphStyle('Small',parent=body,fontSize=10.5,leading=14,firstLineIndent=0,alignment=TA_LEFT,spaceAfter=7)
ref=ParagraphStyle('Ref',parent=body,fontSize=12,leading=16,firstLineIndent=0,leftIndent=18,spaceAfter=12,alignment=TA_LEFT)
story=[]
def p(t): story.append(Paragraph(t,body))
def h(t): story.append(Paragraph(t,head))
def chapter(t): story.append(Paragraph(t,title))
def page(): story.append(PageBreak())

story.append(Spacer(1,1.3*cm))
chapter('LAPORAN PERBANDINGAN<br/>HUKUM TATA NEGARA DARURAT<br/>INDONESIA DAN JERMAN')
story.append(Spacer(1,1.0*cm))
story.append(Paragraph('Disusun untuk memenuhi tugas mata kuliah<br/>Hukum Tata Negara Darurat',ParagraphStyle('CoverText',parent=body,alignment=TA_CENTER,firstLineIndent=0)))
story.append(Spacer(1,0.6*cm))
logo=Image(str(ROOT/'tmp/pdfs/logo-uad/logo UAD hitam.png'),width=4.5*cm,height=4.5*cm)
logo.hAlign='CENTER'
story.append(logo)
story.append(Spacer(1,0.8*cm))
data=[['Nama',': Meisya Bunga Deta'],['NIM',': 2300024249'],['Mata kuliah',': Hukum Tata Negara Darurat'],['Kelas',': A']]
t=Table([[Paragraph(a,small),Paragraph(b,small)] for a,b in data],colWidths=[2.7*cm,10.5*cm])
t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
story.append(t)
story.append(Spacer(1,1.5*cm))
story.append(Paragraph('2026',ParagraphStyle('Year',parent=title,fontSize=12)))
page()

chapter('BAB I<br/>PENDAHULUAN')
h('A. Latar Belakang')
p('Negara dapat menghadapi ancaman yang tidak dapat ditangani secara memadai melalui mekanisme pemerintahan biasa. Dalam keadaan demikian, hukum tata negara darurat menyediakan kerangka kewenangan khusus agar negara tetap berfungsi. Persoalannya, perluasan kekuasaan untuk mengatasi krisis juga dapat memperbesar risiko penyalahgunaan wewenang. Karena itu, tindakan darurat harus memiliki dasar hukum, tujuan yang jelas, ruang lingkup yang terukur, dan mekanisme pengawasan.')
p('Indonesia dan Jerman dipilih karena memiliki desain ketatanegaraan yang berbeda. Indonesia memberi peran sentral kepada Presiden dalam pernyataan keadaan bahaya. Jerman menempatkan keterlibatan parlemen sebagai unsur penting dalam keadaan pertahanan. Perbandingan ini berguna untuk menilai bagaimana kebutuhan bertindak cepat dapat berjalan bersama pertanggungjawaban demokratis. [1][2][4][6]')
h('B. Rumusan Masalah')
p('Laporan ini membahas tiga masalah: bagaimana dasar hukum dan mekanisme keadaan darurat di Indonesia dan Jerman; apa persamaan serta perbedaannya dalam pembagian kewenangan, pengawasan, dan perlindungan hak; serta pelajaran apa yang dapat digunakan untuk memperbaiki pengaturan di Indonesia.')
h('C. Tujuan dan Metode Penulisan')
p('Penulisan bertujuan menjelaskan kedua sistem dan menyusun penilaian kritis terhadap desain pengendalian kekuasaan darurat. Metode yang digunakan adalah kajian yuridis normatif dengan pendekatan peraturan perundang-undangan dan perbandingan konstitusi. Bahan utama berupa konstitusi, peraturan keadaan bahaya, putusan Mahkamah Konstitusi, serta penjelasan resmi parlemen Jerman.')
p('Ruang lingkup laporan mencakup keadaan bahaya Indonesia dan keadaan pertahanan Jerman, dengan pengaturan bencana serta ancaman dalam negeri sebagai konteks. Penilaian dan saran merupakan analisis penulis atas bahan hukum tersebut.')
page()

chapter('BAB II<br/>PENGATURAN DI INDONESIA')
h('A. Keadaan Bahaya dan Kewenangan Presiden')
p('Pasal 12 UUD NRI Tahun 1945 menjadi dasar kewenangan Presiden menyatakan keadaan bahaya, sedangkan syarat dan akibatnya diatur dengan undang-undang. Kerangka operasionalnya terdapat dalam Perppu Nomor 23 Tahun 1959 tentang Keadaan Bahaya. Pasal 1 membedakan darurat sipil, darurat militer, dan keadaan perang; penetapan dapat meliputi seluruh atau sebagian wilayah. [1][2]')
p('Pemicu meliputi gangguan keamanan atau ketertiban yang tidak dapat ditangani secara biasa, perang atau ancamannya, serta bahaya terhadap kelangsungan hidup negara. Presiden menetapkan sekaligus menghapus keadaan bahaya. Struktur penguasa darurat pusat dan daerah dibentuk menurut tingkatannya. Contoh kewenangan khusus ialah pembatasan penerbitan dalam Pasal 13 dan penggeledahan dalam Pasal 14. Pasal 60 mengatur ganti kerugian untuk tindakan yang ternyata tidak beralasan. [2]')
h('B. Perppu dan Kegentingan yang Memaksa')
p('Pasal 22 UUD NRI Tahun 1945 memberi Presiden kewenangan menerbitkan Perppu dalam kegentingan yang memaksa. Persetujuan DPR diperlukan pada persidangan berikut; jika tidak disetujui, Perppu harus dicabut. Mekanisme ini berbeda dari penetapan keadaan bahaya Pasal 12. Penerbitan Perppu tidak otomatis berarti pemberlakuan darurat sipil atau darurat militer. [1][3]')
p('Putusan MK Nomor 138/PUU-VII/2009, pertimbangan [3.10], mensyaratkan kebutuhan mendesak menyelesaikan masalah hukum, ketiadaan atau ketidakmemadaian undang-undang, serta ketidakmungkinan menunggu pembentukan undang-undang melalui prosedur biasa. Dalam pertimbangan [3.13], MK menyatakan berwenang menguji Perppu. Dengan demikian, alasan Presiden dapat dinilai melalui ukuran hukum dan pengawasan kelembagaan. [3]')
h('C. Batas Kekuasaan')
p('Keadaan bahaya tidak menghapus kedudukan konstitusi. Jaminan hak yang tidak dapat dikurangi dalam keadaan apa pun terdapat pada Pasal 28I ayat (1), sementara pembatasan hak tunduk pada Pasal 28J. [1]')
page()

chapter('BAB III<br/>PENGATURAN DI JERMAN')
h('A. Pembedaan Jenis Ancaman')
p('Grundgesetz atau Hukum Dasar Jerman membedakan penanganan bencana dalam Pasal 35, ancaman terhadap keberadaan atau tatanan demokratis dalam negeri dalam Pasal 91, serta keadaan pertahanan dalam Pasal 115a sampai 115l. Karena itu, semua krisis tidak masuk ke satu status tunggal. Pemilihan dasar kewenangan mengikuti sifat ancaman. [4]')
h('B. Penetapan Keadaan Pertahanan')
p('Menurut Pasal 115a ayat (1), keadaan pertahanan berkaitan dengan serangan bersenjata atau ancaman serangan yang segera terjadi terhadap wilayah federal. Penetapannya dilakukan Bundestag atas permohonan pemerintah federal dengan persetujuan Bundesrat. Diperlukan dua pertiga suara yang diberikan dan setidaknya mayoritas seluruh anggota Bundestag. Presiden federal mengumumkan penetapan tersebut. [4]')
p('Jika parlemen tidak dapat bersidang tepat waktu karena hambatan yang tidak dapat diatasi atau tidak memenuhi kuorum, tersedia Joint Committee sesuai persyaratan konstitusi. Komite ini beranggotakan unsur Bundestag dan Bundesrat. Keberadaannya dimaksudkan menjaga fungsi perwakilan ketika lembaga parlemen biasa tidak dapat menjalankan tugas secara penuh. [5]')
h('C. Penguatan Eksekutif dan Pengawasan')
p('Penjelasan resmi Bundestag menerangkan bahwa keadaan pertahanan memperkuat eksekutif, termasuk beralihnya komando angkatan bersenjata kepada Kanselir. Meskipun demikian, parlemen tetap memiliki hak informasi dan pengawasan. Desain tersebut berupaya menjaga legitimasi demokratis ketika pemerintah membutuhkan tindakan cepat. [6]')
p('Pasal 115e melarang Joint Committee mengubah atau menangguhkan konstitusi. Pasal 115g menjaga kedudukan dan fungsi Mahkamah Konstitusi Federal. Berdasarkan Pasal 115l, Bundestag dengan persetujuan Bundesrat dapat mengakhiri keadaan pertahanan; pengakhiran wajib dilakukan segera ketika syaratnya tidak lagi ada. [4]')
page()

chapter('BAB IV<br/>PERBANDINGAN KEDUA NEGARA')
h('A. Matriks Perbandingan')
rows=[
['Aspek','Indonesia','Jerman'],
['Dasar utama','Pasal 12 dan Pasal 22 UUD 1945; Perppu 23/1959.','Grundgesetz, khususnya Pasal 35, 91, dan 115a-115l.'],
['Bentuk pengaturan','Tiga tingkatan keadaan bahaya; Perppu merupakan mekanisme legislasi tersendiri.','Membedakan bencana, ancaman dalam negeri, dan keadaan pertahanan.'],
['Penentu status','Presiden menyatakan keadaan bahaya.','Keadaan pertahanan: Bundestag dengan persetujuan Bundesrat, atas permohonan pemerintah.'],
['Peran parlemen','Persetujuan DPR pada persidangan berikut untuk Perppu; berbeda dari deklarasi Pasal 12.','Parlemen terlibat sejak penetapan keadaan pertahanan; tersedia Joint Committee.'],
['Arah kewenangan','Penguasaan darurat terpusat pada Presiden dengan struktur pelaksana daerah.','Eksekutif diperkuat, disertai kelanjutan perwakilan dan pengawasan parlemen.'],
['Perlindungan hukum','Jaminan HAM konstitusional dan pengujian norma melalui mekanisme peradilan.','Keberlanjutan Mahkamah Konstitusi Federal dijamin khusus dalam Pasal 115g.'],
['Pengakhiran','Presiden menghapus keadaan bahaya berdasarkan Pasal 1 ayat (2) Perppu 23/1959.','Bundestag dengan persetujuan Bundesrat mengakhiri keadaan pertahanan.']]
table=Table([[Paragraph(escape(x),small) for x in row] for row in rows],colWidths=[2.5*cm,5.75*cm,5.75*cm],repeatRows=1,hAlign='LEFT')
table.setStyle(TableStyle([('GRID',(0,0),(-1,-1),.5,'black'),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
story.append(table)
story.append(Spacer(1,8))
story.append(Paragraph('Sumber: disusun berdasarkan bahan hukum [1]-[6]. Perbandingan penetapan dan pengakhiran Jerman pada tabel ini khusus mengenai keadaan pertahanan.',small))
page()

h('B. Persamaan dan Perbedaan Pokok')
p('Kedua negara menempatkan tindakan darurat dalam kerangka hukum. Negara membutuhkan kewenangan tambahan untuk menghadapi ancaman tertentu, tetapi kewenangan tersebut harus dapat dijelaskan berdasarkan norma. Persamaannya terletak pada kebutuhan menjaga kelangsungan pemerintahan, sedangkan perbedaan utamanya terletak pada siapa yang menentukan aktivasi dan pengakhiran kewenangan khusus.')
p('Dalam analisis penulis, desain Indonesia memungkinkan konsentrasi keputusan pada Presiden sehingga berpotensi memudahkan respons cepat. Namun, konsentrasi tersebut menuntut indikator ancaman dan pengawasan yang kuat. Desain Jerman membagi tanggung jawab keadaan pertahanan di antara pemerintah dan lembaga perwakilan. Pilihan ini memperluas dasar legitimasi, tetapi menuntut kesiapan koordinasi lembaga dalam keadaan mendesak.')
h('C. Perlindungan Hak Asasi Manusia')
p('Pasal 4 International Covenant on Civil and Political Rights (ICCPR) menyediakan ukuran pembanding: penyimpangan kewajiban tertentu hanya dimungkinkan dalam keadaan darurat yang mengancam kehidupan bangsa dan diumumkan resmi, sebatas yang benar-benar diperlukan. Penyimpangan tidak boleh diskriminatif atas dasar yang disebutkan dalam pasal tersebut dan harus sesuai kewajiban internasional lainnya. Beberapa hak, termasuk larangan penyiksaan, tidak dapat disimpangi. Terdapat pula kewajiban pemberitahuan melalui Sekretaris Jenderal PBB. [7]')
p('Komite HAM PBB dalam General Comment No. 29 menegaskan sifat sementara penyimpangan dan tujuan mengembalikan keadaan normal. Ukuran keperluan yang ketat harus diterapkan terhadap durasi, cakupan wilayah, dan substansi tindakan. Dengan demikian, deklarasi keadaan darurat saja belum cukup untuk membenarkan semua pembatasan. [8]')
p('Menurut penulis, setiap kebijakan perlu diuji melalui pertanyaan konkret: ancaman apa yang hendak diatasi, apakah tindakan itu membantu mengatasi ancaman, adakah pilihan yang lebih ringan, dan apakah beban terhadap masyarakat sebanding dengan manfaatnya. Alasan serta data pendukung perlu didokumentasikan agar pengawasan dapat menilai kebutuhan tindakan secara nyata.')
page()

chapter('BAB V<br/>PENUTUP')
h('A. Kesimpulan')
p('Perbandingan menunjukkan bahwa hukum tata negara darurat merupakan cara mempertahankan pemerintahan konstitusional ketika mekanisme biasa tidak memadai. Indonesia menempatkan Presiden sebagai aktor utama keadaan bahaya, sedangkan Jerman menekankan keterlibatan parlemen dalam keadaan pertahanan. Perppu Indonesia harus dibedakan dari deklarasi keadaan bahaya karena fungsi, syarat, dan mekanisme pengawasannya berbeda.')
p('Berdasarkan analisis dalam laporan ini, kekuatan suatu sistem tidak cukup dinilai dari kecepatan pemberian kewenangan tambahan. Ukurannya juga mencakup kejelasan ancaman, keterbukaan alasan, efektivitas pengawasan, perlindungan hak, serta kemampuan mengakhiri kewenangan khusus. Desain Jerman memberi pelajaran tentang kelanjutan fungsi lembaga perwakilan dan peradilan selama krisis, dengan tetap memperhatikan perbedaan konteks kedua negara.')
h('B. Saran')
p('Pertama, Indonesia perlu memperbarui pengaturan keadaan bahaya dengan indikator ancaman yang lebih terukur dan pembagian kewenangan yang jelas. Pembaruan sebaiknya menyelaraskan kewenangan darurat dengan jaminan konstitusional setelah perubahan UUD 1945.')
p('Kedua, penulis menyarankan tenggat evaluasi yang tegas, kewajiban pelaporan kepada DPR, dan peninjauan berkala atas kelanjutan status. Perpanjangan kewenangan khusus seharusnya didukung penilaian ancaman terbaru. Kebijakan juga perlu menjelaskan kapan dan bagaimana kehidupan pemerintahan dikembalikan kepada prosedur biasa.')
p('Ketiga, akses pengaduan, bantuan hukum, dan pemulihan bagi pihak yang dirugikan perlu dijamin dalam pelaksanaan kebijakan. Pembatasan hak harus beralasan, sebanding, dan dapat diperiksa. Pelajaran perbandingan ini sebaiknya digunakan untuk memperkuat pertanggungjawaban di Indonesia dengan penyesuaian terhadap sistem presidensial dan bentuk negara kesatuan.')
page()

chapter('DAFTAR PUSTAKA')
refs=[
('1','Republik Indonesia. <i>Undang-Undang Dasar Negara Republik Indonesia Tahun 1945</i>, khususnya Pasal 12, 22, 28I, dan 28J. JDIH DPR RI.','https://jdih.dpr.go.id/index/uu1945'),
('2','Republik Indonesia. <i>Peraturan Pemerintah Pengganti Undang-Undang Nomor 23 Tahun 1959 tentang Keadaan Bahaya</i>. JDIH Kementerian Keuangan.','https://jdih.kemenkeu.go.id/dok/perpu-23-tahun-1959'),
('3','Mahkamah Konstitusi RI. <i>Putusan Nomor 138/PUU-VII/2009</i>, 8 Februari 2010, pertimbangan [3.10] dan [3.13].','https://www.mkri.id/public/content/persidangan/putusan/putusan_sidang_Perkara%20Nomor%20138-PUU-VII-2009.pdf'),
('4','Republik Federal Jerman. <i>Basic Law for the Federal Republic of Germany</i>. Terjemahan resmi daring, memperhitungkan perubahan 22 Maret 2025.','https://www.gesetze-im-internet.de/englisch_gg/englisch_gg.html'),
('5','Deutscher Bundestag. <i>Joint Committee</i>. Penjelasan resmi mengenai komite gabungan Bundestag dan Bundesrat.','https://www.bundestag.de/en/committees/joint'),
('6','Deutscher Bundestag. <i>Verteidigungsfall</i>. Penjelasan resmi mengenai keadaan pertahanan dan pengawasan parlemen.','https://www.bundestag.de/parlament/grundgesetz/gg-serie-14-verteidigungsfall-634560'),
]
for n,txt,url in refs:
    story.append(Paragraph('['+n+'] '+txt,ref))
    story.append(Paragraph('<link href="'+url+'" color="black">'+escape(url)+'</link>',small))
page()
chapter('DAFTAR PUSTAKA<br/>(LANJUTAN)')
refs2=[
('7','Perserikatan Bangsa-Bangsa. <i>International Covenant on Civil and Political Rights</i>, 1966, Pasal 4. OHCHR.','https://2covenants.ohchr.org/About-ICCPR.html'),
('8','Human Rights Committee. <i>General Comment No. 29: States of Emergency (Article 4)</i>. CCPR/C/21/Rev.1/Add.11, 31 Agustus 2001, khususnya paragraf 1-4.','https://docs.un.org/en/CCPR/C/21/Rev.1/Add.11'),
]
for n,txt,url in refs2:
    story.append(Paragraph('['+n+'] '+txt,ref))
    story.append(Paragraph('<link href="'+url+'" color="black">'+escape(url)+'</link>',small))
story.append(Spacer(1,12))
story.append(Paragraph('Seluruh sumber daring diakses pada 22 Oktober 2026. Nomor dalam kurung siku pada pembahasan mengacu pada daftar pustaka ini.',small))

def footer(c,doc):
    c.setFillColorRGB(0,0,0)
    if doc.page>1:
        c.setFont('TNR',12)
        c.drawCentredString((4*cm+A4[0]-3*cm)/2,2*cm,str(doc.page-1))
doc=SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=3*cm,leftMargin=4*cm,topMargin=3*cm,bottomMargin=3*cm,title='Perbandingan Hukum Tata Negara Darurat Indonesia dan Jerman',author='Meisya Bunga Deta',subject='Hukum Tata Negara Darurat - Kelas A')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(OUT)
