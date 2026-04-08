import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Path for public uploads
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'policies');
        
        // Ensure directory exists (just in case)
        await mkdir(uploadDir, { recursive: true });

        // Clean filename to avoid issues
        const cleanFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = join(uploadDir, cleanFileName);

        await writeFile(filePath, buffer);
        
        // Return URL for the file
        const fileUrl = `/uploads/policies/${cleanFileName}`;

        return NextResponse.json({ success: true, url: fileUrl });
    } catch (error: any) {
        console.error('Error al subir archivo:', error);
        return NextResponse.json({ error: 'Error al procesar la carga del archivo', details: error.message }, { status: 500 });
    }
}
