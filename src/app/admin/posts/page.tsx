'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  FileText, Plus, Search, Edit, Eye, Trash2,
  CheckCircle, XCircle, AlertTriangle, Clock, RefreshCw
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Pagination } from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function PostsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [showPinnedOnly, setShowPinnedOnly] = useState<boolean>(false);
  const [isPinning, setIsPinning] = useState(false);
  const pageSize = 10; // 减少每页显示数量，使表格更紧凑

  // 获取文章的所有分类
  const fetchPostCategories = async (postId: number) => {
    try {
      const response = await fetch(`/api/posts/${postId}/categories`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch post categories');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching categories for post ${postId}:`, error);
      return [];
    }
  };

  // 获取所有文章的分类
  const fetchAllPostsCategories = async (postsData: any[]) => {
    try {
      const postsWithCategories = await Promise.all(
        postsData.map(async (post) => {
          const categories = await fetchPostCategories(post.id);
          return {
            ...post,
            categories: categories.length > 0 ? categories : (post.category ? [post.category] : [])
          };
        })
      );
      
      return postsWithCategories;
    } catch (error) {
      console.error('Error fetching all posts categories:', error);
      return postsData;
    }
  };

  // 获取文章列表
  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      // 构建查询参数
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        sortBy,
        sortOrder,
        admin: '1', // 添加管理员标识
        _t: Date.now().toString() // 添加时间戳防止缓存
      });

      // 添加可选参数
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategoryId) params.append('categoryId', selectedCategoryId);
      if (selectedTagId) params.append('tagId', selectedTagId);
      if (showPinnedOnly) params.append('pinned', '1');

      const response = await fetch(`/api/posts?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const result = await response.json();
      console.log("API返回的文章数据:", JSON.stringify(result, null, 2));

      // 检查数据结构，兼容新旧API格式
      const postsData = result.posts || result.data || [];
      
      // 获取所有文章的完整分类信息
      const postsWithAllCategories = await fetchAllPostsCategories(postsData);
      
      // 处理文章数据，确保标题是字符串
      const processedPosts = postsWithAllCategories.map((post: any) => ({
        ...post,
        title: String(post.title).replace(/^0+/, '') // 移除标题前面的所有0
      }));

      console.log("处理后的文章数据:", JSON.stringify(processedPosts, null, 2));
      setPosts(processedPosts);
      setTotalPages(result.pagination.totalPages);
      setTotalCount(result.pagination.totalCount);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setIsLoading(false);
      toast({
        title: "加载失败",
        description: "无法加载文章列表，请稍后再试",
        variant: "destructive",
      });
    }
  };

  // 获取所有分类
  const fetchCategories = async () => {
    try {
      console.log('开始获取分类列表');
      const response = await fetch('/api/categories/list', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      console.log('获取到的分类数据:', data);
      
      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        console.error('分类数据格式不正确:', data);
        toast({
          title: "数据格式错误",
          description: "分类数据格式不正确",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "加载失败",
        description: "无法加载分类列表，请稍后再试",
        variant: "destructive",
      });
    }
  };

  // 获取所有标签
  const fetchTags = async () => {
    try {
      console.log('开始获取标签列表');
      const response = await fetch('/api/tags?pageSize=100', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }); // 获取前100个标签
      
      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }
      
      const result = await response.json();
      console.log('获取到的标签数据:', result);
      
      // 兼容新旧API格式
      const tagsData = result.tags || result.data || [];
      
      if (Array.isArray(tagsData)) {
        setTags(tagsData);
      } else {
        console.error('标签数据格式不正确:', result);
        toast({
          title: "数据格式错误",
          description: "标签数据格式不正确",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast({
        title: "加载失败",
        description: "无法加载标签列表，请稍后再试",
        variant: "destructive",
      });
    }
  };

  // 页面加载时获取分类和标签
  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);

  // 页面加载或搜索条件/页码/排序/筛选变化时获取数据
  useEffect(() => {
    fetchPosts();
  }, [currentPage, searchQuery, selectedCategoryId, selectedTagId, sortBy, sortOrder, showPinnedOnly]);

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // 重置到第一页
    fetchPosts();
  };

  // 处理分类筛选变化
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategoryId(e.target.value);
    setCurrentPage(1); // 重置到第一页
  };

  // 处理标签筛选变化
  const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTagId(e.target.value);
    setCurrentPage(1); // 重置到第一页
  };

  // 处理排序变化
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    // 解析排序字段和顺序
    const [field, order] = value.split('-');
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1); // 重置到第一页
  };

  // 处理置顶筛选变化
  const handlePinnedFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowPinnedOnly(e.target.checked);
    setCurrentPage(1); // 重置到第一页
  };

  // 格式化日期时间，显示到秒
  const formatDateTime = (dateString: string) => {
    if (!dateString) return '无日期';

    const date = new Date(dateString);

    // 格式化为 YYYY-MM-DD HH:MM:SS
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date).replace(/\//g, '-');
  };

  // 打开确认对话框
  const openConfirmDialog = (post: any) => {
    setSelectedPost(post);
    setConfirmDialogOpen(true);
  };

  // 处理发布状态切换
  const handlePublishToggle = async () => {
    if (!selectedPost) return;

    try {
      setIsPublishing(true);

      const newPublishedState = !selectedPost.published;

      const response = await fetch('/api/posts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedPost.id,
          published: newPublishedState
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update post');
      }

      // 更新本地状态
      setPosts(posts.map(post =>
        post.id === selectedPost.id
          ? { ...post, published: newPublishedState }
          : post
      ));

      // 显示成功消息
      toast({
        title: newPublishedState ? "文章已发布" : "文章已取消发布",
        description: `《${selectedPost.title}》${newPublishedState ? '已成功发布' : '已设为草稿'}`,
        variant: "default",
      });

      // 关闭对话框
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "操作失败",
        description: "无法更新文章状态，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // 处理置顶状态切换
  const handlePinToggle = async (post: any) => {
    try {
      setIsPinning(true);

      const newPinnedState = !post.pinned;

      const response = await fetch('/api/posts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: post.id,
          pinned: newPinnedState
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update post');
      }

      // 更新本地状态
      setPosts(posts.map(p =>
        p.id === post.id
          ? { ...p, pinned: newPinnedState }
          : p
      ));

      // 显示成功消息
      toast({
        title: newPinnedState ? "文章已置顶" : "文章已取消置顶",
        description: `《${post.title}》${newPinnedState ? '已成功置顶' : '已取消置顶'}`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating post pin status:', error);
      toast({
        title: "操作失败",
        description: "无法更新文章置顶状态，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setIsPinning(false);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-xl font-bold">文章管理</CardTitle>
            <CardDescription>管理您的博客文章，包括发布、编辑和删除操作</CardDescription>
          </div>
          <Link href="/admin/posts/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新建文章
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {/* 搜索和筛选区域 */}
          <div className="space-y-4 mb-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="搜索文章标题..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button type="submit" variant="secondary">
                <Search className="h-4 w-4 mr-2" />
                搜索
              </Button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 分类筛选 */}
              <div>
                <label htmlFor="category-filter" className="block text-sm font-medium mb-1">
                  按分类筛选
                </label>
                <select
                  id="category-filter"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedCategoryId}
                  onChange={handleCategoryChange}
                >
                  <option value="">所有分类</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 标签筛选 */}
              <div>
                <label htmlFor="tag-filter" className="block text-sm font-medium mb-1">
                  按标签筛选
                </label>
                <select
                  id="tag-filter"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedTagId}
                  onChange={handleTagChange}
                >
                  <option value="">所有标签</option>
                  {tags.map(tag => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 排序选项 */}
              <div>
                <label htmlFor="sort-option" className="block text-sm font-medium mb-1">
                  排序方式
                </label>
                <select
                  id="sort-option"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={`${sortBy}-${sortOrder}`}
                  onChange={handleSortChange}
                >
                  <option value="createdAt-desc">创建时间（最新）</option>
                  <option value="createdAt-asc">创建时间（最早）</option>
                  <option value="updatedAt-desc">更新时间（最新）</option>
                  <option value="updatedAt-asc">更新时间（最早）</option>
                  <option value="title-asc">标题（A-Z）</option>
                  <option value="title-desc">标题（Z-A）</option>
                  <option value="categoryName-asc">分类（A-Z）</option>
                  <option value="categoryName-desc">分类（Z-A）</option>
                </select>
              </div>

              {/* 置顶筛选 */}
              <div className="flex items-end">
                <div className="flex items-center space-x-2 mb-1">
                  <input
                    type="checkbox"
                    id="pinned-filter"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={showPinnedOnly}
                    onChange={handlePinnedFilterChange}
                  />
                  <label htmlFor="pinned-filter" className="text-sm font-medium">
                    只显示置顶文章
                  </label>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <span className="mt-2 text-sm text-muted-foreground">加载中...</span>
              </div>
            </div>
          ) : posts.length > 0 ? (
            <div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="[&>*:first-child]:pl-6">
                      <TableHead className="w-[300px]">标题</TableHead>
                      <TableHead>封面</TableHead>
                      <TableHead>分类</TableHead>
                      <TableHead>标签</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>更新时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id} className="[&>*:first-child]:pl-6">
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            {post.pinned === true ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="text-orange-500">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="17" x2="12" y2="22"></line>
                                        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
                                      </svg>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>置顶文章</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : null}
                            {/* 确保标题是字符串，并去除可能的前导0 */}
                            <span className="title-text">{String(post.title).replace(/^0+/, '')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {post.coverImage ? (
                            <div className="relative h-10 w-16 overflow-hidden rounded">
                              <img
                                src={post.coverImage.startsWith('/') ? post.coverImage : `/${post.coverImage}`}
                                alt={post.title}
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                  console.log('列表图片加载失败:', post.coverImage);
                                  // 尝试修复相对路径问题
                                  const target = e.target as HTMLImageElement;
                                  if (post.coverImage && !post.coverImage.startsWith('http') && !post.coverImage.startsWith('data:')) {
                                    // 如果是相对路径，尝试添加域名
                                    const fixedUrl = window.location.origin + (post.coverImage.startsWith('/') ? post.coverImage : `/${post.coverImage}`);
                                    console.log('尝试使用完整URL加载图片:', fixedUrl);
                                    target.src = fixedUrl;
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">无封面</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {post.categories && post.categories.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {post.categories.map((category: any) => (
                                <Badge key={category.id} variant="outline">
                                  {category.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">无分类</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {post.tags && post.tags.length > 0 ? (
                              post.tags.map((tag: any) => (
                                <Badge key={tag.id} variant="secondary" className="text-xs">
                                  {tag.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">无标签</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {post.published ? (
                            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                              已发布
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                              草稿
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="mr-1 h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(post.updatedAt)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            {/* 置顶/取消置顶按钮 */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handlePinToggle(post)}
                                    disabled={isPinning}
                                  >
                                    {post.pinned ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                                        <line x1="12" y1="17" x2="12" y2="22"></line>
                                        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
                                      </svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="17" x2="12" y2="22"></line>
                                        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
                                      </svg>
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{post.pinned ? '取消置顶' : '置顶文章'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {/* 发布/取消发布按钮 */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openConfirmDialog(post)}
                                  >
                                    {post.published ? (
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{post.published ? '取消发布' : '发布文章'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {/* 编辑按钮 */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link href={`/admin/posts/edit/${post.id}`}>
                                    <Button variant="ghost" size="icon">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>编辑文章</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {/* 预览按钮 */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link href={`/posts/${post.slug}`} target="_blank">
                                    <Button variant="ghost" size="icon">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>预览文章</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 分页组件 */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    显示 <span className="font-medium">{posts.length}</span> 条，共 <span className="font-medium">{totalCount}</span> 条
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">
                {searchQuery || selectedCategoryId || selectedTagId ? '没有找到匹配的文章' : '暂无文章'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategoryId || selectedTagId
                  ? '尝试使用不同的筛选条件'
                  : '开始创建您的第一篇博客文章'}
              </p>
              {!searchQuery && !selectedCategoryId && !selectedTagId && (
                <Link href="/admin/posts/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    新建文章
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 确认对话框 */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedPost?.published
                ? '确认取消发布文章？'
                : '确认发布文章？'}
            </DialogTitle>
            <DialogDescription>
              {selectedPost?.published
                ? '取消发布后，该文章将不再对访问者可见，变为草稿状态。'
                : '发布后，该文章将对所有访问者可见。确保内容已准备就绪。'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="flex items-center space-x-2 mb-1">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{selectedPost?.title}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedPost?.published
                ? '当前状态: 已发布'
                : '当前状态: 草稿'}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={isPublishing}
            >
              取消
            </Button>
            <Button
              variant={selectedPost?.published ? "destructive" : "default"}
              onClick={handlePublishToggle}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  处理中...
                </>
              ) : (
                selectedPost?.published ? '确认取消发布' : '确认发布'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
