import 'server-only';

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
  if (
    lowerMime.startsWith('text/') ||
    lowerMime.includes('csv') ||
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.csv') ||
    lowerName.endsWith('.md')
  ) {
    return 'text';
  }

  return 'unknown';
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
      return {
        parserType: 'pdf_text_v1',
        text: normalizeExtractedText(result.text),
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

  if (format === 'text') {
    return {
      parserType: 'plain_text_v1',
      text: normalizeExtractedText(new TextDecoder('utf-8').decode(options.buffer)),
    };
  }

  return {
    parserType: 'filename_heuristics_v1',
    text: null,
  };
}
