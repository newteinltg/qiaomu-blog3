"use client";

import Link from 'next/link';
import Image from 'next/image';
import { FaGithub, FaWeibo } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { useEffect, useState } from 'react';

export default function SimpleFooter() {
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [contactInfo, setContactInfo] = useState<any[]>([]);
  const [donationInfo, setDonationInfo] = useState<any[]>([]);
  const [footerLinks, setFooterLinks] = useState<{name: string, url: string}[]>([]);
  const [socialLinks, setSocialLinks] = useState<{name: string, url: string}[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取网站设置
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSettings(data.data.settings || {});
            setContactInfo(data.data.contactInfo || []);
            setDonationInfo(data.data.donationInfo || []);

            // 解析 footer_links
            if (data.data.settings.footer_links) {
              try {
                const links = JSON.parse(data.data.settings.footer_links);
                setFooterLinks(links);
              } catch (e) {
                console.error('解析 footer_links 失败:', e);
              }
            }

            // 解析 social_links
            if (data.data.settings.social_links) {
              try {
                const links = JSON.parse(data.data.settings.social_links);
                setSocialLinks(links);
              } catch (e) {
                console.error('解析 social_links 失败:', e);
              }
            }
          }
        }
      } catch (error) {
        console.error('获取网站设置失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <footer className="footer bg-gray-50 dark:bg-gray-800 py-12 rounded-lg shadow-sm mt-12">
      <div className="container-wide max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <Link href="https://link.qiaomu.ai" className="footer-link block mb-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  AI&阅读社群
                </Link>
                <Link href="https://daohang.qiaomu.ai" className="footer-link block mb-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  AI网址导航
                </Link>
                <Link href="https://www.32kw.com" className="footer-link block mb-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  AI生成展示
                </Link>
                <Link href="https://cards.qiaomu.ai" className="footer-link block mb-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  AI卡片生成
                </Link>
              </>
            )}
          </div>

          {/* 社交媒体 */}
          <div className="footer-section">
            <h4 className="footer-title text-xl font-semibold mb-4">社交媒体</h4>
            {socialLinks.length > 0 ? (
              socialLinks.map((link, index) => (
                <a
                  key={`social-link-${index}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link block mb-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {link.name}
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

            {/* 社交媒体图标已移除 */}
          </div>

          {/* 联系方式 */}
          <div className="footer-section">
            <h4 className="footer-title text-xl font-semibold mb-4">联系乔木</h4>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {contactInfo.length > 0 ? (
                contactInfo.filter(contact => contact.type === 'wechat').map((contact, index) => {
                  if (contact.qrCodeUrl) {
                    return (
                      <div key={contact.id || index} style={{ width: '144px', height: '144px' }}>
                        <Image
                          src={contact.qrCodeUrl}
                          alt="微信二维码"
                          width={140}
                          height={140}
                          className="w-36 h-36 object-contain rounded-lg"
                          style={{ width: '100%', height: '100%' }}
                        />
                        {/* 移除微信文字 */}
                      </div>
                    );
                  }
                  return null;
                })
              ) : (
                <>
                  <div style={{ width: '144px', height: '144px' }}>
                    <Image
                      src="/images/default-qrcode.png"
                      alt="微信二维码"
                      width={140}
                      height={140}
                      className="w-36 h-36 object-contain rounded-lg"
                      style={{ width: '100%', height: '100%' }}
                    />
                    {/* 移除微信文字 */}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 打赏 */}
          <div className="footer-section">
            <h4 className="footer-title text-xl font-semibold mb-4">打赏乔木</h4>
            <div className="flex justify-start mt-4">
              {donationInfo.length > 0 ? (
                donationInfo.map((donation, index) => {
                  if (donation.qrCodeUrl) {
                    return (
                      <div key={donation.id || index} style={{ width: '144px', height: '144px' }}>
                        <Image
                          src={donation.qrCodeUrl}
                          alt="打赏二维码"
                          width={140}
                          height={140}
                          className="w-36 h-36 object-contain rounded-lg"
                          style={{ width: '100%', height: '100%' }}
                        />
                      </div>
                    );
                  }
                  return null;
                })
              ) : (
                <div style={{ width: '144px', height: '144px' }}>
                  <Image
                    src="/images/default-qrcode.png"
                    alt="打赏二维码"
                    width={140}
                    height={140}
                    className="w-36 h-36 object-contain rounded-lg"
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 版权信息 */}
        <div className="copyright text-center mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            {currentYear}@{settings.site_name || '向阳乔木'}
          </p>
        </div>
      </div>
    </footer>
  );
}
