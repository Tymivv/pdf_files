import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import Button  from '../common/Button/Button';
import FileUploader  from '../common/FileUploader/FileUploader';
import DownloadLink from "../common/DownloadLink/DownloadLink";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker.entry";

// Налаштовуємо PDF.js Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;


const SplitPDF = () => {
  const [file, setFile] = useState(null);
  const [processedPDF, setProcessedPDF] = useState(null);
  const [jpegQuality, setJpegQuality] = useState(0.7); // Початкова якість JPEG
  const [convertToGrayscale, setConvertToGrayscale] = useState(false); // Контроль чорно-білого перетворення
  const [loading, setLoading] = useState(false);


  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const processPDF = async (file) => {
    setLoading(true);
    const pdfData = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const imagesList = [];
    const scale = 1.0; // Масштаб для Canvas

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;

      if (convertToGrayscale) {
        // Чорно-біла обробка
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        for (let j = 0; j < pixels.length; j += 4) {
          const gray = 0.299 * pixels[j] + 0.587 * pixels[j + 1] + 0.114 * pixels[j + 2];
          pixels[j] = gray; // R
          pixels[j + 1] = gray; // G
          pixels[j + 2] = gray; // B
        }
        ctx.putImageData(imageData, 0, 0);
      }

      // Зберігаємо зображення у формат JPEG із вибраною якістю
      const img = canvas.toDataURL("image/jpeg", jpegQuality);
      imagesList.push(img);
    }

    setLoading(false);
    return imagesList;
  };

  const generatePDF = async (imageUrls) => {
    const newPdfDoc = await PDFDocument.create();

    for (const imgUrl of imageUrls) {
      const imgBytes = await fetch(imgUrl).then((res) => res.arrayBuffer());
      const img = await newPdfDoc.embedJpg(imgBytes);

      const page = newPdfDoc.addPage([img.width, img.height]);
      page.drawImage(img, {
        x: 0,
        y: 0,
        width: img.width,
        height: img.height,
      });
    }

    const pdfBytes = await newPdfDoc.save();
    return new Blob([pdfBytes], { type: "application/pdf" });
  };

  const handleProcessPDF = async () => {
    if (!file) return;

    setLoading(true);
    const images = await processPDF(file);

    // Генеруємо PDF (зменшений або чорно-білий залежно від чекбокса)
    const processedPDFBlob = await generatePDF(images);
    setProcessedPDF(processedPDFBlob);
    setLoading(false);
  };

  return (
    <>
      <h1>Зменшення розміру PDF</h1>
      <FileUploader onChange={handleFileChange} accept=".pdf" />
      <div style={{ margin: "20px 0" }}>
        <label htmlFor="jpegQuality">
          Зменшити розмір: {Math.round(jpegQuality * 100)}%
        </label>
        <input
          id="jpegQuality"
          type="range"
          min="0"
          max="100"
          step="1"
          value={jpegQuality * 100}
          onChange={(e) => setJpegQuality(e.target.value / 100)}
          style={{ width: "100%" }}
        />
      </div>
      <div style={{ margin: "20px 0" }}>
        <label>
          <input
            type="checkbox"
            checked={convertToGrayscale}
            onChange={(e) => setConvertToGrayscale(e.target.checked)}
          />
          <span className="make_pages_size_text">Зробити монохромним</span>
        </label>
      </div>
      <Button onClick={handleProcessPDF} disabled={loading}>{loading ? "Обробка..." : "Обробити PDF"}</Button>
      {processedPDF && (
        <DownloadLink href={URL.createObjectURL(processedPDF)} download="processed.pdf">
            Завантажити новий PDF
        </DownloadLink>
      )}
    </>
  );
};

export default SplitPDF;
