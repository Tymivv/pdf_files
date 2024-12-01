import React, { useState } from "react";
import FileUploader  from '../common/FileUploader/FileUploader';
import "../../App.css";
import * as pdfjsLib from "pdfjs-dist/webpack";
import pdfWorker from "pdfjs-dist/build/pdf.worker.entry";

// Налаштування PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PDFToImages = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
        setSelectedFile(file);
        await convertPDFToImages(file);
    }
    };

    const convertPDFToImages = async (file) => {
    setLoading(true);
    setImages([]);
    const pdfData = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

    const imagesList = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 }); // Збільшення масштабу для кращої якості
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
        canvasContext: context,
        viewport,
        }).promise;

      // Отримання зображення у форматі JPEG
        const imgData = canvas.toDataURL("image/jpeg");
        imagesList.push({ page: i, data: imgData });
    }

    setImages(imagesList);
    setLoading(false);
    };

    return (
    <div >
        <h1>Перетворення PDF у зображення</h1>
        <FileUploader onChange={handleFileChange} accept="application/pdf" />
        {loading && <p>Обробка PDF...</p>}
        {!loading && images.length > 0 && (
        <div>
            <h3>Сторінки PDF</h3>
            <div style={{ 
                display: "inline-block"
                }}>
            {images.map((img, index) => (
                <div
                key={index}
                style={{
                    position: "relative",
                    display: "inline-block",
                    textAlign: "center",
                }}
                >
                <img
                    src={img.data}
                    alt={`Page ${img.page}`}
                    style={{
                    width: "150px",
                    height: "auto",
                    margin: "10px",
                    border: "2px solid #ccc",
                    borderRadius: "5px",
                    boxShadow:"0 8px 24px #959da533",
                  }}
                />
                <a
                  className="imageLink"
                  href={img.data}
                  download={`page-${img.page}.jpeg`}
                  style={{
                    position: "absolute",
                    bottom: "23px",
                    right: "18px",
                    display: "inline-block",
                    width: "32px",
                    height: "32px",
                    backgroundColor: "rgba(0, 128, 0, 0.3)", 
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                  }}
                  title="Завантажити"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="green" 
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="20px"
                    height="20px"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <polyline points="19 12 12 19 5 12" />
                    <line x1="5" y1="23" x2="19" y2="23" /> 
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFToImages;
