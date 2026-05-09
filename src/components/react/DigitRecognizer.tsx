import { useEffect, useRef, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import JSZip from "jszip";

type HistoryItem = {
  image: string;
  actual: number;
  predicted: number;
  correct: boolean;
};

export default function DigitRecognizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const modelRef = useRef<tf.LayersModel | null>(null);
  const drawingRef = useRef(false);
  const hasDrawnRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  const [result, setResult] = useState<{ digit: number; confidence: number; snapshot: string } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [accepted, setAccepted] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const model = await tf.loadLayersModel("/models/model.json");
        if (!cancelled) {
          modelRef.current = model;
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) setError("模型加载失败: " + (e instanceof Error ? e.message : String(e)));
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 504, 504);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 28;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;
  }, [loading]);

  const getPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const takeSnapshot = useCallback((): string => {
    return canvasRef.current!.toDataURL("image/png");
  }, []);

  const doPredict = useCallback(async () => {
    const model = modelRef.current;
    const canvas = canvasRef.current;
    if (!model || !canvas) return;

    try {
      const tensor = tf.tidy(() => {
        let img = tf.browser.fromPixels(canvas, 1);
        img = img.resizeNearestNeighbor([28, 28]);
        const t = tf.fill([28, 28, 1], 255, "int32");
        img = t.sub(img);
        return img
          .expandDims()
          .toFloat()
          .div(255.0);
      });
      const out = model.predict(tensor) as tf.Tensor;
      const data = Array.from(await out.data());
      let maxIdx = 0;
      let maxVal = data[0];
      for (let i = 1; i < data.length; i++) {
        if (data[i] > maxVal) {
          maxVal = data[i];
          maxIdx = i;
        }
      }
      const snapshot = takeSnapshot();
      setResult({ digit: maxIdx, confidence: maxVal, snapshot });
      tensor.dispose();
      out.dispose();
    } catch (e) {
      console.error("Prediction error:", e);
    }
  }, [takeSnapshot]);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    drawingRef.current = true;
    lastRef.current = getPos(e);
  }, [getPos]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !ctxRef.current) return;
    const pos = getPos(e);
    hasDrawnRef.current = true;
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(lastRef.current!.x, lastRef.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastRef.current = pos;
  }, [getPos]);

  const onMouseUp = useCallback(() => {
    drawingRef.current = false;
    lastRef.current = null;
    if (hasDrawnRef.current) {
      hasDrawnRef.current = false;
      doPredict();
    }
  }, [doPredict]);

  const clearCanvas = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 504, 504);
    setResult(null);
  }, []);

  const accept = useCallback(() => {
    if (!result) return;
    setHistory((h) => [
      ...h,
      { image: result.snapshot, actual: result.digit, predicted: result.digit, correct: true },
    ]);
    setAccepted((a) => a + 1);
    setTotal((t) => t + 1);
    clearCanvas();
  }, [result, clearCanvas]);

  const reject = useCallback(() => {
    if (!result) return;
    const input = prompt("请输入正确的数字（0-9）：");
    if (input === null) return;
    const actual = parseInt(input, 10);
    if (isNaN(actual) || actual < 0 || actual > 9) return;
    setHistory((h) => [
      ...h,
      { image: result.snapshot, actual, predicted: result.digit, correct: false },
    ]);
    setTotal((t) => t + 1);
    clearCanvas();
  }, [result, clearCanvas]);

  const stamp = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  };

  const downloadAsZip = useCallback((items: HistoryItem[], label: string) => {
    if (items.length === 0) return;
    const zip = new JSZip();
    items.forEach((item, i) => {
      zip.file(
        `记录${i + 1}-实际${item.actual}-预测${item.predicted}.png`,
        item.image.split(";base64,")[1],
        { base64: true }
      );
    });
    const filename = `${stamp()}_${label}.zip`;
    zip.generateAsync({ type: "blob" }).then((content) => {
      const a = document.createElement("a");
      a.download = filename;
      a.href = URL.createObjectURL(content);
      a.style.display = "none";
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }, []);

  const downloadAll = useCallback(() => {
    downloadAsZip(history, "手写数字识别记录");
  }, [history, downloadAsZip]);

  const downloadWrong = useCallback(() => {
    downloadAsZip(
      history.filter((h) => !h.correct),
      "手写数字识别错误"
    );
  }, [history, downloadAsZip]);

  const accuracy = total > 0 ? ((accepted / total) * 100).toFixed(1) : "—";

  if (error) {
    return (
      <div class="flex items-center justify-center py-20 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div class="flex items-center justify-center py-20">
        <p class="text-lg opacity-70">正在加载模型...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 540, margin: "0 auto", color: "var(--fg)" }}>
      <div style={{
        background: "var(--card)",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
      }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ marginBottom: 8, fontSize: 20, color: "var(--fg)" }}>!欢迎来到德莱联盟!</h2>
          <p style={{ fontSize: 14, marginBottom: 12, color: "var(--fg)", opacity: 0.7 }}>把数字写在正中央准确率更高哦~</p>
          <canvas
            ref={canvasRef}
            width={504}
            height={504}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 8,
              maxWidth: "100%",
              touchAction: "none",
              cursor: "crosshair",
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />
          <div style={{ marginTop: 12 }}>
            <button
              onClick={clearCanvas}
              style={{
                width: "100%",
                padding: "10px 0",
                background: "rgb(116, 180, 245)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              清空
            </button>
          </div>
          <h3 style={{ marginTop: 12, fontSize: 22, minHeight: 32, color: "var(--fg)" }}>
            {result
              ? `识别结果为: ${result.digit}  可信度: ${result.confidence.toFixed(3)}`
              : "识别结果为: null"}
          </h3>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={accept}
              disabled={!result}
              style={{
                flex: 1,
                padding: "10px 0",
                background: !result ? "#ccc" : "rgb(116, 180, 245)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 16,
                cursor: !result ? "not-allowed" : "pointer",
              }}
            >
              识别成功
            </button>
            <button
              onClick={reject}
              disabled={!result}
              style={{
                flex: 1,
                padding: "10px 0",
                background: !result ? "#ccc" : "rgb(244, 109, 67)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 16,
                cursor: !result ? "not-allowed" : "pointer",
              }}
            >
              识别失败
            </button>
          </div>
          <p style={{ marginTop: 8, fontSize: 18, color: "var(--fg)" }}>
            识别准确率: {accuracy}{total > 0 ? `% (${accepted}/${total})` : ""}
          </p>
        </div>
      </div>

      {history.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 20, marginBottom: 12, color: "var(--fg)" }}>识别历史记录</h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button
              onClick={downloadAll}
              style={{
                flex: 1,
                padding: "8px 0",
                background: "rgb(116, 180, 245)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              下载全部图片
            </button>
            <button
              onClick={downloadWrong}
              style={{
                flex: 1,
                padding: "8px 0",
                background: "rgb(244, 109, 67)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              下载错误图片
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {[...history].reverse().map((item, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <img
                  src={item.image}
                  alt={`实际${item.actual} 预测${item.predicted}`}
                  style={{ width: "100%", display: "block" }}
                />
                <div
                  style={{
                    padding: "6px 8px",
                    fontSize: 12,
                    textAlign: "center",
                    background: item.correct ? "rgb(166,217,106)" : "rgb(244,109,67)",
                    color: "#fff",
                  }}
                >
                  实际:{item.actual} 预测:{item.predicted}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
