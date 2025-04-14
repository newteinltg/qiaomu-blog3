'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  LinkIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowTopRightOnSquareIcon as ExternalLinkIcon
} from '@heroicons/react/24/outline';
import { getLinks, createLink, updateLink, deleteLink, toggleLinkVisibility } from '@/lib/actions/links';
import ImageUploader from '@/components/ImageUploader';
import TagifyInput from '@/components/TagifyInput';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Link } from '@/lib/schema/links';

export default function LinksPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [links, setLinks] = useState<Link[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentLink, setCurrentLink] = useState<Link | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    coverImage: '',
    tags: '[]',
    isVisible: 1
  });
  const [tagsList, setTagsList] = useState<Array<{ id: number; name: string }>>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  // 加载链接列表和标签列表
  useEffect(() => {
    fetchLinks(pagination.page);
    fetchTags();

    // 检查URL参数，如果有edit参数，打开编辑对话框
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    if (editId) {
      const id = parseInt(editId);
      if (!isNaN(id)) {
        // 先加载链接列表，然后打开编辑对话框
        fetchLinks(pagination.page).then(() => {
          const linkToEdit = links.find(link => link.id === id);
          if (linkToEdit) {
            handleOpenEditDialog(linkToEdit);
            // 清除URL参数
            window.history.replaceState({}, '', '/admin/links');
          }
        });
      }
    }
  }, [pagination.page]);

  // 搜索过滤链接
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLinks(links);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = links.filter(link => {
      // 搜索标题
      if (link.title.toLowerCase().includes(query)) return true;

      // 搜索URL
      if (link.url.toLowerCase().includes(query)) return true;

      // 搜索标签
      if (link.tags) {
        try {
          // 尝试解析JSON格式的标签
          const parsedTags = JSON.parse(link.tags);
          for (const tag of parsedTags) {
            const tagValue = tag.value || tag;
            if (tagValue.toLowerCase().includes(query)) return true;
          }
        } catch (e) {
          // 兼容旧格式（逗号分隔的字符串）
          const tagArray = link.tags.split(',');
          for (const tag of tagArray) {
            if (tag.trim().toLowerCase().includes(query)) return true;
          }
        }
      }

      return false;
    });

    setFilteredLinks(filtered);
  }, [links, searchQuery]);

  // 获取标签列表
  const fetchTags = async () => {
    try {
      setIsLoadingTags(true);
      const response = await fetch('/api/tags');

      if (!response.ok) {
        throw new Error('获取标签列表失败');
      }

      const data = await response.json();
      setTagsList(data.data || []);
    } catch (error) {
      console.error('获取标签列表失败:', error);
    } finally {
      setIsLoadingTags(false);
    }
  };

  // 获取链接列表
  const fetchLinks = async (page: number = 1) => {
    return new Promise<void>(async (resolve) => {
    try {
      setIsLoading(true);

      // 使用服务器操作获取链接列表（包括隐藏的链接）
      const result = await getLinks(null, page, pagination.pageSize, true);
      const fetchedLinks = result.links || [];

      setLinks(fetchedLinks);
      setFilteredLinks(fetchedLinks);

      // 更新分页信息
      setPagination({
        total: Number(result.pagination.total),
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        totalPages: result.pagination.totalPages
      });
    } catch (error) {
      console.error('获取链接列表失败:', error);
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '获取链接列表失败',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
    resolve();
  });
  };

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 打开创建对话框
  const handleOpenCreateDialog = () => {
    setFormData({
      title: '',
      url: '',
      description: '',
      coverImage: '',
      tags: '[]',
      isVisible: 1
    });
    setIsCreateDialogOpen(true);
  };

  // 打开编辑对话框
  const handleOpenEditDialog = (link: Link) => {
    setCurrentLink(link);

    // 处理标签数据
    let tagsValue = '[]';
    if (link.tags) {
      try {
        // 尝试解析现有标签，如果已经是JSON格式
        JSON.parse(link.tags);
        tagsValue = link.tags;
      } catch (e) {
        // 如果不是JSON格式，将逗号分隔的字符串转换为JSON格式
        const tagArray = link.tags.split(',').map(tag => ({
          value: tag.trim()
        }));
        tagsValue = JSON.stringify(tagArray);
      }
    }

    setFormData({
      title: link.title,
      url: link.url,
      description: link.description || '',
      coverImage: link.coverImage || '',
      tags: tagsValue,
      isVisible: link.isVisible
    });
    setIsEditDialogOpen(true);
  };

  // 打开删除对话框
  const handleOpenDeleteDialog = (link: Link) => {
    setCurrentLink(link);
    setIsDeleteDialogOpen(true);
  };

  // 创建链接
  const handleCreateLink = async () => {
    try {
      if (!formData.title || !formData.url) {
        toast({
          title: '错误',
          description: '标题和URL为必填项',
          variant: 'destructive'
        });
        return;
      }

      // 使用服务器操作创建链接
      await createLink(formData);

      toast({
        title: '成功',
        description: '链接创建成功'
      });

      setIsCreateDialogOpen(false);
      fetchLinks();
    } catch (error) {
      console.error('创建链接失败:', error);
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '创建链接失败',
        variant: 'destructive'
      });
    }
  };

  // 更新链接
  const handleUpdateLink = async () => {
    try {
      if (!currentLink) return;
      if (!formData.title || !formData.url) {
        toast({
          title: '错误',
          description: '标题和URL为必填项',
          variant: 'destructive'
        });
        return;
      }

      // 使用服务器操作更新链接
      await updateLink(currentLink.id, formData);

      toast({
        title: '成功',
        description: '链接更新成功'
      });

      setIsEditDialogOpen(false);
      fetchLinks();
    } catch (error) {
      console.error('更新链接失败:', error);
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '更新链接失败',
        variant: 'destructive'
      });
    }
  };

  // 切换链接可见性
  const handleToggleVisibility = async (link: Link) => {
    try {
      // 使用服务器操作切换链接可见性
      const updatedLink = await toggleLinkVisibility(link.id);

      toast({
        title: '成功',
        description: updatedLink.isVisible === 1 ? '链接已设为可见' : '链接已设为隐藏'
      });

      fetchLinks();
    } catch (error) {
      console.error('切换链接可见性失败:', error);
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '切换链接可见性失败',
        variant: 'destructive'
      });
    }
  };

  // 删除链接
  const handleDeleteLink = async () => {
    try {
      if (!currentLink) return;

      // 使用服务器操作删除链接
      await deleteLink(currentLink.id);

      toast({
        title: '成功',
        description: '链接删除成功'
      });

      setIsDeleteDialogOpen(false);
      fetchLinks();
    } catch (error) {
      console.error('删除链接失败:', error);
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '删除链接失败',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">链接管理</h1>
        <Button onClick={handleOpenCreateDialog}>
          <PlusIcon className="h-4 w-4 mr-2" />
          添加链接
        </Button>
      </div>

      {/* 搜索框 */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="搜索标题、网址或标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">加载中...</div>
      ) : filteredLinks.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <LinkIcon className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            {searchQuery ? `没有找到匹配“${searchQuery}”的链接` : '暂无链接'}
          </h3>
          {!searchQuery && <p className="mt-1 text-sm text-gray-500">点击添加按钮创建您的第一个链接</p>}
          <div className="mt-6">
            <Button onClick={handleOpenCreateDialog}>
              <PlusIcon className="h-4 w-4 mr-2" />
              添加链接
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  标题
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  标签
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
              {filteredLinks.map((link) => (
                <tr key={link.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-md mr-3 flex-shrink-0 flex items-center justify-center overflow-hidden bg-gray-100">
                        {link.coverImage ? (
                          <img
                            className="h-full w-full object-cover"
                            src={link.coverImage}
                            alt={link.title}
                            onError={(e) => {
                              // 如果图片加载失败，显示首字图标
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.classList.add('bg-gray-200');
                              (e.target as HTMLImageElement).parentElement!.innerHTML += `<span class="text-xl text-gray-500">${link.title.charAt(0)}</span>`;
                            }}
                          />
                        ) : (
                          <span className="text-xl text-gray-500">{link.title.charAt(0)}</span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900 max-w-[250px] line-clamp-2" title={link.title}>{link.title}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        {link.url.length > 30 ? `${link.url.substring(0, 30)}...` : link.url}
                        <ExternalLinkIcon className="h-4 w-4 ml-1" />
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {link.tags ? (
                        (() => {
                          try {
                            const parsedTags = JSON.parse(link.tags);
                            return parsedTags.map((tag: any, index: number) => (
                              <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1">
                                {tag.value || tag}
                              </span>
                            ));
                          } catch (e) {
                            // 兼容旧格式（逗号分隔的字符串）
                            return link.tags.split(',').map((tag, index) => (
                              <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1">
                                {tag.trim()}
                              </span>
                            ));
                          }
                        })()
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(link.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleVisibility(link)}
                      className={`${link.isVisible === 1 ? 'text-green-600 hover:text-green-900' : 'text-gray-400 hover:text-gray-600'} mr-2`}
                      title={link.isVisible === 1 ? '点击隐藏链接' : '点击显示链接'}
                    >
                      {link.isVisible === 1 ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditDialog(link)}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDeleteDialog(link)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 分页组件 */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <nav className="inline-flex rounded-md shadow">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-4 py-2 rounded-l-md border ${pagination.page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'} text-sm font-medium`}
                >
                  上一页
                </button>

                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                  // 如果页数少于5，直接显示所有页
                  if (pagination.totalPages <= 5) {
                    return i + 1;
                  }

                  // 如果当前页面在前两页，显示1-5页
                  if (pagination.page <= 2) {
                    return i + 1;
                  }

                  // 如果当前页面在后两页，显示最后5页
                  if (pagination.page >= pagination.totalPages - 1) {
                    return pagination.totalPages - 4 + i;
                  }

                  // 否则显示当前页面及其前后各两页
                  return pagination.page - 2 + i;
                }).map(page => (
                  <button
                    key={page}
                    onClick={() => setPagination(prev => ({ ...prev, page }))}
                    className={`relative inline-flex items-center px-4 py-2 border ${pagination.page === page ? 'bg-blue-50 text-blue-600 border-blue-500 z-10' : 'bg-white text-gray-700 hover:bg-gray-50'} text-sm font-medium`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, prev.totalPages) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className={`relative inline-flex items-center px-4 py-2 rounded-r-md border ${pagination.page === pagination.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'} text-sm font-medium`}
                >
                  下一页
                </button>
              </nav>
            </div>
          )}
        </div>
      )}

      {/* 创建链接对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加链接</DialogTitle>
            <DialogDescription>
              添加一个新的链接到您的收藏中
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                标题 *
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
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
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                描述
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="coverImage" className="text-right">
                封面图
              </Label>
              <div className="col-span-3">
                <ImageUploader
                  value={formData.coverImage}
                  onChange={(url) => setFormData(prev => ({ ...prev, coverImage: url }))}
                  placeholder="选择或拖放封面图片到此处"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tags" className="text-right">
                标签
              </Label>
              <div className="col-span-3">
                <TagifyInput
                  value={formData.tags}
                  onChange={(value) => setFormData(prev => ({ ...prev, tags: value }))}
                  whitelist={tagsList}
                  loading={isLoadingTags}
                  placeholder="输入标签..."
                  className="w-full text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isVisible" className="text-right">
                可见性
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <select
                  id="isVisible"
                  value={formData.isVisible}
                  onChange={(e) => setFormData(prev => ({ ...prev, isVisible: parseInt(e.target.value) }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="1">可见</option>
                  <option value="0">隐藏</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateLink}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑链接对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑链接</DialogTitle>
            <DialogDescription>
              修改链接信息
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-title" className="text-right">
                标题 *
              </Label>
              <Input
                id="edit-title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
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
              <Label htmlFor="edit-description" className="text-right">
                描述
              </Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-coverImage" className="text-right">
                封面图
              </Label>
              <div className="col-span-3">
                <ImageUploader
                  value={formData.coverImage}
                  onChange={(url) => setFormData(prev => ({ ...prev, coverImage: url }))}
                  placeholder="选择或拖放封面图片到此处"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-tags" className="text-right">
                标签
              </Label>
              <div className="col-span-3">
                <TagifyInput
                  value={formData.tags}
                  onChange={(value) => setFormData(prev => ({ ...prev, tags: value }))}
                  whitelist={tagsList}
                  loading={isLoadingTags}
                  placeholder="输入标签..."
                  className="w-full text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-isVisible" className="text-right">
                可见性
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <select
                  id="edit-isVisible"
                  value={formData.isVisible}
                  onChange={(e) => setFormData(prev => ({ ...prev, isVisible: parseInt(e.target.value) }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="1">可见</option>
                  <option value="0">隐藏</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateLink}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除链接对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除链接</DialogTitle>
            <DialogDescription>
              确定要删除这个链接吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              您即将删除链接: <span className="font-medium text-gray-900">{currentLink?.title}</span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteLink}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
