import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import Merge from "./components/merge/Merge";
import ReducePDF from "./components/ReducePDF/ReducePDF";
import SplitPDF from "./components/SplitPDF/SplitPDF";
import ImageToPDF from "./components/imageToPDF/ImageToPDF";
import PDFToImage from "./components/PDFToImage/PDFToImage";
import DrawOnPDF from "./components/DrawOnPDF/DrawOnPDF";
import PdfPageEditor from "./components/PdfPageEditor/PdfPageEditor";
import TiffToPdf from "./components/TiffToPdf/TiffToPdf";

import EncodeDecodePDFBase64 from "./components/EncodeDecodePDFBase64/EncodeDecodePDFBase64"; 
import "./App.css"; // Стилі для навігації

const App = () => {
  return (
    <div className="container">
      <div className="card">
        <div>
          {/* Навігація */}
          <nav className="navbar">
            <NavLink to="/merge" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Об'єднати
            </NavLink>
            <NavLink to="/reducepdf" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Роз'єднати
            </NavLink>
            <NavLink to="/page" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Сторінки
            </NavLink>
            <NavLink to="/splitpdf" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Редагувати
            </NavLink>
            <NavLink to="/imagetopdf" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Створити
            </NavLink>
            <NavLink to="/pdftoimages" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              JPEG
            </NavLink>
            <NavLink to="/drawonpdf" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Малювати
            </NavLink>
            <NavLink to="/tiff" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              TIFF
            </NavLink>
            <NavLink to="/encodeDecodePDFBase64" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Base64
            </NavLink>
          </nav>

          {/* Відображення компонентів */}
          <div className="content">
            <Routes>
              <Route path="/merge" element={<Merge />} />
              <Route path="/reducepdf" element={<ReducePDF />} />
              <Route path="/splitpdf" element={<SplitPDF />} />
              <Route path="/imagetopdf" element={<ImageToPDF />} />
              <Route path="/pdftoimages" element={<PDFToImage />} />
              <Route path="/drawonpdf" element={<DrawOnPDF />} />
              <Route path="/encodeDecodePDFBase64" element={<EncodeDecodePDFBase64 />} />
              <Route path="/page" element={<PdfPageEditor />} />
              <Route path="/tiff" element={<TiffToPdf />} />
              <Route path="/" element={<Merge />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
