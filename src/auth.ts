import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { LoginSchema } from "@/lib/validations/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      // Hàm này chạy khi user bấm nút Login
      authorize: async (credentials) => {
        try {
          // 1. Validate dữ liệu đầu vào
          const { email, password } = await LoginSchema.parseAsync(credentials);

          // 2. Tìm user trong DB
          const user = await db.user.findUnique({
            where: { email },
          });

          if (!user) {
            throw new Error("Email không tồn tại.");
          }

          // 3. So sánh mật khẩu (Pass nhập vào vs Pass đã mã hóa trong DB)
          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (!passwordsMatch) {
            throw new Error("Mật khẩu không chính xác.");
          }

          // 4. Trả về user (Thành công)
          return user;
        } catch (error) {
          if (error instanceof ZodError) {
            return null;
          }
          throw error; // Ném lỗi ra để LoginForm bắt được
        }
      },
    }),
  ],
  pages: {
    signIn: "/login", // Nếu chưa đăng nhập, tự đá về trang này
  },
  callbacks: {
    // Tùy chỉnh dữ liệu lưu trong Session
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub; // Gắn ID vào session để dùng sau này
      }
      return session;
    },
    async jwt({ token }) {
      return token;
    }
  },
  session: { strategy: "jwt" }, // Dùng JSON Web Token (nhẹ, không tốn DB)
});