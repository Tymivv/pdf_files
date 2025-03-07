import React, { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import Button  from '../common/Button/Button';
import FileUploader  from '../common/FileUploader/FileUploader';



function PdfPageEditor() {
  // === Стани для вихідного PDF ===
  const [pdfFile, setPdfFile] = useState(null);    // Вихідний PDF-файл (File)
  const [pdfBytes, setPdfBytes] = useState(null);  // PDF у вигляді масиву байтів
  const [pdfDoc, setPdfDoc] = useState(null);      // PDFDocument (pdf-lib)
  const [numPages, setNumPages] = useState(0);     // Кількість сторінок у pdfDoc

  // === Сторінки для видалення ===
  const [pagesToRemove, setPagesToRemove] = useState({});

  // === Зображення, які будуть вставлені як нові сторінки ===
  // Зберігаємо масив об’єктів: { id, file, bytes, pageIndex, name }
  const [imagesToInsert, setImagesToInsert] = useState([]);

  // === Допоміжні стани для форми “Додати зображення” ===
  const [tempImageFile, setTempImageFile] = useState(null);        // останнє вибране зображення (File)
  const [tempImageBytes, setTempImageBytes] = useState(null);      // байти зображення
  const [tempInsertIndex, setTempInsertIndex] = useState(1);       // куди вставляємо
  const [tempImageName, setTempImageName] = useState("");          // назва файлу зображення (для відображення)

  /**
   * Завантаження PDF-файлу
   */
  const handlePdfChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPdfFile(file);

    // Зчитуємо в масив байтів (ArrayBuffer)
    const ab = await file.arrayBuffer();
    setPdfBytes(ab);
  };

  /**
   * Коли pdfBytes оновився — завантажуємо його через pdf-lib
   */
  useEffect(() => {
    if (!pdfBytes) return;
    (async () => {
      try {
        const doc = await PDFDocument.load(pdfBytes);
        setPdfDoc(doc);
        setNumPages(doc.getPageCount());

        // Скидаємо відмітки видалення сторінок
        const emptyRemove = {};
        for (let i = 0; i < doc.getPageCount(); i++) {
          emptyRemove[i] = false; // спочатку жодна сторінка не відмічена
        }
        setPagesToRemove(emptyRemove);
      } catch (err) {
        console.error("Помилка завантаження PDF:", err);
      }
    })();
  }, [pdfBytes]);

  /**
   * Обробка чекбоксів "видалити цю сторінку"
   */
  const handleTogglePageRemove = (pageIndex) => {
    setPagesToRemove((prev) => ({
      ...prev,
      [pageIndex]: !prev[pageIndex],
    }));
  };

  /**
   * Завантаження зображення у проміжні стани (для одного зображення)
   */
  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setTempImageFile(file);
    setTempImageName(file.name);

    const ab = await file.arrayBuffer();
    setTempImageBytes(ab);
  };

  /**
   * Додаємо обране зображення до списку `imagesToInsert`
   */
  const handleAddImagePage = () => {
    if (!tempImageFile || !tempImageBytes) {
      alert("Оберіть зображення перед додаванням");
      return;
    }
    if (!pdfDoc) {
      alert("Спочатку завантажте PDF");
      return;
    }
    // Створимо новий об’єкт
    const newImageEntry = {
      id: Date.now(), // унікальний ключ
      file: tempImageFile,
      bytes: tempImageBytes,
      pageIndex: tempInsertIndex, // “людський” індекс сторінки (починається з 1)
      name: tempImageName,
    };
    // Додаємо до списку
    setImagesToInsert((prev) => [...prev, newImageEntry]);
    // Скидаємо форму
    setTempImageFile(null);
    setTempImageBytes(null);
    setTempImageName("");
  };

  /**
   * Видалити зображення зі списку “запланованих для вставки”
   */
  const handleRemoveImageEntry = (id) => {
    setImagesToInsert((prev) => prev.filter((item) => item.id !== id));
  };

  /**
   * Коли користувач натискає "Зберегти оновлений PDF":
   * 1) Клонуємо оригінал PDF (через load оригінального pdfBytes)
   * 2) Видаляємо вибрані сторінки
   * 3) Додаємо всі нові сторінки з imageToInsert у вказаний індекс
   * 4) Зберігаємо
   */
  const handleSavePdf = async () => {
    if (!pdfDoc || !pdfBytes) return;

    // Створюємо новий документ на основі оригінальних байтів
    let newPdf = await PDFDocument.load(pdfBytes);

    // 1) Видаляємо вибрані сторінки
    const pageCount = newPdf.getPageCount();
    // Зберемо індекси для видалення
    const indexesToRemove = [];
    for (let i = 0; i < pageCount; i++) {
      if (pagesToRemove[i]) indexesToRemove.push(i);
    }
    // Видаляємо зі старшого індексу до меншого
    indexesToRemove.reverse().forEach((idx) => {
      newPdf.removePage(idx);
    });

    // 2) Додаємо зображення як сторінки
    // Індекси у pdf-lib починаються з 0
    // Якщо користувач ввів “1” => pdf-lib індекс = 0
    // Якщо індекс > кількості сторінок, вставляємо в кінець

    for (let imgItem of imagesToInsert) {
      let { bytes, pageIndex, file } = imgItem;

      // Обчислимо фактичний індекс (pdf-lib)
      let targetIndex = Math.max(0, pageIndex - 1);
      if (targetIndex > newPdf.getPageCount()) {
        targetIndex = newPdf.getPageCount();
      }

      // Визначимо, чи PNG чи JPG
      let embeddedImage;
      if (file.type.includes("png")) {
        embeddedImage = await newPdf.embedPng(bytes);
      } else {
        // припускаємо jpg, webp тут не підтримується
        embeddedImage = await newPdf.embedJpg(bytes);
      }

      // Розміри зображення
      const { width: imgWidth, height: imgHeight } = embeddedImage.size();

      // Додаємо нову сторінку
      const newPage = newPdf.insertPage(targetIndex, [imgWidth, imgHeight]);

      // Малюємо зображення, заповнюючи всю сторінку
      newPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: imgWidth,
        height: imgHeight,
      });
    }

    // 3) Зберігаємо
    const outPdfBytes = await newPdf.save();

    // 4) Даємо файл користувачеві
    const blob = new Blob([outPdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modified.pdf";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <h1>Видалення сторінок та вставка зображень</h1>

      {/* 1) Вибір PDF */}
        <FileUploader onChange={handlePdfChange} accept=".pdf" type="file" />
      {/* 2) Якщо PDF завантажено – список сторінок з опціями видалення */}
      {pdfDoc && (
        <div style={{ marginBottom: 16 }}>
          <h4>Сторінок: {numPages}</h4>
          <p>Обрати сторінки для видалення (поставте галочку):</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {Array.from({ length: numPages }, (_, i) => (
              <label key={i} style={{ display: "inline-block" }}>
                <input
                  type="checkbox"
                  checked={pagesToRemove[i] || false}
                  onChange={() => handleTogglePageRemove(i)}
                />
                Стор. {i + 1}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 3) Форма "Додати зображення як нову сторінку" */}
      {pdfDoc && (
      <div style={{ border: "1px solid #ccc", padding: 10, marginBottom: 16 }}>
        <h3>Додати зображення</h3>
        <div style={{ marginBottom: 8 }}>
          <input
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleImageFileChange}
          />
        </div>
        {tempImageName && <div>Обране зображення: {tempImageName}</div>}

        <div style={{ marginTop: 8 }}>
          <label>
            Номер сторінки (1–{numPages + 1}), куди вставити:
            <input
              type="number"
              value={tempInsertIndex}
              min={1}
              max={numPages + 1}
              onChange={(e) => setTempInsertIndex(parseInt(e.target.value))}
              style={{ width: 60, marginLeft: 8 }}
            />
          </label>
        </div>
        <Button onClick={handleAddImagePage}>Додати у список на додавання сторінок</Button>
      </div>
        )}
      {/* 4) Список зображень, які буде вставлено */}
      {imagesToInsert.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4>Заплановані для вставки зображення:</h4>
          {imagesToInsert.map((imgItem) => (
            <div
              key={imgItem.id}
              style={{
                border: "1px solid #ddd",
                marginBottom: 6,
                padding: 6,
                borderRadius: 4,
              }}
            >
              <div>
                <strong>{imgItem.name}</strong> &nbsp; (сторінка:{" "}
                {imgItem.pageIndex})
              </div>
              <Button onClick={() => handleRemoveImageEntry(imgItem.id)}>Видалити з черги</Button>
            </div>
          ))}
        </div>
      )}

      {/* 5) Кнопка збереження */}
      <Button onClick={handleSavePdf} disabled={!pdfDoc}>Зберегти оновлений PDF</Button>
    </div>
  );
}

export default PdfPageEditor;
