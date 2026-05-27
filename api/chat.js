/**
 * Vercel Serverless Function — MiniMax AI 代理接口
 * POST /api/chat
 *
 * 功能：接收前端发来的消息，附加 API Key 后转发给 MiniMax，返回 AI 响应。
 * 安全：API Key 存储在环境变量 MINIMAX_API_KEY 中，前端无法获取。
 */

export default async function handler(req, res) {
  // 仅允许 POST 请求
  if (req.method !== "POST") {
    return res.status(405).json({ error: "仅支持 POST 请求" });
  }

  const apiKey = process.env.MINIMAX_API_KEY;

  if (!apiKey) {
    console.error("MINIMAX_API_KEY 环境变量未设置");
    return res.status(500).json({ error: "服务端配置错误，请联系管理员" });
  }

  // 校验请求体
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "请提供有效的 messages 参数" });
  }

  try {
    const response = await fetch("https://api.minimax.io/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "MiniMax-M2.7",
        stream: false,
        max_tokens: 512,
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        frequency_penalty: 0.5,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("MiniMax API 错误:", response.status, errorText);
      return res.status(response.status).json({
        error: "AI 服务暂时不可用，请稍后再试",
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("请求 MiniMax API 失败:", err);
    return res.status(500).json({ error: "请求 AI 服务失败，请检查网络连接" });
  }
}
