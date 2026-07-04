import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    const expectedPassword = process.env.ADMIN_PASSWORD || 'violeta123';

    if (password === expectedPassword) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Contraseña incorrecta' }, { status: 401 });
  } catch (error) {
    console.error('Admin Auth Error:', error);
    return NextResponse.json({ error: 'Error al autenticar' }, { status: 500 });
  }
}
