import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { db } from '@/lib/db';
import { RegisterSchema } from '@/lib/validations/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  return apiHandler(async () => {
    // 1. Lấy dữ liệu
    const body = await req.json();

    // 2. Validate
    const { email, password, name } = RegisterSchema.parse(body);

    // 3. Check trùng
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('Email này đã được sử dụng.');
    }

    // 4. Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Tạo user mới (QUAN TRỌNG: Đã thêm password vào đây)
    const newUser = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword, // <--- Dòng này sẽ fix lỗi gạch đỏ của cậu
      }
    });

    // 6. Trả về kết quả
    return NextResponse.json({ 
      message: 'Đăng ký thành công', 
      user: { id: newUser.id, email: newUser.email, name: newUser.name } 
    });
  });
}