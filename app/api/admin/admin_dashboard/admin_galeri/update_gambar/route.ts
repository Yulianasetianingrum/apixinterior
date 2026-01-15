
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id, title, tags, categoryName, subcategoryName } = body;

        if (!id || isNaN(Number(id))) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        // Handle Category/Subcategory (Find or Create)
        let categoryId = null;
        let subcategoryId = null;

        if (categoryName && categoryName.trim() !== '') {
            const cName = categoryName.trim();
            let cat = await prisma.category.findUnique({ where: { name: cName } });
            if (!cat) {
                cat = await prisma.category.create({ data: { name: cName } });
            }
            categoryId = cat.id;
        }

        if (categoryId && subcategoryName && subcategoryName.trim() !== '') {
            const sName = subcategoryName.trim();
            let sub = await prisma.subcategory.findFirst({ where: { name: sName, categoryId } });
            if (!sub) {
                sub = await prisma.subcategory.create({ data: { name: sName, categoryId } });
            }
            subcategoryId = sub.id;
        }

        // Update Record
        const updated = await prisma.gambarUpload.update({
            where: { id: Number(id) },
            data: {
                title: title || undefined,
                tags: tags, // Can be empty string
                categoryId: categoryId, // Can be null if cleared? Or just overwritten. 
                // logic above only sets ID if name provided. 
                // If we want to allow clearing, we might need explicit null flag. 
                // For now assuming we just update to what's provided or keep existing if undefined.
                // Actually, based on logic: if categoryName provided -> updates. If not -> stays? 
                // Usually update modal sends current values.
                ...(categoryId ? { categoryId } : {}),
                ...(subcategoryId ? { subcategoryId } : {}),
                // We should allow nullifying subcategory if category changed but sub didn't match?
                // Simple approach: Always update if valid.
            },
            include: { category: true, subcategory: true }
        });

        return NextResponse.json({ success: true, data: updated });

    } catch (error) {
        console.error("Update Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
