const baseTemplates = [
  ["onyx", "Onyx", "professional", "经典页首搭配清晰的双栏布局。", "#111827"],
  ["azurill", "Azurill", "modern", "个人信息居中，工作经历以时间线呈现。", "#2563eb"],
  ["bronzor", "Bronzor", "professional", "分栏清楚，点缀色低调。", "#92400e"],
  ["chikorita", "Chikorita", "creative", "醒目的侧栏，适合展示个人风格。", "#15803d"],
  ["ditgar", "Ditgar", "modern", "醒目的标题与均衡的留白。", "#7c3aed"],
  ["ditto", "Ditto", "simple", "经典单栏，便于顺序阅读。", "#374151"],
  ["gengar", "Gengar", "creative", "配色鲜明，层次清楚。", "#7c3aed"],
  ["glalie", "Glalie", "modern", "字体排版简洁，带有杂志风格。", "#0369a1"],
  ["kakuna", "Kakuna", "professional", "个人信息醒目，章节组织利落。", "#b45309"],
  ["lapras", "Lapras", "modern", "留白充裕，整体简洁专业。", "#0e7490"],
  ["leafish", "Leafish", "creative", "清爽的版式搭配鲜明的强调色。", "#047857"],
  ["meowth", "Meowth", "simple", "细节简约，突出工作经历。", "#475569"],
  ["pikachu", "Pikachu", "professional", "页首醒目，章节划分清晰。", "#a16207"],
  ["rhyhorn", "Rhyhorn", "simple", "版式克制，便于快速浏览。", "#334155"],
  ["scizor", "Scizor", "creative", "结构鲜明的现代双栏版式。", "#be123c"],
].map(([id, name, category, description, color]) => ({
  id,
  name,
  category,
  description,
  color,
  language: "en-US" as const,
  previewId: id,
}));

export const reactiveTemplates = [
  ...baseTemplates,
  ...baseTemplates.map((template) => ({
    ...template,
    id: `${template.id}-zh`,
    name: `${template.name}（中文版）`,
    description: `${template.description} 中文示例内容`,
    language: "zh-CN" as const,
  })),
];
