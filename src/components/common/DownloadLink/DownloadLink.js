import React from "react";
import styles from "./downloadLink.module.css";

const DownloadLink = ({ href, download = "file.pdf", children }) => {
    return (
        <a href={href} download={download} className={styles.link}>
        {children}
        </a>
    );
};

export default DownloadLink;
