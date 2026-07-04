import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type');

    if (type === 'departments') {
      const departments = await prisma.department.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      });
      return NextResponse.json({ items: departments });
    }

    if (type === 'provinces') {
      const departmentId = searchParams.get('departmentId');
      if (!departmentId) {
        return NextResponse.json({ error: 'departmentId is required' }, { status: 400 });
      }
      const provinces = await prisma.province.findMany({
        where: { departmentId },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      });
      return NextResponse.json({ items: provinces });
    }

    if (type === 'districts') {
      const provinceId = searchParams.get('provinceId');
      if (!provinceId) {
        return NextResponse.json({ error: 'provinceId is required' }, { status: 400 });
      }
      const districts = await prisma.district.findMany({
        where: { provinceId },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      });
      return NextResponse.json({ items: districts });
    }

    if (type === 'stations') {
      const districtId = searchParams.get('districtId');
      if (!districtId) {
        return NextResponse.json({ error: 'districtId is required' }, { status: 400 });
      }
      const stations = await prisma.policeStation.findMany({
        where: { districtId },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          district: {
            select: { name: true },
          },
        },
      });

      const formattedStations = stations.map((s) => ({
        id: s.id,
        name: s.name,
        address: s.address,
        phone: s.phone,
        districtName: s.district.name,
      }));

      return NextResponse.json({ items: formattedStations });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('Locations API error:', error);
    return NextResponse.json(
      { error: 'Error al obtener ubicaciones' },
      { status: 500 }
    );
  }
}
