export type ReplyLanguage='en'|'id';
export function replyLanguage(question:string,fallback:ReplyLanguage,infer=true):ReplyLanguage{
 const pattern=/\b(?:(?:gunakan|pakai|jawab(?:lah|an)?|jelaskan|tulis|balas|use|respond|reply|answer|write|explain)\s+(?:(?:dalam|dengan|menggunakan|in|using)\s+)?|(?:dalam|in)\s+)(?:bahasa\s+)?(indonesia(?:n)?|inggris|english)\b/gi;
 let language=fallback,explicit=false;
 for(const match of question.matchAll(pattern)){
  const before=question.slice(Math.max(0,match.index!-20),match.index).trim();
  if(/\b(?:jangan|do not|don't)\s*$/i.test(before))continue;
  explicit=true;language=/^(indonesia|indonesian)$/i.test(match[1])?'id':'en';
 }
 if(!explicit&&infer){
 const words=question.toLowerCase().replace(/[`"'][^`"']*[`"']/g,' ').match(/[a-z]+/g)||[];
 const id=new Set('tampilkan ubah ganti buat jelaskan hitung jumlah hapus jangan dahulu dulu hanya semua seluruh kolom baris data yang dan dengan untuk pada ini itu saya tolong grafik menjadi kenapa bagaimana berdasarkan paling bulan negara duplikat berapa gunakan apakah hasil ringkasan penjualan meningkat menurun nilai pelanggan pesanan dibandingkan terdapat merupakan menunjukkan tersedia terlihat secara karena dapat belum sudah oleh dari tanpa'.split(' '));
 const en=new Set('show change replace create explain calculate total delete remove keep only all columns rows the and with for this that please chart into why how based highest month country duplicates what which use results summary sales indicates contains available is are from without because can has have been not'.split(' '));
 const score=(set:Set<string>)=>words.filter(w=>set.has(w)).length;
 if(score(id)>score(en))language='id';else if(score(en)>score(id))language='en';
 }
 return language;
}
