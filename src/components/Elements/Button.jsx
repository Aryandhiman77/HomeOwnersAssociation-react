import React from "react";

const Button = ({
  startIcon,
  endIcon,
  title = "Enter title",
  className,
  onClick = () => {},
  type = "button",
  disabled = false,
}) => {
  return (
    <>
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={` px-4 py-2 ${className} flex items-center gap-1`}
      >
        {startIcon}
        <p>{title}</p>
        {endIcon}
      </button>
    </>
  );
};

export default Button;
