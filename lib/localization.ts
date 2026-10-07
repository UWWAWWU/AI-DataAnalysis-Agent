export type Locale = 'en' | 'id';
export type ProtectedText = {text:string;tokens:string[]};
// Literal data, numerical evidence and code must survive translation byte for byte.
export function protectText(text:string, columns:string[]=[]):ProtectedText {
 const tokens:string[]=[];
 const literals=columns.filter(Boolean).sort((a,b)=>b.length-a.length).map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
 const pattern=new RegExp('```[\\s\\S]*?```|`[^`\\n]+`|https?:\\/\\/[^\\s)]+|\\b\\d+(?:[.,:/-]\\d+)*(?:%|[kKmMbB])?'+(literals.length?'|(?<![\\w])(?:'+literals.join('|')+')(?![\\w])':''),'g');
 return {text:text.replace(pattern,match=>{const id=tokens.push(match)-1;return `⟦P${id}⟧`}),tokens};
}
export function restoreText(translated:string,protectedText:ProtectedText):string {
 const expected=protectedText.tokens.map((_,i)=>`⟦P${i}⟧`);
 const found=translated.match(/⟦P\d+⟧/g)||[];
 if(found.length!==expected.length||expected.some(t=>found.filter(x=>x===t).length!==1))throw Error('Translation changed protected data.');
 const restored=translated.replace(/⟦P(\d+)⟧/g,(_,i)=>protectedText.tokens[Number(i)]);
 // No new numerical claims are allowed outside protected placeholders.
 if(/\d/.test(translated.replace(/⟦P\d+⟧/g,'')))throw Error('Translation added numerical data.');
 return restored;
}
export function translationBatches(texts:string[],maxChars=10000){
 const batches:string[][]=[];let current:string[]=[],size=0;
 for(const text of [...new Set(texts.filter(Boolean))]){if(current.length&&(size+text.length>maxChars||current.length>=40)){batches.push(current);current=[];size=0}current.push(text);size+=text.length}if(current.length)batches.push(current);return batches;
}
