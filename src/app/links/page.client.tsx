'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/lib/schema/links';
import { ArrowTopRightOnSquareIcon as ExternalLinkIcon, MagnifyingGlassIcon, XMarkIcon, PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { getLinks, updateLink, deleteLink, toggleLinkVisibility } from '@/lib/actions/links';
import useAdminCheck from '@/components/AdminCheck';
import { useRouter } from 'next/navigation';
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
import TagifyInput from '@/components/TagifyInput';
import ImageUploader from '@/components/ImageUploader';

export default function LinksClient() {
  const router = useRouter();
  const isAdmin = useAdminCheck();
  const { toast } = useToast();
  const [links, setLinks] = useState<Link[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
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
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [tagsList, setTagsList] = useState<Array<{ id: number; name: string }>>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0
  });

  // 加载链接列表
  useEffect(() => {
    fetchLinks(pagination.page);
  }, [selectedTag, pagination.page]);

  // 获取标签列表
  const fetchTags = async () => {
    try {
      setIsLoadingTags(true);

      // 使用服务器操作获取标签列表
      const response = await fetch('/api/tags');
      const data = await response.json();

      if (response.ok) {
        setTagsList(data.tags || []);
      } else {
        console.error('获取标签列表失败:', data.error);
      }
    } catch (error) {
      console.error('获取标签列表失败:', error);
    } finally {
      setIsLoadingTags(false);
    }
  };

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 打开编辑对话框
  const handleEditLink = (link: Link, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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

    // 打开编辑对话框
    setIsEditDialogOpen(true);

    // 获取标签列表
    fetchTags();
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
      fetchLinks(pagination.page);
    } catch (error) {
      console.error('更新链接失败:', error);
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '更新链接失败',
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
      fetchLinks(pagination.page);
    } catch (error) {
      console.error('删除链接失败:', error);
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '删除链接失败',
        variant: 'destructive'
      });
    }
  };

  // 切换链接可见性
  const handleToggleVisibility = async (id: number) => {
    try {
      // 使用服务器操作切换可见性
      await toggleLinkVisibility(id);

      toast({
        title: '成功',
        description: '链接可见性已切换'
      });

      fetchLinks(pagination.page);
    } catch (error) {
      console.error('切换链接可见性失败:', error);
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '切换链接可见性失败',
        variant: 'destructive'
      });
    }
  };

  // 搜索过滤链接
  const filterLinks = useCallback(() => {
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

  // 当链接数据或搜索查询变化时过滤链接
  useEffect(() => {
    filterLinks();
  }, [links, searchQuery, filterLinks]);

  // 获取链接列表
  const fetchLinks = async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      // 使用服务器操作获取链接列表
      const result = await getLinks(selectedTag, page, pagination.pageSize);
      const fetchedLinks = result.links || [];

      setLinks(fetchedLinks);
      // 如果没有搜索查询，直接设置过滤后的链接为所有链接
      if (!searchQuery.trim()) {
        setFilteredLinks(fetchedLinks);
      }

      // 更新分页信息
      setPagination({
        total: Number(result.pagination.total),
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        totalPages: result.pagination.totalPages
      });

      // 提取所有标签
      if (!selectedTag) {
        const allTags = new Set<string>();
        result.links.forEach((link: Link) => {
          if (link.tags) {
            try {
              // 尝试解析JSON格式的标签
              const parsedTags = JSON.parse(link.tags);
              parsedTags.forEach((tag: any) => {
                allTags.add(tag.value || tag);
              });
            } catch (e) {
              // 兼容旧格式（逗号分隔的字符串）
              link.tags.split(',').forEach(tag => {
                allTags.add(tag.trim());
              });
            }
          }
        });
        setTags(Array.from(allTags));
      }
    } catch (error) {
      console.error('获取链接列表失败:', error);
      setError(error instanceof Error ? error.message : '获取链接列表失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理标签点击
  const handleTagClick = (tag: string | null) => {
    setSelectedTag(tag);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
        <button
          onClick={(e) => {
            e.preventDefault();
            fetchLinks(pagination.page);
          }}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* 搜索框 */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="搜索标题、网址或标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* 标签过滤器 */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleTagClick(null)}
            className={`px-3 py-1 rounded-md text-sm ${
              selectedTag === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`px-3 py-1 rounded-md text-sm ${
                selectedTag === tag
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 链接列表 */}
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : filteredLinks.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">
            {searchQuery ? `没有找到匹配“${searchQuery}”的链接` : '暂无链接'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredLinks.map((link) => (
            <div key={link.id} className="relative">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow p-4 h-[180px] flex flex-col relative group-hover:border-blue-300">

                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full"
                >
                  <div className="flex items-start gap-3">
                    {/* 图标和编辑按钮 */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-2">
                      <div className="w-7 h-7 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden shadow-sm">
                        {link.coverImage ? (
                          <img
                            src={link.coverImage}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // 如果图片加载失败，显示默认图标
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.classList.add('bg-gray-200');
                              (e.target as HTMLImageElement).parentElement!.innerHTML += `<span class="text-sm font-medium text-gray-500">${link.title.charAt(0).toUpperCase()}</span>`;
                            }}
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-500">{link.title.charAt(0).toUpperCase()}</span>
                        )}
                      </div>

                      {/* 编辑图标 */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEditLink(link, e);
                        }}
                        className="p-1 rounded-md hover:bg-gray-100"
                        title="编辑链接"
                      >
                        <PencilIcon className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="text-base font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2" title={link.title}>
                          {link.title}
                        </h3>
                      </div>

                      {/* URL */}
                      <div className="mt-1">
                        <div className="text-xs text-gray-500 truncate" title={link.url}>
                          {link.url.length > 50 ? `${link.url.substring(0, 50)}...` : link.url}
                        </div>
                      </div>

                      {/* 引用式描述 */}
                      {link.description && (
                        <blockquote
                          className="mt-2 pl-2 border-l-2 border-gray-300 italic text-sm text-gray-600 dark:text-gray-400 line-clamp-3 overflow-hidden bg-gray-50 rounded-r-sm py-1 pr-1"
                          title={link.description}
                        >
                          {link.description}
                        </blockquote>
                      )}

                      {/* 标签和编辑图标 */}
                      <div className="absolute bottom-[10px] left-6 right-4 flex flex-wrap items-center justify-between">
                        {/* 标签 */}
                        <div className="flex flex-wrap gap-1.5 flex-grow">
                          {link.tags && (() => {
                            try {
                              const parsedTags = JSON.parse(link.tags);
                              return parsedTags.map((tag: any, index: number) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors"
                                >
                                  {tag.value || tag}
                                </span>
                              ));
                            } catch (e) {
                              // 兼容旧格式（逗号分隔的字符串）
                              return link.tags.split(',').map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors"
                                >
                                  {tag.trim()}
                                </span>
                              ));
                            }
                          })()}
                        </div>

                        {/* 右下角编辑图标已移除 */}
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页组件 */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="inline-flex rounded-md shadow">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
              disabled={pagination.page === 1}
              className={`relative inline-flex items-center px-4 py-2 rounded-l-md border ${pagination.page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'} text-sm font-medium`}
            >
              上一页
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
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

      {/* 编辑链接对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑链接</DialogTitle>
            <DialogDescription>修改链接信息并点击保存按钮更新。</DialogDescription>
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
              <Label htmlFor="edit-visibility" className="text-right">
                可见性
              </Label>
              <div className="col-span-3 flex items-center">
                <input
                  type="checkbox"
                  id="edit-visibility"
                  checked={formData.isVisible === 1}
                  onChange={(e) => setFormData(prev => ({ ...prev, isVisible: e.target.checked ? 1 : 0 }))}
                  className="mr-2 h-4 w-4"
                />
                <label htmlFor="edit-visibility" className="text-sm text-gray-600">
                  {formData.isVisible === 1 ? '公开可见' : '仅管理员可见'}
                </label>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <div>
              <Button
                variant="destructive"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setIsDeleteDialogOpen(true);
                }}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                删除
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleUpdateLink}>保存</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除这个链接吗？这个操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {currentLink && (
              <div className="border border-gray-200 rounded-md p-4">
                <h3 className="font-medium">{currentLink.title}</h3>
                <p className="text-sm text-gray-500 truncate">{currentLink.url}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteLink}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
