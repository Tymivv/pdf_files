import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import * as UTIF from "utif";
import FileUploader  from '../common/FileUploader/FileUploader';
import Button  from '../common/Button/Button';



function TiffToPdf() {

    const [tiffFile, setTiffFile] = useState(null);
    const [loading, setLoading] = useState(false);

  /**
   * Обробка вибору файлу
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Переконаємося, що файл має тип image/tiff або .tif/.tiff
    if (
      !file.type.includes("tiff") &&
      !(file.name.endsWith(".tif") || file.name.endsWith(".tiff"))
    ) {
      alert("Будь ласка, оберіть файл формату .tif або .tiff");
      return;
    }
    setTiffFile(file);
  };

  /**
   * Головна функція "Конвертувати"
   */
  const handleConvert = async () => {
    setLoading(true);
    if (!tiffFile) {
      alert("Спочатку оберіть TIFF-файл");
      return;
    }

    try {
      // 1) Зчитаємо TIFF у буфер
      const arrayBuffer = await tiffFile.arrayBuffer();
      // 2) Парсимо з UTIF
      const ifds = UTIF.decode(arrayBuffer);

      // Створимо новий PDF
      const newPdf = await PDFDocument.create();

      // 3) Для кожної сторінки TIFF:
      for (let i = 0; i < ifds.length; i++) {
        const ifd = ifds[i];
        UTIF.decodeImage(arrayBuffer, ifd); // декодуємо зображення в ifd
        const rgba = UTIF.toRGBA8(ifd);     // отримуємо масив пікселів RGBA

        // 3.1) Створимо "тимчасовий" canvas і запишемо туди RGBA
        const w = ifd.width;
        const h = ifd.height;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");

        // Створимо ImageData з RGBA і покладемо його у canvas
        const imageData = new ImageData(new Uint8ClampedArray(rgba), w, h);
        ctx.putImageData(imageData, 0, 0);

        // 3.2) Отримуємо PNG-дані з canvas
        const pngUrl = canvas.toDataURL("image/png");
        // Перетворюємо на масив байтів, щоб вбудувати у PDF
        const pngBytes = await (await fetch(pngUrl)).arrayBuffer();

        // 3.3) Вбудовуємо png у PDF
        const embeddedPng = await newPdf.embedPng(pngBytes);

        // 3.4) Додаємо сторінку у PDF розміром зображення
        const page = newPdf.addPage([w, h]);

        // 3.5) Малюємо зображення на сторінку
        page.drawImage(embeddedPng, {
          x: 0,
          y: 0,
          width: w,
          height: h,
        });
      }

      // 4) Зберігаємо PDF
      const outPdfBytes = await newPdf.save();

      // 5) Завантажуємо
      const blob = new Blob([outPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = tiffFile.name.replace(/\.tiff?$/, "") + ".pdf"; 
      link.click();
      URL.revokeObjectURL(url);
      setLoading(false);
      setTiffFile(null);
    } catch (err) {
      console.error("Помилка конвертації:", err);
      alert("Сталася помилка при конвертації TIFF у PDF. Перевірте консоль.");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h1>Конвертація TIFF у PDF</h1>
      <FileUploader onChange={handleFileChange} accept=".tif,.tiff" />
      <Button onClick={handleConvert} disabled={!tiffFile}>{loading ? "Обробка..." : "Завантажити створений PDF"}</Button>
    </div>
  );
}

export default TiffToPdf;
