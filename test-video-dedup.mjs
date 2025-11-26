#!/usr/bin/env node
/**
 * 视频去重功能测试脚本
 * 用于快速测试video-dedup命令的各项功能
 */

import runVideoDedup from "./lib/video-dedup.mjs";

// 测试配置 - 使用最小化配置快速测试
const testConfig = {
  input: "output/merge-video/merged_1760674285792_merged.mp4",

  // 只启用部分功能进行快速测试
  sweepLight: {
    enabled: true,
    opacity: 0.15,
    speed: "fast",
    angle: 45, // 固定角度便于测试
    color: "white",
  },

  modifyMD5: true,

  letterbox: {
    enabled: true,
    top: 30,
    bottom: 30,
    left: 0,
    right: 0,
  },

  sharpen: {
    enabled: false, // 禁用以加快测试
  },

  denoise: {
    enabled: false, // 禁用以加快测试
  },

  speedChange: {
    enabled: false, // 禁用以加快测试
  },

  quality: "medium", // 使用中等质量加快测试
  keepAudio: true,
};

console.log("🧪 开始测试视频去重功能...\n");
console.log("测试配置:");
console.log(JSON.stringify(testConfig, null, 2));
console.log("\n");

try {
  await runVideoDedup(testConfig);
  console.log("\n✅ 测试完成！");
} catch (error) {
  console.error("\n❌ 测试失败:", error.message);
  process.exit(1);
}
