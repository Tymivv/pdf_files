import React, { useRef } from "react";
import Button  from '../Button/Button';


const FileUploader = ({ onChange, accept, multiple = false }) => {
    const fileInputRef = useRef(null);

    const openFileInput = () => fileInputRef.current.click();

    return (
    <>
        <input
        type="file"
        onChange={onChange}
        accept={accept}
        multiple={multiple}
        ref={fileInputRef}
        style={{ display: "none" }}
        />
        <Button onClick={openFileInput}>Виберіть файли</Button>
    </> 
    );
};

export default FileUploader;
