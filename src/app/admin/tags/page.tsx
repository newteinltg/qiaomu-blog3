'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import pinyin from 'pinyin';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogOverlay,
} from "@/components/ui/alert-dialog";
import { Pagination } from '@/components/ui/pagination';

interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTag, setNewTag] = useState({ name: '', slug: '', description: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 25;
  const { toast } = useToast();

  // 获取所有标签
  const fetchTags = async () => {
    try {
      setIsLoading(true);
      console.log('开始获取标签数据...');
      const response = await fetch(`/api/tags?page=${currentPage}&pageSize=${pageSize}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`);

      console.log('标签API响应状态:', response.status);

      if (!response.ok) {
        throw new Error(`获取标签失败 (${response.status})`);
      }

      const result = await response.json();
      console.log('获取到的标签数据:', result);
      setTags(result.data);
      setTotalPages(result.pagination.totalPages);
      setTotalCount(result.pagination.totalCount);
    } catch (err) {
      console.error('获取标签出错:', err);
      setError('无法加载标签数据，请稍后再试');
      toast({
        title: "加载失败",
        description: "无法加载标签数据，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [currentPage, searchQuery]);

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // 重置到第一页
    fetchTags();
  };

  // 创建新标签
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTag.name.trim()) {
      toast({
        title: "错误",
        description: "标签名称不能为空",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTag.name.trim(),
          slug: newTag.slug?.trim() || generateSlug(newTag.name.trim()),
          description: newTag.description.trim() || null
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create tag');
      }

      toast({
        title: "创建成功",
        description: "标签创建成功",
      });

      setIsCreateModalOpen(false);
      setNewTag({ name: '', slug: '', description: '' });
      fetchTags();
    } catch (err: any) {
      console.error('创建标签出错:', err);
      toast({
        title: "创建失败",
        description: err.message || "创建标签失败，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // 生成 slug - 将中文转换为拼音
  const generateSlug = (text: string): string => {
    if (!text) return '';

    try {
      // 转换为拼音
      const pinyinArray = pinyin(text, {
        style: pinyin.STYLE_NORMAL, // 普通风格，不带声调
      });

      // 将拼音数组扁平化并用连字符连接
      return pinyinArray
        .flat()
        .join('-')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // 替换非字母数字为连字符
        .replace(/^-|-$/g, ''); // 移除首尾连字符
    } catch (error) {
      console.error('生成slug出错:', error);
      // 降级处理：直接替换非法字符
      return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
  };

  // 处理名称变化时自动生成 slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>, isNewTag = true) => {
    const name = e.target.value;

    if (isNewTag) {
      // 为新标签设置
      setNewTag(prev => {
        // 只有当slug为空或者之前是自动生成的，才自动更新slug
        const shouldUpdateSlug = !prev.slug || prev.slug === generateSlug(prev.name);
        return {
          ...prev,
          name,
          slug: shouldUpdateSlug ? generateSlug(name) : prev.slug
        };
      });
    } else if (editingTag) {
      // 为编辑中的标签设置
      const shouldUpdateSlug = !editingTag.slug || editingTag.slug === generateSlug(editingTag.name);
      setEditingTag({
        ...editingTag,
        name,
        slug: shouldUpdateSlug ? generateSlug(name) : editingTag.slug
      });
    }
  };

  // 更新标签
  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingTag) return;

    if (!editingTag.name.trim()) {
      toast({
        title: "错误",
        description: "标签名称不能为空",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsEditing(true);
      const response = await fetch(`/api/tags/${editingTag.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingTag.name.trim(),
          slug: editingTag.slug?.trim() || generateSlug(editingTag.name.trim()),
          description: editingTag.description?.trim() || null
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update tag');
      }

      toast({
        title: "更新成功",
        description: "标签更新成功",
      });

      setIsEditModalOpen(false);
      setEditingTag(null);
      fetchTags();
    } catch (err: any) {
      console.error('更新标签出错:', err);
      toast({
        title: "更新失败",
        description: err.message || "更新标签失败，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  // 删除标签
  const handleDeleteTag = async () => {
    if (!tagToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/tags/${tagToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete tag');
      }

      toast({
        title: "删除成功",
        description: "标签已成功删除",
      });

      setIsDeleteAlertOpen(false);
      setTagToDelete(null);
      fetchTags();
    } catch (err: any) {
      console.error('删除标签出错:', err);
      toast({
        title: "删除失败",
        description: err.message || "删除标签失败，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 打开创建标签模态框
  const openCreateModal = () => {
    setNewTag({ name: '', slug: '', description: '' });
    setIsCreateModalOpen(true);
  };

  // 打开编辑标签模态框
  const openEditModal = (tag: Tag) => {
    setEditingTag({ ...tag });
    setIsEditModalOpen(true);
  };

  // 打开删除确认对话框
  const openDeleteAlert = (tagId: number) => {
    setTagToDelete(tagId);
    setIsDeleteAlertOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">标签管理</h1>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          新建标签
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="搜索标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          搜索
        </button>
      </div>

      {/* 标签列表 */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                名称
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                描述
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
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                    <span>加载中...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-red-500">
                  {error}
                </td>
              </tr>
            ) : tags.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  {searchQuery ? '没有找到匹配的标签' : '暂无标签数据'}
                </td>
              </tr>
            ) : (
              tags.map((tag) => (
                <tr key={tag.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tag.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{tag.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{tag.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 truncate max-w-xs">{tag.description || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(tag.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(tag)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => openDeleteAlert(tag.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {!isLoading && !error && tags.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-700">
            共 <span className="font-medium">{totalCount}</span> 个标签
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* 创建标签模态框 */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="创建新标签"
      >
        {isCreateModalOpen && (
          <form onSubmit={handleCreateTag}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  标签名称 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  value={newTag.name}
                  onChange={(e) => handleNameChange(e)}
                  required
                  className="mt-1 block w-full"
                />
              </div>
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                  Slug
                </label>
                <Input
                  id="slug"
                  value={newTag.slug}
                  onChange={(e) => setNewTag({ ...newTag, slug: e.target.value })}
                  className="mt-1 block w-full"
                />
                <p className="mt-1 text-xs text-gray-500">中文会自动转换为拼音，留空将根据标签名自动生成</p>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  描述
                </label>
                <textarea
                  id="description"
                  value={newTag.description}
                  onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isCreating ? '创建中...' : '创建'}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* 编辑标签模态框 */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="编辑标签"
      >
        {isEditModalOpen && editingTag && (
          <form onSubmit={handleUpdateTag}>
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                  标签名称 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="edit-name"
                  value={editingTag.name}
                  onChange={(e) => handleNameChange(e, false)}
                  required
                  className="mt-1 block w-full"
                />
              </div>
              <div>
                <label htmlFor="edit-slug" className="block text-sm font-medium text-gray-700">
                  Slug
                </label>
                <Input
                  id="edit-slug"
                  value={editingTag.slug}
                  onChange={(e) => setEditingTag({ ...editingTag, slug: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">中文会自动转换为拼音，留空将根据标签名自动生成</p>
              </div>
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                  描述
                </label>
                <textarea
                  id="edit-description"
                  value={editingTag.description || ''}
                  onChange={(e) => setEditingTag({ ...editingTag, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isEditing ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* 删除标签确认对话框 */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogOverlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <AlertDialogContent className="fixed left-[50%] top-[50%] z-50 max-w-md w-[95vw] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-xl">
          <AlertDialogHeader className="mb-4">
            <AlertDialogTitle className="text-xl font-semibold text-gray-900">确认删除</AlertDialogTitle>
            <AlertDialogDescription className="mt-2 text-sm text-gray-500">
              您确定要删除这个标签吗？这将同时移除所有文章上的这个标签，此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex justify-end space-x-3">
            <AlertDialogCancel
              disabled={isDeleting}
              className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTag}
              disabled={isDeleting}
              className="inline-flex h-9 items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isDeleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
