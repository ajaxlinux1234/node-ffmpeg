import { name } from "../jimeng-video-config.mjs";
export const transform =
  "当前镜头到下一镜头之间要结合视频描述词生成一种一定要镜头跟随, 运镜的转换是当前人物在当前场景到下一个场景的合理转换,要是大师级转换, 从一个镜头到另一个镜头的转换细节是: 主人物自然从一个场景到另一个场景, 一定要自然, 而且都要是主人物, 运镜转换描述一定是主人物从一个场景到下一个场景, 例如邓稼先从婴儿状态(出生场景)走去学校(另一场景)上学, 人物特写运镜, 所有运镜转化的中心都是只描述主人物从一个场景到另一个场景的过渡, 并且主人物的表情要自然贴合当时的场景,画面提示词要大气，运镜提示词要创新";

export const prompt = `中国人面孔, 电影风格，生成图片一定要是人物正脸照, 生成的图片任何地方都不要出现地图, 不要跟上下文中的重复, 各个镜头采用镜头跟随, 不要出现汉字军，军国主义, 警察党旗,核潜艇, 遗像等特殊字眼, 不要出现直播间, 搜索资料,要是完全符合即梦生图和视频的提示词, 出现情况要是当时的实际情况, 物品服饰场景等要符合那个年代的场景, 人物形象国籍形象要统一, 人物发型要跟当时实际的发型统一, 人物使用物品的场景也要符合实际:比如天文望远镜要往天上看, 物品款式要证是当时年代的物品, 不要是现代或者未来的款式, 人物性别要统一, 标题, 画面提示,${transform},分别在不同的段落, 还有按照"年份/几岁|什么场景|做什么事"的格式生成一份分镜提示词也新起一个段落, 画面提示跟运镜方式都要新起个段落, 画面提示词不要涉及国家领导人, 画面提示词中不涉及人物名称, 男性用一位男性,另一位男人,女性用一位女性,另一位女性来代替`;

export const PERSON_HISTORY = `${prompt}，{{name}}, 根据主题${name}现在{{timeNum}}个关键时间段, 时间点是从${name}开始到${name}结束, 要特别注意人物服饰要符合历史事实,{{timeNum}}段视频生成提示词, 以及各个镜头画面之间的转换方式或运动方式, 视频镜头要是电影写实风格,比例9:16, 各段视频描述要与{{name}}的长相类似, 各段视频描述要写上人物年龄, 视频提示词不要显示国徽, 人民大会堂等政治信息, 严格生成{{timeNum}}段视频生成提示词，提示词为中文，每句话前面都加上"生成图片要符合实际生活场景",一定要符合历史事实,不需要当代视频分镜, 如果标题中涉及到关键词"一生"的最后一个分镜要讲去世，请联网查找${name}的正确资料，不要捏造生成虚假信息`;

export const history_deepseek_result_txt_fn = () => {
  const historyNum = 13;
  // 实现 takeRight 函数，不依赖 lodash
  function takeRight(arr, n) {
    if (!Array.isArray(arr) || arr.length === 0) return [];
    return arr.slice(Math.max(0, arr.length - n));
  }

  const originTitle =
    takeRight(
      Array.from(document.querySelectorAll("span"))
        .map((one) => one.innerText)
        .filter((one) => /^\d/.test(one) && one.includes("|")),
      historyNum
    ) ||
    takeRight(
      Array.from(document.querySelectorAll("span"))
        .map((one) => one.innerText)
        .filter((one) => one.includes("|") && /^\d/.test(one)),
      historyNum
    );

  const title = originTitle.map((one) =>
    one.replaceAll("|", "\n").replaceAll("\t", "\n").replaceAll('"', "'")
  );

  const prompt =
    takeRight(
      [...document.querySelectorAll("span")]
        .map((one) => one.innerText)
        .filter(
          (one) => one.startsWith("生成图片要符合实际生活场景。")
          // one.startsWith("画面提示") ||
          // one.startsWith("画面内容") ||
          // one.startsWith("中国人面孔")
        ),
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
  const shot =
    takeRight(
      [...document.querySelectorAll("span")]
        .map((one) => one.innerText)
        .filter((one) => one.startsWith("运镜方式：")),
      historyNum
    ) ||
    takeRight(
      [...document.querySelectorAll("li")]
        .map((one) => one.innerText)
        .filter((one) => one.startsWith("运镜方式：")),
      historyNum
    );
  return title.map((one, index) => {
    return {
      title: one,
      // prompt: `${originTitle[index]},${prompt[index]} ${navPrompt}, ${globalPrompt}, 参考图片跟生成的人物图片50%相似度, 一定不要太相似否则会侵权`,
      prompt: `中国人面孔，${originTitle[index]},${prompt[index]},参考图片跟生成的人物图片50%相似度, 一定不要太相似否则会侵权，参考生图的人物比例要协调`,
      shot: `${shot[index]}`,
    };
  });
};
