import type { ResumeData } from "../vendor/reactive-resume/schema/resume/data";

/**
 * Localizes the bundled demonstration resume while preserving its structure,
 * links, section IDs, and quantitative achievements.
 */
export function translateSampleResumeToChinese(data: ResumeData): void {
  data.metadata.template = "onyx-zh";
  data.metadata.page.locale = "zh-CN";

  data.basics.name = "戴维·科瓦尔斯基";
  data.basics.headline = "游戏开发工程师｜Unity 与 Unreal Engine 专家";
  data.basics.location = "美国·西雅图";
  data.basics.website.label = "个人作品集";
  data.basics.customFields[0]!.text = "GitHub 作品集";
  data.basics.customFields[1]!.text = "itch.io 游戏作品";

  data.summary.content =
    "<p><strong>拥有 5 年以上专业经验的游戏开发工程师</strong>，专注于打造富有吸引力的玩法系统和跨平台游戏体验。熟练使用 Unity、Unreal Engine，精通 C#、C++ 及游戏设计原则。善于与策划、美术和质量保障等跨职能团队协作，按计划交付高质量游戏产品。</p>";

  const experience = data.sections.experience.items[0];
  if (experience) {
    experience.position = "高级游戏开发工程师";
    experience.location = "美国·西雅图";
    experience.period = "2022年3月—至今";
    experience.description = [
      "<ul>",
      "<li><p>负责一款尚未公布的 AAA 动作冒险游戏的核心玩法程序开发，项目基于 Unreal Engine 5，面向 PC 与新一代主机平台。</p></li>",
      "<li><p>设计并实现核心战斗系统，包括命中检测、连招机制和敌人行为树，支持 15 种以上敌人类型。</p></li>",
      "<li><p>使用 C++ 开发自定义编辑器工具，将关卡设计师的迭代时间缩短 40%，提升团队工作效率。</p></li>",
      "<li><p>优化渲染管线与玩法系统，使所有支持平台达到 60 FPS 目标帧率，帧率稳定性达到 95%。</p></li>",
      "<li><p>与策划、美术和 QA 团队紧密协作，持续改进玩法体验并保障交付质量。</p></li>",
      "</ul>",
    ].join("");
  }

  const education = data.sections.education.items[0];
  if (education) {
    education.school = "华盛顿大学";
    education.degree = "理学学士";
    education.area = "计算机科学";
    education.grade = "GPA 3.6";
    education.location = "美国·西雅图";
    education.period = "2014年—2018年";
    education.description =
      "<p>主修游戏开发。相关课程：游戏引擎架构、计算机图形学、人工智能、物理仿真、三维数学、软件工程、数据结构与算法。</p>";
  }

  const projects = data.sections.projects.items;
  if (projects[0]) {
    projects[0].name = "《虚空回响》（独立游戏）";
    projects[0].period = "2023年—至今";
    projects[0].website.label = "在 itch.io 查看";
    projects[0].description =
      "<p>独立开发者，使用 Unity 制作叙事驱动的 2D 平台游戏。项目包含自定义对话系统、分支剧情和氛围像素美术。试玩版已在 itch.io 发布，下载量超过 5,000 次，并获得玩家积极反馈。计划于 2025 年第二季度在 Steam 发布。</p>";
  }
  if (projects[1]) {
    projects[1].name = "开源项目：Unity 对话框架";
    projects[1].period = "2021年—2023年";
    projects[1].website.label = "在 GitHub 查看";
    projects[1].description =
      "<p>创建并维护面向 Unity 的开源对话系统，包含可视化节点编辑器、本地化支持和配音集成功能。项目获得 800+ GitHub Stars，并被全球独立开发者使用，同时提供完整文档和示例项目。</p>";
  }
  if (projects[2]) {
    projects[2].name = "Game Jam 参赛经历";
    projects[2].period = "2019年—至今";
    projects[2].description =
      "<p>定期参加 Ludum Dare 和 Global Game Jam，制作了 12 个以上探索实验机制与美术风格的游戏原型。在 Ludum Dare 48 的解谜游戏《越陷越深》中获得“最佳玩法”奖，综合排名进入前 5%。</p>";
  }

  const skills = data.sections.skills.items;
  const skillTranslations = [
    { name: "Unity 引擎", proficiency: "精通", keywords: ["C#", "编辑器工具", "性能分析"] },
    { name: "Unreal Engine", proficiency: "熟练", keywords: ["C++", "蓝图", "UE5 新特性"] },
    { name: "编程语言", proficiency: "精通", keywords: ["C#", "C++", "Python", "HLSL/GLSL"] },
    { name: "游戏人工智能", proficiency: "熟练", keywords: ["行为树", "有限状态机（FSM）", "寻路", "导航"] },
    { name: "物理与数学", proficiency: "熟练", keywords: ["三维数学", "碰撞检测", "刚体动力学"] },
    { name: "性能优化", proficiency: "熟练", keywords: ["性能分析", "内存管理", "帧率优化"] },
  ];
  skills.forEach((skill, index) => {
    const translation = skillTranslations[index];
    if (!translation) return;
    skill.name = translation.name;
    skill.proficiency = translation.proficiency;
    skill.keywords = translation.keywords;
  });

  const languages = data.sections.languages.items;
  if (languages[0]) {
    languages[0].language = "英语";
    languages[0].fluency = "母语";
  }
  if (languages[1]) {
    languages[1].language = "波兰语";
    languages[1].fluency = "日常交流";
  }

  const interests = data.sections.interests.items;
  const interestTranslations = [
    { name: "游戏设计", keywords: ["玩法机制", "关卡设计", "玩家心理"] },
    { name: "人工智能与程序化生成", keywords: ["程序化内容生成（PCG）", "机器学习", "涌现式玩法"] },
    { name: "独立游戏开发", keywords: ["独立开发", "Game Jam", "开发者社区"] },
    { name: "技术美术", keywords: ["着色器", "视觉特效", "性能优化"] },
  ];
  interests.forEach((interest, index) => {
    const translation = interestTranslations[index];
    if (!translation) return;
    interest.name = translation.name;
    interest.keywords = translation.keywords;
  });

  const awards = data.sections.awards.items;
  if (awards[0]) {
    awards[0].title = "Ludum Dare 48 最佳玩法奖";
    awards[0].date = "2021年4月";
    awards[0].description =
      "<p>凭借解谜游戏《越陷越深》获奖，该作品在 3,000 多份参赛作品中排名前 5%。</p>";
  }
  if (awards[1]) {
    awards[1].title = "优秀员工奖";
    awards[1].date = "2021年12月";
    awards[1].description =
      "<p>表彰在《星际奥德赛》开发过程中作出的突出贡献，以及对代码质量的持续投入。</p>";
  }

  const certifications = data.sections.certifications.items;
  if (certifications[0]) {
    certifications[0].title = "Unity 认证专家：程序员";
    certifications[0].date = "2022年3月";
  }
  if (certifications[1]) {
    certifications[1].title = "Unreal Engine 5 C++ 开发者认证";
    certifications[1].issuer = "Epic Games（Udemy）";
    certifications[1].date = "2023年6月";
  }

  const publications = data.sections.publications.items;
  if (publications[0]) {
    publications[0].title = "《Unity 移动游戏优化实战指南》";
    publications[0].publisher = "《Game Developer》杂志";
    publications[0].date = "2021年9月";
    publications[0].description =
      "<p>介绍移动端优化技术，包括 Draw Call 合批、LOD 系统和内存管理。</p>";
  }
  if (publications[1]) {
    publications[1].title = "《构建模块化对话系统》";
    publications[1].publisher = "西雅图独立游戏开发者聚会";
    publications[1].date = "2022年5月";
    publications[1].description =
      "<p>分享如何为叙事类游戏设计灵活的对话系统，现场有 60 多位开发者参与。</p>";
  }

  const volunteers = data.sections.volunteer.items;
  if (volunteers[0]) {
    volunteers[0].organization = "Seattle Indies 独立游戏社区";
    volunteers[0].location = "美国·西雅图";
    volunteers[0].period = "2020年—至今";
    volunteers[0].description =
      "<p>积极参与当地独立游戏开发者社区，组织每月游戏展示活动，并通过代码评审和技术指导帮助有志于游戏开发的新人。</p>";
  }
  if (volunteers[1]) {
    volunteers[1].organization = "Code.org 游戏开发工作坊";
    volunteers[1].location = "美国·西雅图";
    volunteers[1].period = "2021年—至今";
    volunteers[1].description =
      "<p>担任志愿讲师，向中学生介绍基础游戏编程概念。已开展 8 场以上工作坊，讲解 Unity 基础和游戏设计原则。</p>";
  }

  const reference = data.sections.references.items[0];
  if (reference) reference.name = "可按需提供";

  const additionalExperience = data.customSections.find((section) => section.type === "experience");
  if (additionalExperience) {
    additionalExperience.title = "工作经历（续）";
    const roles = additionalExperience.items;
    if (roles[0]) {
      roles[0].position = "游戏开发工程师";
      roles[0].location = "美国·贝尔维尤";
      roles[0].period = "2020年6月—2022年2月";
      roles[0].description = [
        "<ul>",
        "<li><p>参与开发科幻 Roguelike 游戏《星际奥德赛》，该作品在 Steam 售出 50 万余份，玩家评价为“特别好评”。</p></li>",
        "<li><p>使用 Unity 和 C# 为关卡布局、敌人遭遇和战利品掉落设计并实现程序化生成系统。</p></li>",
        "<li><p>设计并编写玩家成长系统，包括技能树、装备升级和长期成长机制。</p></li>",
        "<li><p>构建稳定的存档与读档系统，支持云存档以及 PC 与 Nintendo Switch 跨平台游戏。</p></li>",
        "<li><p>集成分析、成就和多人联机等第三方 SDK，包括 GameAnalytics、Steamworks 和 Photon。</p></li>",
        "<li><p>根据社区反馈和数据分析修复关键问题、调整玩法平衡，并在上线后发布 12 次内容更新。</p></li>",
        "<li><p>与美术团队协作实现视觉特效、动画和着色器，在达到性能目标的同时提升画面表现。</p></li>",
        "</ul>",
      ].join("");
    }
    if (roles[1]) {
      roles[1].company = "移动游戏工作室";
      roles[1].position = "初级游戏开发工程师";
      roles[1].location = "远程";
      roles[1].period = "2018年9月—2020年5月";
      roles[1].description = [
        "<ul>",
        "<li><p>参与开发三款基于 Unity 的移动端解谜游戏，iOS 和 Android 平台累计下载量超过 200 万次。</p></li>",
        "<li><p>开发适配移动设备和多种屏幕尺寸的 UI 系统、触控操作与手势识别功能。</p></li>",
        "<li><p>开发激励视频广告、应用内购买和每日奖励等商业化功能，使用户留存率提升 25%。</p></li>",
        "<li><p>通过资源压缩和代码优化降低内存占用与加载时间，使应用体积减少 35%。</p></li>",
        "<li><p>与游戏策划合作，结合 A/B 测试数据调整解谜难度曲线和关卡推进节奏。</p></li>",
        "</ul>",
      ].join("");
    }
  }

  const coverLetter = data.customSections.find((section) => section.type === "cover-letter");
  if (coverLetter) {
    coverLetter.title = "求职信";
    const letter = coverLetter.items[0];
    if (letter) {
      letter.recipient =
        '<p>招聘负责人<br />Sunrise Games Studio<br />美国·西雅图<br /><a href="mailto:hiring@sunrisegames.com">hiring@sunrisegames.com</a></p>';
      letter.content =
        "<p>尊敬的招聘负责人：</p><p>我希望应聘 Sunrise Games Studio 的高级游戏玩法工程师岗位。过去五年里，我参与交付了多款跨平台游戏，负责核心玩法系统与开发工具，持续提升迭代效率和玩家体验。在 Cascade Studios 任职期间，我设计了战斗系统并优化性能，使主机平台能够稳定达到 60 FPS，同时与策划和美术团队紧密协作。</p><p>我擅长跨职能协作，也乐于指导初级工程师。期待有机会将我在游戏系统和开发工具方面的经验带入贵团队的下一款作品。</p><p>此致<br />敬礼！<br />戴维·科瓦尔斯基</p>";
    }
  }
}
