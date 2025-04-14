'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Webhook } from '@/lib/schema/links';

export default function WebhooksPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentWebhook, setCurrentWebhook] = useState<Webhook | null>(null);
  const [formData, setFormData] = useState({
    url: '',
    secret: '',
    isActive: true
  });

  // 加载Webhook列表
  useEffect(() => {
    fetchWebhooks();
  }, []);

  // 获取Webhook列表
  const fetchWebhooks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/webhooks');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '获取Webhook列表失败');
      }

      const data = await response.json();

      // 检查响应中是否有Webhook数据
      if (!data.webhooks) {
        setWebhooks([]);
        return;
      }

      setWebhooks(data.webhooks || []);
    } catch (error) {
      console.error('获取Webhook列表失败:', error);
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '获取Webhook列表失败',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 处理开关变化
  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isActive: checked }));
  };

  // 打开创建对话框
  const handleOpenCreateDialog = () => {
    setFormData({
      url: '',
      secret: '',
      isActive: true
    });
    setIsCreateDialogOpen(true);
  };

  // 打开编辑对话框
  const handleOpenEditDialog = (webhook: Webhook) => {
    setCurrentWebhook(webhook);
    setFormData({
      url: webhook.url,
      secret: webhook.secret || '',
      isActive: webhook.isActive === 1
    });
    setIsEditDialogOpen(true);
  };

  // 打开删除对话框
  const handleOpenDeleteDialog = (webhook: Webhook) => {
    setCurrentWebhook(webhook);
    setIsDeleteDialogOpen(true);
  };

  // 创建Webhook
  const handleCreateWebhook = async () => {
    try {
      if (!formData.url) {
        toast({
          title: '错误',
          description: 'Webhook URL为必填项',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: formData.url,
          secret: formData.secret || null,
          isActive: formData.isActive ? 1 : 0
        })
      });

      if (!response.ok) {
        throw new Error('创建Webhook失败');
      }

      toast({
        title: '成功',
        description: 'Webhook创建成功'
      });

      setIsCreateDialogOpen(false);
      fetchWebhooks();
    } catch (error) {
      console.error('创建Webhook失败:', error);
      toast({
        title: '错误',
        description: '创建Webhook失败',
        variant: 'destructive'
      });
    }
  };

  // 更新Webhook
  const handleUpdateWebhook = async () => {
    try {
      if (!currentWebhook) return;
      if (!formData.url) {
        toast({
          title: '错误',
          description: 'Webhook URL为必填项',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch(`/api/webhooks/${currentWebhook.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: formData.url,
          secret: formData.secret || null,
          isActive: formData.isActive ? 1 : 0
        })
      });

      if (!response.ok) {
        throw new Error('更新Webhook失败');
      }

      toast({
        title: '成功',
        description: 'Webhook更新成功'
      });

      setIsEditDialogOpen(false);
      fetchWebhooks();
    } catch (error) {
      console.error('更新Webhook失败:', error);
      toast({
        title: '错误',
        description: '更新Webhook失败',
        variant: 'destructive'
      });
    }
  };

  // 删除Webhook
  const handleDeleteWebhook = async () => {
    try {
      if (!currentWebhook) return;

      const response = await fetch(`/api/webhooks/${currentWebhook.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('删除Webhook失败');
      }

      toast({
        title: '成功',
        description: 'Webhook删除成功'
      });

      setIsDeleteDialogOpen(false);
      fetchWebhooks();
    } catch (error) {
      console.error('删除Webhook失败:', error);
      toast({
        title: '错误',
        description: '删除Webhook失败',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Webhook管理</h1>
          <p className="text-gray-500 mt-1">
            Webhook允许您在链接被创建、更新或删除时接收通知
          </p>
        </div>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => router.push('/admin/links')}>
            返回链接管理
          </Button>
          <Button onClick={handleOpenCreateDialog}>
            <PlusIcon className="h-4 w-4 mr-2" />
            添加Webhook
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">加载中...</div>
      ) : webhooks.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <BellIcon className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">暂无Webhook</h3>
          <p className="mt-1 text-sm text-gray-500">添加Webhook以在链接变更时接收通知</p>
          <div className="mt-6">
            <Button onClick={handleOpenCreateDialog}>
              <PlusIcon className="h-4 w-4 mr-2" />
              添加Webhook
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  密钥
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {webhooks.map((webhook) => (
                <tr key={webhook.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{webhook.url}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {webhook.secret ? '******' : '无'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      webhook.isActive === 1
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {webhook.isActive === 1 ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(webhook.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditDialog(webhook)}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDeleteDialog(webhook)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 创建Webhook对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加Webhook</DialogTitle>
            <DialogDescription>
              添加一个新的Webhook以接收链接变更通知
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="url" className="text-right">
                URL *
              </Label>
              <Input
                id="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="https://example.com/webhook"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="secret" className="text-right">
                密钥
              </Label>
              <Input
                id="secret"
                name="secret"
                value={formData.secret}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="用于签名验证（可选）"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                启用
              </Label>
              <div className="col-span-3 flex items-center">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={handleSwitchChange}
                />
                <span className="ml-2 text-sm text-gray-500">
                  {formData.isActive ? '已启用' : '已禁用'}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateWebhook}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑Webhook对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑Webhook</DialogTitle>
            <DialogDescription>
              修改Webhook配置
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-url" className="text-right">
                URL *
              </Label>
              <Input
                id="edit-url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-secret" className="text-right">
                密钥
              </Label>
              <Input
                id="edit-secret"
                name="secret"
                value={formData.secret}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="留空保持不变"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-isActive" className="text-right">
                启用
              </Label>
              <div className="col-span-3 flex items-center">
                <Switch
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={handleSwitchChange}
                />
                <span className="ml-2 text-sm text-gray-500">
                  {formData.isActive ? '已启用' : '已禁用'}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateWebhook}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除Webhook对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除Webhook</DialogTitle>
            <DialogDescription>
              确定要删除这个Webhook吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              您即将删除Webhook: <span className="font-medium text-gray-900">{currentWebhook?.url}</span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteWebhook}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
