import React, { useState } from "react";
import Button  from '../common/Button/Button';
import FileUploader  from '../common/FileUploader/FileUploader';


const EncodeDecodePDFBase64 = () => {
  const [base64String, setBase64String] = useState("");
  const [fileName, setFileName] = useState("");
  // const [decodedPDF, setDecodedPDF] = useState(null);

  // Функція для кодування PDF у Base64
  const encodeToBase64 = (file) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(",")[1]; // Видаляємо префікс "data:application/pdf;base64,"
      setBase64String(base64);
    };
    reader.onerror = (error) => {
      console.error("Помилка при читанні файлу:", error);
    };
  };

  // Обробка вибору файлу для кодування
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setFileName(file.name.replace(".pdf", "")); // Зберігаємо ім'я без .pdf
      encodeToBase64(file);
    } else {
      alert("Будь ласка, виберіть PDF-файл.");
    }
  };

  // Функція для копіювання Base64 у буфер обміну
  const copyToClipboard = () => {
    navigator.clipboard.writeText(base64String).then(() => {
      alert("Base64 скопійовано!");
    });
  };

  // Функція для збереження Base64 у .txt
  const downloadBase64 = () => {
    const blob = new Blob([base64String], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}_base64.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Функція для розшифрування Base64 у PDF
  const decodeFromBase64 = () => {
      if (base64String === "") {
      alert("Спочатку вставте Base64 для розшифрування!");
      return;
    }
    try {
      const pdfData = `data:application/pdf;base64,${base64String}`;
      const link = document.createElement("a");
    link.href = pdfData;
    link.download = `${fileName}_decoded.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    } catch (error) {
      console.error("Помилка при розшифруванні Base64:", error);
      alert("Неправильний формат Base64!");
    }
  };

  return (
    // <div style={{ padding: "20px", textAlign: "center" }}>
    <div>
      <h1>Кодування та розшифрування PDF в Base64</h1>
      {/* Вибір PDF для кодування */}
      <FileUploader onChange={handleFileChange} accept="application/pdf" />

      {/* Відображення закодованого Base64 */}
      {base64String && (
        <div style={{ marginTop: "10px" }}>
          <textarea
            value={base64String}
            readOnly
            style={{ width: "80%", height: "200px", padding: "10px", margin: "10px" }}
          />          
          <Button onClick={copyToClipboard}>  Скопіювати Base64</Button>
          <Button onClick={downloadBase64}>   Завантажити Base64 (.txt)</Button>
        </div>
      )}
      {/* Введення Base64 для декодування */}
      <div style={{ marginTop: "10px" }}>
        <h3>Вставте Base64 для розшифрування</h3>
        <textarea
          onChange={(e) => setBase64String(e.target.value)}
          value={base64String}
          placeholder="Вставте Base64 тут..."
          style={{ width: "80%", height: "200px", padding: "10px", margin: "10px" }}
        />
        <br />
        {base64String.length>0 && (
        <Button onClick={decodeFromBase64}>  Розшифрувати в PDF</Button>
        )}
      </div>
    </div>
  );
};

export default EncodeDecodePDFBase64;
