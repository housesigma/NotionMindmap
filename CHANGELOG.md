# Changelog

本文档记录了NotionMindmap项目的主要变更和待发布的功能。

## Unreleased (Pending Push)

以下任务已完成开发，等待推送至远程仓库：

### ✨ 新功能 Features

- **层级化路由结构**: 实现 `/`, `/problems`, `/problems/tree`, `/problems/matrix`, `/objectives` 路由架构
- **Matrix可视化增强**: 添加unique_id字段支持，实现P-前缀标识符显示
- **智能交互优化**: Matrix页面统计数据单行布局，unmappable项目改为右上角下拉交互
- **节点选择控制**: 新增NodeSelectionControls组件，提升用户交互体验
- **Minimap功能增强**: 支持拖拽、缩放和视觉改进

### 🔄 重构 Refactoring

- **页面文件重命名**:
  - `MindMapPage.tsx` → `Problems.tsx`
  - `RoadmapNewPage.tsx` → `Objectives.tsx`
  - `MatrixPage.tsx` → `Matrix.tsx`
- **组件架构优化**: 移除NotionConnection组件，简化应用结构
- **导航系统重构**: 更新路由检测逻辑和导航链接

### 🎨 UI/UX改进

- **Matrix统计布局**: 右上角统计改为水平单行显示，避免遮挡主视图
- **Popover交互**: unmappable项目点击统计数字触发下拉面板，提升空间利用率
- **视觉一致性**: 统一hover效果和点击反馈设计

### 📚 文档更新

- **已知问题记录**: 新增Known Issues章节，详细记录需解决的关键问题
  - 大量问题无法映射放入Matrix统计
  - 切换路由时数据获取失败问题
- **项目结构更新**: 更新文档反映当前文件组织和路由架构
- **API文档完善**: 补充unique_id字段说明和使用方式

### 🛠 技术改进

- **类型定义增强**: 添加unique_id字段到ProblemNode接口
- **数据提取优化**: 改进notionDirect.ts中的unique_id提取逻辑
- **状态管理**: 新增popover状态管理，优化交互体验
- **开发配置**: 更新.claude设置和依赖包配置

### 📋 待解决问题

1. **Matrix映射问题**: 大量问题缺少Impact/Effort值，影响战略分析效果
2. **路由切换问题**: 页面间导航时数据获取不稳定，需改进状态管理

---

## 提交信息 Commit Details

```
dc6703c - Update documentation with known issues and current project structure
0a1c6cc - Restructure routes and optimize Matrix visualization
0f35d03 - Enhance minimap with drag, zoom, and visual improvements
b39bf78 - Add node selection controls and update development configuration
```

**状态**: 4个commit待推送至origin/deploy-dev分支
**影响**: 1,822行新增代码，254行删除，10个文件修改