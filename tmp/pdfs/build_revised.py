from pathlib import Path
root=Path('D:/Au-Toolkit')
helpers=(root/'tmp/pdfs/build_word.py').read_text(encoding='utf-8').split('gap(1.3)')[0]
exec(helpers)
sec.different_first_page_header_footer=False

# Identitas di halaman pertama mengikuti susunan referensi.
for label,value in [('NAMA','Meisya Bunga Deta'),('NIM','2300024249'),('MATA KULIAH','Hukum Tata Negara Darurat'),('KELAS','A')]:
 p=para(label+'\t: '+value)
 p.paragraph_format.first_line_indent=Cm(0);p.paragraph_format.space_after=Pt(2)
 p.paragraph_format.tab_stops.add_tab_stop(Cm(3.1))
p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.first_line_indent=Cm(0);p.paragraph_format.line_spacing=1.0
p.paragraph_format.space_before=Pt(8);p.paragraph_format.space_after=Pt(8)
p.add_run().add_picture(str(root/'tmp/pdfs/logo-uad/logo UAD hitam.png'),width=Cm(2.5))
chapter('PERBANDINGAN HUKUM TATA NEGARA DARURAT<br/>INDONESIA DENGAN JERMAN DAN MALAYSIA',True)

para('1. Perbandingan HTN Darurat Indonesia dengan Jerman','Heading 2')
para('Indonesia mengatur keadaan bahaya melalui Pasal 12 UUD NRI Tahun 1945 dan Perppu Nomor 23 Tahun 1959 tentang Keadaan Bahaya. Jerman mengaturnya dalam Grundgesetz melalui beberapa mekanisme sesuai jenis ancaman. Perbandingan berikut menitikberatkan keadaan bahaya Indonesia dan keadaan pertahanan Jerman, dengan pengaturan bencana serta ancaman dalam negeri sebagai konteks. [1][2][4]')
rows1=[
['Aspek','Indonesia','Jerman'],
['Dasar konstitusional','Pasal 12 UUD NRI Tahun 1945 mengenai keadaan bahaya.','Grundgesetz: Pasal 35, 91, serta 115a sampai 115l.'],
['Bentuk pengaturan','Darurat sipil, darurat militer, dan keadaan perang dalam Perppu 23/1959.','Bencana, ancaman dalam negeri, serta keadaan pertahanan memiliki jalur pengaturan berbeda.'],
['Pejabat atau lembaga berwenang','Presiden menyatakan keadaan bahaya untuk seluruh atau sebagian wilayah.','Keadaan pertahanan ditetapkan Bundestag dengan persetujuan Bundesrat atas permohonan pemerintah federal.'],
['Kondisi penerapan','Ancaman keamanan atau ketertiban yang tidak tertangani secara biasa, perang atau ancamannya, serta bahaya bagi kelangsungan negara.','Keadaan pertahanan: serangan bersenjata atau ancaman serangan yang segera terjadi terhadap wilayah federal.'],
['Bentuk kewenangan','Penguasa darurat memperoleh kewenangan khusus menurut tingkatan dan ketentuan Perppu 23/1959.','Eksekutif diperkuat; komando angkatan bersenjata beralih kepada Kanselir dalam keadaan pertahanan.'],
['Peran legislatif','DPR membentuk undang-undang mengenai syarat dan akibat keadaan bahaya bersama Presiden. Persetujuan atas Perppu adalah mekanisme berbeda dalam Pasal 22.','Parlemen terlibat sejak penetapan keadaan pertahanan. Joint Committee dapat bertindak dalam kondisi yang ditentukan konstitusi.'],
['Pengawasan dan perlindungan hukum','Jaminan HAM dalam UUD 1945 dan pengujian norma melalui lembaga peradilan sesuai kewenangannya.','Fungsi Mahkamah Konstitusi Federal dilindungi Pasal 115g; kewenangan Joint Committee dibatasi konstitusi.'],
['Pengakhiran status','Presiden menghapus keadaan bahaya berdasarkan Pasal 1 ayat (2) Perppu 23/1959.','Bundestag dengan persetujuan Bundesrat dapat mengakhiri keadaan pertahanan berdasarkan Pasal 115l.'],
['Persoalan yang perlu dinilai','Kejelasan indikator ancaman, batas waktu, dan efektivitas pertanggungjawaban penguasa darurat.','Keseimbangan kecepatan respons dengan koordinasi serta keberlanjutan pengawasan parlemen.']]
t=table(rows1,[3.4,5.3,5.3])
def caption(s):
 p=para(s);p.paragraph_format.first_line_indent=Cm(0);p.paragraph_format.space_before=Pt(6)
 p.paragraph_format.line_spacing=Pt(15)
 for r in p.runs:r.font.size=Pt(11)
caption('Sumber dasar perbandingan: UUD NRI Tahun 1945, Perppu 23/1959, Grundgesetz, serta penjelasan resmi Bundestag. [1][2][4][5][6]')
para('Indonesia dan Jerman sama-sama menyediakan kewenangan khusus untuk mempertahankan fungsi negara ketika mekanisme biasa tidak memadai. Perbedaannya terlihat pada cara mengaktifkan kewenangan dan membagi tanggung jawab antarlembaga. Dalam analisis penulis, aturan darurat perlu dinilai dari kemampuan mengatasi ancaman sekaligus menjaga agar perluasan kekuasaan tetap dapat dikendalikan.')
para('Di Indonesia, Presiden memegang kewenangan menyatakan keadaan bahaya. Pasal 12 UUD 1945 menyerahkan pengaturan syarat dan akibatnya kepada undang-undang. Karena itu, peran DPR dalam pembentukan kerangka hukumnya harus dibedakan dari persetujuan terhadap penerbitan Perppu menurut Pasal 22. Pasal 12 sendiri tidak mensyaratkan persetujuan DPR atas setiap deklarasi keadaan bahaya. [1]')
para('Keadaan bahaya juga tidak identik dengan kegentingan yang memaksa untuk menerbitkan Perppu. Putusan MK Nomor 138/PUU-VII/2009, pertimbangan [3.10], memberikan ukuran berupa kebutuhan hukum mendesak, kekosongan atau ketidakmemadaian undang-undang, dan ketidakmungkinan menunggu prosedur legislasi biasa. Pertimbangan [3.13] menegaskan kewenangan MK menguji Perppu. Dengan demikian, alasan penerbitannya dapat dinilai secara hukum. [3]')
para('Di Jerman, keadaan pertahanan melibatkan Bundestag dan Bundesrat. Pasal 115a ayat (1) mensyaratkan dua pertiga suara yang diberikan dan setidaknya mayoritas seluruh anggota Bundestag. Ketika terdapat hambatan yang tidak dapat diatasi untuk bersidang atau kuorum tidak terpenuhi, tersedia Joint Committee sesuai syarat konstitusi. Mekanisme ini menjaga keberlanjutan fungsi perwakilan selama krisis. [4][5]')
para('Penjelasan resmi Bundestag menunjukkan bahwa penguatan eksekutif tetap disertai hak informasi dan kontrol parlemen. Dalam analisis penulis, hal ini memberi pelajaran bahwa kebutuhan bertindak cepat perlu disertai pengawasan yang tetap berjalan. Penilaian tidak cukup berhenti pada siapa yang berwenang menetapkan keadaan darurat, tetapi juga harus mencakup siapa yang memeriksa penggunaan kewenangan dan dapat mendorong pengakhirannya. [6]')
para('Oleh karena itu, Indonesia dapat mengambil pelajaran mengenai pentingnya evaluasi berkala, pelaporan yang terbuka, dan perlindungan fungsi lembaga pengawas. Penyesuaian tetap diperlukan karena bentuk negara dan sistem pemerintahan kedua negara berbeda. Tujuan pembaruan ialah memastikan tindakan khusus berhenti ketika ancaman dapat ditangani kembali melalui prosedur biasa.')

para('2. Perbandingan HTN Darurat Indonesia dengan Malaysia','Heading 2')
para('Malaysia mengatur proklamasi darurat dalam Pasal 150 Konstitusi Federal. Pasal tersebut menyebut ancaman serius terhadap keamanan, kehidupan ekonomi, atau ketertiban umum di federasi maupun sebagian wilayahnya. Berbeda dengan pengaturan Indonesia yang menjabarkan tingkatan keadaan bahaya dalam Perppu 23/1959, ketentuan Malaysia memuat kewenangan proklamasi dan ordinansi darurat secara rinci dalam konstitusi. [2][7]')
rows2=[
['Aspek','Indonesia','Malaysia'],
['Dasar konstitusional','Pasal 12 UUD NRI Tahun 1945; Pasal 22 untuk mekanisme Perppu.','Pasal 150 Konstitusi Federal mengenai proklamasi dan kewenangan darurat.'],
['Dasar pengaturan lanjutan','Perppu Nomor 23 Tahun 1959 tentang Keadaan Bahaya.','Ketentuan Pasal 150 serta ordinansi atau undang-undang yang dibentuk berdasarkan kewenangan darurat.'],
['Pejabat berwenang','Presiden menyatakan dan menghapus keadaan bahaya.','Yang di-Pertuan Agong mengeluarkan proklamasi darurat menurut ketentuan konstitusi.'],
['Kondisi penerapan','Ancaman keamanan atau ketertiban, perang atau ancamannya, dan bahaya terhadap kelangsungan negara.','Keadaan darurat serius yang mengancam keamanan, kehidupan ekonomi, atau ketertiban umum; dapat diproklamasikan saat ancaman segera terjadi.'],
['Instrumen khusus','Kewenangan penguasa darurat menurut Perppu 23/1959; penerbitan Perppu menurut Pasal 22 mempunyai syarat tersendiri.','Pasal 150 ayat (2B) memungkinkan ordinansi jika tindakan segera diperlukan, kecuali ketika kedua majelis bersidang bersamaan.'],
['Peran legislatif','DPR terlibat dalam pembentukan dasar undang-undang keadaan bahaya dan menilai Perppu pada persidangan berikut.','Proklamasi dan ordinansi diajukan kepada kedua majelis; keduanya dapat membatalkan melalui resolusi menurut Pasal 150 ayat (3).'],
['Pengawasan yudisial','MK menguji undang-undang dan Perppu terhadap UUD menurut kewenangan serta putusannya.','Teks Pasal 150 ayat (8) memuat pembatasan luas pengujian pengadilan atas proklamasi dan ordinansi darurat.'],
['Batas dan akibat berakhirnya status','Penghapusan status oleh Presiden; tindakan khusus perlu dinilai menurut dasar dan syarat hukumnya.','Pasal 150 ayat (7) mengatur berakhirnya ordinansi dan ketentuan hukum tertentu enam bulan setelah proklamasi berakhir, dengan pengecualian yang ditentukan.'],
['Persoalan yang perlu dinilai','Kejelasan batas kewenangan dan efektivitas pengawasan dalam kerangka konstitusi.','Luasnya kewenangan darurat dan pembatasan pengujian menuntut perhatian terhadap akuntabilitas serta hak warga.']]
table(rows2,[3.4,5.3,5.3])
caption('Sumber dasar perbandingan: Pasal 12 dan Pasal 22 UUD NRI Tahun 1945, Perppu 23/1959, Putusan MK 138/PUU-VII/2009, serta Pasal 150 Konstitusi Federal Malaysia. [1][2][3][7]')
para('Kedua negara memberi dasar bagi tindakan luar biasa untuk mengatasi ancaman serius. Akan tetapi, desain hukumnya berbeda. Di Indonesia, penetapan status keadaan bahaya dan penerbitan Perppu merupakan dua jalur konstitusional yang harus dibedakan. Di Malaysia, ordinansi Pasal 150 ayat (2B) berkaitan dengan proklamasi darurat yang sedang berlaku. [1][3][7]')
para('Perbedaan tersebut berpengaruh pada cara menilai keabsahan tindakan pemerintah. Menurut penulis, penggunaan instrumen yang keliru dapat mengaburkan alasan penerapan serta jalur pengawasannya. Karena itu, penilaian harus dimulai dari identifikasi status hukum, pejabat yang bertindak, dan syarat kewenangan yang digunakan, kemudian dilanjutkan pada kebutuhan serta dampak tindakannya.')
para('Peran lembaga perwakilan juga tidak boleh disamaratakan. Persetujuan DPR atas Perppu Indonesia pada persidangan berikut berbeda dari mekanisme pembatalan proklamasi dan ordinansi oleh kedua majelis Malaysia. Perbedaan ini menunjukkan bahwa istilah pengawasan parlemen perlu dijelaskan dengan menyebut tahap, objek, dan akibat hukum pengawasannya. [1][7]')
para('Sebagai ilustrasi penerapan, Malaysia menerbitkan Emergency (Essential Powers) Ordinance 2021 berdasarkan Pasal 150 ayat (2B) setelah proklamasi 11 Januari 2021 terkait COVID-19. Pembukaan ordinansi menghubungkan pandemi dengan ancaman terhadap keamanan, kehidupan ekonomi, dan ketertiban umum. Contoh tersebut memperlihatkan penggunaan jalur darurat konstitusional untuk menghadapi krisis kesehatan dengan dampak luas. [8]')
para('Pengawasan peradilan menjadi persoalan penting dalam perbandingan ini. Indonesia mengenal pengujian Perppu oleh MK, sedangkan teks Pasal 150 ayat (8) Malaysia membatasi secara luas pengujian proklamasi dan ordinansi darurat. Pembahasan ini membandingkan desain normanya; penilaian atas setiap sengketa konkret tetap perlu memeriksa objek perkara dan perkembangan putusan pengadilan yang relevan. [3][7]')
para('Dalam analisis penulis, luasnya kewenangan darurat perlu diimbangi alasan yang terdokumentasi, pelaporan kepada lembaga perwakilan, dan mekanisme pemulihan bagi pihak yang dirugikan. Pembatasan hak harus dinilai berdasarkan hubungan nyata antara tindakan dan ancaman yang dihadapi. Keberadaan status darurat tidak dengan sendirinya membuktikan bahwa semua tindakan yang diambil merupakan pilihan yang diperlukan.')
para('Dari kedua perbandingan, Indonesia dapat mengambil pelajaran tentang pentingnya memperjelas indikator ancaman, membedakan instrumen hukum, dan memastikan pengawasan berlangsung sejak penetapan sampai pengakhiran status. Jerman memberi contoh keberlanjutan pengawasan parlemen, sedangkan Malaysia memperlihatkan luasnya pengaturan kewenangan darurat dalam konstitusi. Pembaruan hukum Indonesia perlu diarahkan pada respons krisis yang efektif, terukur, dan tetap menghormati hak warga negara.')

para('Sumber','Heading 2')
refs=[
('1','Republik Indonesia. Undang-Undang Dasar Negara Republik Indonesia Tahun 1945, khususnya Pasal 12, 22, 28I, dan 28J.','https://jdih.dpr.go.id/index/uu1945'),
('2','Republik Indonesia. Peraturan Pemerintah Pengganti Undang-Undang Nomor 23 Tahun 1959 tentang Keadaan Bahaya. JDIH Kementerian Keuangan.','https://jdih.kemenkeu.go.id/dok/perpu-23-tahun-1959'),
('3','Mahkamah Konstitusi RI. Putusan Nomor 138/PUU-VII/2009, 8 Februari 2010, pertimbangan [3.10]-[3.13].','https://www.mkri.id/public/content/persidangan/putusan/putusan_sidang_Perkara%20Nomor%20138-PUU-VII-2009.pdf'),
('4','Republik Federal Jerman. Basic Law for the Federal Republic of Germany, khususnya Pasal 35, 91, dan 115a-115l.','https://www.gesetze-im-internet.de/englisch_gg/englisch_gg.html'),
('5','Deutscher Bundestag. Joint Committee.','https://www.bundestag.de/en/committees/joint'),
('6','Deutscher Bundestag. Verteidigungsfall.','https://www.bundestag.de/parlament/grundgesetz/gg-serie-14-verteidigungsfall-634560'),
('7','Malaysia. Federal Constitution, Pasal 150. Salinan pada portal Judicial Appointments Commission.','https://jac.gov.my/sites/default/files/documents/Federal%20Constitution.pdf'),
('8','Malaysia. Emergency (Essential Powers) Ordinance 2021, 11 Januari 2021. Kertas Perintah 7 Tahun 2021. Parlimen Malaysia.','https://www.parlimen.gov.my/ipms/eps/2021-07-26/CMD.7.2021%20-%20CMD%207.2021.pdf')]
for n,s,url in refs:
 p=para('['+n+'] '+s);p.paragraph_format.first_line_indent=Cm(0);p.paragraph_format.line_spacing=Pt(16);p.paragraph_format.keep_with_next=True
 p=para(url);p.paragraph_format.first_line_indent=Cm(0);p.paragraph_format.line_spacing=Pt(14)
 for r in p.runs:r.font.size=Pt(10.5)
caption('Sumber daring diakses pada 22 Oktober 2026.')

# Seluruh tulisan dan garis tabel berwarna hitam, dengan header berulang.
for t in doc.tables:
 for i,row in enumerate(t.rows):
  for cell in row.cells:
   for p in cell.paragraphs:
    p.paragraph_format.line_spacing=Pt(16)
    for r in p.runs:r.font.size=Pt(11)
footer=sec.footer.paragraphs[0];footer.alignment=WD_ALIGN_PARAGRAPH.CENTER;footer.paragraph_format.first_line_indent=Cm(0)
fld=OxmlElement('w:fldSimple');fld.set(qn('w:instr'),'PAGE');footer._p.append(fld)
doc.core_properties.author='Meisya Bunga Deta'
doc.core_properties.title='Perbandingan Hukum Tata Negara Darurat Indonesia dengan Jerman dan Malaysia'
out=root/'output/docx/Laporan_HTN_Darurat_Meisya_Bunga_Deta_Revisi.docx'
doc.save(out)
print(out)
