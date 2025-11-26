#!/usr/bin/env node
/**
 * 视频去重高级功能测试脚本
 * 测试所有14种去重手段
 */

import runVideoDedup from "./lib/video-dedup.mjs";

// 测试配置 - 启用所有去重功能（强度去重方案）
const testConfig = {
  input: "output/merge-video/merged_1760674285792_merged.mp4",

  // 基础去重功能
  sweepLight: {
    enabled: true,
    opacity: 0.15,
  },

  modifyMD5: true,

  letterbox: {
    enabled: true,
    top: 40,
    bottom: 40,
  },

  sharpen: {
    enabled: true,
    strength: "light",
  },

  denoise: {
    enabled: true,
    strength: "light",
  },

  speedChange: {
    enabled: true,
    speed: 1.03,
  },

  // 高级去重功能
  colorAdjust: {
    enabled: true,
    hue: 0, // 随机
    saturation: 1.0, // 随机
    brightness: 0, // 随机
    contrast: 1.0, // 随机
  },

  flip: {
    enabled: false, // 翻转会改变方向，谨慎使用
    horizontal: false,
    vertical: false,
  },

  scale: {
    enabled: true,
    scale: 0.98, // 缩小2%
  },

  rotate: {
    enabled: true,
    angle: 1, // 旋转1度
  },

  fpsAdjust: {
    enabled: false, // 帧率调整可能影响流畅度
    fps: 0,
  },

  blur: {
    enabled: true,
    strength: "light",
  },

  curves: {
    enabled: true,
    preset: "vintage",
  },

  timestamp: {
    enabled: true,
    position: "bottom-right",
    format: "invisible",
  },

  quality: "medium",
  keepAudio: true,
};

console.log("🧪 开始测试高级视频去重功能...\n");
console.log("📋 启用的去重功能:");
console.log("  ✓ 随机噪点");
console.log("  ✓ MD5修改");
console.log("  ✓ 黑边框");
console.log("  ✓ 锐化");
console.log("  ✓ 降噪");
console.log("  ✓ 变速");
console.log("  ✓ 色彩调整");
console.log("  ✓ 缩放");
console.log("  ✓ 旋转");
console.log("  ✓ 模糊");
console.log("  ✓ 色彩曲线");
console.log("  ✓ 时间戳");
console.log("\n总计: 12种去重手段\n");

try {
  await runVideoDedup(testConfig);
  console.log("\n✅ 高级去重测试完成！");
  console.log("💡 提示: 可以根据需要调整各项配置以获得最佳效果");
} catch (error) {
  console.error("\n❌ 测试失败:", error.message);
  process.exit(1);
}
