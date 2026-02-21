"use client";
import { useState } from "react";

export default function Calculator() {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [justEvaluated, setJustEvaluated] = useState(false);

  const handleNumber = (val: string) => {
    if (justEvaluated) {
      setDisplay(val);
      setExpression(val);
      setJustEvaluated(false);
      return;
    }
    const newDisplay = display === "0" ? val : display + val;
    setDisplay(newDisplay);
    setExpression(expression + val);
  };

  const handleOperator = (op: string) => {
    setJustEvaluated(false);
    setExpression(expression + " " + op + " ");
    setDisplay(op);
  };

  const handleDecimal = () => {
    if (justEvaluated) {
      setDisplay("0.");
      setExpression("0.");
      setJustEvaluated(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(display + ".");
      setExpression(expression + ".");
    }
  };

  const handleEquals = () => {
    try {
      const result = Function('"use strict"; return (' + expression + ')')();
      const rounded = Math.round(result * 1000000) / 1000000;
      setDisplay(String(rounded));
      setExpression(String(rounded));
      setJustEvaluated(true);
    } catch {
      setDisplay("Error");
      setExpression("");
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setExpression("");
    setJustEvaluated(false);
  };

  const handleBackspace = () => {
    if (display.length === 1 || display === "Error") {
      setDisplay("0");
      setExpression(expression.slice(0, -1));
      return;
    }
    setDisplay(display.slice(0, -1));
    setExpression(expression.slice(0, -1));
  };

  const handleSpecial = (type: string) => {
    try {
      const num = parseFloat(display);
      let result;
      let newExpr;
      if (type === "sqrt") {
        result = Math.sqrt(num);
        newExpr = `√(${num})`;
      } else if (type === "square") {
        result = num * num;
        newExpr = `${num}²`;
      } else if (type === "percent") {
        result = num / 100;
        newExpr = `${num}%`;
      } else if (type === "inverse") {
        result = 1 / num;
        newExpr = `1/${num}`;
      } else {
        return;
      }
      const rounded = Math.round(result * 1000000) / 1000000;
      setDisplay(String(rounded));
      setExpression(newExpr);
      setJustEvaluated(true);
    } catch {
      setDisplay("Error");
    }
  };

  const btn = (label: string, onClick: () => void, style: string) => (
    <button
      key={label}
      onClick={onClick}
      className={`flex items-center justify-center rounded-2xl text-lg font-semibold h-14 transition-all active:scale-95 ${style}`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-900 to-green-700 p-4 rounded-b-3xl mb-4">
        <a href="/" className="text-white text-sm block mb-2">← Home</a>
        <h1 className="text-white text-xl font-bold">🧮 Calculator</h1>
        <p className="text-green-200 text-xs">JAMB Scientific Calculator</p>
      </div>

      <div className="px-4">
        {/* Display */}
        <div className="bg-gray-900 rounded-2xl p-4 mb-4">
          <p className="text-gray-400 text-sm min-h-5 text-right">{expression || " "}</p>
          <p className="text-white text-4xl font-light text-right mt-1 overflow-x-auto">
            {display}
          </p>
        </div>

        {/* Special functions */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          {btn("√", () => handleSpecial("sqrt"), "bg-indigo-100 text-indigo-700")}
          {btn("x²", () => handleSpecial("square"), "bg-indigo-100 text-indigo-700")}
          {btn("%", () => handleSpecial("percent"), "bg-indigo-100 text-indigo-700")}
          {btn("1/x", () => handleSpecial("inverse"), "bg-indigo-100 text-indigo-700")}
        </div>

        {/* Main buttons */}
        <div className="grid grid-cols-4 gap-2">
          {btn("AC", handleClear, "bg-red-100 text-red-600")}
          {btn("⌫", handleBackspace, "bg-orange-100 text-orange-600")}
          {btn("(", () => handleNumber("("), "bg-gray-200 text-gray-700")}
          {btn(")", () => handleNumber(")"), "bg-gray-200 text-gray-700")}

          {btn("7", () => handleNumber("7"), "bg-white text-gray-800 shadow-sm")}
          {btn("8", () => handleNumber("8"), "bg-white text-gray-800 shadow-sm")}
          {btn("9", () => handleNumber("9"), "bg-white text-gray-800 shadow-sm")}
          {btn("÷", () => handleOperator("/"), "bg-orange-400 text-white")}

          {btn("4", () => handleNumber("4"), "bg-white text-gray-800 shadow-sm")}
          {btn("5", () => handleNumber("5"), "bg-white text-gray-800 shadow-sm")}
          {btn("6", () => handleNumber("6"), "bg-white text-gray-800 shadow-sm")}
          {btn("×", () => handleOperator("*"), "bg-orange-400 text-white")}

          {btn("1", () => handleNumber("1"), "bg-white text-gray-800 shadow-sm")}
          {btn("2", () => handleNumber("2"), "bg-white text-gray-800 shadow-sm")}
          {btn("3", () => handleNumber("3"), "bg-white text-gray-800 shadow-sm")}
          {btn("−", () => handleOperator("-"), "bg-orange-400 text-white")}

          {btn("0", () => handleNumber("0"), "bg-white text-gray-800 shadow-sm col-span-2")}
          {btn(".", handleDecimal, "bg-white text-gray-800 shadow-sm")}
          {btn("+", () => handleOperator("+"), "bg-orange-400 text-white")}

          <div className="col-span-4">
            {btn("=", handleEquals, "bg-green-500 text-white w-full")}
          </div>
        </div>
      </div>
    </div>
  );
}
