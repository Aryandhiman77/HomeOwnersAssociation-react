import React, { useEffect, useRef, useState } from "react";
import { IoIosCloseCircle } from "react-icons/io";
import { GrAttachment } from "react-icons/gr";
import { RiImageAddFill } from "react-icons/ri";

const sizes = {
  "1MB": Math.pow(1024, 2),
  "2MB": Math.pow(1024, 2) * 2,
  "3MB": Math.pow(1024, 2) * 3,
  "4MB": Math.pow(1024, 2) * 4,
  "20MB": Math.pow(1024, 2) * 20,
};
const formatFileSize = (bytes = 0) => {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isImageFile = (type = "") => type.startsWith("image/");
const CustomDropBox = ({
  multiple = false,
  maxFiles = 1,
  sizePerFile = ["1MB", "2MB", "3MB", "4MB", "20MB"][0],
  className,
  previewClasses,
  previewsWrapperClasses,
  allowedMimeTypes = ["image/png", "image/jpg", "image/jpeg"],
  getFiles = () => {},
  initialPreviews = [],
  disablePreviews = false,
}) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([...(initialPreviews || [])]);
  const styleRef = useRef(null);
  const inputRef = useRef(null);
  const difference = maxFiles - previews.length;

  const onDragEnter = (e) => {
    e.preventDefault();
  };
  const onDragLeaveCapture = (e) => {
    e.preventDefault();
    styleRef.current.style.background = "transparent";
  };
  const onDrop = (e) => {
    e.preventDefault();
    const addfiles = [...e.dataTransfer.files]?.slice(0, difference);
    styleRef.current.style.background = "transparent";

    handleSetFiles(addfiles);
  };

  const appendFilesAndGeneratePreviews = (newFiles) => {
    if (files?.length + newFiles.length <= maxFiles) {
      setFiles((prev) => [...prev, ...newFiles]);
      generatePreviews([...files, ...newFiles]);
    }
  };

  const handleSetFiles = (inputs) => {
    if (inputs && inputs.length === 0) {
      setFiles([...inputs]);
      generatePreviews(inputs);
    } else if (files && files.length + inputs.length <= maxFiles) {
      appendFilesAndGeneratePreviews([...inputs]);
    } else {
      setFiles([]);
      setFiles([...inputs.slice(0, maxFiles)]);
      generatePreviews([...inputs.slice(0, maxFiles)]);
    }
  };
  const generatePreviews = (files) => {
    const nextPreviews = Array.from(files).map((item) => {
      if (item instanceof File && typeof item === "object") {
        const providedSize = sizes[sizePerFile] || false;
        const imagePreview = isImageFile(item.type)
          ? URL.createObjectURL(item)
          : "";
        const fileMeta = {
          filename: item.name,
          image: imagePreview,
          size: item.size,
          type: item.type,
        };

        if (!allowedMimeTypes?.includes(item.type)) {
          return {
            ...fileMeta,
            errorMessage: `Either ${allowedMimeTypes?.map((m) => "." + m.split("/")[1]).join(", ")} are allowed.`,
          };
        }
        if (!providedSize || item.size <= providedSize) {
          return fileMeta;
        }
        return {
          ...fileMeta,
          errorMessage: `file size greater than ${sizePerFile}`,
        };
      }
      return item;
    });
    setPreviews(nextPreviews);
  };
  const deleteFile = (i) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
    if (previews[i]?.image) URL.revokeObjectURL(previews[i].image);
  };
  useEffect(() => {
    return () => {
      previews?.forEach((p) => {
        if (p?.image) URL.revokeObjectURL(p.image);
      });
    };
  }, [previews]);
  useEffect(() => {
    getFiles(files.filter((_, i) => !previews[i]?.errorMessage));
  }, [files, getFiles, previews]);
  return (
    <>
      {files?.length < maxFiles && previews.length < maxFiles && (
        <label
          id="dropbox"
          className={`border-2 border-dashed border-[#cfcfd1] bg-[#f9f9fb] rounded-md flex justify-center items-center flex-col cursor-pointer transition-all duration-150 active:scale-95 ${className} py-4 `}
          ref={styleRef}
          onDragEnter={onDragEnter}
          onDragLeaveCapture={onDragLeaveCapture}
          onDragOver={(e) => {
            e.preventDefault();
            styleRef.current.style.background = "#e6f1f3";
          }}
          onDragOverCapture={(e) => {
            e.preventDefault();
          }}
          onDrop={onDrop}
          onDropCapture={(e) => e.preventDefault()}
        >
          <div className="mx-auto">
            <div className="flex gap-x-2">
              <RiImageAddFill size={50} color="#1655c2" />
              <h1>
                Upload Media{" "}
                <span className="opacity-[0.5] text-md">
                  (Optional but Recommended)
                </span>
                <p className="text-[15px] opacity-[0.5]">
                  Add photos, documents, or videos to support your story.
                </p>
              </h1>
            </div>
            <div className="bg-[#1655c2] px-4 py-1 flex gap-2 items-center text-white rounded-lg mx-auto mt-2 justify-center">
              {" "}
              <GrAttachment />
              Choose Files or Drag & Drop
            </div>
            <p className="text-[15px] opacity-[0.5] mt-2">
              .jpg, .png, .pdf, webp, .docx, .mp4 or .mpeg files upto{" "}
              {sizePerFile} each &middot; You can upload {difference + " "}
              files.
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            hidden
            onChange={(e) =>
              handleSetFiles([...e.target.files]?.slice(0, difference))
            }
            max={difference}
            multiple={difference > 1 || multiple}
            id="dropbox"
            accept={allowedMimeTypes.toString()}
          />
        </label>
      )}
      <div
        className={`flex items-center gap-4 py-4 ${previewsWrapperClasses} w-full flex-wrap`}
      >
        {!disablePreviews &&
          previews?.map((preview, i) => {
            const fileName = preview?.filename || "Selected file";
            const extension = fileName.includes(".")
              ? fileName.split(".").pop().toUpperCase()
              : "FILE";
            const hasImagePreview = Boolean(preview?.image);

            return (
              <div
                key={`custom-dropbox-preview-${i}`}
                className={`relative flex min-h-[76px] w-full max-w-[260px] items-center gap-3 rounded-lg border bg-white p-3 shadow-sm ${preview?.errorMessage ? "border-red-500" : "border-[#d7dadd]"} ${previewClasses || ""}`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#edf4fe] text-[#1655c2]">
                  {hasImagePreview ? (
                    <img
                      className="h-full w-full object-cover"
                      src={preview.image}
                      alt={fileName}
                    />
                  ) : (
                    <GrAttachment size={20} />
                  )}
                </div>
                <div className="min-w-0 flex-1 pr-5">
                  <p
                    className="truncate text-sm font-semibold text-[#1f2933]"
                    title={fileName}
                  >
                    {fileName}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-[#6b7280]">
                    {extension}{" "}
                    {preview?.size ? `- ${formatFileSize(preview.size)}` : ""}
                  </p>
                  {preview?.errorMessage && (
                    <p className="mt-1 text-xs font-semibold text-red-600">
                      {preview.errorMessage}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteFile(i)}
                  type="button"
                  aria-label={`Remove ${fileName}`}
                  className="absolute right-2 top-2 cursor-pointer text-red-500 hover:text-red-700"
                >
                  <IoIosCloseCircle size={20} />
                </button>
              </div>
            );
          })}
      </div>
    </>
  );
};

export default CustomDropBox;
