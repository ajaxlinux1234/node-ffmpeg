// DeepSeek 配置文件

import { name } from "./jimeng-video-config.mjs";
import {
  history_deepseek_result_txt_fn,
  PERSON_HISTORY,
} from "./promot/person-constants.mjs";

import {
  storytelling_deepseek_result_txt_fn,
  STORYTELLING_HISTORY,
} from "./promot/storytelling-constants.mjs";

// const USE = "storytelling";
const USE = "person";
const historyNum = 13;

// 添加调试模式配置
const DEBUG_MODE = true; // 设置为 true 启用调试日志

const map = {
  person: {
    promot: PERSON_HISTORY,
    getPromot: history_deepseek_result_txt_fn,
  },
  storytelling: {
    promot: STORYTELLING_HISTORY,
    getPromot: storytelling_deepseek_result_txt_fn,
  },
};

const { promot, getPromot } = map[USE];
export const deepseekConfig = {
  url: "https://chat.deepseek.com/", // 要无头浏览器打开的deepseek网站
  persistLogin: true, // 是否保持登录状态（使用浏览器用户数据目录）
  getConfig: false, // 直接下载配置文件
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
  send_msg_template: promot,
  send_msg_template_data: {
    // 把send_msg_template中的{{name}}和{{timeNum}}替换为实际值, 然后把send_msg_template内容输入到chat_selector中
    name,
    timeNum: historyNum,
  },
  get_deepseek_result_time: historyNum * 10, // 等待deepseek返回结果的时间, 单位为秒
  deepseek_result_txt_fn: getPromot,
  // 新增配置项
  expected_history_num: historyNum, // 期望的历史数量
  debug_mode: DEBUG_MODE, // 调试模式
};

export default deepseekConfig;
