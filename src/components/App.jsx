import React, { useState, useRef } from 'react';
import { PDFDocument} from 'pdf-lib';
import Files from './files/Files';
import style from './app.module.css';

const App =() =>{
  const [files, setFiles] = useState([]);
  const [mergedPDF, setMergedPDF] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    if(event.target.files.length<2){
      return
    }
    setMergedPDF(null);
    const newFiles = [...event.target.files];
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    };
    
  const openFileInput = () => {
    fileInputRef.current.click();
  };
  const removeFile = (indexToRemove) => {
    setFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const moveFile = (fromIndex, toIndex) => {
    const updatedFiles = [...files];
    const movedFile = updatedFiles.splice(fromIndex, 1)[0];
    updatedFiles.splice(toIndex, 0, movedFile);
    setFiles(updatedFiles);
  };

  const mergePDFs = async () => {
    if (files.length < 2) {
      setError('Виберіть принаймні два файли PDF.');
      return;
    }
    try {
      const mergedDoc = await PDFDocument.create();
      for (const file of files) {
        const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
        const copiedPages = await mergedDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => mergedDoc.addPage(page));
      }
      const mergedPDFBytes = await mergedDoc.save();
      setMergedPDF(new Blob([mergedPDFBytes], { type: 'application/pdf' }));
      setError(null);
      setFiles([]);
    } catch (error) {
      setError('Помилка зшивання документів', error);
    }
  };
  let d = new Date().getTime()
  return (
    <div className={style.container}>
      <div className={style.card}>
      <h1>Об'єднання PDF файлів</h1>
        <input
          type="file"
          onChange={handleFileChange}
          multiple
          accept='.pdf'
          style={{ display: 'none' }}
          ref={fileInputRef}
        />
        <button className={style.btn}onClick={openFileInput}>Виберіть PDF файли</button>
        {files.length>1 && <button className={style.btn} onClick={mergePDFs}>Об'єднати PDF файли</button>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {mergedPDF && (
        <div className={style.download}>
          <a className={style.downloadLink } href={URL.createObjectURL(mergedPDF)} download={`${d}`}>
            Завантажити PDF
          </a>
        </div>
      )}
      <Files
        files={files}
        removeFile={removeFile}
        moveFile={moveFile}
      />
      </div>
    </div>
  );
};
export default App;