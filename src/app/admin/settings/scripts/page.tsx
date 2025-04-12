'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 脚本类型定义
type Script = {
  id: number;
  name: string;
  description: string | null;
  code: string;
  type: string;
  isActive: number;
  position: string;
  pages: string | null;
  order: number;
  createdAt: string;
  updatedAt: string | null;
};

// 新脚本表单状态
type ScriptForm = {
  name: string;
  description: string;
  code: string;
  type: string;
  isActive: boolean;
  position: string;
  pages: string;
  order: number;
};

export default function ScriptsSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);

  // 新脚本表单状态
  const [scriptForm, setScriptForm] = useState<ScriptForm>({
    name: '',
    description: '',
    code: '',
    type: 'analytics',
    isActive: true,
    position: 'head',
    pages: '',
    order: 0,
  });

  // 获取所有脚本
  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const response = await fetch('/api/settings/scripts');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setScripts(data.data.scripts);
          }
        }
      } catch (error) {
        console.error('获取脚本失败:', error);
        toast({
          variant: "destructive",
          title: "错误",
          description: "获取脚本失败"
        });
      }
    };

    fetchScripts();
  }, [toast]);

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setScriptForm({
      ...scriptForm,
      [name]: value,
    });
  };

  // 处理选择框变化
  const handleSelectChange = (name: string, value: string) => {
    setScriptForm({
      ...scriptForm,
      [name]: value,
    });
  };

  // 处理开关变化
  const handleSwitchChange = (checked: boolean) => {
    setScriptForm({
      ...scriptForm,
      isActive: checked,
    });
  };

  // 重置表单
  const resetForm = () => {
    setScriptForm({
      name: '',
      description: '',
      code: '',
      type: 'analytics',
      isActive: true,
      position: 'head',
      pages: '',
      order: 0,
    });
    setEditingScript(null);
  };

  // 打开编辑对话框
  const openEditDialog = (script: Script) => {
    setEditingScript(script);
    setScriptForm({
      name: script.name,
      description: script.description || '',
      code: script.code,
      type: script.type,
      isActive: script.isActive === 1,
      position: script.position,
      pages: script.pages || '',
      order: script.order,
    });
    setIsDialogOpen(true);
  };

  // 保存脚本
  const saveScript = async () => {
    setLoading(true);
    try {
      const payload = {
        name: scriptForm.name,
        description: scriptForm.description || null,
        code: scriptForm.code,
        type: scriptForm.type,
        isActive: scriptForm.isActive ? 1 : 0,
        position: scriptForm.position,
        pages: scriptForm.pages || null,
        order: scriptForm.order,
      };

      let response;
      if (editingScript) {
        // 更新现有脚本
        response = await fetch(`/api/settings/scripts/${editingScript.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else {
        // 创建新脚本
        response = await fetch('/api/settings/scripts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        toast({
          title: "成功",
          description: editingScript ? "脚本更新成功" : "脚本创建成功"
        });

        // 重新获取脚本列表
        const scriptsResponse = await fetch('/api/settings/scripts');
        if (scriptsResponse.ok) {
          const data = await scriptsResponse.json();
          if (data.success) {
            setScripts(data.data.scripts);
          }
        }

        // 关闭对话框并重置表单
        setIsDialogOpen(false);
        resetForm();
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      console.error('保存脚本失败:', error);
      toast({
        variant: "destructive",
        title: "错误",
        description: "保存脚本失败"
      });
    } finally {
      setLoading(false);
    }
  };

  // 删除脚本
  const deleteScript = async (id: number) => {
    if (!confirm('确定要删除这个脚本吗？此操作不可撤销。')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/settings/scripts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "成功",
          description: "脚本删除成功"
        });

        // 从列表中移除已删除的脚本
        setScripts(scripts.filter(script => script.id !== id));
      } else {
        throw new Error('删除失败');
      }
    } catch (error) {
      console.error('删除脚本失败:', error);
      toast({
        variant: "destructive",
        title: "错误",
        description: "删除脚本失败"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">网站脚本管理</h1>

      <div className="mb-8 flex flex-wrap gap-4">
        <a
          href="/admin/settings/general"
          className="px-4 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
        >
          基本设置
        </a>
        <a
          href="/admin/settings"
          className="px-4 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
        >
          联系与打赏
        </a>
        <a
          href="/admin/settings/scripts"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          脚本管理
        </a>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">网站脚本列表</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>添加新脚本</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingScript ? '编辑脚本' : '添加新脚本'}</DialogTitle>
                <DialogDescription>
                  {editingScript
                    ? '修改现有脚本的设置和代码。'
                    : '添加新的脚本到网站。这些脚本将根据设置插入到网站的HTML中。'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    名称
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={scriptForm.name}
                    onChange={handleInputChange}
                    className="col-span-3"
                    placeholder="例如：Google Analytics"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    描述
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={scriptForm.description}
                    onChange={handleInputChange}
                    className="col-span-3"
                    placeholder="简短描述这个脚本的用途"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    类型
                  </Label>
                  <Select
                    value={scriptForm.type}
                    onValueChange={(value) => handleSelectChange('type', value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="选择脚本类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="analytics">流量统计</SelectItem>
                      <SelectItem value="ads">广告</SelectItem>
                      <SelectItem value="custom">自定义</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="position" className="text-right">
                    位置
                  </Label>
                  <Select
                    value={scriptForm.position}
                    onValueChange={(value) => handleSelectChange('position', value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="选择插入位置" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="head">头部 (head)</SelectItem>
                      <SelectItem value="body_start">正文开始 (body开始标签后)</SelectItem>
                      <SelectItem value="body_end">正文结束 (body结束标签前)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pages" className="text-right">
                    页面
                  </Label>
                  <Textarea
                    id="pages"
                    name="pages"
                    value={scriptForm.pages}
                    onChange={handleInputChange}
                    className="col-span-3"
                    placeholder='["/*"]表示所有页面，或["/"，"/posts/*"]特定页面'
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="order" className="text-right">
                    排序
                  </Label>
                  <Input
                    id="order"
                    name="order"
                    type="number"
                    value={scriptForm.order.toString()}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isActive" className="text-right">
                    启用
                  </Label>
                  <div className="flex items-center space-x-2 col-span-3">
                    <Switch
                      id="isActive"
                      checked={scriptForm.isActive}
                      onCheckedChange={handleSwitchChange}
                    />
                    <Label htmlFor="isActive">
                      {scriptForm.isActive ? '已启用' : '已禁用'}
                    </Label>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <Label htmlFor="code" className="text-right">
                    代码
                  </Label>
                  <Textarea
                    id="code"
                    name="code"
                    value={scriptForm.code}
                    onChange={handleInputChange}
                    className="col-span-3 h-40 font-mono text-sm"
                    placeholder='<script>...</script> 或 <link>...'
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={saveScript} disabled={loading}>
                  {loading ? '保存中...' : '保存'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="analytics">流量统计</TabsTrigger>
            <TabsTrigger value="ads">广告</TabsTrigger>
            <TabsTrigger value="custom">自定义</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scripts.length > 0 ? (
                scripts.map((script) => (
                  <Card key={script.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{script.name}</CardTitle>
                          <CardDescription>{script.description}</CardDescription>
                        </div>
                        <div className={`px-2 py-1 text-xs rounded-full ${
                          script.isActive === 1
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {script.isActive === 1 ? '已启用' : '已禁用'}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-2">
                        <span className="text-sm font-medium">类型：</span>
                        <span className="text-sm">
                          {script.type === 'analytics' ? '流量统计' :
                           script.type === 'ads' ? '广告' : '自定义'}
                        </span>
                      </div>
                      <div className="mb-2">
                        <span className="text-sm font-medium">位置：</span>
                        <span className="text-sm">
                          {script.position === 'head' ? '头部' :
                           script.position === 'body_start' ? '正文开始' : '正文结束'}
                        </span>
                      </div>
                      <div className="mb-2">
                        <span className="text-sm font-medium">代码：</span>
                        <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto">
                          {script.code.length > 100
                            ? `${script.code.substring(0, 100)}...`
                            : script.code}
                        </pre>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(script)}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteScript(script.id)}
                      >
                        删除
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  暂无脚本，点击"添加新脚本"按钮创建
                </div>
              )}
            </div>
          </TabsContent>

          {['analytics', 'ads', 'custom'].map((type) => (
            <TabsContent key={type} value={type}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scripts.filter(script => script.type === type).length > 0 ? (
                  scripts
                    .filter(script => script.type === type)
                    .map((script) => (
                      <Card key={script.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>{script.name}</CardTitle>
                              <CardDescription>{script.description}</CardDescription>
                            </div>
                            <div className={`px-2 py-1 text-xs rounded-full ${
                              script.isActive === 1
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {script.isActive === 1 ? '已启用' : '已禁用'}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-2">
                            <span className="text-sm font-medium">位置：</span>
                            <span className="text-sm">
                              {script.position === 'head' ? '头部' :
                               script.position === 'body_start' ? '正文开始' : '正文结束'}
                            </span>
                          </div>
                          <div className="mb-2">
                            <span className="text-sm font-medium">代码：</span>
                            <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto">
                              {script.code.length > 100
                                ? `${script.code.substring(0, 100)}...`
                                : script.code}
                            </pre>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(script)}
                          >
                            编辑
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteScript(script.id)}
                          >
                            删除
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    暂无{
                      type === 'analytics' ? '流量统计' :
                      type === 'ads' ? '广告' : '自定义'
                    }脚本
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">使用说明</h2>
        <div className="prose dark:prose-invert max-w-none">
          <p>在这里管理网站的脚本代码，如Google Analytics、广告代码等。</p>
          <h3>脚本类型</h3>
          <ul>
            <li><strong>流量统计</strong>：如Google Analytics、百度统计、Umami等流量分析工具的代码</li>
            <li><strong>广告</strong>：如Google AdSense、百度联盟等广告代码</li>
            <li><strong>自定义</strong>：其他需要插入网站的自定义代码</li>
          </ul>
          <h3>插入位置</h3>
          <ul>
            <li><strong>头部 (head)</strong>：插入到HTML的&lt;head&gt;标签内，适合大多数分析和跟踪代码</li>
            <li><strong>正文开始 (body_start)</strong>：插入到&lt;body&gt;标签后，页面内容前</li>
            <li><strong>正文结束 (body_end)</strong>：插入到&lt;/body&gt;标签前，页面内容后</li>
          </ul>
          <h3>页面设置</h3>
          <p>可以指定脚本在哪些页面上生效。使用JSON数组格式，例如：</p>
          <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded">["/*"]</pre>
          <p>表示在所有页面上生效。或者：</p>
          <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded">["/", "/posts/*"]</pre>
          <p>表示只在首页和文章页面上生效。留空表示在所有页面上生效。</p>
          <h3>示例</h3>
          <p>Umami流量统计代码：</p>
          <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded">&lt;script defer src="https://cloud.umami.is/script.js" data-website-id="b1135309-3118-4fac-bcbe-868247a90834"&gt;&lt;/script&gt;</pre>
        </div>
      </div>
    </div>
  );
}
