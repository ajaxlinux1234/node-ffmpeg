// DeepSeek 配置文件

import { name } from "./jimeng-video-config.mjs";

const transform =
  "当前镜头到下一镜头之间要结合视频描述词生成一种一定要一镜到底, 运镜的转换是当前人物在当前场景到下一个场景的合理转换,要是大师级转换, 从一个镜头到另一个镜头的转换细节是: 主人物自然从一个场景到另一个场景, 一定要自然, 而且都要是主人物, 运镜转换描述一定是主人物从一个场景到下一个场景, 例如邓稼先从婴儿状态(出生场景)走去学校(另一场景)上学, 人物特写运镜, 所有运镜转化的中心都是只描述主人物从一个场景到另一个场景的过渡, 并且主人物的表情要自然贴合当时的场景,画面提示词要大气，运镜提示词要创新";

const prompt = `中国人面孔, 电影风格，生成图片一定要是人物正脸照, 生成的图片任何地方都不要出现地图, 不要跟上下文中的重复, 不要讲去世, 各个镜头采用一镜到底, 不要出现汉字军，军国主义, 警察党旗,核潜艇, 遗像等特殊字眼, 不要出现直播间, 搜索资料,要是完全符合即梦生图和视频的提示词, 出现情况要是当时的实际情况, 物品服饰场景等要符合那个年代的场景, 人物形象国籍形象要统一, 人物发型要跟当时实际的发型统一, 人物使用物品的场景也要符合实际:比如天文望远镜要往天上看, 物品款式要证是当时年代的物品, 不要是现代或者未来的款式, 人物性别要统一, 标题, 画面提示,${transform},分别在不同的段落, 还有按照"年份/几岁|什么场景|做什么事"的格式生成一份分镜提示词也新起一个段落, 画面提示跟运镜方式都要新起个段落, 画面提示词不要涉及国家领导人, 画面提示词中不涉及人物名称, 男性用一位男性,另一位男人,女性用一位女性,另一位女性来代替`;
const historyNum = 13;

export const deepseekConfig = {
  url: "https://chat.deepseek.com/", // 要无头浏览器打开的deepseek网站
  persistLogin: true, // 是否保持登录状态（使用浏览器用户数据目录）
  getConfig: true, // 直接下载配置文件
  login_selector: {
    // 进入deepseek登录页面后，如果发现能选择到下列元素，表示未登录，就选择账号密码元素
    username: `input[placeholder="请输入手机号/邮箱地址"]`,
    password: `input[placeholder="请输入密码"]`,
    login_button: `div[role="button"]`,
    username_password_tab: `div.ds-tab + div`,
  },
  login_data: {
    // 选择完账号密码元素后，输入账号密码, 然后点击登录按钮
    username: "13683514587",
    password: "zhongguo1234..A",
  },
  side_selector: `a`,
  chat_selector: `textarea[placeholder="给 DeepSeek 发送消息 "]`, // 登录完成后进入聊天页面，首先选择发送消息的输入框选择器
  send_chat_selector: `input[type="file"] + div`, // 录入完消息后，发送消息的按钮选择器
  send_msg_template: `${prompt}，{{name}}, 根据主题${name}现在{{timeNum}}个关键时间点, 时间点是从${name}开始到${name}结束, 要特别注意人物服饰要符合历史事实,{{timeNum}}段视频生成提示词, 以及各个镜头画面之间的转换方式或运动方式, 视频镜头要是电影写实风格,比例9:16, 各段视频描述要与{{name}}的长相类似, 各段视频描述要写上人物年龄, 视频提示词不要显示国徽, 人民大会堂等政治信息, 严格生成{{timeNum}}段视频生成提示词，提示词为中文，每句话前面都加上"生成图片要符合实际生活场景"`,
  send_msg_template_data: {
    // 把send_msg_template中的{{name}}和{{timeNum}}替换为实际值, 然后把send_msg_template内容输入到chat_selector中
    name,
    timeNum: historyNum,
  },
  get_deepseek_result_time: historyNum * 10, // 等待deepseek返回结果的时间, 单位为秒
  deepseek_result_txt_fn: () => {
    const historyNum = 13;
    const name = "从“体制内高官”到“地下战士”：陈宝仓的信仰蜕变之路";
    const navPrompt = `比例9:16，中国人面孔，像${name}, 电影风格，不要出现汉字军, 生成图片一定要是人物正脸照,警察遗像不要出现病房医院等特殊字眼, 任何地方都不要出现地图, 人物的衣服不要破洞, 物品服饰场景等要符合那个年代的场景, 衣服不要破洞, 人物形象国籍形象要统一, 人物发型要跟当时实际的发型统一, 人物使用物品的场景也要符合实际:比如天文望远镜要往天上看, 物品款式要证是当时年代的物品, 不要是现代或者未来的款式, 人物性别要统一, 生成的图中不要包含任何地图相关的物品,也不要包含条约相关的, 任何位置都不要出现地图`;

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

    const globalPrompt = Array.from(
      Array.from(document.querySelectorAll("ol")).pop().querySelectorAll("span")
    )
      .map((one) =>
        one.innerText
          .replaceAll(/-,?/g, "")
          .replaceAll("\n", "")
          .replaceAll(/\d,?/g, "")
      )
      .join(" ");

    const prompt =
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
      ) ||
      takeRight(
        [...document.querySelectorAll("span")]
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
        [...document.querySelectorAll("li")]
          .map((one) => one.innerText)
          .filter((one) => one.startsWith("运镜方式")),
        historyNum
      ) ||
      takeRight(
        [...document.querySelectorAll("span")]
          .map((one) => one.innerText)
          .filter((one) => one.startsWith("运镜方式")),
        historyNum
      );
    return title.map((one, index) => {
      return {
        title: one,
        // prompt: `${originTitle[index]},${prompt[index]} ${navPrompt}, ${globalPrompt}, 参考图片跟生成的人物图片50%相似度, 一定不要太相似否则会侵权`,
        prompt: `中国人面孔，${originTitle[index]},${prompt[index]},参考图片跟生成的人物图片50%相似度, 一定不要太相似否则会侵权`,
        shot: `${shot[index]}`,
      };
    });
  },
};

export default deepseekConfig;
