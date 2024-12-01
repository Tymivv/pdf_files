import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import Button  from '../common/Button/Button';
import FileControls  from '../common/FileControls/FileControls';
import FileUploader  from '../common/FileUploader/FileUploader';
import DownloadLink from "../common/DownloadLink/DownloadLink";

const ImageToPDF = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [pdfBlob, setPdfBlob] = useState(null);

  // Обробка вибору файлів
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
  };

  // Зміна порядку файлів
  const moveFile = (fromIndex, toIndex) => {
    const updatedFiles = [...selectedFiles];
    const [movedFile] = updatedFiles.splice(fromIndex, 1);
    updatedFiles.splice(toIndex, 0, movedFile);
    setSelectedFiles(updatedFiles);
  };

  // Видалення файлу
  const deleteFile = (indexToRemove) => {
    const updatedFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
    setSelectedFiles(updatedFiles);
  };

  // Створення PDF із зображень
  const createPDF = async () => {
    const pdfDoc = await PDFDocument.create();

    for (const file of selectedFiles) {
      const fileData = await file.arrayBuffer();
      const imageExt = file.name.split(".").pop().toLowerCase();
      let embeddedImage;

      if (imageExt === "jpg" || imageExt === "jpeg") {
        embeddedImage = await pdfDoc.embedJpg(fileData);
      } else if (imageExt === "png") {
        embeddedImage = await pdfDoc.embedPng(fileData);
      } else {
        alert(`Формат файлу ${file.name} не підтримується.`);
        continue;
      }

      const { width, height } = embeddedImage.scale(1);
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });
    }

    const pdfBytes = await pdfDoc.save();
    setPdfBlob(new Blob([pdfBytes], { type: "application/pdf" }));
  };

    return (
    <div >
        <h1>Створення PDF з зображень</h1>
        <FileUploader onChange={handleFileChange} accept="image/jpeg, image/jpg, image/png" multiple />
        {selectedFiles.length > 0 && (
        <div style={{ marginTop: "20px" }}>
        <h2 style={{color: "#4CAF50"}}>Вибрані зображення</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
            {selectedFiles.map((file, index) => (
            <li
                key={file.name}
                style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "10px",
                color: "#4CAF50",
                }}
            >
                <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                style={{
                    width: "100px",
                    height: "auto",
                    marginRight: "10px",
                    border: "2px solid #ccc",
                    borderRadius: "5px",
                    boxShadow:"0 8px 24px #959da533",
                }}
                />
                <span>{file.name}</span>
                <FileControls
                    index={index}
                    moveFile={moveFile}
                    deleteFile={deleteFile}
                    totalFiles={selectedFiles.length}
                    />
            </li>
            ))}
        </ul>
        </div>)}
        <Button onClick={createPDF} disabled={selectedFiles.length === 0}>Створити PDF</Button>
        {pdfBlob && (
        <DownloadLink href={URL.createObjectURL(pdfBlob)} download="newFile.pdf">
            Завантажити PDF
        </DownloadLink>
        )}
    </div>
  );
};

export default ImageToPDF;
