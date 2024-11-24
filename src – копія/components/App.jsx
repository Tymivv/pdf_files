import React, { useState } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit"; // Підключаємо fontkit для роботи зі шрифтами
import robotoFont from "./fonts/Roboto-Regular.ttf"; // Завантажте шрифт у проект

const App = () => {
  const [file, setFile] = useState(null);
  const [processedPDF, setProcessedPDF] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const convertToGrayscale = async () => {
    if (!file) {
      setError("Будь ласка, завантажте PDF-файл.");
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Додаємо підтримку шрифтів через fontkit
      pdfDoc.registerFontkit(fontkit);

      const fontBytes = await fetch(robotoFont).then((res) => res.arrayBuffer());
      const customFont = await pdfDoc.embedFont(fontBytes);

      const newPdfDoc = await PDFDocument.create();

      const pages = pdfDoc.getPages();

      for (const page of pages) {
        const { width, height } = page.getSize();

        // Створюємо нову сторінку
        const newPage = newPdfDoc.addPage([width, height]);

        // Додаємо текст кирилицею
        const text = "Це приклад тексту на чорно-білій сторінці.";

        newPage.drawText(text, {
          x: 50,
          y: height - 50,
          size: 12,
          font: customFont,
          color: rgb(0, 0, 0), // Чорний колір
        });
      }

      const pdfBytes = await newPdfDoc.save();
      setProcessedPDF(new Blob([pdfBytes], { type: "application/pdf" }));
      setError(null);
    } catch (err) {
      setError("Помилка при обробці файлу: " + err.message);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Конвертація PDF у чорно-білий</h1>
      <div style={{ marginBottom: "20px" }}>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          style={{ marginBottom: "10px" }}
        />
        <button onClick={convertToGrayscale} style={{ marginLeft: "10px" }}>
          Конвертувати у чорно-білий
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {processedPDF && (
        <div style={{ marginTop: "20px" }}>
          <a
            href={URL.createObjectURL(processedPDF)}
            download="grayscale.pdf"
            style={{
              textDecoration: "none",
              color: "white",
              backgroundColor: "#4CAF50",
              padding: "10px 20px",
              borderRadius: "5px",
            }}
          >
            Завантажити чорно-білий PDF
          </a>
        </div>
      )}
    </div>
  );
};

export default App;
