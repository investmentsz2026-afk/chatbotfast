import { groq } from '@ai-sdk/groq';
import { streamText, convertToModelMessages } from 'ai';
import prisma from '@/lib/prisma';

export const maxDuration = 30;

const SYSTEM_PROMPT = `Eres un asistente de ayuda virtual profesional y empático. Tu misión es orientar y ayudar a las personas que necesitan asistencia, especialmente en situaciones de agresión.

REGLAS IMPORTANTES:
1. SOLO responde con información que se te proporcione en el contexto. Si no tienes información sobre un tema, di que no dispones de esa información y sugiere contactar la Línea 100 o el 105.
2. Sé empático, profesional y conciso en tus respuestas.
3. Si alguien está en peligro inmediato, SIEMPRE recomienda llamar al 105 (Emergencias PNP) o al 100 (Línea de ayuda gratuita las 24 horas).
4. Responde en español.
5. Usa formato markdown cuando sea útil (negritas, listas, etc.).
6. Si te preguntan sobre un tema fuera de tu base de conocimiento, indica que solo puedes ayudar con la información disponible.

NÚMEROS DE EMERGENCIA:
- 105: Central de Emergencias PNP
- 100: Línea de ayuda gratuita (24 horas)
- 0800-00-170: Línea contra la violencia familiar

Si te proporcionan contexto de la base de conocimiento, úsalo para responder. Si no hay contexto relevante, responde con la información general que tienes sobre números de emergencia y orientación básica.`;

export async function POST(req: Request) {
  try {
    const { messages, conversationState } = await req.json();

    // Try to find relevant knowledge from the database
    let contextText = '';
    
    const lastUserMessage = messages.filter((m: { role: string }) => m.role === 'user').pop();
    
    if (lastUserMessage) {
      // Extract text content from parts (v7) or content (v6)
      let userTextContent = '';
      if (typeof lastUserMessage.content === 'string') {
        userTextContent = lastUserMessage.content;
      } else if (Array.isArray(lastUserMessage.parts)) {
        userTextContent = lastUserMessage.parts
          .filter((p: any) => p.type === 'text')
          .map((p: any) => p.text)
          .join('\n');
      }

      if (userTextContent.trim()) {
        try {
          // Simple text-based search (works without embeddings)
          const relevantChunks = await prisma.knowledgeChunk.findMany({
            where: {
              content: {
                contains: userTextContent,
                mode: 'insensitive' as const,
              },
              document: {
                isActive: true,
              },
            },
            take: 5,
            include: {
              document: {
                select: { title: true },
              },
            },
          });

          // Also search with individual words for better coverage
          if (relevantChunks.length === 0) {
            const words = userTextContent
              .split(/\s+/)
              .filter((w: string) => w.length > 3)
              .slice(0, 5);

            if (words.length > 0) {
              const wordChunks = await prisma.knowledgeChunk.findMany({
                where: {
                  OR: words.map((word: string) => ({
                    content: {
                      contains: word,
                      mode: 'insensitive' as const,
                    },
                  })),
                  document: {
                    isActive: true,
                  },
                },
                take: 5,
                include: {
                  document: {
                    select: { title: true },
                  },
                },
              });
              relevantChunks.push(...wordChunks);
            }
          }

        if (relevantChunks.length > 0) {
          contextText = '\n\nINFORMACIÓN DE LA BASE DE CONOCIMIENTO:\n' +
            relevantChunks
              .map((chunk) => `[${chunk.document.title}]: ${chunk.content}`)
              .join('\n\n');
        }
      } catch {
        // Knowledge base might not have data yet, continue without it
        console.log('No knowledge base data available yet');
      }
    }
  }

  const systemMessage = SYSTEM_PROMPT + contextText;

    // Check if GROQ_API_KEY is set
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      // Return a mock response when no API key is configured
      return new Response(
        JSON.stringify({
          id: 'mock-response',
          role: 'assistant',
          content: '⚠️ **API key no configurada**\n\nPara habilitar las respuestas inteligentes con IA, necesitas:\n\n1. Crear una cuenta gratuita en [console.groq.com](https://console.groq.com)\n2. Generar una API key\n3. Agregarla en el archivo `.env.local`:\n\n```\nGROQ_API_KEY=tu_api_key_aquí\n```\n\n4. Reiniciar el servidor\n\nMientras tanto, el flujo guiado (departamento → provincia → distrito → comisaría) funciona sin necesidad de IA.',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: systemMessage,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al procesar tu mensaje. Por favor, intenta nuevamente.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
