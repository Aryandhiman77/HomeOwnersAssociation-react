import React, { useMemo } from "react";
import { Editor } from "@tinymce/tinymce-react";

import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/models/dom";
import "tinymce/plugins/accordion";
import "tinymce/plugins/advlist";
import "tinymce/plugins/anchor";
import "tinymce/plugins/autolink";
import "tinymce/plugins/autoresize";
import "tinymce/plugins/charmap";
import "tinymce/plugins/code";
import "tinymce/plugins/codesample";
import "tinymce/plugins/directionality";
import "tinymce/plugins/emoticons";
import "tinymce/plugins/fullscreen";
import "tinymce/plugins/help";
import "tinymce/plugins/image";
import "tinymce/plugins/insertdatetime";
import "tinymce/plugins/link";
import "tinymce/plugins/lists";
import "tinymce/plugins/media";
import "tinymce/plugins/nonbreaking";
import "tinymce/plugins/pagebreak";
import "tinymce/plugins/preview";
import "tinymce/plugins/quickbars";
import "tinymce/plugins/searchreplace";
import "tinymce/plugins/table";
import "tinymce/plugins/visualblocks";
import "tinymce/plugins/visualchars";
import "tinymce/plugins/wordcount";

import "tinymce/skins/ui/oxide/skin.min.css";
import "tinymce/skins/ui/oxide/content.min.css";
import "tinymce/skins/content/default/content.min.css";

function hasHtml(value) {
  return /<\/?[a-z][\s\S]*>/i.test(String(value || ""));
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeInitialHtml(value) {
  const source = String(value || "").trim();
  if (!source) return "";
  if (hasHtml(source)) return source;

  return source
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
}

const MAX_EDITOR_IMAGE_DIMENSION = 1200;
const MAX_EDITOR_IMAGE_BYTES = 350 * 1024;

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Could not process image.")),
      type,
      quality,
    );
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(blob);
  });
}

function loadLocalImage(blob) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("The selected image could not be loaded."));
    };
    image.src = objectUrl;
  });
}

async function getPersistentImageUrl(blob) {
  if (!blob?.type?.startsWith("image/")) {
    throw new Error("Please select a valid image file.");
  }

  const image = await loadLocalImage(blob);
  const initialScale = Math.min(
    1,
    MAX_EDITOR_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
  );
  let width = Math.max(1, Math.round(image.naturalWidth * initialScale));
  let height = Math.max(1, Math.round(image.naturalHeight * initialScale));
  let quality = 0.82;
  let optimizedBlob;

  for (let attempt = 0; attempt < 7; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is unavailable.");

    context.drawImage(image, 0, 0, width, height);
    optimizedBlob = await canvasToBlob(canvas, "image/webp", quality);

    if (optimizedBlob.size <= MAX_EDITOR_IMAGE_BYTES) break;

    quality = Math.max(0.5, quality - 0.08);
    width = Math.max(1, Math.round(width * 0.84));
    height = Math.max(1, Math.round(height * 0.84));
  }

  return blobToDataUrl(optimizedBlob);
}

// const contentStyle = `
//   p { margin: 0 0 16px; }
//   h1, h2, h3, h4, h5, h6 { color: #0a4d2c; line-height: 1.2; margin: 24px 0 12px; }
//   blockquote { border-left: 4px solid #c8102e; background: #f7f8f9; margin: 16px 0; padding: 10px 16px; }
//   a { color: #0a4d2c; font-weight: 700; }
//   img { max-width: 100%; height: auto; }
//   table { border-collapse: collapse; width: 100%; }
//   td, th { border: 1px solid #cfd3d7; padding: 8px; }
//   pre { background: #17212b; border-radius: 4px; color: #fff; overflow: auto; padding: 14px; }
//   code { background: #eef2f4; border-radius: 3px; color: #c8102e; padding: 2px 5px; }
// `;

const editorPlugins = [
  "accordion",
  "advlist",
  "anchor",
  "autolink",
  "autoresize",
  "charmap",
  "code",
  "codesample",
  "directionality",
  "emoticons",
  "fullscreen",
  "help",
  "image",
  "insertdatetime",
  "link",
  "lists",
  "media",
  "nonbreaking",
  "pagebreak",
  "preview",
  "quickbars",
  "searchreplace",
  "table",
  "visualblocks",
  "visualchars",
  "wordcount",
];

const editorToolbar = [
  "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough superscript subscript code removeformat",
  "forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent",
  "link image media table hr charmap emoticons insertdatetime pagebreak accordion | ltr rtl | searchreplace visualblocks visualchars fullscreen preview code help",
].join(" | ");

const RichTextEditor = ({ value, onChange, label = "Body" }) => {
  const editorValue = useMemo(() => normalizeInitialHtml(value), [value]);

  const editorConfig = useMemo(
  () => ({
    license_key: "gpl",

    // Editor Size
    height: 560,
    min_height: 320,
    max_height: 1500,
    resize: true,
    autoresize_bottom_margin: 24,

    // UI
    branding: false,
    promotion: false,
    skin: false,
    content_css: false,

    // Content
    convert_urls: false,
    entity_encoding: "raw",

    // Menus & Toolbar
    menubar: "file edit view insert format tools table help",
    plugins: editorPlugins,
    toolbar: editorToolbar,
    toolbar_mode: "sliding",

    // Context Menus
    contextmenu: "link image table",
    quickbars_selection_toolbar:
      "bold italic underline | quicklink h2 h3 blockquote | bullist numlist",
    quickbars_insert_toolbar: "quickimage quicktable media",

    // Fonts
    font_family_formats: `
      League Spartan='League Spartan',sans-serif;
      Arial=arial,helvetica,sans-serif;
      Helvetica=helvetica,arial,sans-serif;
      Georgia=georgia,palatino,serif;
      Times New Roman='Times New Roman',times,serif;
      Trebuchet MS='Trebuchet MS',geneva,sans-serif;
      Verdana=verdana,geneva,sans-serif;
      Courier New='Courier New',courier,monospace
    `,

    font_size_formats:
      "12px 14px 16px 18px 20px 22px 24px 28px 32px 36px 48px 64px",

    // Blocks
    block_formats:
      "Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6; Quote=blockquote; Code=pre",

    // Custom Styles
    style_formats: [
      {
        title: "Primary Heading",
        block: "h2",
        classes: "admin-editor-heading",
      },
      {
        title: "Callout",
        block: "blockquote",
        classes: "admin-editor-callout",
      },
      {
        title: "Inline Code",
        inline: "code",
      },
    ],

    // Links
    link_default_target: "_blank",
    link_assume_external_targets: "https",

    // Images
    image_advtab: true,
    image_title: true,
    automatic_uploads: true,
    paste_data_images: true,
    file_picker_types: "image",
    file_picker_callback: (callback, _value, meta) => {
      if (meta.filetype !== "image") return;

      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        try {
          const dataUrl = await getPersistentImageUrl(file);
          callback(dataUrl, { title: file.name });
        } catch (error) {
          window.alert(error.message || "Could not process the selected image.");
        }
      };
      input.click();
    },
    images_upload_handler: (blobInfo) =>
      getPersistentImageUrl(blobInfo.blob()),

    // Media
    media_live_embeds: true,

    // Tables
    table_toolbar:
      "tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol",

    // Editor CSS
    content_style: `
      @import url('https://fonts.googleapis.com/css2?family=League+Spartan:wght@100..900&display=swap');

      html, body {
        font-family: "League Spartan", sans-serif !important;
        font-optical-sizing: auto;
        font-size: 16px;
        line-height: 1.7;
        color: #1f2937;
        padding: 16px;
      }

      p {
        margin: 0 0 1rem;
      }

      h1, h2, h3, h4, h5, h6 {
        font-family: "League Spartan", sans-serif;
        font-weight: 700;
        line-height: 1.3;
        margin: 1.2em 0 0.6em;
      }

      blockquote {
        border-left: 4px solid #2563eb;
        margin: 1rem 0;
        padding: 0.75rem 1rem;
        background: #f8fafc;
      }

      code {
        background: #f3f4f6;
        padding: 2px 4px;
        border-radius: 4px;
      }

      table {
        border-collapse: collapse;
        width: 100%;
      }

      table td,
      table th {
        border: 1px solid #d1d5db;
        padding: 8px;
      }

      img {
        max-width: 100%;
        height: auto;
      }
    `,
  }),
  []
);

  return (
    <div className="block text-sm font-semibold">
      <label>{label}</label>
      <div className="mt-2 overflow-hidden rounded border border-[#cfd3d7] bg-white [&_.tox-tinymce]:border-0">
        <Editor
          value={editorValue}
          init={editorConfig}
          onEditorChange={(nextValue, editor) => {
            if (/\bsrc=["']blob:/i.test(nextValue)) {
              editor
                .uploadImages()
                .then(() => onChange?.(editor.getContent()))
                .catch((error) => {
                  window.alert(
                    error?.message || "Could not process the selected image.",
                  );
                });
              return;
            }

            onChange?.(nextValue);
          }}
        />
      </div>
    </div>
  );
};

export default RichTextEditor;
