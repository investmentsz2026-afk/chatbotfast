import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export const maxDuration = 60; // Allow up to 60 seconds for Vercel

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Allow public uploads of PDFs and images
        return {
          tokenPayload: JSON.stringify({
            // optional metadata
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Upload completed callback
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Vercel Blob Error:', error);
    return NextResponse.json(
      { 
        error: (error as Error).message, 
        name: (error as Error).name,
        stack: (error as Error).stack 
      },
      { status: 400 }
    );
  }
}
