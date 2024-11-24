import React from 'react';
import style from '../app.module.css';


const Files = ({ fileInfos, removeFile, moveFile }) => {
return (
    <ul className={style.preview}>
    {fileInfos?.map((info, index) => (
        <li className={style.list} key={index}>
        <div className={style.fileName}>
            <strong>{info.file.name}</strong> 
            <div className={style.sizePsges}>
                Розмір сторінок: {info.maxWidth.toFixed(0)} x {info.maxHeight.toFixed(0)}
            </div>
        </div>
        <div className={style.controls}>
            <div
                className={style.previewRemove}
                onClick={() => removeFile(index)} // Викликаємо функцію видалення файлу
                >
                    &#10006; 
            </div>
            {index > 0 && (
            <div
                className={style.arrow_up}
                onClick={() => moveFile(index, index - 1)} // Переміщуємо файл вгору
                >
                &#11014; 
            </div>
            )}
            {index < fileInfos.length - 1 && (
            <div
                className={style.arrow_down}
                onClick={() => moveFile(index, index + 1)} // Переміщуємо файл вниз
                >
                &#11015; 
            </div>
            )}
        </div>
            
        </li>
    ))}
    </ul>
    );
};

export default Files;
