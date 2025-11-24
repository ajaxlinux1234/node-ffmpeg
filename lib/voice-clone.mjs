import "zx/globals";
import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";

/**
 * 声音克隆模块 - 使用免费开源模型
 * 支持文本转语音和声音克隆功能
 */

// 配置常量
const CONFIG = {
  // 输出目录
  OUTPUT_DIR: "output/voice-clone",
  INPUT_DIR: "input/voice-clone",
  
  // TTS 模型配置
  TTS_MODELS: {
    // 中文TTS模型
    CHINESE: "tts_models/zh-CN/baker/tacotron2-DDC-GST",
    // 英文TTS模型  
    ENGLISH: "tts_models/en/ljspeech/tacotron2-DDC",
    // 多语言模型
    MULTILINGUAL: "tts_models/multilingual/multi-dataset/xtts_v2"
  },
  
  // 音频参数
  AUDIO: {
    SAMPLE_RATE: 22050,
    FORMAT: "wav",
    QUALITY: "high"
  }
};

/**
 * 检查和安装Coqui TTS
 */
async function checkAndInstallTTS() {
  console.log("🔍 检查TTS环境...");
  
  // 尝试多个可能的Python路径
  const pythonPaths = [
    "python",
    "python3", 
    `${process.env.USERPROFILE}\\AppData\\Local\\Programs\\Python\\Python311\\python.exe`,
    `${process.env.USERPROFILE}\\AppData\\Local\\Programs\\Python\\Python312\\python.exe`
  ];
  
  let workingPython = null;
  
  // 查找可用的Python
  for (const pythonPath of pythonPaths) {
    try {
      execSync(`"${pythonPath}" -c "import sys; print(sys.version)"`, { stdio: 'pipe' });
      workingPython = pythonPath;
      console.log(`✅ 找到Python: ${pythonPath}`);
      break;
    } catch (error) {
      // 继续尝试下一个路径
    }
  }
  
  if (!workingPython) {
    console.error("❌ 未找到Python环境");
    console.log("💡 请安装Python 3.9-3.11: https://www.python.org/downloads/");
    return false;
  }
  
  // 首先尝试检查 Coqui TTS
  try {
    execSync(`"${workingPython}" -c "import TTS; print('Coqui TTS已安装')"`, { stdio: 'pipe' });
    console.log("✅ Coqui TTS已安装 (支持声音克隆)");
    return true;
  } catch (error) {
    // Coqui TTS 未安装，检查 pyttsx3
    try {
      execSync(`"${workingPython}" -c "import pyttsx3; print('pyttsx3已安装')"`, { stdio: 'pipe' });
      console.log("✅ pyttsx3已安装 (基础TTS功能)");
      console.log("💡 如需声音克隆功能，请安装 Coqui TTS: pip install TTS");
      return true;
    } catch (pyttsx3Error) {
      console.log("📦 未找到TTS库，开始安装...");
      
      try {
        // 先尝试安装简单的 pyttsx3
        console.log("正在安装pyttsx3 (基础TTS引擎)...");
        console.log(`使用Python: ${workingPython}`);
        execSync(`"${workingPython}" -m pip install pyttsx3`, { stdio: 'inherit' });
        
        // 验证安装
        execSync(`"${workingPython}" -c "import pyttsx3; print('pyttsx3安装成功')"`, { stdio: 'pipe' });
        console.log("✅ pyttsx3安装成功");
        console.log("💡 如需声音克隆功能，请手动安装 Coqui TTS: pip install TTS");
        return true;
      } catch (installError) {
        console.error("❌ TTS安装失败:", installError.message);
        console.log("💡 请手动安装: pip install pyttsx3");
        return false;
      }
    }
  }
}

/**
 * 获取可用的Python路径
 */
function getWorkingPython() {
  const pythonPaths = [
    "python",
    "python3", 
    `${process.env.USERPROFILE}\\AppData\\Local\\Programs\\Python\\Python311\\python.exe`,
    `${process.env.USERPROFILE}\\AppData\\Local\\Programs\\Python\\Python312\\python.exe`
  ];
  
  for (const pythonPath of pythonPaths) {
    try {
      execSync(`"${pythonPath}" -c "import sys; print(sys.version)"`, { stdio: 'pipe' });
      return pythonPath;
    } catch (error) {
      // 继续尝试下一个路径
    }
  }
  return null;
}

/**
 * 列出可用的TTS模型
 */
async function listAvailableModels() {
  console.log("📋 获取可用模型列表...");
  
  const workingPython = getWorkingPython();
  if (!workingPython) {
    console.error("❌ 未找到Python环境");
    return null;
  }
  
  try {
    // 获取TTS辅助脚本路径
    const ttsHelperPath = path.join(process.cwd(), "lib", "tts_helper.py");
    
    const result = execSync(`"${workingPython}" "${ttsHelperPath}" --list_models`, { encoding: 'utf8' });
    console.log(result);
    return result;
  } catch (error) {
    console.error("❌ 获取模型列表失败:", error.message);
    console.log("💡 请确保已安装TTS库: pip install pyttsx3 或 pip install TTS");
    return null;
  }
}

/**
 * 文本转语音 (TTS)
 */
async function textToSpeech(config) {
  const { text, outputFile, model, language = "zh", speakerWav = null, engine = "auto" } = config;
  
  console.log(`🎤 开始文本转语音...`);
  console.log(`📝 文本: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
  console.log(`🎯 输出: ${outputFile}`);
  
  try {
    // 获取可用的Python路径
    const workingPython = getWorkingPython();
    if (!workingPython) {
      throw new Error("未找到Python环境");
    }
    
    // 确保输出目录存在
    await fs.ensureDir(path.dirname(outputFile));
    
    // 获取TTS辅助脚本路径
    const ttsHelperPath = path.join(process.cwd(), "lib", "tts_helper.py");
    
    // 构建TTS命令
    let ttsCommand = `"${workingPython}" "${ttsHelperPath}"`;
    
    // 添加文本
    ttsCommand += ` --text "${text}"`;
    
    // 添加输出文件
    ttsCommand += ` --output "${outputFile}"`;
    
    // 添加语言
    ttsCommand += ` --language "${language}"`;
    
    // 选择模型
    if (model) {
      ttsCommand += ` --model "${model}"`;
    }
    
    // 添加引擎选择
    ttsCommand += ` --engine "${engine}"`;
    
    // 如果提供了参考音频进行声音克隆
    if (speakerWav && await fs.pathExists(speakerWav)) {
      console.log(`🎭 使用参考音频进行声音风格模拟: ${speakerWav}`);
      ttsCommand += ` --speaker_wav "${speakerWav}"`;
    }
    
    console.log(`🚀 执行TTS命令: ${ttsCommand}`);
    
    // 执行TTS
    execSync(ttsCommand, { stdio: 'inherit' });
    
    // 检查输出文件
    if (await fs.pathExists(outputFile)) {
      const stats = await fs.stat(outputFile);
      console.log(`✅ 语音生成成功: ${outputFile} (${(stats.size / 1024).toFixed(2)} KB)`);
      return outputFile;
    } else {
      throw new Error("输出文件未生成");
    }
    
  } catch (error) {
    console.error("❌ 文本转语音失败:", error.message);
    throw error;
  }
}

/**
 * 声音克隆
 */
async function cloneVoice(config) {
  const { referenceAudio, targetTexts, outputDir, language = "zh", engine = "auto" } = config;
  
  console.log(`🎭 开始声音克隆...`);
  console.log(`🎵 参考音频: ${referenceAudio}`);
  console.log(`📝 目标文本数量: ${targetTexts.length}`);
  
  // 检查参考音频文件
  if (!await fs.pathExists(referenceAudio)) {
    throw new Error(`参考音频文件不存在: ${referenceAudio}`);
  }
  
  // 确保输出目录存在
  await fs.ensureDir(outputDir);
  
  const results = [];
  
  for (let i = 0; i < targetTexts.length; i++) {
    const text = targetTexts[i];
    const outputFile = path.join(outputDir, `cloned_voice_${i + 1}.wav`);
    
    console.log(`\n[${i + 1}/${targetTexts.length}] 克隆语音...`);
    
    try {
      const result = await textToSpeech({
        text,
        outputFile,
        speakerWav: referenceAudio,
        language,
        engine
      });
      
      results.push({
        text,
        outputFile: result,
        success: true
      });
      
    } catch (error) {
      console.error(`❌ 第 ${i + 1} 个文本克隆失败:`, error.message);
      results.push({
        text,
        outputFile: null,
        success: false,
        error: error.message
      });
    }
  }
  
  // 统计结果
  const successCount = results.filter(r => r.success).length;
  console.log(`\n📊 声音克隆完成: ${successCount}/${targetTexts.length} 成功`);
  
  return results;
}

/**
 * 批量文本转语音
 */
async function batchTextToSpeech(config) {
  const { texts, outputDir, model, language = "zh" } = config;
  
  console.log(`🎤 开始批量文本转语音...`);
  console.log(`📝 文本数量: ${texts.length}`);
  
  // 确保输出目录存在
  await fs.ensureDir(outputDir);
  
  const results = [];
  
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    const outputFile = path.join(outputDir, `tts_${i + 1}.wav`);
    
    console.log(`\n[${i + 1}/${texts.length}] 生成语音...`);
    
    try {
      const result = await textToSpeech({
        text,
        outputFile,
        model,
        language
      });
      
      results.push({
        text,
        outputFile: result,
        success: true
      });
      
    } catch (error) {
      console.error(`❌ 第 ${i + 1} 个文本转语音失败:`, error.message);
      results.push({
        text,
        outputFile: null,
        success: false,
        error: error.message
      });
    }
  }
  
  // 统计结果
  const successCount = results.filter(r => r.success).length;
  console.log(`\n📊 批量TTS完成: ${successCount}/${texts.length} 成功`);
  
  return results;
}

/**
 * 音频格式转换
 */
async function convertAudioFormat(inputFile, outputFile, format = "wav") {
  console.log(`🔄 转换音频格式: ${inputFile} -> ${outputFile}`);
  
  try {
    // 使用FFmpeg转换格式
    const ffmpegCmd = `ffmpeg -i "${inputFile}" -acodec pcm_s16le -ar 22050 "${outputFile}" -y`;
    execSync(ffmpegCmd, { stdio: 'inherit' });
    
    if (await fs.pathExists(outputFile)) {
      console.log(`✅ 格式转换成功: ${outputFile}`);
      return outputFile;
    } else {
      throw new Error("转换后的文件未生成");
    }
  } catch (error) {
    console.error("❌ 音频格式转换失败:", error.message);
    throw error;
  }
}

/**
 * 主处理函数
 */
export async function runVoiceClone(config) {
  console.log("🎭 开始声音克隆任务...");
  
  try {
    // 检查TTS环境
    const ttsReady = await checkAndInstallTTS();
    if (!ttsReady) {
      throw new Error("TTS环境未就绪");
    }
    
    // 根据配置类型执行不同任务
    if (config.mode === "clone" && config.referenceAudio && config.targetTexts) {
      // 声音克隆模式
      console.log("🎭 执行声音克隆模式");
      const results = await cloneVoice({
        referenceAudio: config.referenceAudio,
        targetTexts: config.targetTexts,
        outputDir: config.outputDir || CONFIG.OUTPUT_DIR,
        language: config.language,
        engine: config.engine || "auto"
      });
      
      // 保存结果
      const resultFile = path.join(config.outputDir || CONFIG.OUTPUT_DIR, "clone_results.json");
      await fs.writeJson(resultFile, results, { spaces: 2 });
      console.log(`📄 结果已保存: ${resultFile}`);
      
      return results;
      
    } else if (config.mode === "tts" && config.texts) {
      // 批量TTS模式
      console.log("🎤 执行批量TTS模式");
      const results = await batchTextToSpeech({
        texts: config.texts,
        outputDir: config.outputDir || CONFIG.OUTPUT_DIR,
        model: config.model,
        language: config.language
      });
      
      // 保存结果
      const resultFile = path.join(config.outputDir || CONFIG.OUTPUT_DIR, "tts_results.json");
      await fs.writeJson(resultFile, results, { spaces: 2 });
      console.log(`📄 结果已保存: ${resultFile}`);
      
      return results;
      
    } else if (config.mode === "single" && config.text) {
      // 单个TTS模式
      console.log("🎤 执行单个TTS模式");
      const outputFile = config.outputFile || path.join(CONFIG.OUTPUT_DIR, "single_tts.wav");
      
      const result = await textToSpeech({
        text: config.text,
        outputFile,
        model: config.model,
        language: config.language,
        speakerWav: config.speakerWav
      });
      
      return { outputFile: result, success: true };
      
    } else {
      throw new Error("无效的配置模式，请检查config.mjs中的voice-clone配置");
    }
    
  } catch (error) {
    console.error("❌ 声音克隆任务失败:", error.message);
    throw error;
  }
}

// 导出工具函数
export {
  checkAndInstallTTS,
  listAvailableModels,
  textToSpeech,
  cloneVoice,
  batchTextToSpeech,
  convertAudioFormat
};
