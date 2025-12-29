import { name } from "../jimeng-video-config.mjs";
export const transform =
  "当前镜头到下一镜头之间要结合视频描述词生成一种一定要镜头跟随, 运镜的转换是当前人物在当前场景到下一个场景的合理转换,要是大师级转换, 从一个镜头到另一个镜头的转换细节是: 主人物自然从一个场景到另一个场景, 一定要自然, 而且都要是主人物, 运镜转换描述一定是主人物从一个场景到下一个场景, 例如邓稼先从婴儿状态(出生场景)走去学校(另一场景)上学, 人物特写运镜, 所有运镜转化的中心都是只描述主人物从一个场景到另一个场景的过渡, 并且主人物的表情要自然贴合当时的场景,画面提示词要大气，运镜提示词要创新";

export const prompt = `中国人面孔, 电影风格，生成图片一定要是人物正脸照, 生成的图片任何地方都不要出现地图, 不要跟上下文中的重复, 各个镜头采用镜头跟随, 不要出现汉字军，军国主义, 警察党旗,核潜艇, 遗像等特殊字眼, 不要出现直播间, 搜索资料,要是完全符合即梦生图和视频的提示词, 出现情况要是当时的实际情况, 物品服饰场景等要符合那个年代的场景, 人物形象国籍形象要统一, 人物发型要跟当时实际的发型统一, 人物使用物品的场景也要符合实际:比如天文望远镜要往天上看, 物品款式要证是当时年代的物品, 不要是现代或者未来的款式, 人物性别要统一, 标题, 画面提示,${transform},分别在不同的段落, 还有按照"年份/几岁|什么场景|做什么事"的格式生成一份分镜提示词也新起一个段落, 画面提示跟运镜方式还有人物台词, 人物台词要与当前分镜主题相符, 分镜台词按照年份以及做什么事还有心里活动的格式输出,分镜台词长度不超过24个字符,也不要太短,台词不要有标点,24个字符,台词口语化一些人要能听懂, 都要新起个段落, 画面提示词不要涉及国家领导人, 如果人物已经去世那么最后一个分镜写去世`; //画面提示词中不涉及人物名称, 男性用一位男性,另一位男人,女性用一位女性,另一位女性来代替

export const PERSON_HISTORY = `${prompt}，{{name}}, 根据主题${name}现在{{timeNum}}个关键时间段, 时间点是从${name}开始到${name}结束, 要特别注意人物服饰要符合历史事实,{{timeNum}}段视频生成提示词, 以及各个镜头画面之间的转换方式或运动方式, 视频镜头要是电影写实风格,比例9:16, 各段视频描述要与{{name}}的长相类似, 各段视频描述要写上人物年龄, 视频提示词不要显示国徽, 人民大会堂等政治信息, 严格生成{{timeNum}}段视频生成提示词，提示词为中文，每句话前面都加上"生成图片要符合实际生活场景",一定要符合历史事实,不需要当代视频分镜, 如果标题中涉及到关键词"一生"的最后一个分镜要讲去世，标题要包含年龄，请联网查找${name}的正确资料，不要捏造生成虚假信息，要讲出生信息，运镜使用主要人物镜头跟随，要求人物自然的从一个场景到另一个场景中，分镜台词按照年份以及做什么事还有心里活动的格式输出，分镜台词长度不超过24个字符，也不要太短,台词不要有标点,24个字符，台词口语化一些人要能听懂，第一个分镜如果讲出生画面提示中只有婴儿一人，最后一条标题不要讲生病，标题描述词通俗易懂点，标题要讲什么地点，做了什么事(用极其通俗易懂的话)， 标题中做什么事不要过于抽象， 要改写的通俗易懂点， 要通俗易懂!!!!!`;

export const history_deepseek_result_txt_fn = () => {
  const historyNum = 13;
  // 实现 takeRight 函数，不依赖 lodash
  function takeRight(arr, n) {
    if (!Array.isArray(arr) || arr.length === 0) return [];
    return arr.slice(Math.max(0, arr.length - n));
  }

  // 调试信息：记录找到的元素数量
  console.log("=== DOM 解析调试信息 ===");

  // 尝试多种选择器来找到数据
  const trElements = Array.from(document.querySelectorAll("body tr"));
  console.log(`找到 tr 元素数量: ${trElements.length}`);

  const h3Elements = Array.from(document.querySelectorAll("h3")).filter((one) =>
    one.innerText.startsWith("分镜")
  );
  console.log(`找到 h3 分镜元素数量: ${h3Elements.length}`);

  const spanElements = Array.from(document.querySelectorAll("span")).filter(
    (one) => /^\d/.test(one.innerText) && one.innerText.includes("|")
  );
  console.log(`找到 span 元素数量: ${spanElements.length}`);

  // 尝试使用最佳的选择器
  let originTitle;

  if (trElements.length >= historyNum) {
    console.log("使用 tr 选择器");
    originTitle = takeRight(
      trElements.map((one) =>
        one.innerText
          .slice(2)
          ?.replace(/\s\/\s/, "/")
          .replace(/^\t/, "")
          .replace(/\t/g, "\n")
          .replaceAll("，", "\n")
          .replace("/0岁", "")
          .replaceAll("。", "")
      ),
      historyNum
    );
  } else if (h3Elements.length >= historyNum) {
    console.log("使用 h3 选择器");
    originTitle = takeRight(
      h3Elements
        .map((one) => one.innerText)
        .map((one) => one.replace(/(分镜\d+：)/, "")),
      historyNum
    );
  } else if (spanElements.length >= historyNum) {
    console.log("使用 span 选择器");
    originTitle = takeRight(
      spanElements.map((one) => one.innerText),
      historyNum
    );
  } else {
    console.log("所有选择器都无法找到足够的元素，使用可用的最多元素");
    // 使用找到最多元素的选择器
    if (
      trElements.length >= spanElements.length &&
      trElements.length >= h3Elements.length
    ) {
      originTitle = trElements.map((one) =>
        one.innerText
          .slice(2)
          ?.replace(/\s\/\s/, "/")
          .replace(/^\t/, "")
          .replace(/\t/g, "\n")
      );
    } else if (spanElements.length >= h3Elements.length) {
      originTitle = spanElements.map((one) => one.innerText);
    } else {
      originTitle = h3Elements
        .map((one) => one.innerText)
        .map((one) => one.replace(/(分镜\d+：)/, ""));
    }
  }

  console.log(`最终获取到的标题数量: ${originTitle.length}`);
  console.log("标题内容:", originTitle);

  // const title = originTitle.map((one) =>
  //   one
  //     .replaceAll("|", "\n")
  //     .replaceAll("\t", "\n")
  //     .replace(/·/g, "\n")
  //     .replaceAll('"', "'")
  //     .replaceAll(/\./g, "")
  //     .slice(4).replace(' ','\n')
  // );
  const title = originTitle;

  console.log("=== 提示词解析调试信息 ===");
  const prompt =
    takeRight(
      [...document.querySelectorAll(".ds-markdown-paragraph")]
        .map((one) => one.innerText)
        .filter((one) => one.includes("画面提示"))
        .map((one) => one.split("运镜方式：")[0]),
      historyNum
    ) ||
    takeRight(
      [...document.querySelectorAll("li")]
        .map((one) => one.innerText)
        .filter(
          (one) =>
            one.startsWith("画面提示") ||
            one.startsWith("画面内容") ||
            one.startsWith("中国人面孔")
        ),
      historyNum
    );

  console.log(`找到的提示词数量: ${prompt ? prompt.length : 0}`);

  const lines‌ =
    takeRight(
      [...document.querySelectorAll(".ds-markdown-paragraph")]
        .map((one) => one.innerText)
        .filter((one) => one.includes("画面提示"))
        .map((one) =>
          one
            .split("人物台词：")[1]
            ?.replaceAll?.('\"', "")
            ?.replace(/-\n\d/, "")
            ?.replaceAll("（婴儿时期无台词）", "")
        ),
      historyNum
    ) ||
    takeRight(
      [...document.querySelectorAll("li")]
        .map((one) => one.innerText)
        .filter((one) => one.startsWith("运镜方式：")),
      historyNum
    );

  console.log(`找到的台词数量: ${lines‌ ? lines‌.length : 0}`);

  const shot =
    takeRight(
      [...document.querySelectorAll(".ds-markdown-paragraph")]
        .map((one) => one.innerText)
        .filter((one) => one.includes("画面提示"))
        .map((one) => one.split("运镜方式：")[1]),
      historyNum
    ) ||
    takeRight(
      [...document.querySelectorAll("li")]
        .map((one) => one.innerText)
        .filter((one) => one.startsWith("运镜方式：")),
      historyNum
    );

  console.log(`找到的运镜数量: ${shot ? shot.length : 0}`);

  const customShot =
    "运镜方式：镜头跟随图中主要人物，图中场景缓慢自然变成下一场景伴随着图中人物从当前场景缓慢变成下一个场景的人物，人物先进行形态和样貌上的变化，然后场景变成下一场景，接着人物缓慢自然走到下一场景，动态转换流畅自然";

  // 运镜方式：镜头跟随图中主要人物，图中场景缓慢自然变成下一场景伴随着图中人物从当前场景缓慢变成下一个场景的人物，人物先进行形态和样貌上的变化，然后场景变成下一场景，接着人物缓慢自然走到下一场景，动态转换流畅自然
  // 运镜方式：镜头跟随图中主要人物，图中场景缓慢自然变成下一场景伴随着图中人物从当前场景缓慢变成下一个场景的人物，人物不要走动，人物只进行形态和样貌上的变化，场景变成下一场景，同时人物变换为下一场景的主要人物，动态转换流畅自然
  console.log(`期望数量: ${historyNum}, 实际获取数量: ${originTitle.length}`);
  console.log("=== 调试信息结束 ===");

  originTitle[0] = originTitle[0].replace("/0岁", "/3岁");
  prompt[0] = `${name.match(/([^, ]+)的一生/)?.[1] || name.match(/([^, ]+)的从政之路/)?.[1] || name.split(", ").pop()}3岁正脸全身照`;
  return title.map((one, index) => {
    return {
      title: one,
      prompt: `生成一张比例为9:16的写实风格图片，画面质感丰富，散发古典氛围。 以平视且略俯视角，确保构图完整，着重刻画其情感。画面主色调为棕色、红色与暗黄色，营造沉稳庄重之感，${originTitle[index]},${prompt[index]}`,
      shot: customShot,
      lines‌: lines‌[index],
    };
  });
};
