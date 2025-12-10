'use client';

import { Form, Input, Button, Checkbox, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { logger } from '@/lib/logger'; // Logging hệ thống
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation'; // <--- SỬA THÀNH CÁI NÀY
// Cần import useState vì code trên dùng nó
import { useState } from 'react';

export const LoginForm = () => {
  const t = useTranslations('Auth');


  const [loading, setLoading] = useState(false); // State xử lý loading
  const router = useRouter();
  const { message } = App.useApp();
  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      logger.info('User attempting login', { email: values.email });

      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false, // Chúng ta tự handle redirect để không bị reload trang
      });

      if (result?.error) {
        // NextAuth trả về error dạng string nếu sai
        throw new Error("Email hoặc mật khẩu không đúng!");
      }
      message.success('Đăng nhập thành công! Chào mừng trở lại.');
      // TODO: Redirect to dashboard
      router.push('/dashboard');
      router.refresh(); // Refresh để cập nhật trạng thái session
    } catch (error) {
      logger.error('Login Failed', error);
      message.error('Sai email hoặc mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      name="login_form"
      initialValues={{ remember: true }}
      onFinish={onFinish}
      layout="vertical"
      size="large"
    >
      {/* Email Field */}
      <Form.Item
        name="email"
        rules={[
          { required: true, message: t('validation_required') },
          // { type: 'email', message: 'Email không hợp lệ!' }
        ]}
      >
        <Input
          prefix={<UserOutlined className="text-gray-400" />}
          placeholder={t('emailPlaceholder')}
        // className="hover:border-atomic-main focus:border-atomic-main"
        />
      </Form.Item>

      {/* Password Field */}
      <Form.Item
        name="password"
        rules={[{ required: true, message: t('validation_required') }]}
      >
        <Input.Password
          prefix={<LockOutlined className="text-gray-400" />}
          placeholder={t('passwordPlaceholder')}
        />
      </Form.Item>

      {/* Remember & Forgot */}
      <div className="flex justify-between items-center mb-4">
        <Form.Item name="remember" valuePropName="checked" noStyle>
          <Checkbox>Ghi nhớ tôi</Checkbox>
        </Form.Item>
        <Link href="/forgot-password" className="text-atomic-main hover:underline text-sm font-medium">
          Quên mật khẩu?
        </Link>
      </div>

      {/* Submit Button */}
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          className="bg-atomic-main hover:!bg-atomic-hover border-none h-12 font-bold text-lg shadow-md"
        >
          {t('btn_login')}
        </Button>
      </Form.Item>

      {/* Switch to Register */}
      <div className="text-center">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="text-atomic-main font-bold hover:underline">
          Tạo ngay (Miễn phí)
        </Link>
      </div>
    </Form>
  );
};


