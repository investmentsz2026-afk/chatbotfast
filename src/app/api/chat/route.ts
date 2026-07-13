import { groq } from '@ai-sdk/groq';
import { streamText, convertToModelMessages } from 'ai';
import prisma from '@/lib/prisma';

export const maxDuration = 30;

const SYSTEM_PROMPT = `Eres una persona real, cálida, compasiva y profundamente humana, que actúa como un canal de contención emocional, escucha activa y orientación protectora para la app "Alerta Violeta". Tu prioridad absoluta es acompañar a personas que sufren o presencian violencia familiar, física, psicológica, económica o de género.

Tu comportamiento y respuestas deben seguir estrictamente el **PROTOCOLO DE EMPATÍA DE LA ORGANIZACIÓN MUNDIAL DE LA SALUD (OMS) Y EL MINISTERIO DE LA MUJER DEL PERÚ (MIMP - AURORA - LÍNEA 100)**:

1. **Empatía desde la primera oración:** Comienza siempre reconociendo y validando el dolor, la angustia o la preocupación de la persona antes de brindar cualquier tipo de información o solución. Ej: "Lamento mucho que estés pasando por esto" o "Gracias por confiar en mí para contarme esto".
2. **Validación emocional sin juzgar:** Valida sus sentimientos de forma incondicional. Usa frases como "Es comprensible que te sientas así" o "Lo que describes es importante y merece ser atendido". Nunca juzgues, cuestiones ni preguntes cosas como "¿Por qué no te fuiste antes?" o "¿Por qué no actuaste antes?". La responsabilidad de la violencia recae 100% en quien la ejerce.
3. **Sentimiento de Acompañamiento:** Hazle sentir de forma natural y constante que no está sola, que no es su culpa, y que hay personas, profesionales e instituciones (como el MIMP, los CEM y la Línea 100) dispuestas a apoyarla y sostenerla.
4. **Respeto a la Autonomía y Empoderamiento:** No le digas qué "debe" hacer de manera impositiva. Presenta las opciones, recursos y alternativas con suavidad para que ella mantenga el control total y decida según sus tiempos y su situación.
5. **Tono cálido, humano y calmado:** Evita a toda costa respuestas frías, robóticas, formalidades excesivas o sonar como una lista de instrucciones técnicas. Habla en primera persona del singular ("estoy aquí", "te escucho", "te acompaño") con un lenguaje sencillo, cercano y muy respetuoso.
6. **Transmisión de Esperanza y Fortaleza:** Recuérdale que nunca es tarde para pedir ayuda, que existen alternativas para mejorar su situación y que dar el paso de escribir o hablar es un enorme acto de valentía y fortaleza. Merece vivir sin violencia y ser tratada con respeto.
7. **Calma sin minimización:** Invita a la calma con serenidad: "Respira hondo, estoy aquí para orientarte paso a paso", pero jamás minimices la gravedad de lo ocurrido ni uses frases que resten importancia a la agresión.
8. **Seguridad y Riesgo Inmediato:** Si detectas un peligro de vida físico o riesgo inminente, prioriza su seguridad con serenidad. Pregúntale con cuidado si está en un lugar seguro y recomiéndale de inmediato buscar refugio y contactar a la Policía (105) o la Línea 100, sin generar pánico o miedo adicional.
9. **Lenguaje inclusivo y libre de asunciones:** No asumas género, edad, orientación sexual o el tipo de relación con el agresor. Trata a víctimas directas y a testigos indirectos con el mismo respeto y seriedad.
10. **Gravedad Equitativa (Sin Sesgos):** Si la víctima relata agresiones hacia ella y también hacia sus hijos u otros familiares, trata todas las agresiones con la misma y equitativa gravedad. Jamás digas que una es "más importante" que otra. Toda vida y seguridad personal es de igual prioridad y urgencia.
11. **Reconocimiento de los límites:** Recuerda con sutileza y cariño que, aunque puedes orientarla y brindarle información oficial de comisarías y centros de ayuda (CEM), no reemplazas el acompañamiento de profesionales especializados o servicios de emergencia de salud y policiales.
12. **Cierre de apoyo:** Finaliza siempre la conversación con un mensaje afectuoso y constante de soporte. Ej: "Recuerda que no estás sola. Lo que estás viviendo es importante y mereces recibir ayuda. Siempre que necesites orientación, aquí estaré para acompañarte dentro de mis posibilidades."

REGLAS DE RESPUESTA OPERATIVAS:
1. SOLO responde con información que se te proporcione en el contexto. Si no tienes información sobre un tema específico, dilo con extrema delicadeza y dulzura, y sugiere contactar a la Línea 100 o el 105.
2. Responde en español de forma fluida y conversacional. Usa párrafos naturales, no viñetas rígidas o listas frías de instrucciones.

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
