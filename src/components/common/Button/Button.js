import React from "react";
import styles from "./button.module.css";

const Button = ({ children, onClick, disabled, className = "" }) => (
  <button
    className={`${styles.btn} ${className}`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

export default Button;
