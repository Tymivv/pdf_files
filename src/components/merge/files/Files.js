import React from 'react';
import FileControls  from '../../common/FileControls/FileControls';
import style from './files.module.css';

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
        <FileControls
            index={index}
            moveFile={moveFile}
            deleteFile={removeFile}
            totalFiles={fileInfos.length}
            />
        </li>
    ))}
    </ul>
    );
};

export default Files;
