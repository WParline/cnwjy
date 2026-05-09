import { useEffect, useRef, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import { Canvas as FabricCanvas } from "fabric";

type HistoryItem = {
  image: string;
  actual: number;
  predicted: number;
  correct: boolean;
};

export default function DigitRecognizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const modelRef = useRef<tf.LayersModel | null>(null);
  const [result, setResult] = useState<{ digit: number; confidence: number } | null>(null);
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
    if (!canvasRef.current || fabricRef.current || loading) return;
    const canvas = new FabricCanvas(canvasRef.current, {
      backgroundColor: "#ffffff",
      isDrawingMode: true,
      width: 504,
      height: 504,
    });
    canvas.freeDrawingBrush.width = 40;
    canvas.freeDrawingBrush.color = "#000000";
    canvas.renderAll();
    fabricRef.current = canvas;
    canvas.on("mouse:up", doPredict);
    return () => { canvas.dispose(); };
  }, [loading]);

  const doPredict = useCallback(async () => {
    const model = modelRef.current;
    const htmlCanvas = canvasRef.current;
    if (!model || !htmlCanvas) return;

    try {
      const tensor = tf.tidy(() => {
        let img = tf.browser.fromPixels(htmlCanvas, 1);
        img = img.resizeNearestNeighbor([28, 28]);
        const t = tf.fill([28, 28, 1], 255, "int32");
        img = t.sub(img);
        return img
          .expandDims()
          .toFloat()
          .div(255.0);
      });
      const results = await model.predict(tensor) as tf.Tensor;
      const data = Array.from(await results.data());
      let maxIdx = 0;
      let maxVal = data[0];
      for (let i = 1; i < data.length; i++) {
        if (data[i] > maxVal) {
          maxVal = data[i];
          maxIdx = i;
        }
      }
      setResult({ digit: maxIdx, confidence: maxVal });
      tensor.dispose();
      results.dispose();
    } catch (e) {
      console.error("Prediction error:", e);
    }
  }, []);

  const clearCanvas = useCallback(() => {
    if (!fabricRef.current) return;
    fabricRef.current.clear();
    fabricRef.current.backgroundColor = "#ffffff";
    fabricRef.current.renderAll();
    setResult(null);
  }, []);

  const accept = useCallback(() => {
    if (!fabricRef.current || result === null) return;
    const img = fabricRef.current.toDataURL({ format: "png", multiplier: 1 });
    setHistory((h) => [...h, { image: img, actual: result.digit, predicted: result.digit, correct: true }]);
    setAccepted((a) => a + 1);
    setTotal((t) => t + 1);
    fabricRef.current.clear();
    fabricRef.current.backgroundColor = "#ffffff";
    fabricRef.current.renderAll();
    setResult(null);
  }, [result]);

  const reject = useCallback(() => {
    if (!fabricRef.current || result === null) return;
    const input = prompt("请输入正确的数字（0-9）：");
    if (input === null) return;
    const actual = parseInt(input, 10);
    if (isNaN(actual) || actual < 0 || actual > 9) return;
    const img = fabricRef.current.toDataURL({ format: "png", multiplier: 1 });
    setHistory((h) => [...h, { image: img, actual, predicted: result.digit, correct: false }]);
    setTotal((t) => t + 1);
    fabricRef.current.clear();
    fabricRef.current.backgroundColor = "#ffffff";
    fabricRef.current.renderAll();
    setResult(null);
  }, [result]);

  const downloadAll = useCallback(() => {
    history.forEach((item, i) => {
      const a = document.createElement("a");
      a.href = item.image;
      a.download = `记录${i + 1}-实际${item.actual}-预测${item.predicted}.png`;
      a.click();
    });
  }, [history]);

  const downloadWrong = useCallback(() => {
    history.filter((h) => !h.correct).forEach((item, i) => {
      const a = document.createElement("a");
      a.href = item.image;
      a.download = `错误${i + 1}-实际${item.actual}-预测${item.predicted}.png`;
      a.click();
    });
  }, [history]);

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
    <div style={{ maxWidth: 540, margin: "0 auto" }}>
      <div style={{
        background: "rgb(245, 247, 227)",
        borderRadius: 12,
        padding: 24,
        boxShadow: "5px 16px 23px 5px rgba(197,199,173,0.5)",
      }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ marginBottom: 8, fontSize: 20 }}>!欢迎来到德莱联盟!</h2>
          <p style={{ fontSize: 14, marginBottom: 12, opacity: 0.7 }}>把数字写在正中央准确率更高哦~</p>
          <canvas
            ref={canvasRef}
            width={504}
            height={504}
            style={{
              border: "1px solid #0c0c0c",
              borderRadius: 8,
              maxWidth: "100%",
              cursor: "crosshair",
            }}
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
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgb(172, 198, 223)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgb(116, 180, 245)"; }}
            >
              清空
            </button>
          </div>
          <h3 style={{ marginTop: 12, fontSize: 22, minHeight: 32 }}>
            {result
              ? `识别结果为: ${result.digit}  可信度: ${result.confidence.toFixed(3)}`
              : "识别结果为: null"}
          </h3>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={accept}
              disabled={result === null}
              style={{
                flex: 1,
                padding: "10px 0",
                background: result === null ? "#ccc" : "rgb(116, 180, 245)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 16,
                cursor: result === null ? "not-allowed" : "pointer",
              }}
            >
              识别成功
            </button>
            <button
              onClick={reject}
              disabled={result === null}
              style={{
                flex: 1,
                padding: "10px 0",
                background: result === null ? "#ccc" : "rgb(244, 109, 67)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 16,
                cursor: result === null ? "not-allowed" : "pointer",
              }}
            >
              识别失败
            </button>
          </div>
          <p style={{ marginTop: 8, fontSize: 18 }}>
            识别准确率: {accuracy}{total > 0 ? `% (${accepted}/${total})` : ""}
          </p>
        </div>
      </div>

      {history.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 20, marginBottom: 12 }}>识别历史记录</h3>
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
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <img
                  src={item.image}
                  alt={`预测${item.predicted}`}
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
