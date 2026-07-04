import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - List all knowledge documents
export async function GET() {
  try {
    const documents = await prisma.knowledgeDocument.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });

    const formatted = documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      sourceType: doc.sourceType,
      sourceUrl: doc.sourceUrl,
      createdAt: doc.createdAt.toISOString(),
      chunksCount: doc._count.chunks,
      isActive: doc.isActive,
    }));

    return NextResponse.json({ documents: formatted });
  } catch (error) {
    console.error('Knowledge GET error:', error);
    return NextResponse.json({ error: 'Error al obtener documentos' }, { status: 500 });
  }
}

// POST - Add new knowledge document
export async function POST(req: NextRequest) {
  try {
    const { title, content, sourceType, sourceUrl } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Se requiere título y contenido' },
        { status: 400 }
      );
    }

    // Chunk the content into smaller pieces
    const chunks = chunkText(content, 500, 50);

    // Create document with chunks
    const document = await prisma.knowledgeDocument.create({
      data: {
        title,
        sourceType: sourceType || 'text',
        sourceUrl: sourceUrl || null,
        rawContent: content,
        chunks: {
          create: chunks.map((chunk, index) => ({
            content: chunk,
            chunkIndex: index,
            metadata: { source: title },
          })),
        },
      },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        chunksCount: document._count.chunks,
      },
    });
  } catch (error) {
    console.error('Knowledge POST error:', error);
    return NextResponse.json({ error: 'Error al crear documento' }, { status: 500 });
  }
}

// DELETE - Remove a knowledge document
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Se requiere ID del documento' }, { status: 400 });
    }

    await prisma.knowledgeDocument.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Knowledge DELETE error:', error);
    return NextResponse.json({ error: 'Error al eliminar documento' }, { status: 500 });
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

      // Keep some overlap from the end of the previous chunk
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

  // If no sentences were found, chunk by character count
  if (chunks.length === 0 && text.length > 0) {
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      chunks.push(text.slice(i, i + chunkSize));
    }
  }

  return chunks;
}
