import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import Button  from '../common/Button/Button';
import FileUploader  from '../common/FileUploader/FileUploader';
import DownloadLink from "../common/DownloadLink/DownloadLink";

import "../../App.css";
import pdfWorker from "pdfjs-dist/build/pdf.worker.entry";
import { PDFDocument } from "pdf-lib";

// Налаштовуємо PDF.js Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const ReducePDF = () => {
  const [file, setFile] = useState(null);
  const [processedPDF, setProcessedPDF] = useState(null);
  const [pageRange, setPageRange] = useState(""); // Сторінки для нового PDF
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  // Парсер сторінок (1,3-6 => [1, 3, 4, 5, 6])
  const parsePageRange = (range) => {
    const pages = [];
    const ranges = range.split(",").map((part) => part.trim());

    for (const part of ranges) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
      } else {
        pages.push(Number(part));
      }
    }

    return pages;
  };

  const createNewPDF = async (file, pagesToInclude) => {
    setLoading(true);
  
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const totalPages = pdfDoc.getPageCount(); // Отримуємо кількість сторінок у PDF
    const newPdfDoc = await PDFDocument.create();
  
    // Копіює вибрані сторінки до нового PDF
    for (const pageNumber of pagesToInclude) {
      if (pageNumber > 0 && pageNumber <= totalPages) {
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNumber - 1]);
        newPdfDoc.addPage(copiedPage);
      } else {
        alert(`Сторінка ${pageNumber} не існує у цьому PDF файлі.`);
      }
    }
  
    const pdfBytes = await newPdfDoc.save();
    setLoading(false);
    return new Blob([pdfBytes], { type: "application/pdf" });
  };
  

  const handleCreatePDF = async () => {
    if (!file || !pageRange) return;

    const pages = parsePageRange(pageRange);

    if (pages.some((p) => isNaN(p) || p <= 0)) {
      alert("Не коректний формат сторінок!");
      return;
    }

    const newPDF = await createNewPDF(file, pages);
    setProcessedPDF(newPDF);
  };

  return (
    <>
      <h1>Роз'єднання PDF</h1>
      <FileUploader onChange={handleFileChange} accept=".pdf" />
      <div style={{ margin: "20px 0" }}>
        <label>
          Введіть сторінки (наприклад, 1,3-6):
          <input
            type="text"
            value={pageRange}
            onChange={(e) => setPageRange(e.target.value)}
            style={{ marginLeft: "10px", padding: "5px", width: "200px",  borderRadius:"6px" }}
          />
        </label>
      </div>
      <Button onClick={handleCreatePDF} disabled={loading}>{loading ? "Обробка..." : "Створити новий PDF"}</Button>
      {processedPDF && (
        <DownloadLink href={URL.createObjectURL(processedPDF)} download="selected-pages.pdf">
          Завантажити новий PDF
        </DownloadLink>
      )}
    </>
  );
};

export default ReducePDF;
