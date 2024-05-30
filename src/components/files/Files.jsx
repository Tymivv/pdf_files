import style from './files.module.css';

const Files = ({files, removeFile, moveFile}) =>{
    return (
    <ul className={style.preview}>
    {files?.map((file, index) => (
        <li className={style.list}key={index}>
            {file?.name}{' '}
            <div className={style.previewRemove} onClick={() => removeFile(index)}>&#10006;</div>
            {index > 0 && (
            <div className={style.arrow_up} onClick={() => moveFile(index, index - 1)}>&#11014;</div>
            )}
            {index < files.length - 1 && (
            <div className={style.arrow_down} onClick={() => moveFile(index, index + 1)}>&#11015;</div>
            )}
        </li>
    ))}
    </ul>
);
};
export default Files;