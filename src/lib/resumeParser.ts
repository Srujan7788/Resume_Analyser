import * as Mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';

export type ParsedResume = {
  text: string;
  source: 'pdf' | 'docx' | 'text' | 'image' | 'demo';
};

const supportedResumeExtensions = ['pdf', 'docx', 'doc', 'txt', 'png', 'jpg', 'jpeg'];

export const isSupportedResumeFile = (file: File | undefined): boolean => {
  if (!file) return false;

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const mimeType = file.type.toLowerCase();

  return supportedResumeExtensions.includes(extension) ||
    mimeType === 'application/pdf' ||
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'text/plain' ||
    mimeType === 'image/png' ||
    mimeType === 'image/jpeg';
};

if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
}

export const extractTextFromPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    pages.push(pageText);
  }

  return pages.join('\n');
};

export const extractTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await Mammoth.extractRawText({ arrayBuffer });
  return result.value || '';
};

export const readTextFile = async (file: File): Promise<string> => {
  const text = await file.text();
  return text || '';
};

export const extractTextFromImage = async (file: File): Promise<string> => {
  try {
    const result = await Tesseract.recognize(file, 'eng', {
      logger: () => undefined
    });

    const text = result?.data?.text || '';
    return text.trim();
  } catch (error) {
    console.error('Image OCR failure', error);
    throw new Error('Failed to read text from the uploaded image. Please try a clearer scan or another file.');
  }
};

export const parseResumeFile = async (file: File): Promise<ParsedResume> => {
  if (!file) {
    return { text: '', source: 'demo' };
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.type.toLowerCase();

  try {
    if (extension === 'pdf' || mimeType === 'application/pdf') {
      const text = await extractTextFromPdf(file);
      return { text, source: 'pdf' };
    }

    if (extension === 'docx' || extension === 'doc' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword') {
      const text = await extractTextFromDocx(file);
      return { text, source: 'docx' };
    }

    if (extension === 'png' || extension === 'jpg' || extension === 'jpeg' || mimeType === 'image/png' || mimeType === 'image/jpeg') {
      const text = await extractTextFromImage(file);
      return { text, source: 'image' };
    }

    const text = await readTextFile(file);
    return { text, source: 'text' };
  } catch (error) {
    console.error('Resume parse failure', error);
    return {
      text: '',
      source: 'demo'
    };
  }
};
