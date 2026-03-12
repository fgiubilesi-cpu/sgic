import 'server-only';

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function normalizeExtractedText(text: string | null | undefined) {
  if (!text) return null;
  const normalized = text
    .replace(/\u0000/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  return normalized === '' ? null : normalized;
}

function inferFormat(fileName: string | null | undefined, mimeType: string | null | undefined) {
  const lowerName = (fileName ?? '').toLowerCase();
  const lowerMime = (mimeType ?? '').toLowerCase();

  if (lowerMime.includes('pdf') || lowerName.endsWith('.pdf')) return 'pdf';
  if (
    lowerMime.includes('wordprocessingml.document') ||
    lowerName.endsWith('.docx')
  ) {
    return 'docx';
  }
  if (lowerMime.includes('msword') || lowerName.endsWith('.doc')) {
    return 'doc';
  }
  if (
    lowerMime.startsWith('text/') ||
    lowerMime.includes('csv') ||
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.csv') ||
    lowerName.endsWith('.md')
  ) {
    return 'text';
  }
  if (
    lowerMime.startsWith('image/') ||
    lowerName.endsWith('.png') ||
    lowerName.endsWith('.jpg') ||
    lowerName.endsWith('.jpeg') ||
    lowerName.endsWith('.heic') ||
    lowerName.endsWith('.heif') ||
    lowerName.endsWith('.tif') ||
    lowerName.endsWith('.tiff')
  ) {
    return 'image';
  }

  return 'unknown';
}

const PDF_TEXT_MIN_LENGTH = 80;

async function extractTextWithVisionOcr(options: {
  buffer: Buffer;
  extension: string;
}) {
  const tempDir = await mkdtemp(join(tmpdir(), 'sgic-ocr-'));
  const inputPath = join(tempDir, `input${options.extension}`);
  const scriptPath = join(process.cwd(), 'scripts', 'ocr.swift');

  try {
    await writeFile(inputPath, options.buffer);
    const { stdout } = await execFileAsync('swift', [scriptPath, inputPath], {
      maxBuffer: 20 * 1024 * 1024,
    });

    return normalizeExtractedText(stdout);
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export async function extractTextFromDocumentBuffer(options: {
  buffer: Buffer;
  fileName?: string | null;
  mimeType?: string | null;
}) {
  const format = inferFormat(options.fileName, options.mimeType);

  if (format === 'pdf') {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: new Uint8Array(options.buffer) });
    try {
      const result = await parser.getText();
      const parsedText = normalizeExtractedText(result.text);

      if (parsedText && parsedText.length >= PDF_TEXT_MIN_LENGTH) {
        return {
          parserType: 'pdf_text_v1',
          text: parsedText,
        };
      }

      try {
        const ocrText = await extractTextWithVisionOcr({
          buffer: options.buffer,
          extension: '.pdf',
        });

        if (ocrText) {
          return {
            parserType: 'pdf_ocr_v1',
            text: ocrText,
          };
        }
      } catch {
        // Fallback to the best text extraction already available.
      }

      return {
        parserType: 'pdf_text_v1',
        text: parsedText,
      };
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  }

  if (format === 'docx') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer: options.buffer });
    return {
      parserType: 'docx_text_v1',
      text: normalizeExtractedText(result.value),
    };
  }

  if (format === 'doc') {
    const tempDir = await mkdtemp(join(tmpdir(), 'sgic-doc-'));
    const extension = options.fileName?.toLowerCase().endsWith('.doc') ? '.doc' : '.doc';
    const inputPath = join(tempDir, `input${extension}`);

    try {
      await writeFile(inputPath, options.buffer);
      const { stdout } = await execFileAsync('textutil', ['-convert', 'txt', '-stdout', inputPath], {
        maxBuffer: 10 * 1024 * 1024,
      });
      return {
        parserType: 'doc_text_v1',
        text: normalizeExtractedText(stdout),
      };
    } catch {
      return {
        parserType: 'doc_text_v1',
        text: null,
      };
    } finally {
      await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  if (format === 'text') {
    return {
      parserType: 'plain_text_v1',
      text: normalizeExtractedText(new TextDecoder('utf-8').decode(options.buffer)),
    };
  }

  if (format === 'image') {
    try {
      const extension = options.fileName?.toLowerCase().match(/\.[^.]+$/)?.[0] ?? '.png';
      return {
        parserType: 'image_ocr_v1',
        text: await extractTextWithVisionOcr({
          buffer: options.buffer,
          extension,
        }),
      };
    } catch {
      return {
        parserType: 'image_ocr_v1',
        text: null,
      };
    }
  }

  return {
    parserType: 'filename_heuristics_v1',
    text: null,
  };
}
