import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2, { message: "Tên phải có ít nhất 2 ký tự" }),
  email: z.string().email({ message: "Email không hợp lệ" }),
  password: z.string()
    .min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" })
    .regex(/[A-Z]/, { message: "Phải có ít nhất 1 chữ hoa" }) // Ép buộc kỷ luật chút xíu
    .regex(/[0-9]/, { message: "Phải có ít nhất 1 số" }), 
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});


export const HabitSchema = z.object({
  title: z.string().min(1, "Tên thói quen không được để trống"),
  description: z.string().optional(),
  mode: z.enum(["ATOMIC", "BEAST"]),
  difficulty: z.number().min(1).max(10),
  stakeAmount: z.number().optional(),
  
  // --- THÊM CÁC TRƯỜNG MỚI VÀO ĐÂY ---
  frequency: z.string().default("daily"),
  goalCount: z.number().default(1),
  goalUnit: z.string().default("lần"),
  timeOfDay: z.array(z.string()).optional(), // Nhận mảng string từ Form
  checklist: z.array(z.object({
    content: z.string()
  })).optional()
});