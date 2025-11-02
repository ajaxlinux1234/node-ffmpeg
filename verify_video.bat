@echo off
echo 检查原始视频时长:
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "input/ai-remove-watermark/手机洒上水了.mp4"

echo.
echo 检查输出视频时长:
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "output/ai-remove-watermark/手机洒上水了_blur_mask.mp4"

echo.
echo 生成第一帧截图验证:
ffmpeg -y -ss 0 -i "output/ai-remove-watermark/手机洒上水了_blur_mask.mp4" -vframes 1 "first_frame.png"

echo.
echo 验证完成！请查看 first_frame.png 截图
pause
