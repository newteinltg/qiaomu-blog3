-- 清空现有菜单数据
DELETE FROM menus;

-- 插入顶级菜单
INSERT INTO menus (id, name, description, url, is_external, parent_id, sort_order, is_active, created_at)
VALUES 
(1, 'AI工具', 'AI工具分类', '/categories/ai-tools', 0, NULL, 1, 1, CURRENT_TIMESTAMP),
(2, '未分类', '未分类文章', '/categories/uncategorized', 0, NULL, 2, 1, CURRENT_TIMESTAMP),
(3, 'AI教程', 'AI教程分类', '/categories/ai-tutorials', 0, NULL, 3, 1, CURRENT_TIMESTAMP),
(4, '工具推荐', '工具推荐分类', '/categories/tool-recommendations', 0, NULL, 4, 1, CURRENT_TIMESTAMP),
(5, 'Prompt分享', 'Prompt分享分类', '/categories/prompt-sharing', 0, NULL, 5, 1, CURRENT_TIMESTAMP),
(6, '阅读思考', '阅读思考分类', '/categories/reading-thoughts', 0, NULL, 6, 1, CURRENT_TIMESTAMP),
(7, 'AI总结', 'AI总结分类', '/categories/ai-summaries', 0, NULL, 7, 1, CURRENT_TIMESTAMP);

-- 插入子菜单
INSERT INTO menus (id, name, description, url, is_external, parent_id, sort_order, is_active, created_at)
VALUES 
-- AI工具子菜单
(8, 'ChatGPT', 'ChatGPT相关', '/categories/ai-tools/chatgpt', 0, 1, 1, 1, CURRENT_TIMESTAMP),
(9, 'Claude', 'Claude相关', '/categories/ai-tools/claude', 0, 1, 2, 1, CURRENT_TIMESTAMP),
(10, 'Midjourney', 'Midjourney相关', '/categories/ai-tools/midjourney', 0, 1, 3, 1, CURRENT_TIMESTAMP),
(11, 'Stable Diffusion', 'Stable Diffusion相关', '/categories/ai-tools/stable-diffusion', 0, 1, 4, 1, CURRENT_TIMESTAMP),

-- AI教程子菜单
(12, '入门教程', '入门级AI教程', '/categories/ai-tutorials/beginner', 0, 3, 1, 1, CURRENT_TIMESTAMP),
(13, '进阶教程', '进阶级AI教程', '/categories/ai-tutorials/advanced', 0, 3, 2, 1, CURRENT_TIMESTAMP),

-- Prompt分享子菜单
(14, '文本提示词', '文本类提示词', '/categories/prompt-sharing/text', 0, 5, 1, 1, CURRENT_TIMESTAMP),
(15, '图像提示词', '图像类提示词', '/categories/prompt-sharing/image', 0, 5, 2, 1, CURRENT_TIMESTAMP);
