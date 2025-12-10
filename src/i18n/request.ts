import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;
 
  // Nếu không tìm thấy locale hợp lệ, fallback về tiếng Anh
  if (!locale || !['en', 'vi'].includes(locale)) {
    locale = 'en';
  }
 
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});