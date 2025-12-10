import { AuthLayout } from '@/components/templates/AuthLayout';
import { RegisterForm } from '@/components/organisms/RegisterForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đăng Ký | Habit Evolution',
  description: 'Bắt đầu xây dựng thói quen nguyên tử ngay hôm nay.',
};

export default function RegisterPage() {
  return (
    <AuthLayout 
      title="Tạo tài khoản mới" 
      subtitle="1% tốt hơn mỗi ngày bắt đầu từ đây."
    >
      <RegisterForm />
    </AuthLayout>
  );
}