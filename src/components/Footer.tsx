import Link from 'next/link';
import Image from 'next/image';
import { SocialLink, ContactInfo, DonationInfo } from '@/lib/schema';
import { FaGithub, FaWeibo } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

type FooterProps = {
  socialLinks?: SocialLink[];
  contactInfo?: ContactInfo[];
  donationInfo?: DonationInfo[];
  siteTitle?: string;
  siteDescription?: string;
  footerMenus?: { name: string; url: string }[];
  footerLinks?: { name: string; url: string }[];
  footerCopyright?: string;
};

export default function Footer({
  socialLinks = [],
  contactInfo = [],
  donationInfo = [],
  siteTitle = '向阳乔木',
  siteDescription = '分享技术、生活和思考，记录成长的点滴。',
  footerMenus = [
    { name: '首页', url: '/' },
    { name: '分类', url: '/categories' },
    { name: '标签', url: '/tags' },
    { name: '关于我', url: '/about' }
  ],
  footerLinks = [],
  footerCopyright = ''
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  // 获取图标的正确URL
  const getIconUrl = (platform: string): string => {
    // 如果平台名称是一个完整的URL，则直接返回
    if (platform.startsWith('http://') || platform.startsWith('https://')) {
      return platform;
    }

    // 否则构建到公共图标目录的路径
    return `/icons/${platform.toLowerCase()}.svg`;
  };

  // 渲染社交媒体图标
  const renderSocialIcon = (platform: string) => {
    // 使用图片标签显示图标
    return (
      <Image
        src={getIconUrl(platform)}
        alt={`${platform} 图标`}
        width={24}
        height={24}
        className="w-5 h-5"
      />
    );
  };

  return (
    <footer className="footer bg-gray-50 dark:bg-gray-800 py-12 rounded-lg shadow-sm mt-12">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* 相关链接 */}
          <div className="footer-section">
            <h4 className="footer-title text-xl font-semibold mb-4">相关链接</h4>
            {footerLinks && footerLinks.length > 0 ? (
              footerLinks.map((link, index) => (
                <Link
                  key={`footer-link-${index}`}
                  href={link.url}
                  className="footer-link block mb-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {link.name}
                </Link>
              ))
            ) : (
              <>
                <Link href="/blog" className="footer-link block mb-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  AI&阅读社群
                </Link>
                <Link href="/categories" className="footer-link block mb-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  AI网址导航
                </Link>
                <Link href="/tags" className="footer-link block mb-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  AI生成展示
                </Link>
                <Link href="/about" className="footer-link block mb-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  AI卡片生成
                </Link>
              </>
            )}
          </div>

          {/* 社交媒体 */}
          <div className="footer-section">
            <h4 className="footer-title text-xl font-semibold mb-4">社交媒体</h4>
            {socialLinks.length > 0 ? (
              socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link block mb-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {link.platform}
                </a>
              ))
            ) : (
              <>
                <a href="https://x.com/vista8" target="_blank" rel="noopener noreferrer" className="footer-link block mb-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  X
                </a>
                <a href="https://github.com/joeseesun" target="_blank" rel="noopener noreferrer" className="footer-link block mb-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Github
                </a>
                <a href="https://weibo.com/u/1620605960" target="_blank" rel="noopener noreferrer" className="footer-link block mb-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  微博
                </a>
              </>
            )}

            <div className="social-links flex gap-4 mt-4">
              <a
                href="https://x.com/vista8"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link flex items-center justify-center w-8 h-8 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <FaXTwitter size={20} />
              </a>
              <a
                href="https://github.com/joeseesun"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link flex items-center justify-center w-8 h-8 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <FaGithub size={20} />
              </a>
              <a
                href="https://weibo.com/u/1620605960"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link flex items-center justify-center w-8 h-8 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <FaWeibo size={20} />
              </a>
            </div>
          </div>

          {/* 联系方式 */}
          <div className="footer-section">
            <h4 className="footer-title text-xl font-semibold mb-4">联系乔木</h4>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {contactInfo.length > 0 ? (
                contactInfo.map((contact, index) => {
                  if (contact.qrCodeUrl) {
                    return (
                      <div key={contact.id || index} className="text-center">
                        <Image
                          src={contact.qrCodeUrl}
                          alt={`${contact.type === 'wechat' ? '微信' : '公众号'}二维码`}
                          width={96}
                          height={96}
                          className="mx-auto w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                          {contact.type === 'wechat' ? '微信' : '公众号'}
                        </p>
                      </div>
                    );
                  }
                  return null;
                })
              ) : (
                <>
                  <div className="text-center">
                    <Image
                      src="/images/default-qrcode.png"
                      alt="微信二维码"
                      width={96}
                      height={96}
                      className="mx-auto w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">微信</p>
                  </div>
                  <div className="text-center">
                    <Image
                      src="/images/default-qrcode.png"
                      alt="公众号二维码"
                      width={96}
                      height={96}
                      className="mx-auto w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">公众号</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 打赏 */}
          <div className="footer-section">
            <h4 className="footer-title text-xl font-semibold mb-4">打赏乔木</h4>
            <div className="text-center mt-4">
              {donationInfo.length > 0 ? (
                donationInfo.map((donation, index) => {
                  if (donation.qrCodeUrl) {
                    return (
                      <div key={donation.id || index}>
                        <Image
                          src={donation.qrCodeUrl}
                          alt="打赏二维码"
                          width={128}
                          height={128}
                          className="mx-auto w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">感谢您的支持！</p>
                      </div>
                    );
                  }
                  return null;
                })
              ) : (
                <div>
                  <Image
                    src="/images/default-qrcode.png"
                    alt="打赏二维码"
                    width={128}
                    height={128}
                    className="mx-auto w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">感谢您的支持！</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 版权信息 */}
        <div className="copyright text-center mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            {footerCopyright ? footerCopyright : `${currentYear}@${siteTitle}`}
          </p>
        </div>
      </div>
    </footer>
  );
}
