import React from "react";

const DocumentPageHeader = ({
  title,
  description,
  maxWidthClass = "max-w-[1320px]",
}) => {
  return (
    <header className="bg-[#fbfcfb] px-5 pt-9 text-[#1e2934] md:px-8 md:pt-12">
      <div className={`mx-auto ${maxWidthClass}`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <h1 className="shrink-0 font-serif text-[38px] font-bold leading-none text-[#075b36] sm:text-5xl">
            {title}
          </h1>
          <div
            className="flex h-3 min-w-0 flex-1 overflow-hidden"
            aria-hidden="true"
          >
            <span className="w-1/2 bg-[#08663b]" />
            <span className="w-1/2 bg-[#c8102e]" />
          </div>
        </div>

        {description && (
          <p className="mt-4 max-w-[980px] text-base font-medium leading-6 text-[#273542]">
            {description}
          </p>
        )}
      </div>
    </header>
  );
};

export default DocumentPageHeader;
