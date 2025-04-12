'use client';
import { notFound } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { generateSlug } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import TagifyInput from '@/components/TagifyInput';
import ImageUploader from '@/components/ImageUploader';
import IsolatedMarkdownEditor from '@/components/IsolatedMarkdownEditor';
import * as React from 'react';

export default function EditPostPage() {
  // 使用 useParams 钩子获取参数
  const params = useParams();
  const postId = params.id as string;

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [pageType, setPageType] = useState('markdown'); // 添加页面类型状态
  const [tags, setTags] = useState('');
  const [tagsList, setTagsList] = useState<Array<{ id: number; name: string }>>([]);
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string; slug: string }>>([]);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [autoUpdateSlug, setAutoUpdateSlug] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const localStorageKey = `post_draft_${postId}`;

  // 获取所有标签
  const fetchAllTags = async () => {
    try {
      setIsLoadingTags(true);
      const response = await fetch('/api/tags');

      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }

      const result = await response.json();
      const tagsData = result.data || [];
      setTagsList(tagsData);
    } catch (err) {
      console.error('Error fetching tags:', err);
    } finally {
      setIsLoadingTags(false);
    }
  };

  // 获取所有分类
  const fetchAllCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await fetch('/api/categories');

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // 获取文章标签
  const fetchPostTags = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/tags`);

      if (!response.ok) {
        throw new Error('Failed to fetch post tags');
      }

      const tagsData = await response.json();
      // 确保返回的是格式化后的JSON字符串，适用于TagifyInput组件
      if (Array.isArray(tagsData)) {
        const formattedTags = tagsData.map((tag: any) => ({
          value: tag.name,
          id: tag.id
        }));
        return JSON.stringify(formattedTags);
      }
      return '';
    } catch (err) {
      console.error('Error fetching post tags:', err);
      return '';
    }
  };

  // 获取文章数据
  const fetchPost = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/posts/${postId}`);

      if (!response.ok) {
        if (response.status === 404) {
          return notFound();
        }
        throw new Error('Failed to fetch post');
      }

      const post = await response.json();
      console.log('Fetched post data:', post);

      setTitle(post.title || '');
      setSlug(post.slug || '');
      setContent(post.content || '');
      setCoverImage(post.coverImage || '');
      setPublished(post.published === 1);
      setPageType(post.pageType || 'markdown'); // 设置页面类型

      // 获取文章分类
      try {
        // 首先获取主分类
        const mainCategoryId = post.categoryId;

        // 获取文章的所有分类
        const postCategoriesResponse = await fetch(`/api/posts/${postId}/categories`);
        if (postCategoriesResponse.ok) {
          const postCategories = await postCategoriesResponse.json();
          console.log('Fetched post categories:', postCategories);

          // 如果有分类数据，使用它
          if (Array.isArray(postCategories) && postCategories.length > 0) {
            const categoryIdsList = postCategories.map(cat => cat.id);
            setCategoryIds(categoryIdsList);
          } else if (mainCategoryId) {
            // 如果没有分类关联数据，但有主分类，使用主分类
            setCategoryIds([mainCategoryId]);
          } else {
            // 如果没有分类数据，设置为空数组
            setCategoryIds([]);
          }
        } else {
          // 如果获取分类失败，但有主分类，使用主分类
          if (mainCategoryId) {
            setCategoryIds([mainCategoryId]);
          } else {
            setCategoryIds([]);
          }
        }
      } catch (err) {
        console.error('Error fetching post categories:', err);
        // 如果有主分类，使用主分类
        if (post.categoryId) {
          setCategoryIds([post.categoryId]);
        } else {
          setCategoryIds([]);
        }
      }

      // 获取文章标签
      try {
        const tagsString = await fetchPostTags(postId);
        setTags(tagsString);
      } catch (err) {
        console.error('获取文章标签失败:', err);
      }

      console.log('文章数据加载成功:', {
        title: post.title,
        slug: post.slug,
        categoryId: post.categoryId,
        coverImage: post.coverImage,
        content: post.content ? post.content.substring(0, 50) + '...' : 'empty'
      });

    } catch (err) {
      console.error('获取文章失败:', err);
      setError('获取文章失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 先获取分类和标签，然后获取文章
  const loadData = async () => {
    try {
      await Promise.all([
        fetchAllCategories(),
        fetchAllTags()
      ]);
      await fetchPost();
    } catch (err) {
      console.error('加载数据失败:', err);
    }
  };

  // 初始化数据
  useEffect(() => {
    loadData();
  }, [postId]);

  // Generate slug from title automatically when title changes and autoUpdateSlug is enabled
  useEffect(() => {
    if (title && autoUpdateSlug) {
      setSlug(generateSlug(title));
    }
  }, [title, autoUpdateSlug]);

  // 自动保存功能 - 简化版本，不显示保存时间
  useEffect(() => {
    if (!title && !content) return; // 避免初始化时保存空内容

    // 创建自动保存定时器
    const autoSaveInterval = setInterval(() => {
      // 只有当内容有变化时才保存
      if (title || content || coverImage || tags || categoryIds.length > 0) {
        const draftData = {
          title,
          content,
          coverImage,
          tags,
          categoryIds,
          timestamp: new Date().toISOString()
        };

        localStorage.setItem(localStorageKey, JSON.stringify(draftData));
        // 不再更新lastSaved状态，后台静默保存
      }
    }, 30000); // 每30秒自动保存一次

    return () => {
      clearInterval(autoSaveInterval);
    };
  }, [title, content, coverImage, tags, categoryIds, localStorageKey]);

  // 手动保存草稿
  const saveDraft = () => {
    const draftData = {
      title,
      content,
      coverImage,
      tags,
      categoryIds,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem(localStorageKey, JSON.stringify(draftData));

    toast({
      title: "草稿已保存",
      description: "文章草稿已保存到本地",
      duration: 2000, // 2秒后自动消失
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      // 确保 slug 不为空且格式正确
      if (!slug) {
        throw new Error('URL别名不能为空');
      }

      // 确保分类已选择
      if (!categoryIds || categoryIds.length === 0) {
        throw new Error('请选择至少一个文章分类');
      }

      console.log('Submitting with data:', {
        title,
        slug,
        contentLength: content?.length || 0,
        categoryIds,
        published: true
      });

      // 更新文章
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          slug,
          content,
          categoryIds,
          coverImage,
          published,
          pageType // 添加页面类型字段
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        console.error('API Error Text:', responseText);

        let errorMessage = '更新文章失败';
        try {
          const responseData = JSON.parse(responseText);
          errorMessage = responseData.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing API response:', parseError);
        }

        throw new Error(errorMessage);
      }

      const responseData = await response.text();
      let jsonData = { success: true };

      if (responseData) {
        try {
          jsonData = JSON.parse(responseData);
        } catch (parseError) {
          console.warn('Warning: Could not parse response as JSON:', responseData);
        }
      }

      // 处理标签
      if (tags) {
        let parsedTags;
        try {
          // 检查tags是否已经是对象（可能已经被解析过）
          if (typeof tags === 'string') {
            parsedTags = JSON.parse(tags);
          } else {
            parsedTags = tags;
          }

          // 确保标签数据格式正确
          if (Array.isArray(parsedTags)) {
            console.log('Updating tags:', parsedTags);
            const tagsResponse = await fetch(`/api/posts/${postId}/tags`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ tags: parsedTags }),
            });

            if (!tagsResponse.ok) {
              const tagsErrorText = await tagsResponse.text();
              console.error('Tags API Error Text:', tagsErrorText);

              let tagsErrorMessage = '更新标签失败';
              if (tagsErrorText) {
                try {
                  const tagsError = JSON.parse(tagsErrorText);
                  tagsErrorMessage = tagsError.error || tagsErrorMessage;
                } catch (e) {
                  console.error('Failed to parse tags error response:', tagsErrorText);
                }
              }

              console.warn('Warning: Failed to update tags:', tagsErrorMessage);
              // 不抛出错误，允许文章保存成功即使标签更新失败
            }
          } else {
            console.warn('标签数据格式不正确:', parsedTags);
          }
        } catch (e) {
          console.error('处理标签数据时出错:', e, '原始标签值:', tags);
          // 不抛出错误，允许文章保存成功即使标签处理失败
        }
      }

      toast({
        title: "更新成功",
        description: "文章已成功更新",
        duration: 2000,
      });

      router.push('/admin/posts');
    } catch (err: any) {
      setError(err.message || '更新文章失败');
      console.error('Error submitting form:', err);

      toast({
        title: "更新失败",
        description: err.message || "无法更新文章，请稍后再试",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">编辑文章</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={saveDraft}
            disabled={isSaving}
          >
            {isSaving ? '保存中...' : '保存草稿'}
          </Button>
          <Button
            type="submit"
            form="post-form"
            disabled={isSaving}
          >
            {isSaving ? '提交中...' : '提交更新'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        {error && <p className="text-red-500 mb-4 p-3 bg-red-50 rounded">{error}</p>}

        <form onSubmit={handleSubmit} id="post-form" className="space-y-6">
          {/* 标题区域 - 突出显示 */}
          <div className="mb-6">
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-3 text-2xl border-0 border-b focus:ring-0 focus:border-blue-500 font-medium"
              placeholder="文章标题"
              required
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 主要内容区域 - 占据更多空间 */}
            <div className="lg:col-span-3 space-y-6">
              {/* 根据页面类型显示不同的编辑器 */}
              {pageType === 'markdown' ? (
                <div>

                  <IsolatedMarkdownEditor
                    value={content}
                    onChange={setContent}
                    height={650}
                  />
                </div>
              ) : (
                <div>

                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-[600px] px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    placeholder="输入HTML代码..."
                  />
                </div>
              )}
            </div>

            {/* 侧边栏 - 压缩其他元素 */}
            <div className="lg:col-span-1 space-y-6">
              <div className="border rounded-md p-4 bg-white shadow-sm">
                <h3 className="font-medium text-gray-700 mb-3">发布设置</h3>

                {/* 页面类型 */}
                <div className="mb-4">
                  <Label className="block text-sm text-gray-600 mb-1">页面类型</Label>
                  <ToggleGroup
                    type="single"
                    value={pageType}
                    onValueChange={(value) => value && setPageType(value)}
                    className="w-full border rounded-md overflow-hidden"
                    variant="outline"
                  >
                    <ToggleGroupItem value="markdown" className="flex-1 text-center">
                      Markdown
                    </ToggleGroupItem>
                    <ToggleGroupItem value="html" className="flex-1 text-center">
                      HTML
                    </ToggleGroupItem>
                  </ToggleGroup>
                  
                </div>

                {/* URL别名 */}
                <div className="mb-4">
                  <Label className="block text-sm text-gray-600 mb-1">URL 别名</Label>
                  <Input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setAutoUpdateSlug(false);
                    }}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  <div className="mt-1 flex items-center">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="auto-update-slug"
                        checked={autoUpdateSlug}
                        onCheckedChange={(checked) => setAutoUpdateSlug(checked === true)}
                      />
                      <Label htmlFor="auto-update-slug" className="text-xs text-gray-500">
                        根据标题生成
                      </Label>
                    </div>
                  </div>
                </div>

                {/* 分类 - 多选 */}
                <div className="mb-4">
                  <Label className="block text-sm text-gray-600 mb-1">分类（可多选）</Label>
                  <div className="border rounded-md p-2 max-h-20 overflow-y-auto">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={categoryIds.includes(category.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setCategoryIds([...categoryIds, category.id]);
                            } else {
                              setCategoryIds(categoryIds.filter(id => id !== category.id));
                            }
                          }}
                        />
                        <Label htmlFor={`category-${category.id}`} className="text-sm cursor-pointer">
                          {category.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {categoryIds.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">请选择至少一个分类</p>
                  )}
                </div>

                {/* 标签 */}
                <div className="mb-4">
                  <Label className="block text-sm text-gray-600 mb-1">标签</Label>
                  <TagifyInput
                    value={tags}
                    onChange={setTags}
                    whitelist={tagsList}
                    loading={isLoadingTags}
                    placeholder="输入标签..."
                    className="w-full text-sm"
                  />
                  
                </div>

                {/* 封面图片 */}
                <div className="mb-4">
                  <ImageUploader
                    value={coverImage}
                    onChange={setCoverImage}
                    label="封面图片"
                    placeholder="选择或拖放封面图片到此处"
                  />
                </div>

                {/* 发布状态 */}
                <div className="mb-4">
                  <div className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id="published-status"
                      checked={published}
                      onCheckedChange={(checked) => setPublished(checked === true)}
                    />
                    <Label htmlFor="published-status" className="text-sm cursor-pointer">
                      发布文章
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    未勾保存为草稿，不会前台显示
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
