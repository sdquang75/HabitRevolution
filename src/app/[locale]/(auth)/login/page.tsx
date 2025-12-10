import { AuthLayout } from '@/components/templates/AuthLayout';
import { LoginForm } from '@/components/organisms/LoginForm';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const t = useTranslations('Auth');
  
  return (
    <AuthLayout 
      title={t('loginTitle')} 
      subtitle={t('loginSubtitle')}
    >
      <LoginForm />
    </AuthLayout>
  );
}