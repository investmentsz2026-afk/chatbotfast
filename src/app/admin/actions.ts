'use server';

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import prisma from '@/lib/prisma';
import * as pdf from 'pdf-parse';
import { put } from '@vercel/blob';

export async function processUploadedFileAction(url: string, fileName: string, description: string) {
  try {
    if (!url) {
      return { success: false, error: 'No se recibió la URL del archivo' };
    }

    // Download the file from Vercel Blob into memory
    const res = await fetch(url);
    const bytes = await res.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const sourceUrl = url;

    let documentTitle = fileName;
    let fileContent = '';
    let sourceType = 'file';

    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    if (fileExtension === 'pdf') {
      sourceType = 'pdf';
      try {
        const pdfParser = (pdf as any).default || pdf;
        const pdfData = await pdfParser(buffer);
        fileContent = pdfData.text || '';
        if (!fileContent.trim()) throw new Error('Empty PDF parsed');
      } catch (err) {
        console.error('Error parsing PDF:', err);
        // Fallback to storing the file with its description instead of failing
        fileContent = description 
          ? `Documento PDF: ${fileName}\n\nDescripción: ${description}` 
          : `Documento PDF subido: ${fileName}. (El contenido no pudo ser extraído textualmente, pero el archivo está enlazado).`;
      }
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'img'].includes(fileExtension || '')) {
      sourceType = 'image';
      fileContent = description 
        ? `Imagen: ${fileName}\n\nDescripción: ${description}` 
        : `Archivo de imagen subido: ${fileName}. (La IA usará la imagen como referencia si se solicita).`;
    } else {
      // Default to reading it as plain text if it is text-like
      try {
        fileContent = buffer.toString('utf-8');
      } catch {
        fileContent = description || `Archivo subido: ${fileName}`;
      }
    }

    if (!fileContent.trim()) {
      fileContent = description || `Contenido de archivo subido: ${fileName}`;
    }

    // Chunk text
    const chunks = chunkText(fileContent, 400, 50);

    // Save to Database
    const document = await prisma.knowledgeDocument.create({
      data: {
        title: documentTitle,
        sourceType,
        sourceUrl,
        rawContent: fileContent,
        chunks: {
          create: chunks.map((chunk, index) => ({
            content: chunk,
            chunkIndex: index,
            metadata: { source: documentTitle, fileUrl: sourceUrl },
          })),
        },
      },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });

    return {
      success: true,
      document: {
        id: document.id,
        title: document.title,
        sourceType: document.sourceType,
        sourceUrl: document.sourceUrl,
        chunksCount: document._count.chunks,
      },
    };
  } catch (error) {
    console.error('File Upload Action Error:', error);
    return { success: false, error: 'Error interno al procesar el archivo' };
  }
}

// Utility: Chunk text into smaller pieces with overlap
function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + ' ' + sentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 5));
      currentChunk = overlapWords.join(' ') + ' ' + sentence;
    } else {
      currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  if (chunks.length === 0 && text.length > 0) {
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      chunks.push(text.slice(i, i + chunkSize));
    }
  }

  return chunks;
}
