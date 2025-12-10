import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { HabitSchema } from '@/lib/validations/auth';



export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    return apiHandler(async () => {
        const session = await auth();
        if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const body = await req.json();

        // Validate dữ liệu gửi lên (cho phép gửi thiếu trường, nên dùng .partial())
        // Nhưng Zod schema của ta đang strict, ta cứ parse an toàn các field cần thiết
        // Tạm thời lấy các field thủ công để an toàn
        const { title, description, difficulty, stakeAmount, frequency, goalCount, goalUnit, timeOfDay, mode, startDate, endDate, reminders, checklist } = body;

        // Kiểm tra quyền sở hữu
        const habit = await db.habit.findUnique({ where: { id } });
        if (!habit || habit.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updatedHabit = await db.habit.update({
            where: { id },
            data: {
                title,
                description,
                difficulty,
                stakeAmount,
                frequency,
                goalCount,
                goalUnit,
                timeOfDay, // JSON string
                mode, // Cho phép đổi mode (Atomic <-> Beast)
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : null, // Nếu null là "Không bao giờ"
                reminders: JSON.stringify(reminders || []),
                checklist: undefined, 
            }
        });

        return NextResponse.json(updatedHabit);
    });
}
// 1. GET: Lấy chi tiết Habit + Logs (để vẽ biểu đồ)
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    return apiHandler(async () => {
        const session = await auth();

        // --- FIX LỖI Ở ĐÂY ---
        // Kiểm tra kỹ: Phải có Session VÀ có User ID thì mới cho đi tiếp
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id; // Gán vào biến để dùng cho an toàn

        const { id } = await params;

        const habit = await db.habit.findUnique({
            where: { id },
            include: {
                logs: {
                    orderBy: { completedAt: 'desc' },
                    take: 365 // Lấy 1 năm log để vẽ lịch
                }
            }
        });

        // So sánh với biến userId đã lấy ở trên
        if (!habit || habit.userId !== userId) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json(habit);
    });
}

// 2. DELETE: Xóa Habit (Và toàn bộ logs liên quan)
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    return apiHandler(async () => {
        const session = await auth();

        // --- FIX LỖI TƯƠNG TỰ Ở ĐÂY ---
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;

        const { id } = await params;

        // Kiểm tra quyền sở hữu trước khi xóa
        const habit = await db.habit.findUnique({
            where: { id },
        });

        if (!habit || habit.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Xóa thói quen (Logs tự bay màu do Cascade)
        await db.habit.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Deleted successfully" });
    });
}