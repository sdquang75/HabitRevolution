'use client';

import { Form, Input, Button, App } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Dùng để chuyển trang
import { useTranslations } from 'next-intl';

export const RegisterForm = () => {
  const t = useTranslations('Auth');
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // Hook điều hướng

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Gọi API đăng ký
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        // Nếu API trả lỗi (ví dụ trùng email)
        throw new Error(data.error || 'Đăng ký thất bại');
      }

      message.success('Tạo tài khoản thành công! Hãy đăng nhập.');
      
      // Chuyển hướng sang trang login sau 1 giây
      setTimeout(() => {
        router.push('/login');
      }, 1000);

    } catch (error: any) {
      // Hiển thị lỗi từ backend ra cho user thấy
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      name="register_form"
      onFinish={onFinish}
      layout="vertical"
      size="large"
    >
      <Form.Item
        name="name"
        rules={[{ required: true, message: t('validation_required') }]}
      >
        <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="Tên hiển thị" />
      </Form.Item>

      <Form.Item
        name="email"
        rules={[
          { required: true, message: t('validation_required') },
          { type: 'email', message: 'Email không đúng định dạng!' }
        ]}
      >
        <Input prefix={<MailOutlined className="text-gray-400" />} placeholder={t('emailPlaceholder')} />
      </Form.Item>

      <Form.Item
        name="password"
        // Thêm rule check độ mạnh mật khẩu ở Frontend cho UX tốt
        rules={[
            { required: true, message: t('validation_required') }, 
            { min: 6, message: 'Tối thiểu 6 ký tự' }
        ]}
      >
        <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder={t('passwordPlaceholder')} />
      </Form.Item>

      <Form.Item>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={loading} 
          block
          className="bg-atomic-main hover:!bg-atomic-hover border-none h-12 font-bold shadow-md"
        >
          {t('btn_register')}
        </Button>
      </Form.Item>

      <div className="text-center">
        Đã có tài khoản?{' '}
        <Link href="/login" className="text-atomic-main font-bold hover:underline">
          {t('link_login')}
        </Link>
      </div>
    </Form>
  );
};