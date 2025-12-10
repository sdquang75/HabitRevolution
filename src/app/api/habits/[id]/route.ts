import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { db } from '@/lib/db';
import { auth } from '@/auth';
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return apiHandler(async () => {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const habit = await db.habit.findUnique({
      where: { id },
      include: {
        logs: {
          orderBy: { completedAt: 'desc' }, // Lấy log mới nhất lên đầu
          take: 100 // Giới hạn 100 log gần nhất để đỡ lag
        }
      }
    });

    if (!habit || habit.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(habit);
  });
}
// Xử lý XÓA thói quen
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Next.js 15 Syntax
) {
  return apiHandler(async () => {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // 1. Kiểm tra quyền sở hữu (Chỉ xóa được của chính mình)
    const habit = await db.habit.findUnique({
      where: { id },
    });

    if (!habit || habit.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Xóa thói quen
    // Nhờ dòng "onDelete: Cascade" trong schema, toàn bộ Logs và Checklist con sẽ tự động bay màu theo.
    await db.habit.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Deleted successfully" });
  });
}