import React, { useEffect, useMemo } from "react";
import RichTextEditor from "../RichTextEditor";
import { buildAssetUrl } from "../../lib/api";
import { CMS_BUTTON_STYLE_OPTIONS } from "../../lib/cmsButtonStyles";

const inputClass =
  "mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal";
const textAreaClass =
  "mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 font-normal";

function cloneDeep(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function setPathValue(source, path, value) {
  const next = cloneDeep(source || {});
  const keys = path.split(".");
  let cursor = next;
  keys.slice(0, -1).forEach((key) => {
    if (!cursor[key] || typeof cursor[key] !== "object") cursor[key] = {};
    cursor = cursor[key];
  });
  cursor[keys.at(-1)] = value;
  return next;
}

function useObjectPreview(file) {
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  useEffect(() => {
    if (!preview) return undefined;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  return preview;
}

function TextField({ label, value, onChange, type = "text", maxLength }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        type={type}
        value={value || ""}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </label>
  );
}

function TextAreaField({ label, value, onChange, rows = 3, maxLength }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <textarea
        value={value || ""}
        rows={rows}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className={textAreaClass}
      />
      {maxLength && (
        <span className="mt-1 block text-xs font-semibold text-[#6a757d]">
          {String(value || "").length}/{maxLength}
        </span>
      )}
    </label>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <select
        value={value || options[0]?.value || ""}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ImageUploadField({ label, currentUrl, currentAlt, file, onFile, onAlt }) {
  const preview = useObjectPreview(file);
  const displayUrl = preview || buildAssetUrl(currentUrl || "");

  return (
    <div className="rounded border border-[#d7dadd] bg-[#f8fafb] p-4">
      <div className="grid gap-4 md:grid-cols-[190px_1fr] md:items-start">
        <div className="h-32 overflow-hidden rounded border border-[#d7dadd] bg-white">
          {displayUrl ? (
            <img src={displayUrl} alt="" className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-semibold text-[#8b949b]">
              No image
            </div>
          )}
        </div>
        <div className="space-y-3">
          <label className="block text-sm font-semibold">
            {label}
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(event) => onFile(event.target.files?.[0] || null)}
              className="mt-2 w-full rounded border border-[#cfd3d7] px-3 py-2 text-sm font-normal"
            />
          </label>
          {file && (
            <p className="text-xs font-semibold text-[#6a757d]">
              Selected: {file.name}
            </p>
          )}
          <TextField label="Alt Text" value={currentAlt} onChange={onAlt} />
        </div>
      </div>
    </div>
  );
}

function ArrayShell({ title, items, addLabel, onAdd, children }) {
  return (
    <div className="rounded border border-[#d7dadd]">
      <div className="flex items-center justify-between gap-3 border-b border-[#d7dadd] bg-[#f8fafb] px-4 py-3">
        <p className="font-semibold">{title}</p>
        <button
          type="button"
          onClick={onAdd}
          className="rounded border border-[#4a8bc1] px-3 py-1.5 text-sm font-semibold text-[#4a8bc1]"
        >
          {addLabel}
        </button>
      </div>
      <div className="space-y-4 p-4">
        {items.length === 0 ? (
          <p className="text-sm font-semibold text-[#8b949b]">No items</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function removeAt(items, index) {
  return items.filter((_, itemIndex) => itemIndex !== index);
}

function updateAt(items, index, patch) {
  return items.map((item, itemIndex) =>
    itemIndex === index ? { ...item, ...patch } : item,
  );
}

function SocialLinksEditor({ items, onChange }) {
  return (
    <ArrayShell
      title="Social Links"
      items={items}
      addLabel="Add Link"
      onAdd={() => onChange([...(items || []), { platform: "", url: "" }])}
    >
      {(items || []).map((item, index) => (
        <div key={`social-${index}`} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <TextField
            label="Platform"
            value={item.platform}
            onChange={(value) => onChange(updateAt(items, index, { platform: value }))}
          />
          <TextField
            label="URL"
            value={item.url}
            onChange={(value) => onChange(updateAt(items, index, { url: value }))}
          />
          <button
            type="button"
            onClick={() => onChange(removeAt(items, index))}
            className="self-end rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700"
          >
            Remove
          </button>
        </div>
      ))}
    </ArrayShell>
  );
}

function DropdownEditor({ items, onChange }) {
  return (
    <div className="space-y-3 rounded border border-[#e5e5e5] bg-white p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6a757d]">
          Dropdown
        </p>
        <button
          type="button"
          onClick={() => onChange([...(items || []), { label: "", url: "" }])}
          className="rounded border border-[#cfd3d7] px-2 py-1 text-xs font-semibold"
        >
          Add
        </button>
      </div>
      {(items || []).map((item, index) => (
        <div key={`dropdown-${index}`} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <TextField
            label="Label"
            value={item.label}
            onChange={(value) => onChange(updateAt(items, index, { label: value }))}
          />
          <TextField
            label="URL"
            value={item.url}
            onChange={(value) => onChange(updateAt(items, index, { url: value }))}
          />
          <button
            type="button"
            onClick={() => onChange(removeAt(items, index))}
            className="self-end rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

function LinkListEditor({ title, items, onChange, allowDropdown = true }) {
  return (
    <ArrayShell
      title={title}
      items={items}
      addLabel="Add Link"
      onAdd={() =>
        onChange([...(items || []), allowDropdown ? { label: "", url: "", dropdown: [] } : { label: "", url: "" }])
      }
    >
      {(items || []).map((item, index) => (
        <div key={`${title}-${index}`} className="space-y-3 rounded border border-[#e5e5e5] p-3">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <TextField
              label="Label"
              value={item.label}
              onChange={(value) => onChange(updateAt(items, index, { label: value }))}
            />
            <TextField
              label="URL"
              value={item.url}
              onChange={(value) => onChange(updateAt(items, index, { url: value }))}
            />
            <button
              type="button"
              onClick={() => onChange(removeAt(items, index))}
              className="self-end rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700"
            >
              Remove
            </button>
          </div>
          {allowDropdown && (
            <DropdownEditor
              items={item.dropdown || []}
              onChange={(dropdown) =>
                onChange(updateAt(items, index, { dropdown }))
              }
            />
          )}
        </div>
      ))}
    </ArrayShell>
  );
}

function ButtonsEditor({ items, onChange }) {
  return (
    <ArrayShell
      title="Buttons"
      items={items}
      addLabel="Add Button"
      onAdd={() =>
        onChange([...(items || []), { text: "", link: "", style: "red-text-white" }])
      }
    >
      {(items || []).map((item, index) => (
        <div key={`button-${index}`} className="grid gap-3 md:grid-cols-[1fr_1fr_180px_auto]">
          <TextField
            label="Text"
            value={item.text}
            onChange={(value) => onChange(updateAt(items, index, { text: value }))}
          />
          <TextField
            label="Link"
            value={item.link}
            onChange={(value) => onChange(updateAt(items, index, { link: value }))}
          />
          <SelectField
            label="Style"
            value={item.style}
            onChange={(value) => onChange(updateAt(items, index, { style: value }))}
            options={CMS_BUTTON_STYLE_OPTIONS}
          />
          <button
            type="button"
            onClick={() => onChange(removeAt(items, index))}
            className="self-end rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700"
          >
            Remove
          </button>
        </div>
      ))}
    </ArrayShell>
  );
}

function CardsEditor({ items, onChange }) {
  return (
    <ArrayShell
      title="Cards"
      items={items}
      addLabel="Add Card"
      onAdd={() => onChange([...(items || []), { title: "", description: "" }])}
    >
      {(items || []).map((item, index) => (
        <div key={`card-${index}`} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <TextField
            label="Title"
            value={item.title}
            maxLength={48}
            onChange={(value) => onChange(updateAt(items, index, { title: value }))}
          />
          <TextAreaField
            label="Description"
            value={item.description}
            rows={2}
            maxLength={100}
            onChange={(value) =>
              onChange(updateAt(items, index, { description: value }))
            }
          />
          <button
            type="button"
            onClick={() => onChange(removeAt(items, index))}
            className="self-end rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700"
          >
            Remove
          </button>
        </div>
      ))}
    </ArrayShell>
  );
}

function ContactFieldsEditor({ items, onChange }) {
  return (
    <ArrayShell
      title="Contact Form Fields"
      items={items}
      addLabel="Add Field"
      onAdd={() => {
        if ((items || []).length >= 4) return;
        onChange([...(items || []), { label: "", placeholder: "" }]);
      }}
    >
      {(items || []).map((item, index) => (
        <div key={`contact-field-${index}`} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <TextField
            label="Label"
            value={item.label}
            onChange={(value) => onChange(updateAt(items, index, { label: value }))}
          />
          <TextField
            label="Placeholder"
            value={item.placeholder}
            onChange={(value) =>
              onChange(updateAt(items, index, { placeholder: value }))
            }
          />
          <button
            type="button"
            onClick={() => onChange(removeAt(items, index))}
            className="self-end rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700"
          >
            Remove
          </button>
        </div>
      ))}
    </ArrayShell>
  );
}

function GenericSectionsEditor({ items, onChange }) {
  return (
    <ArrayShell
      title="Sections"
      items={items}
      addLabel="Add Section"
      onAdd={() =>
        onChange([
          ...(items || []),
          {
            sectionKey: "",
            titleMain: "",
            titleSubtitle: "",
            content: "{}",
            disclaimerText: "",
            checkboxText: "",
          },
        ])
      }
    >
      {(items || []).map((item, index) => (
        <div key={`generic-section-${index}`} className="space-y-3 rounded border border-[#e5e5e5] p-3">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <TextField
              label="Section Key"
              value={item.sectionKey}
              onChange={(value) =>
                onChange(updateAt(items, index, { sectionKey: value }))
              }
            />
            <TextField
              label="Main Title"
              value={item.titleMain}
              onChange={(value) =>
                onChange(updateAt(items, index, { titleMain: value }))
              }
            />
            <button
              type="button"
              onClick={() => onChange(removeAt(items, index))}
              className="self-end rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700"
            >
              Remove
            </button>
          </div>
          <TextField
            label="Subtitle"
            value={item.titleSubtitle}
            onChange={(value) =>
              onChange(updateAt(items, index, { titleSubtitle: value }))
            }
          />
          <TextAreaField
            label="Content JSON"
            value={item.content}
            rows={5}
            onChange={(value) => onChange(updateAt(items, index, { content: value }))}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <TextField
              label="Disclaimer Text"
              value={item.disclaimerText}
              onChange={(value) =>
                onChange(updateAt(items, index, { disclaimerText: value }))
              }
            />
            <TextField
              label="Checkbox Text"
              value={item.checkboxText}
              onChange={(value) =>
                onChange(updateAt(items, index, { checkboxText: value }))
              }
            />
          </div>
        </div>
      ))}
    </ArrayShell>
  );
}

function GenericFormDefinitionEditor({ items, onChange }) {
  return (
    <ArrayShell
      title="Form Definition"
      items={items}
      addLabel="Add Field"
      onAdd={() =>
        onChange([
          ...(items || []),
          {
            key: "",
            label: "",
            type: "text",
            placeholder: "",
            description: "",
            optionsInput: "",
            required: false,
          },
        ])
      }
    >
      {(items || []).map((item, index) => (
        <div key={`generic-field-${index}`} className="space-y-3 rounded border border-[#e5e5e5] p-3">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_160px_auto]">
            <TextField
              label="Key"
              value={item.key}
              onChange={(value) => onChange(updateAt(items, index, { key: value }))}
            />
            <TextField
              label="Label"
              value={item.label}
              onChange={(value) =>
                onChange(updateAt(items, index, { label: value }))
              }
            />
            <SelectField
              label="Type"
              value={item.type}
              onChange={(value) => onChange(updateAt(items, index, { type: value }))}
              options={[
                { value: "text", label: "Text" },
                { value: "textarea", label: "Textarea" },
                { value: "select", label: "Select" },
                { value: "checkbox", label: "Checkbox" },
                { value: "file", label: "File" },
              ]}
            />
            <button
              type="button"
              onClick={() => onChange(removeAt(items, index))}
              className="self-end rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700"
            >
              Remove
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <TextField
              label="Placeholder"
              value={item.placeholder}
              onChange={(value) =>
                onChange(updateAt(items, index, { placeholder: value }))
              }
            />
            <TextField
              label="Description"
              value={item.description}
              onChange={(value) =>
                onChange(updateAt(items, index, { description: value }))
              }
            />
          </div>
          {item.type === "select" && (
            <TextField
              label="Options"
              value={item.optionsInput}
              onChange={(value) =>
                onChange(updateAt(items, index, { optionsInput: value }))
              }
            />
          )}
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={Boolean(item.required)}
              onChange={(event) =>
                onChange(updateAt(items, index, { required: event.target.checked }))
              }
              className="h-4 w-4"
            />
            Required
          </label>
        </div>
      ))}
    </ArrayShell>
  );
}

export function AdminSettingsEditor({ record, onChange }) {
  const patchPath = (path, value) =>
    onChange((current) => setPathValue(current, path, value));

  return (
    <div className="mt-5 space-y-5">
      <ImageUploadField
        label="Logo Image"
        currentUrl={record.logo?.url}
        currentAlt={record.logo?.altText}
        file={record.logoImageFile}
        onFile={(file) => onChange((current) => ({ ...current, logoImageFile: file }))}
        onAlt={(value) => patchPath("logo.altText", value)}
      />
      <div className="grid gap-3 md:grid-cols-2">
        <TextField
          label="Contact Email"
          value={record.contactInfo?.email}
          onChange={(value) => patchPath("contactInfo.email", value)}
        />
        <TextField
          label="Contact Phone"
          value={record.contactInfo?.phone}
          onChange={(value) => patchPath("contactInfo.phone", value)}
        />
      </div>
      <TextAreaField
        label="Contact Address"
        value={record.contactInfo?.address}
        rows={3}
        onChange={(value) => patchPath("contactInfo.address", value)}
      />
      <SocialLinksEditor
        items={record.socialLinks || []}
        onChange={(items) => onChange((current) => ({ ...current, socialLinks: items }))}
      />
      <TextAreaField
        label="Footer Text"
        value={record.footer?.text}
        rows={3}
        onChange={(value) => patchPath("footer.text", value)}
      />
      <LinkListEditor
        title="Footer Links"
        items={record.footer?.links || []}
        onChange={(items) => patchPath("footer.links", items)}
        allowDropdown={false}
      />
      <LinkListEditor
        title="Navigation Labels"
        items={record.navigationLabels || []}
        onChange={(items) =>
          onChange((current) => ({ ...current, navigationLabels: items }))
        }
      />
      <RichTextEditor
        label="Disclaimer"
        value={record.disclaimer}
        onChange={(value) => onChange((current) => ({ ...current, disclaimer: value }))}
      />
      <RichTextEditor
        label="Attorney Disclaimer"
        value={record.attorneyDisclaimer}
        onChange={(value) =>
          onChange((current) => ({ ...current, attorneyDisclaimer: value }))
        }
      />
      <div className="rounded border border-[#d7dadd] p-4">
        <p className="mb-3 font-semibold">Default SEO</p>
        <div className="space-y-3">
          <TextField
            label="Meta Title"
            value={record.defaultSEO?.metaTitle}
            onChange={(value) => patchPath("defaultSEO.metaTitle", value)}
          />
          <TextAreaField
            label="Meta Description"
            value={record.defaultSEO?.metaDescription}
            rows={3}
            onChange={(value) => patchPath("defaultSEO.metaDescription", value)}
          />
          <TextField
            label="Meta Keywords"
            value={
              record.defaultSEO?.metaKeywordsInput ??
              (record.defaultSEO?.metaKeywords || []).join(", ")
            }
            onChange={(value) => patchPath("defaultSEO.metaKeywordsInput", value)}
          />
        </div>
      </div>
    </div>
  );
}

export function HomeCmsEditor({ record, onChange }) {
  const patchPath = (path, value) =>
    onChange((current) => setPathValue(current, path, value));

  return (
    <div className="mt-5 space-y-5">
      <ImageUploadField
        label="Hero Image"
        currentUrl={record.hero?.featured_image1?.url}
        currentAlt={record.hero?.featured_image1?.altText}
        file={record.featuredImage1File}
        onFile={(file) => onChange((current) => ({ ...current, featuredImage1File: file }))}
        onAlt={(value) => patchPath("hero.featured_image1.altText", value)}
      />
      <TextField
        label="Hero Subtitle"
        value={record.hero?.subtitle}
        onChange={(value) => patchPath("hero.subtitle", value)}
      />
      <ButtonsEditor
        items={record.hero?.buttons || []}
        onChange={(items) => patchPath("hero.buttons", items)}
      />
      <TextAreaField
        label="Disclaimer Checkbox Text"
        value={record.hero?.disclaimerCheckboxText}
        rows={3}
        onChange={(value) => patchPath("hero.disclaimerCheckboxText", value)}
      />
      <TextAreaField
        label="Intro Text"
        value={record.hero?.introText}
        rows={4}
        onChange={(value) => patchPath("hero.introText", value)}
      />
      <div className="grid gap-3 md:grid-cols-2">
        <TextField
          label="Highlight Heading"
          value={record.highlight?.heading}
          onChange={(value) => patchPath("highlight.heading", value)}
        />
        <TextField
          label="Highlight Subheading"
          value={record.highlight?.subHeading}
          onChange={(value) => patchPath("highlight.subHeading", value)}
        />
      </div>
      <ImageUploadField
        label="Property Comparison Image"
        currentUrl={record.propertyComparison?.featured_image2?.url}
        currentAlt={record.propertyComparison?.featured_image2?.altText}
        file={record.featuredImage2File}
        onFile={(file) => onChange((current) => ({ ...current, featuredImage2File: file }))}
        onAlt={(value) => patchPath("propertyComparison.featured_image2.altText", value)}
      />
      <TextAreaField
        label="Property Disclaimer"
        value={record.propertyComparison?.disclaimer}
        rows={3}
        onChange={(value) => patchPath("propertyComparison.disclaimer", value)}
      />
      <TextAreaField
        label="Property Main Text"
        value={record.propertyComparison?.mainText}
        rows={3}
        onChange={(value) => patchPath("propertyComparison.mainText", value)}
      />
      <TextAreaField
        label="Property Highlight Text"
        value={record.propertyComparison?.highlightText}
        rows={3}
        onChange={(value) => patchPath("propertyComparison.highlightText", value)}
      />
    </div>
  );
}

export function AboutCmsEditor({ record, onChange }) {
  return (
    <div className="mt-5 space-y-4">
      <RichTextEditor
        key={`about-cms-${record.id || "singleton"}`}
        label="About Page Content"
        value={record.content || ""}
        onChange={(value) => onChange((current) => ({ ...current, content: value }))}
      />
    </div>
  );
}

export function AdvocateCmsEditor({ record, onChange }) {
  const patchPath = (path, value) =>
    onChange((current) => setPathValue(current, path, value));

  return (
    <div className="mt-5 space-y-5">
      <ImageUploadField
        label="Featured Image"
        currentUrl={record.featured_image1?.url}
        currentAlt={record.featured_image1?.altText}
        file={record.featuredImageFile}
        onFile={(file) => onChange((current) => ({ ...current, featuredImageFile: file }))}
        onAlt={(value) => patchPath("featured_image1.altText", value)}
      />
      <ImageUploadField
        label="Background Image"
        currentUrl={record.background_image?.url}
        currentAlt={record.background_image?.altText}
        file={record.backgroundImageFile}
        onFile={(file) => onChange((current) => ({ ...current, backgroundImageFile: file }))}
        onAlt={(value) => patchPath("background_image.altText", value)}
      />
      <TextField
        label="Hero Heading"
        value={record.heroHeading}
        maxLength={40}
        onChange={(value) => onChange((current) => ({ ...current, heroHeading: value }))}
      />
      <TextField
        label="Subtitle"
        value={record.subtitle}
        onChange={(value) => onChange((current) => ({ ...current, subtitle: value }))}
      />
      <TextAreaField
        label="Description"
        value={record.description}
        rows={4}
        onChange={(value) =>
          onChange((current) => ({ ...current, description: value }))
        }
      />
      <ButtonsEditor
        items={record.buttons || []}
        onChange={(items) => onChange((current) => ({ ...current, buttons: items }))}
      />
      <CardsEditor
        items={record.cards || []}
        onChange={(items) => onChange((current) => ({ ...current, cards: items }))}
      />
    </div>
  );
}

export function ContactCmsEditor({ record, onChange }) {
  return (
    <div className="mt-5 space-y-5">
      <TextField
        label="Heading"
        value={record.heading}
        onChange={(value) => onChange((current) => ({ ...current, heading: value }))}
      />
      <TextField
        label="Subheading"
        value={record.subHeading}
        onChange={(value) => onChange((current) => ({ ...current, subHeading: value }))}
      />
      <TextAreaField
        label="Description"
        value={record.description}
        rows={4}
        onChange={(value) =>
          onChange((current) => ({ ...current, description: value }))
        }
      />
      <ContactFieldsEditor
        items={record.formFields || []}
        onChange={(items) => onChange((current) => ({ ...current, formFields: items }))}
      />
      <TextAreaField
        label="Privacy Text"
        value={record.privacyText}
        rows={3}
        onChange={(value) =>
          onChange((current) => ({ ...current, privacyText: value }))
        }
      />
    </div>
  );
}

export function GenericCmsEditor({ record, onChange, onLoadById, isLoading }) {
  return (
    <div className="mt-5 space-y-5">
      <div className="rounded border border-[#d7dadd] bg-[#f8fafb] p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <TextField
            label="CMS Record ID"
            value={record.cmsLookupId || record.id || ""}
            onChange={(value) =>
              onChange((current) => ({ ...current, cmsLookupId: value }))
            }
          />
          <button
            type="button"
            onClick={() => onLoadById(record.cmsLookupId || record.id)}
            disabled={isLoading || !(record.cmsLookupId || record.id)}
            className="rounded bg-[#405b6d] px-4 py-2 font-semibold text-white disabled:opacity-60"
          >
            {isLoading ? "Loading..." : "Load CMS"}
          </button>
        </div>
      </div>
      <TextField
        label="Page Key"
        value={record.pageKey}
        onChange={(value) => onChange((current) => ({ ...current, pageKey: value }))}
      />
      <GenericSectionsEditor
        items={record.sections || []}
        onChange={(items) => onChange((current) => ({ ...current, sections: items }))}
      />
      <GenericFormDefinitionEditor
        items={record.formDefinition || []}
        onChange={(items) =>
          onChange((current) => ({ ...current, formDefinition: items }))
        }
      />
      <ImageUploadField
        label="Featured Image Left"
        currentUrl={record.featured_image_left}
        currentAlt=""
        file={record.featuredImage1File}
        onFile={(file) => onChange((current) => ({ ...current, featuredImage1File: file }))}
        onAlt={() => {}}
      />
      <ImageUploadField
        label="Featured Image Right"
        currentUrl={record.featured_image_right}
        currentAlt=""
        file={record.featuredImage2File}
        onFile={(file) => onChange((current) => ({ ...current, featuredImage2File: file }))}
        onAlt={() => {}}
      />
    </div>
  );
}

export function NotificationsEditor({ record, onDelete, isSaving }) {
  const createdAt = record.created_at
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(record.created_at))
    : "Not available";

  return (
    <div className="mt-5 space-y-5">
      <div className="overflow-hidden rounded-xl border border-[#dce3e7] bg-white">
        <div className="flex items-start gap-4 border-b border-[#e6ebee] bg-[#f7f9fa] p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#dfeef7] text-xl font-bold text-[#367aa9]">
            !
          </span>
          <div className="min-w-0 flex-1">
            {record.relatedModule && (
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#647681]">
                {record.relatedModule}
              </p>
            )}
            <p className="mt-3 text-xl font-bold leading-tight text-[#2e4353]">
              {record.title || "Admin notification"}
            </p>
            <p className="mt-1 text-xs font-medium text-[#87939a]">
              ReceivedAt: {createdAt}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
              record.isRead
                ? "bg-[#e9eef1] text-[#60717c]"
                : "bg-[#e64863] text-white"
            }`}
          >
            {record.isRead ? "Read" : "Unread"}
          </span>
        </div>

        <div className="p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#87939a]">
            Message
          </p>
          <p className="mt-2 whitespace-pre-wrap leading-7 text-[#4f606a]">
            {record.description || "No additional message was provided."}
          </p>
        </div>
      </div>

      <div className="flex justify-end border-t border-[#e2e7ea] pt-4">
        <button
          type="button"
          onClick={() => onDelete(record.id)}
          disabled={isSaving}
          className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
        >
          Delete notification
        </button>
      </div>
    </div>
  );
}
