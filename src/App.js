import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import Merge from "./components/merge/Merge";
import ReducePDF from "./components/ReducePDF/ReducePDF";
import SplitPDF from "./components/SplitPDF/SplitPDF";
import "./App.css"; // Стилі для навігації
import style from "./components/merge/merge.module.css";

const App = () => {
  return (
    <div className={style.container}>
      <div className={style.card}>
        <div>
          {/* Навігація */}
          <nav className="navbar">
            <NavLink to="/merge" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Об'єднання PDF
            </NavLink>
            <NavLink to="/reducePDF" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Роз'єднання PDF
            </NavLink>
            <NavLink to="/splitPDF" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Редагування PDF
            </NavLink>
          </nav>

          {/* Відображення компонентів */}
          <div className="content">
            <Routes>
              <Route path="/merge" element={<Merge />} />
              <Route path="/reducePDF" element={<ReducePDF />} />
              <Route path="/splitPDF" element={<SplitPDF />} />
              <Route path="/" element={<Merge />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
