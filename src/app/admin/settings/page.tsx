'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';
import { ContactInfo, DonationInfo } from '@/lib/schema/settings';

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([]);
  const [donationInfo, setDonationInfo] = useState<DonationInfo[]>([]);

  // 联系方式表单状态
  const [wechatQRCode, setWechatQRCode] = useState<string>('');
  const [wechatQRCodeFile, setWechatQRCodeFile] = useState<File | null>(null);
  const [wechatQRCodePreview, setWechatQRCodePreview] = useState<string>('');

  const [publicQRCode, setPublicQRCode] = useState<string>('');
  const [publicQRCodeFile, setPublicQRCodeFile] = useState<File | null>(null);
  const [publicQRCodePreview, setPublicQRCodePreview] = useState<string>('');

  // 打赏表单状态
  const [donationQRCode, setDonationQRCode] = useState<string>('');
  const [donationQRCodeFile, setDonationQRCodeFile] = useState<File | null>(null);
  const [donationQRCodePreview, setDonationQRCodePreview] = useState<string>('');

  // 加载数据
  useEffect(() => {
    fetchContactInfo();
    fetchDonationInfo();
  }, []);

  // 获取联系方式数据
  const fetchContactInfo = async () => {
    try {
      const response = await fetch('/api/settings/contact');
      if (response.ok) {
        const data = await response.json();
        setContactInfo(data);

        // 设置微信和公众号二维码
        const wechatInfo = data.find(item => item.type === 'wechat');
        if (wechatInfo) {
          setWechatQRCode(wechatInfo.qrCodeUrl || '');
          setWechatQRCodePreview(wechatInfo.qrCodeUrl || '');
        }

        const publicInfo = data.find(item => item.type === 'public');
        if (publicInfo) {
          setPublicQRCode(publicInfo.qrCodeUrl || '');
          setPublicQRCodePreview(publicInfo.qrCodeUrl || '');
        }
      }
    } catch (error) {
      console.error('获取联系方式失败:', error);
      toast({
        variant: "destructive",
        title: "错误",
        description: "获取联系方式失败"
      });
    }
  };

  // 获取打赏信息
  const fetchDonationInfo = async () => {
    try {
      const response = await fetch('/api/settings/donation');
      if (response.ok) {
        const data = await response.json();
        setDonationInfo(data);

        // 设置打赏二维码
        const donationItem = data[0];
        if (donationItem) {
          setDonationQRCode(donationItem.qrCodeUrl || '');
          setDonationQRCodePreview(donationItem.qrCodeUrl || '');
        }
      }
    } catch (error) {
      console.error('获取打赏信息失败:', error);
      toast({
        variant: "destructive",
        title: "错误",
        description: "获取打赏信息失败"
      });
    }
  };

  // 处理文件上传预览
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>, setPreview: React.Dispatch<React.SetStateAction<string>>) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 保存联系方式
  const saveContactInfo = async () => {
    setLoading(true);
    try {
      // 上传微信二维码
      let wechatQRCodeUrl = wechatQRCode;
      if (wechatQRCodeFile) {
        const formData = new FormData();
        formData.append('file', wechatQRCodeFile);
        formData.append('type', 'contact');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          wechatQRCodeUrl = uploadData.url;
        } else {
          throw new Error('上传微信二维码失败');
        }
      }

      // 上传公众号二维码
      let publicQRCodeUrl = publicQRCode;
      if (publicQRCodeFile) {
        const formData = new FormData();
        formData.append('file', publicQRCodeFile);
        formData.append('type', 'contact');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          publicQRCodeUrl = uploadData.url;
        } else {
          throw new Error('上传公众号二维码失败');
        }
      }

      // 保存微信联系方式
      const wechatInfo = contactInfo.find(item => item.type === 'wechat');
      if (wechatInfo) {
        await fetch(`/api/settings/contact/${wechatInfo.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...wechatInfo,
            qrCodeUrl: wechatQRCodeUrl,
          }),
        });
      } else {
        await fetch('/api/settings/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'wechat',
            value: 'wechat',
            qrCodeUrl: wechatQRCodeUrl,
            displayName: '微信',
            isActive: 1,
          }),
        });
      }

      // 保存公众号联系方式
      const publicInfo = contactInfo.find(item => item.type === 'public');
      if (publicInfo) {
        await fetch(`/api/settings/contact/${publicInfo.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...publicInfo,
            qrCodeUrl: publicQRCodeUrl,
          }),
        });
      } else {
        await fetch('/api/settings/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'public',
            value: 'public',
            qrCodeUrl: publicQRCodeUrl,
            displayName: '公众号',
            isActive: 1,
          }),
        });
      }

      toast({
        title: "成功",
        description: "联系方式保存成功"
      });
      fetchContactInfo();
    } catch (error) {
      console.error('保存联系方式失败:', error);
      toast({
        variant: "destructive",
        title: "错误",
        description: "保存联系方式失败"
      });
    } finally {
      setLoading(false);
    }
  };

  // 保存打赏信息
  const saveDonationInfo = async () => {
    setLoading(true);
    try {
      // 上传打赏二维码
      let donationQRCodeUrl = donationQRCode;
      if (donationQRCodeFile) {
        const formData = new FormData();
        formData.append('file', donationQRCodeFile);
        formData.append('type', 'donation');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          donationQRCodeUrl = uploadData.url;
        } else {
          throw new Error('上传打赏二维码失败');
        }
      }

      // 保存打赏信息
      const donationItem = donationInfo[0];
      if (donationItem) {
        await fetch(`/api/settings/donation/${donationItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...donationItem,
            qrCodeUrl: donationQRCodeUrl,
          }),
        });
      } else {
        await fetch('/api/settings/donation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'general',
            qrCodeUrl: donationQRCodeUrl,
            description: '感谢您的支持！',
            isActive: 1,
          }),
        });
      }

      toast({
        title: "成功",
        description: "打赏信息保存成功"
      });
      fetchDonationInfo();
    } catch (error) {
      console.error('保存打赏信息失败:', error);
      toast({
        variant: "destructive",
        title: "错误",
        description: "保存打赏信息失败"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">网站设置</h1>

        <div className="mb-8 flex flex-wrap gap-4">
          <a
            href="/admin/settings/general"
            className="px-4 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            基本设置
          </a>
          <a
            href="/admin/settings"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            联系与打赏
          </a>
          <a
            href="/admin/settings/scripts"
            className="px-4 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            脚本管理
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 联系方式设置 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">联系方式设置</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                微信二维码
              </label>
              <div className="flex items-start space-x-4">
                <div className="w-32 h-32 relative border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  {wechatQRCodePreview ? (
                    <Image
                      src={wechatQRCodePreview}
                      alt="微信二维码预览"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                      <span className="text-gray-400">无图片</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setWechatQRCodeFile, setWechatQRCodePreview)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-2"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    推荐尺寸: 300x300px, 最大文件大小: 2MB
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                公众号二维码
              </label>
              <div className="flex items-start space-x-4">
                <div className="w-32 h-32 relative border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  {publicQRCodePreview ? (
                    <Image
                      src={publicQRCodePreview}
                      alt="公众号二维码预览"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                      <span className="text-gray-400">无图片</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setPublicQRCodeFile, setPublicQRCodePreview)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-2"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    推荐尺寸: 300x300px, 最大文件大小: 2MB
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={saveContactInfo}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? '保存中...' : '保存联系方式'}
              </button>
            </div>
          </div>

          {/* 打赏设置 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">打赏设置</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                打赏二维码
              </label>
              <div className="flex items-start space-x-4">
                <div className="w-32 h-32 relative border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  {donationQRCodePreview ? (
                    <Image
                      src={donationQRCodePreview}
                      alt="打赏二维码预览"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                      <span className="text-gray-400">无图片</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setDonationQRCodeFile, setDonationQRCodePreview)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-2"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    推荐尺寸: 300x300px, 最大文件大小: 2MB
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={saveDonationInfo}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? '保存中...' : '保存打赏信息'}
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
