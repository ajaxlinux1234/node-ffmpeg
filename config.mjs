const transform =
  "当前镜头到下一镜头之间要结合视频描述词生成一种一定要明确是哪种运镜,不一定是电影运镜只要是高级运镜都可以,例如一镜到底的大师级转换画面或运动方式";
const name = "邓稼先";
const prompt = `中国人面孔，像${name}, 电影风格，不要出现汉字军，警察等特殊字眼, 物品服饰场景等要符合那个年代的场景, 人物形象国籍形象要统一, 人物发型要跟当时实际的发型统一, 人物使用物品的场景也要符合实际:比如天文望远镜要往天上看, 物品款式要证是当时年代的物品, 不要是现代或者未来的款式, 人物性别要统一, 标题, 画面提示,${transform},分别在不同的段落`;
const num = 10;
export default {
  "down-rm-watermark": {
    url: "https://aigc-idea-platform.cdn.bcebos.com/miaoying_video/shadow_i2v_1280x704_20250925_160634_a024gnii_2X_32fps_generate_metadata.mp4?authorization=bce-auth-v1%2FALTAKpTC4weJ6py821WCyek9FC%2F2025-09-25T08%3A06%3A41Z%2F-1%2F%2F612a44bb17040c579d19ab812adda61a6163d21f5bb02231b32c335a6e958b5b",
    "bg-music": "bg-music.mp3",
  },
  "history-person": {
    name,
    url: "input/history-person/燧人氏.mp4",
    title: `三皇五帝之燧人氏`,
    // 快乐传递者何炅
    // 国士无双袁隆平
    titleAnimation: "sweep_slow", // 可选值: "flash", "fade", "scale", "slide", "none", "sweep_fast", "sweep_slow", "sweep_pulse", "sweep_rainbow", "sweep_wave", "sweep_laser", "sweep_glow", "sweep_neon", "sweep_electric", "sweep_diamond"
    sectionTitleAnimation: "sweep_glow", // 分镜字幕动画效果，可选值同titleAnimation
    sectionTitle: [
      "公元前50000年/0岁\n燧人氏于原始部落降生",
      "公元前49970年/30岁\n青年燧人氏观察自然现象\n对火产生好奇",
      "公元前49950年/50岁\n发明钻木取火\n首次主动创造火种",
      "公元前49945年/55岁\n将取火技术传授给族人",
      "公元前49940年/60岁\n教民熟食\n提升部落健康水平",
      "公元前49920年/80岁\n利用火塘\n带领族人建造更宜居的半地穴式房屋",
      "公元前49900年/100岁\n利用火制作出第一批原始陶器",
      "公元前49880年/120岁\n发明结绳记事\n为信息传递奠定基础",
      "公元前49860年/140岁\n晚年燧人氏\n将智慧与领导权交给下一代",
      "公元前49850年/150岁\n传递希望的火种\n燧人氏去世",
    ],
    watermark: "@人物传记史",
    "bg-music": "music/屠洪刚 - 精忠报国_start25s_clip.mp3",
    // 栀子花开_start25s_clip
    // 屠洪刚 - 精忠报国_start25s_clip
  },
  "merge-video": {
    urls: [
      "https://v9-artist.vlabvod.com/ac0373e9326286f2cb269017a3ca0352/68e36176/video/tos/cn/tos-cn-v-148450/oMWLIhsTRBJbJPgaxRi3Ag0QnDaQyAtbEgfMai/?a=4066&ch=0&cr=0&dr=0&er=0&lr=display_watermark_aigc&cd=0%7C0%7C0%7C0&br=5964&bt=5964&cs=0&ds=12&ft=5QYTUxhhe6BMyqx9j-kJD12Nzj&mime_type=video_mp4&qs=0&rc=Ojc3ZDs1PDllZzlpZzs1NUBpM2w0bXE5cjs1NjczNDM7M0BfNjBhNDU2NV4xXmEyNjM2YSNqaXA2MmRzX2FhLS1kNC9zcw%3D%3D&btag=c0000e00020000&dy_q=1759127241&feature_id=7bed9f9dfbb915a044e5d473759ce9df&l=20250929142721B8E2821AAAB76F4CBBDE",
      "https://v9-artist.vlabvod.com/f1d3ff87036bab6500fe40ec69aaa8b0/68e3623f/video/tos/cn/tos-cn-v-148450/oMy0DEAsRgEmOhBGTCtLre8IRiGBE6k4PAeey4/?a=4066&ch=0&cr=0&dr=0&er=0&lr=display_watermark_aigc&cd=0%7C0%7C0%7C0&br=5996&bt=5996&cs=0&ds=12&ft=5QYTUxhhe6BMyqDuj-kJD12Nzj&mime_type=video_mp4&qs=0&rc=MzZlZTU1ZWg6ZzxnZzw4O0BpM2Y1bWs5cjQ1NjczNDM7M0AzYGI1M2ItXmMxMS8vMzNhYSNkcGVkMmRzY2FhLS1kNC9zcw%3D%3D&btag=c0000e00018000&dy_q=1759127452&feature_id=7bed9f9dfbb915a044e5d473759ce9df&l=2025092914305206734F9D23ECFE58F38D",
    ],
    switch: "推拉", // 支持：叠化、淡入淡出、推拉、擦除、无转场
  },
  "ai-remove-watermark": {
    url: "output/history-person/1758868423130_10b9525ce467.mp4",
    debug: true,
    mask: {
      autodetect: "full-text",
      inpaint_radius: 14,
      dilate_px: 16,
      extra_expand_px: 6,
      extra_regions: [{ x: 6, y: 6, w: 220, h: 120 }],
    },
  },
  "clip-audio": [
    {
      url: "input/clip-audio/韩磊 - 向天再借五百年.mp3",
      start: 22,
    },
    {
      url: "input/clip-audio/栀子花开.mp3",
      start: 25,
    },
    {
      url: "input/clip-audio/屠洪刚 - 精忠报国.mp3",
      start: 25,
    },
  ],
  "auto-deepseek-jimeng": {
    deepseek: {
      url: "https://chat.deepseek.com/", // 要无头浏览器打开的deepseek网站
      persistLogin: true, // 是否保持登录状态（使用浏览器用户数据目录）
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
      send_chat_selector: `'input[type="file"] + div'`, // 录入完消息后，发送消息的按钮选择器
      send_msg_template: `${prompt}，{{name}}, 从出生到现在{{timeNum}}个关键时间点, 要特别注意人物服饰要符合历史事实,{{timeNum}}段视频生成提示词, 以及各个镜头画面之间的转换方式或运动方式, 视频镜头要是电影写实风格,比例9:16, 各段视频描述要与{{name}}的长相类似, 各段视频描述要写上人物年龄, 视频提示词不要显示国徽, 人民大会堂等政治信息, 严格生成{{timeNum}}段视频生成提示词，提示词为中文，每句话前面都加上"中国人面孔，像{{name}}，生成图片要符合实际生活场景"`,
      send_msg_template_data: {
        // 把send_msg_template中的{{name}}和{{timeNum}}替换为实际值, 然后把send_msg_template内容输入到chat_selector中
        name,
        timeNum: num,
      },
      get_deepseek_result_time: num * 4.5, // 等待deepseek返回结果的时间, 单位为秒
      deepseek_result_txt_fn: () => {
        const num = 10;
        const navPrompt =
          "中国人面孔，像邓稼先, 电影风格，不要出现汉字军，警察等特殊字眼, 物品服饰场景等要符合那个年代的场景, 人物形象国籍形象要统一, 人物发型要跟当时实际的发型统一, 人物使用物品的场景也要符合实际:比如天文望远镜要往天上看, 物品款式要证是当时年代的物品, 不要是现代或者未来的款式, 人物性别要统一";

        // 实现 takeRight 函数，不依赖 lodash
        function takeRight(arr, n) {
          if (!Array.isArray(arr) || arr.length === 0) return [];
          return arr.slice(Math.max(0, arr.length - n));
        }

        // 调试：输出页面信息
        console.log("🔍 开始提取 DeepSeek 回复内容...");
        console.log("📄 当前页面标题:", document.title);
        console.log("🔗 当前页面URL:", window.location.href);

        // 尝试多种选择器来获取DeepSeek的回复内容
        const allSelectors = [
          "strong span",
          "strong",
          "b span",
          "b",
          "[class*='message'] strong",
          "[class*='content'] strong",
          "[class*='reply'] strong",
          ".markdown strong",
          "div[data-testid] strong",
          "p strong",
        ];

        let titles = [];
        for (const selector of allSelectors) {
          const elements = [...document.querySelectorAll(selector)];
          if (elements.length > 0) {
            console.log(
              `✅ 找到 ${elements.length} 个元素使用选择器: ${selector}`
            );
            titles = elements
              .map((el) => el.innerText)
              .filter((text) => text && text.trim().length > 0);
            if (titles.length >= num) break;
          }
        }

        console.log(`📊 提取到 ${titles.length} 个标题:`, titles.slice(0, 3));

        // 提取画面提示
        const promptSelectors = [
          "span",
          "p",
          "div",
          "[class*='message'] span",
          "[class*='content'] span",
          ".markdown span",
          ".markdown p",
        ];

        let prompts = [];
        for (const selector of promptSelectors) {
          const elements = [...document.querySelectorAll(selector)];
          const filtered = elements
            .map((el) => el.innerText)
            .filter(
              (text) =>
                text &&
                (text.includes("画面提示") ||
                  text.includes("画面内容") ||
                  text.includes("画面描述"))
            );

          if (filtered.length > 0) {
            console.log(
              `✅ 找到 ${filtered.length} 个画面提示使用选择器: ${selector}`
            );
            prompts = filtered;
            if (prompts.length >= num) break;
          }
        }

        console.log(
          `📊 提取到 ${prompts.length} 个画面提示:`,
          prompts.slice(0, 2)
        );

        // 提取运镜方式
        let shots = [];
        for (const selector of promptSelectors) {
          const elements = [...document.querySelectorAll(selector)];
          const filtered = elements
            .map((el) => el.innerText)
            .filter(
              (text) =>
                text &&
                (text.includes("运镜方式") ||
                  text.includes("运镜") ||
                  text.includes("镜头运动"))
            );

          if (filtered.length > 0) {
            console.log(
              `✅ 找到 ${filtered.length} 个运镜方式使用选择器: ${selector}`
            );
            shots = filtered;
            if (shots.length >= num) break;
          }
        }

        console.log(`📊 提取到 ${shots.length} 个运镜方式:`, shots.slice(0, 2));

        // 如果没有找到结构化内容，尝试提取整个回复内容
        if (titles.length === 0 && prompts.length === 0 && shots.length === 0) {
          console.log("⚠️ 未找到结构化内容，尝试提取整个回复...");

          const messageSelectors = [
            "[class*='message-content']",
            "[class*='chat-message']",
            "[class*='reply']",
            "[class*='response']",
            ".markdown",
            "[role='assistant']",
            "div[data-testid*='message']",
          ];

          for (const selector of messageSelectors) {
            const elements = [...document.querySelectorAll(selector)];
            if (elements.length > 0) {
              console.log(
                `🔍 找到消息容器: ${selector}, 数量: ${elements.length}`
              );
              const lastMessage = elements[elements.length - 1];
              const fullText = lastMessage.innerText;
              console.log("📝 完整回复内容长度:", fullText.length);
              console.log(
                "📝 回复内容预览:",
                fullText.substring(0, 200) + "..."
              );

              // 尝试从完整文本中解析结构化内容
              const lines = fullText
                .split("\n")
                .filter((line) => line.trim().length > 0);
              console.log(`📊 分割后得到 ${lines.length} 行内容`);

              // 简单返回前几行作为标题
              if (lines.length > 0) {
                return lines
                  .slice(0, Math.min(num, lines.length))
                  .map((line, index) => ({
                    title: line.trim(),
                    prompt: `${line.trim()},${navPrompt}`,
                    shot: `运镜方式${index + 1}`,
                  }));
              }
              break;
            }
          }
        }

        // 取最后的结果
        const finalTitles = takeRight(titles, num + 1);
        if (finalTitles.length > 0) finalTitles.pop();

        const finalPrompts = takeRight(prompts, num);
        const finalShots = takeRight(shots, num);

        console.log(
          `🎯 最终结果: ${finalTitles.length} 个标题, ${finalPrompts.length} 个提示, ${finalShots.length} 个运镜`
        );

        return finalTitles.map((title, index) => {
          return {
            title: title,
            prompt: `${title},${finalPrompts[index] || ""},${navPrompt}`,
            shot: finalShots[index] || `运镜方式${index + 1}`,
          };
        });
      },
    },
    jimeng: {
      name,
      url: "https://jimeng.jianying.com/ai-tool/home?type=image", // 打开即梦图片生成首页
      login_selector: {
        login_button: `#SiderMenuLogin`,
        agree_policy: `div.zoomModal-enter-done .lv-btn-primary`,
      },
      generate_button_selector: `#AIGeneratedRecord`, // 点击生成按钮
      img_generate_input_selector: `textarea:last-child`, // 选择页面最后一个textarea输入框
      img_generate_input_send_selector: `.lv-btn-primary`, // 发送按钮
      gernerate_img_result_selector: `div[style="--aspect-ratio: 0.5625;"]`, // 生成结果
    },
    "jimeng-video-generator": {
      url: "https://jimeng.jianying.com/ai-tool/home?type=video", // 1.打开即梦视频生成首页
      generate_button_selector: `#AIGeneratedRecord`, // 点击生成按钮
      video_generate_select_trigger_selector: ".lv-typography", // 首尾帧选择器范围
      video_generate_select_trigger_text: "首尾帧", // 点击包含"首尾帧"的元素
      video_generate_select_item_text: "智能多帧", // 点击包含"智能多帧"的元素, 切换成智能多帧模式
      video_generate_select_item_selector: ".lv-typography", // 智能多帧选择器范围
      video_generate_upload_text: "第1帧", // 点击包含"第1帧"的元素
      video_generate_shot_text_btn_selector: 'input[type="file"]', // 点击第一个的class为.reference-upload-eclumn的div元素
      video_generate_shot_input_selector: ".lv-popover-inner-content textarea", // 选择textarea输入框, 按照正序输入processed_data.json中的segments中的shot.输入完成后点击第二个包含"5s"的div元素, 输入第二个shot
      video_generate_shot_input_confirm_text: "确认", // 在每次输入shot后点击包含"确认"的div元素, 接着点击第二个class为.reference-upload-eclumn的div元素, 输入第二个shot, 然后点击包含"确认"的div元素
      video_generate_shot_input_confirm_select:
        ".lv-popover-inner-content .lv-btn-shape-square", // 在每次输入shot后点击包含"确认"的div元素, 接着点击第二个class为.reference-upload-eclumn的div元素, 输入第二个shot, 然后点击包含"确认"的div元素
      video_generate_shot_selector: ".lv-typography", // 5s元素选择器范围
    },
  },
};
