import React, { useState, useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import * as pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
import { PDFDocument } from "pdf-lib";
import Button from "../common/Button/Button";
import FileUploader from "../common/FileUploader/FileUploader";
import style from "../../App.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

function PdfAnnotator() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);

  // Кількість сторінок і поточна сторінка
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Інструмент і налаштування
  const [tool, setTool] = useState("pen"); // "pen", "eraser", "line", "rectangle", "circle"
  const [color, setColor] = useState("#ff0000");
  const [lineWidth, setLineWidth] = useState(3);

  // Прозорість (alpha)
  const [alpha, setAlpha] = useState(1); // 1 = непрозоре, 0 = повністю прозоре

  // Чи заливати прямокутник/коло
  const [fillShape, setFillShape] = useState(false);

  // У shapesByPage зберігаємо фігури окремо для кожної сторінки:
  // {
  //   1: [ {...shape1}, {...shape2}, ... ],
  //   2: [ ... ],
  //   ...
  // }
  const [shapesByPage, setShapesByPage] = useState({});

  // Canvas
  const pdfCanvasRef = useRef(null);   // Canvas для PDF
  const drawCanvasRef = useRef(null);  // Прозорий canvas для малювання

  // Стан малювання (динамічний прев’ю)
  const [isDrawing, setIsDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);

  // Поточні координати (для прев’ю)
  const [currentX, setCurrentX] = useState(0);
  const [currentY, setCurrentY] = useState(0);

  // Масив точок (тільки для "pen" / "eraser")
  const [points, setPoints] = useState([]);

  /**
   * Завантаження PDF-файлу
   */
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPdfFile(file);

    const arrayBuf = await file.arrayBuffer();
    setPdfData(arrayBuf);
  };

  /**
   * Ініціалізація PDF.js
   */
  useEffect(() => {
    if (!pdfData) return;
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    loadingTask.promise.then((loadedPdf) => {
      setPdfDoc(loadedPdf);
      setNumPages(loadedPdf.numPages);
      setCurrentPage(1); // За замовчуванням — сторінка 1
    });
  }, [pdfData]);

  /**
   * Рендеримо поточну сторінку (pdfDoc + currentPage)
   */
  useEffect(() => {
    if (!pdfDoc || !currentPage) return;
    (async () => {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale: 1 });

      // Canvas для PDF
      const pdfCanvas = pdfCanvasRef.current;
      pdfCanvas.width = viewport.width;
      pdfCanvas.height = viewport.height;

      const pdfCtx = pdfCanvas.getContext("2d");
      await page.render({ canvasContext: pdfCtx, viewport }).promise;

      // Прозорий canvas
      const overlayCanvas = drawCanvasRef.current;
      overlayCanvas.width = viewport.width;
      overlayCanvas.height = viewport.height;

      // Перемалювати збережені фігури для поточної сторінки
      reDrawAll();
    })();
  }, [pdfDoc, currentPage]);

  /**
   * Координати в просторі canvas (з урахуванням CSS, прокрутки тощо)
   */
  function getCanvasCoords(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const xClick = e.clientX - rect.left;
    const yClick = e.clientY - rect.top;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: xClick * scaleX,
      y: yClick * scaleY,
    };
  }

  /**
   * Початок малювання (onMouseDown)
   */
  const handleMouseDown = (e) => {
    setIsDrawing(true);

    const { x, y } = getCanvasCoords(e, drawCanvasRef.current);
    setStartX(x);
    setStartY(y);
    setCurrentX(x);
    setCurrentY(y);

    if (tool === "pen" || tool === "eraser") {
      setPoints([{ x, y }]);
    }
  };

  /**
   * Рух миші (динамічний прев’ю)
   */
  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const { x, y } = getCanvasCoords(e, drawCanvasRef.current);
    setCurrentX(x);
    setCurrentY(y);

    // Для pen / eraser — додаємо точки
    if (tool === "pen" || tool === "eraser") {
      setPoints((prev) => [...prev, { x, y }]);
    }

    // Перемальовуємо все + прев’ю поточної фігури
    reDrawAllAndPreview({ x, y });
  };

  /**
   * Завершення малювання (onMouseUp, onMouseLeave)
   */
  const handleMouseUp = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Фінальна точка
    let { x, y } = { x: currentX, y: currentY };
    if (e) {
      const coords = getCanvasCoords(e, drawCanvasRef.current);
      x = coords.x;
      y = coords.y;
    }

    // Формуємо shape
    let newShape = null;
    if (tool === "pen" || tool === "eraser") {
      newShape = {
        tool,
        color: tool === "eraser" ? "#ffffff" : color,
        alpha: tool === "eraser" ? 1 : alpha, // Для гумки можна залишити alpha=1, або враховувати поточне alpha
        lineWidth,
        points: [...points],
      };
    } else {
      // line, rectangle, circle
      newShape = {
        tool,
        color,
        alpha,
        lineWidth,
        x1: startX,
        y1: startY,
        x2: x,
        y2: y,
      };
      // Якщо це rectangle/circle, додаємо info про заливку
      if (tool === "rectangle" || tool === "circle") {
        newShape.fillShape = fillShape; 
      }
    }

    // Додаємо фігуру в shapesByPage для поточної сторінки
    setShapesByPage((prev) => {
      const copy = { ...prev };
      const pageShapes = copy[currentPage] || [];
      pageShapes.push(newShape);
      copy[currentPage] = pageShapes;
      return copy;
    });

    // Скидаємо points
    setPoints([]);
  };

  /**
   * Перемалювати всі фігури на поточній сторінці (без прев’ю)
   */
  const reDrawAll = () => {
    const overlayCanvas = drawCanvasRef.current;
    if (!overlayCanvas) return;

    const ctx = overlayCanvas.getContext("2d");
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    const pageShapes = shapesByPage[currentPage] || [];
    pageShapes.forEach((shape) => {
      drawShape(ctx, shape);
    });
  };

  /**
   * Перемалювати всі фігури + тимчасове прев’ю
   */
  const reDrawAllAndPreview = ({ x, y }) => {
    // Спочатку повний ререндер без прев’ю
    reDrawAll();

    // Потім малюємо прев’ю “поточної” фігури
    const overlayCanvas = drawCanvasRef.current;
    const ctx = overlayCanvas.getContext("2d");
    ctx.save();

    // Встановимо прозорість
    ctx.globalAlpha = alpha;

    if (tool === "pen" || tool === "eraser") {
      // малюємо весь поточний штрих
      drawShape(ctx, {
        tool,
        color: tool === "eraser" ? "#ffffff" : color,
        alpha: tool === "eraser" ? 1 : alpha,
        lineWidth,
        points,
      });
    } else {
      // line / rectangle / circle
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";

      if (tool === "line") {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (tool === "rectangle") {
        const w = x - startX;
        const h = y - startY;
        // Якщо потрібно залити
        if (fillShape) {
          ctx.fillStyle = color;
          ctx.fillRect(startX, startY, w, h);
        }
        // Обведення
        ctx.strokeRect(startX, startY, w, h);
      } else if (tool === "circle") {
        const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2)) / 2;
        const cx = (startX + x) / 2;
        const cy = (startY + y) / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        // Якщо потрібно залити
        if (fillShape) {
          ctx.fillStyle = color;
          ctx.fill();
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  /**
   * Малюємо фігуру (для reDrawAll)
   */
  const drawShape = (ctx, shape) => {
    ctx.save();
    ctx.lineWidth = shape.lineWidth;
    ctx.lineCap = "round";
    ctx.strokeStyle = shape.color;
    // Налаштуємо прозорість
    ctx.globalAlpha = shape.alpha;

    if (shape.tool === "pen" || shape.tool === "eraser") {
      const pts = shape.points || [];
      if (pts.length < 2) {
        ctx.restore();
        return;
      }
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
    } else if (shape.tool === "line") {
      ctx.beginPath();
      ctx.moveTo(shape.x1, shape.y1);
      ctx.lineTo(shape.x2, shape.y2);
      ctx.stroke();
    } else if (shape.tool === "rectangle") {
      const w = shape.x2 - shape.x1;
      const h = shape.y2 - shape.y1;
      if (shape.fillShape) {
        ctx.fillStyle = shape.color;
        ctx.fillRect(shape.x1, shape.y1, w, h);
      }
      ctx.strokeRect(shape.x1, shape.y1, w, h);
    } else if (shape.tool === "circle") {
      const r = Math.sqrt(Math.pow(shape.x2 - shape.x1, 2) + Math.pow(shape.y2 - shape.y1, 2)) / 2;
      const cx = (shape.x1 + shape.x2) / 2;
      const cy = (shape.y1 + shape.y2) / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      if (shape.fillShape) {
        ctx.fillStyle = shape.color;
        ctx.fill();
      }
      ctx.stroke();
    }

    ctx.restore();
  };

  /**
   * Скасувати (Undo) останню фігуру на поточній сторінці
   */
  const handleUndo = () => {
    setShapesByPage((prev) => {
      const copy = { ...prev };
      if (!copy[currentPage]) return copy;
      if (copy[currentPage].length > 0) {
        copy[currentPage] = copy[currentPage].slice(0, -1);
      }
      return copy;
    });
  };

  /**
   * Очистити всі фігури на поточній сторінці
   */
  const handleClear = () => {
    setShapesByPage((prev) => {
      const copy = { ...prev };
      copy[currentPage] = []; // пустий масив
      return copy;
    });
  };

  /**
   * При зміні shapesByPage - перемальовуємо поточну сторінку
   */
  useEffect(() => {
    reDrawAll();
  }, [shapesByPage, currentPage]);

  /**
   * Зберегти PDF (лише для поточної сторінки)
   */
  const handleSavePdf = async () => {
    if (!pdfDoc || !pdfFile) return;

    // Остаточно перемалюємо, щоб на drawCanvas був повний малюнок
    reDrawAll();

    // 1) Отримуємо зображення з другого canvas
    const overlayCanvas = drawCanvasRef.current;
    const drawingDataUrl = overlayCanvas.toDataURL("image/png");

    // 2) Завантажуємо pdf-lib
    const pdfBytes = await pdfFile.arrayBuffer();
    const pdfLibDoc = await PDFDocument.load(pdfBytes);

    // 3) Беремо сторінку
    const page = pdfLibDoc.getPage(currentPage - 1);
    const { width, height } = page.getSize();

    // 4) Вбудовуємо зображення
    const pngImage = await pdfLibDoc.embedPng(drawingDataUrl);
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width,
      height,
    });

    // 5) Зберігаємо
    const newPdfBytes = await pdfLibDoc.save();
    const blob = new Blob([newPdfBytes], { type: "application/pdf" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "annotated_page_" + currentPage + ".pdf";
    link.click();
    URL.revokeObjectURL(url);
  };

  // =========================================
  //               РЕНДЕР
  // =========================================
  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1>Малювання на обраній сторінці</h1>
      <FileUploader onChange={handleFileChange} accept=".pdf" />

      {pdfDoc && (
        <div style={{ marginTop: 16, color: "#4CAF50" }}>
          {/* Вибір сторінки */}
          <div style={{ marginBottom: 8 }}>
            <span>Всього сторінок: {numPages}</span>
            <span style={{ marginLeft: 20 }}>Перейти на сторінку: </span>
            <select
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
            >
              {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Панель інструментів */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ marginRight: 10 }}>
              Інструмент:{" "}
              <select value={tool} onChange={(e) => setTool(e.target.value)}>
                <option value="pen">Перо</option>
                <option value="eraser">Гумка</option>
                <option value="line">Лінія</option>
                <option value="rectangle">Прямокутник</option>
                <option value="circle">Коло</option>
              </select>
            </label>

            {/* Колір (для всіх, крім гумки – в гумки він умовний) */}
            {tool !== "eraser" && (
              <label style={{ marginRight: 10 }}>
                Колір:{" "}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </label>
            )}

            {/* Прозорість */}
            <label style={{ marginRight: 10 }}>
              Прозорість ({alpha.toFixed(1)}):
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={alpha}
                onChange={(e) => setAlpha(Number(e.target.value))}
                style={{ verticalAlign: "middle", marginLeft: 5 }}
              />
            </label>

            {/* Товщина */}
            <label style={{ marginRight: 10 }}>
              Товщина:{" "}
              <input
                type="number"
                min={1}
                max={20}
                style={{ width: 40 }}
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
              />
            </label>

            {/* Чи заливати прямокутник / коло */}
            {(tool === "rectangle" || tool === "circle") && (
              <div style={{ margin: 10 }}>
                <input
                  type="checkbox"
                  checked={fillShape}
                  onChange={(e) => setFillShape(e.target.checked)}
                />
                {" "}Заповнювати фігуру
              </div>
            )}

            <Button onClick={handleUndo}>Відмінити</Button>
            <Button onClick={handleClear}>Очистити</Button>
            <Button onClick={handleSavePdf}>Зберегти PDF</Button>
          </div>

          {/* Блок canvasів */}
          <div
            style={{
              position: "relative",
              display: "inline-block",
              border: "1px solid #ccc",
            }}
          >
            <canvas ref={pdfCanvasRef} style={{ display: "block" }} />
            <canvas
              ref={drawCanvasRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                cursor:
                  tool === "pen" || tool === "eraser" ? "crosshair" : "default",
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default PdfAnnotator;
