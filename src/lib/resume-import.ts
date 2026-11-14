import { unzipSync, strFromU8 } from 'fflate';

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TEXT = 250_000;
export function validateResumeFile(file: Pick<File, 'name' | 'size'>) {
  const type = file.name.split('.').pop()?.toLowerCase();
  if (!['pdf','docx','txt'].includes(type || '')) throw Error('请选择 PDF、DOCX 或 TXT 文件。旧版 .doc 文件请先另存为 .docx。');
  if (!file.size) throw Error('文件为空，请选择其他文件。');
  if (file.size > MAX_FILE_BYTES) throw Error('请选择小于 10 MB 的文件。');
  return type!;
}
export function cleanExtractedText(text: string) {
  if (text.length > MAX_TEXT) throw Error('文档文本过多，请导入更短的简历。');
  return text.replace(/\u0000/g,'').replace(/\r\n?/g,'\n').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}
export function extractDocxText(bytes: Uint8Array) {
  let total = 0;
  const files = unzipSync(bytes, {filter: entry => {
    if (!/^word\/(document|header\d*|footer\d*)\.xml$/.test(entry.name)) return false;
    total += entry.originalSize;
    if (total > 8 * 1024 * 1024) throw Error('文档解压后体积过大，请另存一份更短的文档。');
    return true;
  }});
  if (!files['word/document.xml']) throw Error('无法读取此 DOCX 文件，请用 Word 重新保存或导出为 PDF。');
  const parts = Object.keys(files).sort((a,b) => {
    const order = (s:string) => s.includes('/header') ? 0 : s.includes('/document') ? 1 : 2;
    return order(a)-order(b) || a.localeCompare(b);
  });
  const paragraphs: string[] = [];
  for (const path of parts) {
    const xml = strFromU8(files[path]);
    if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw Error('此 DOCX 包含不受支持的 XML，请导出 PDF 或纯文本后再导入。');
    const doc = new DOMParser().parseFromString(xml,'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw Error('此 DOCX 文件已损坏，请另存一份后重试。');
    const ns = doc.documentElement.namespaceURI || 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    const read = (node:Node):string => {
      if (node.nodeType !== 1) return '';
      const el=node as Element;
      if (el.namespaceURI===ns) {
        if (el.localName==='del' || el.localName==='instrText') return '';
        if (el.localName==='t') return el.textContent || '';
        if (el.localName==='tab') return '\t';
        if (el.localName==='br' || el.localName==='cr') return '\n';
      }
      return Array.from(el.childNodes).map(read).join('');
    };
    for (const paragraph of Array.from(doc.getElementsByTagNameNS(ns,'p'))) {
      // Text boxes can nest paragraphs; read only the inner paragraph once.
      if (paragraph.getElementsByTagNameNS(ns,'p').length) continue;
      const text=read(paragraph).trim();
      if(text) paragraphs.push(text);
    }
  }
  return cleanExtractedText(paragraphs.join('\n'));
}

type PdfTextItem = {str:string; transform:number[]; width:number; height:number; hasEOL?:boolean};
export function pdfItemsToText(items: unknown[]) {
  let output='',previous:PdfTextItem|undefined;
  for(const item of items){
    if(!item || typeof item!=='object' || !('str' in item)) continue;
    const current=item as PdfTextItem;
    if(previous && output && !output.endsWith('\n')) {
      const dy=Math.abs(current.transform[5]-previous.transform[5]);
      const gap=current.transform[4]-(previous.transform[4]+previous.width);
      if(dy>Math.max(2,Math.min(current.height,previous.height)*.5)) output+='\n';
      else if(gap>Math.max(1,previous.height*.12) && !/\s$/.test(output)) output+=' ';
    }
    output+=current.str;
    if(current.hasEOL) output+='\n';
    previous=current;
  }
  return output.trim();
}

export async function importResumeFile(file: File, progress: (message:string)=>void = ()=>{}) {
  const type=validateResumeFile(file);
  const warnings:string[]=[];
  let text='';
  if(type==='txt') text=cleanExtractedText(await file.text());
  if(type==='docx') {
    try {text=extractDocxText(new Uint8Array(await file.arrayBuffer()));}
    catch(e) {throw Error(e instanceof Error && /DOCX|文档|XML/.test(e.message) ? e.message : '无法读取此 DOCX，文件可能已损坏或受密码保护。请另存为未加密的副本后重试。');}
  }
  if(type==='pdf') {
    const pdfjs=await import('pdfjs-dist');
    const {default:worker}=await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc=worker;
    const task=pdfjs.getDocument({data:await file.arrayBuffer(),useSystemFonts:true});
    try {
      const pdf=await task.promise;
      if(pdf.numPages>50) throw Error('此 PDF 超过 50 页，请仅导入简历相关页面。');
      const pages:string[]=[];let empty=0;
      for(let number=1;number<=pdf.numPages;number++) {
        progress(`正在读取 PDF，第 ${number} 页，共 ${pdf.numPages} 页…`);
        const page=await pdf.getPage(number);
        const content=await page.getTextContent();
        const value=pdfItemsToText(content.items);
        if(!value.trim()) empty++;
        pages.push(value);page.cleanup();
        if(pages.join('\n').length>MAX_TEXT) throw Error('此 PDF 文本过多，请导入更短的简历。');
      }
      text=cleanExtractedText(pages.join('\n\n'));
      if(!text) throw Error('未找到可选中的文字。扫描版 PDF 请先做文字识别，也可导入含文本的 PDF、DOCX，或直接粘贴简历文字。');
      if(empty) warnings.push(`有 ${empty} 页未找到可选中的文字，可能是扫描页。`);
      warnings.push('请核对提取后的阅读顺序，尤其是分栏和表格。');
    } catch(e) {
      if(e instanceof Error && e.name==='PasswordException') throw Error('此 PDF 受密码保护，请导入未加密的副本。');
      if(e instanceof Error && e.name==='InvalidPDFException') throw Error('此 PDF 已损坏或格式无效，请重新导出后重试。');
      if(e instanceof Error && /PDF|简历/.test(e.message)) throw e;
      throw Error('无法读取此 PDF，文件可能已损坏，请重新导出后重试。');
    } finally {await task.destroy();}
  }
  if(!text) throw Error('未找到可读取的文字，请使用含文本的文档，或直接粘贴简历内容。');
  return {text,warnings};
}
