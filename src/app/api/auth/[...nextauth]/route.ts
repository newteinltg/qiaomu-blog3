import { authOptions } from '@/auth/options';
import NextAuth from 'next-auth';

// 使用 NextAuth 创建处理程序
const handler = NextAuth(authOptions);

// 确保导出正确的处理函数
export { handler as GET, handler as POST };
