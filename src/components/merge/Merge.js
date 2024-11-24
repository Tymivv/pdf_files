import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import Files from './files/Files';
import style from './merge.module.css';

const Merge = () => {
  const [fileInfos, setFileInfos] = useState([]);
  const [mergedPDF, setMergedPDF] = useState(null);
  const [error, setError] = useState(null);
  const [makePagesSameSize, setMakePagesSameSize] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    if (event.target.files.length < 2) {
      return;
    }
    setMergedPDF(null);
    const newFiles = [...event.target.files];

    const newFileInfos = [];
    for (const file of newFiles) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const pages = pdfDoc.getPages();
        const sizes = pages.map((page) => page.getSize());

        const maxWidth = Math.max(...sizes.map((size) => size.width));
        const maxHeight = Math.max(...sizes.map((size) => size.height));

        newFileInfos.push({
          file: file,
          maxWidth: maxWidth,
          maxHeight: maxHeight,
        });
      } catch (error) {
        setError(`Не вдалося завантажити файл ${file.name}: ${error.message}`);
        return;
      }
    }

    setFileInfos((prevFileInfos) => [...prevFileInfos, ...newFileInfos]);
  };

  const openFileInput = () => {
    fileInputRef.current.click();
  };

  const removeFile = (indexToRemove) => {
    setFileInfos((prevFileInfos) =>
      prevFileInfos.filter((_, index) => index !== indexToRemove)
    );
  };

  const moveFile = (fromIndex, toIndex) => {
    const updatedFileInfos = [...fileInfos];
    const movedFileInfo = updatedFileInfos.splice(fromIndex, 1)[0];
    updatedFileInfos.splice(toIndex, 0, movedFileInfo);
    setFileInfos(updatedFileInfos);
  };

  const mergePDFs = async () => {
    if (fileInfos.length < 2) {
      setError('Виберіть принаймні два файли PDF.');
      return;
    }
    try {
      const mergedDoc = await PDFDocument.create();
      let desiredWidth = 0;
      let desiredHeight = 0;

      if (makePagesSameSize) {
        for (const info of fileInfos) {
          const { maxWidth, maxHeight } = info;
          if (maxWidth > desiredWidth) desiredWidth = maxWidth;
          if (maxHeight > desiredHeight) desiredHeight = maxHeight;
        }
      }

      for (const info of fileInfos) {
        try {
          const arrayBuffer = await info.file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          const pages = pdfDoc.getPages();
          const embeddedPages = await mergedDoc.embedPages(pages);

          for (let i = 0; i < pages.length; i++) {
            const embeddedPage = embeddedPages[i];

            if (makePagesSameSize) {
              const { width, height } = embeddedPage;
              const xScale = desiredWidth / width;
              const yScale = desiredHeight / height;

              const newPage = mergedDoc.addPage([desiredWidth, desiredHeight]);

              newPage.drawPage(embeddedPage, {
                x: 0,
                y: 0,
                xScale: xScale,
                yScale: yScale,
              });
            } else {
              const [copiedPage] = await mergedDoc.copyPages(pdfDoc, [i]);
              mergedDoc.addPage(copiedPage);
            }
          }
        } catch (error) {
          setError(`Не вдалося обробити файл ${info.file.name}: ${error.message}`);
          return;
        }
      }

      const mergedPDFBytes = await mergedDoc.save();
      setMergedPDF(new Blob([mergedPDFBytes], { type: 'application/pdf' }));
      setError(null);
      setFileInfos([]);
    } catch (error) {
      setError('Помилка зшивання документів');
    }
  };

  let d = new Date().getTime();

  return (
    <>
        <h1>Об'єднання PDF файлів</h1>
        <input
          type="file"
          onChange={handleFileChange}
          multiple
          accept=".pdf"
          style={{ display: 'none' }}
          ref={fileInputRef}
        />
        <button className={style.btn} onClick={openFileInput}>
          Виберіть PDF файли
        </button>
        {fileInfos.length > 1 && (
          <>
            <button className={style.btn} onClick={mergePDFs}>
              Об'єднати PDF файли
            </button>
            <div className={style.make_pages_size}>
                <input
                type="checkbox"
                checked={makePagesSameSize}
                onChange={(e) => setMakePagesSameSize(e.target.checked)}
              />
              <span className={style.make_pages_size_text}>
                Зробити розмір сторінок однаковим
              </span>
            </div>
          </>
        )}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {mergedPDF && (
          <div className={style.download}>
            <a
              className={style.downloadLink}
              href={URL.createObjectURL(mergedPDF)}
              download={`${d}`}
            >
              Завантажити PDF
            </a>
          </div>
        )}
        <Files
          fileInfos={fileInfos}
          removeFile={removeFile}
          moveFile={moveFile}
        />
    </>
  );
};

export default Merge;
