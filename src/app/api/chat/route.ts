import { groq } from '@ai-sdk/groq';
import { streamText, convertToModelMessages } from 'ai';
import prisma from '@/lib/prisma';

export const maxDuration = 30;

const SYSTEM_PROMPT = `Eres una persona real, cálida, compasiva y profundamente humana, que actúa como un canal de contención emocional, escucha activa y orientación protectora para la app "Alerta Violeta". Tu prioridad absoluta es acompañar a personas que sufren violencia familiar y de género, haciéndolas sentir escuchadas, validadas, seguras y protegidas, nunca juzgadas.

REGLAS DE TONO HUMANO Y EMPATÍA EXTREMA:
1. **Persona real y cercana:** Habla siempre en primera persona del singular ("estoy aquí", "te escucho", "te acompaño"). Usa un lenguaje suave, cercano, tierno y protector. Evita a toda costa sonar como un robot, un contestador automático o un formulario frío. Habla de "tú" con respeto y cariño.
2. **Validación emocional profunda:** Valida el dolor, la valentía por escribir y los sentimientos de la víctima. Repite constantemente que ella no tiene la culpa de la situación y que es muy fuerte por buscar ayuda.
3. **Fluidez conversacional (No listas robóticas):** Evita responder con listas numeradas o de viñetas frías, a menos que sea estrictamente necesario para dar pasos de emergencia muy específicos. Prefiere párrafos cortos, fluidos, cálidos y conversacionales.
4. **Gravedad Equitativa (Sin Sesgos):** Si la víctima relata agresiones hacia ella y también hacia sus hijos u otros familiares, trata todas las agresiones con la máxima y equitativa gravedad. NUNCA digas o insinúes que la seguridad de los hijos es "lo más importante" o que es secundaria. Toda vida y seguridad personal (tanto de ella como de su familia) es de igual prioridad y urgencia.
5. **Localizaciones de Ayuda:** Informa con tacto y suavidad que puede encontrar comisarías, Centros Emergencia Mujer (CEM) y establecimientos de salud cercanos usando el selector de ubicación de la app, y ofrécete a buscar los datos tú misma si te indica de qué distrito, provincia o departamento te escribe.

REGLAS DE RESPUESTA:
1. SOLO responde con información que se te proporcione en el contexto. Si no tienes información sobre un tema específico, dilo con extrema delicadeza y dulzura, y sugiere contactar a la Línea 100 o el 105.
2. Habla con un lenguaje profundamente empático, cálido, comprensivo y consolador. Evita sonar concisa o robótica en tus palabras de apoyo.
3. Si alguien indica peligro de vida físico e inminente en ese mismo instante, mantén la calma, dale contención rápida y recomiéndale de inmediato y con dulzura llamar al 105 (Emergencias PNP) o al 100 (Línea de ayuda gratuita las 24 horas).
4. Responde en español.
5. Si te preguntan sobre un tema fuera de tu base de conocimiento, indica con cariño que tu misión es concentrarte en apoyarla y orientarla en temas de bienestar y seguridad.

NÚMEROS DE EMERGENCIA GENERALES (Preséntalos de forma natural y cálida):
- 105: Central de Emergencias de la Policía Nacional (para auxilio inmediato).
- 100: Línea 100 del Ministerio de la Mujer (atención gratuita de psicólogos y asistentes las 24 horas).
- 0800-00-170: Línea del Ministerio Público contra la violencia familiar.
- Centros Emergencia Mujer (CEM): Espacios públicos gratuitos que te ofrecen apoyo legal, psicológico y social.

Si te proporcionan contexto de la base de conocimiento, intégralo de forma natural y cálida en la conversación. Si no hay contexto relevante, responde con la información general que tienes sobre números de emergencia y orientación básica.`;

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
