import React from "react";
import style from './fileControls.module.css';


const FileControls = ({ index, moveFile, deleteFile, totalFiles }) => {
    return (
        <div style={{ marginLeft: "auto", display: "flex" }}>
        {index > 0 && (
            <div
            onClick={() => moveFile(index, index - 1)}// Переміщуємо файл вгору
            className={style.arrow_up}
            >
            &#11014;
            </div>
        )}
        {index < totalFiles - 1 && (
            <div
            onClick={() => moveFile(index, index + 1)} // Переміщуємо файл вниз
            className={style.arrow_down}
            >
            &#11015;
            </div>
        )}
        <div
            onClick={() => deleteFile(index)} // Викликаємо функцію видалення файлу
            className={style.previewRemove}
        >
            &#10006; 
        </div>
    </div>
    );
};

export default FileControls;
