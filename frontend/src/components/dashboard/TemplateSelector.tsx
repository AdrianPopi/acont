"use client";

import { useTranslations } from "next-intl";

type Template = "classic" | "modern" | "minimal";

interface TemplateSelectorProps {
  selected: Template;
  onSelect: (template: Template) => void;
  onClose: () => void;
}

export default function TemplateSelector({
  selected,
  onSelect,
  onClose,
}: TemplateSelectorProps) {
  const t = useTranslations("dashboard.invoicesNew");

  const templates: { id: Template; name: string; description: string }[] = [
    {
      id: "classic",
      name: t("templateClassic"),
      description: t("templateClassicDesc"),
    },
    {
      id: "modern",
      name: t("templateModern"),
      description: t("templateModernDesc"),
    },
    {
      id: "minimal",
      name: t("templateMinimal"),
      description: t("templateMinimalDesc"),
    },
  ];

  function handleSelect(template: Template) {
    onSelect(template);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-5xl mx-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white">
              {t("selectTemplate")}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t("selectTemplateDescription")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => handleSelect(tpl.id)}
              className={`group relative rounded-xl border-2 transition-all overflow-hidden ${
                selected === tpl.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
              }`}
            >
              {/* Preview mockup - realistic invoice layout */}
              <div className="aspect-[3/4] bg-white dark:bg-gray-900 p-4 relative border border-gray-200 dark:border-gray-700 rounded-lg shadow-md">
                {/* Classic Preview - Traditional Blue Header */}
                {tpl.id === "classic" && (
                  <div className="h-full flex flex-col text-[6px] leading-tight">
                    {/* Header - Company */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-md">
                      <div className="font-bold text-[7px]">YOUR COMPANY</div>
                      <div className="text-[5px] opacity-90">
                        Address • VAT: BE0123456789
                      </div>
                    </div>

                    {/* Invoice Info */}
                    <div className="flex justify-between mt-3 mb-2">
                      <div>
                        <div className="font-bold text-[6px]">
                          INVOICE #2024-001
                        </div>
                        <div className="text-gray-500 text-[5px]">
                          Date: 09/01/2026
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-[5px]">
                          Client Name
                        </div>
                        <div className="text-gray-500 text-[5px]">
                          Client Address
                        </div>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="flex-1 mt-2">
                      <div className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 flex text-[5px] font-semibold">
                        <div className="flex-1">Item</div>
                        <div className="w-12 text-right">Amount</div>
                      </div>
                      <div className="px-2 py-1 flex text-[5px] border-b border-gray-200 dark:border-gray-700">
                        <div className="flex-1">Product/Service 1</div>
                        <div className="w-12 text-right">€100.00</div>
                      </div>
                      <div className="px-2 py-1 flex text-[5px] border-b border-gray-200 dark:border-gray-700">
                        <div className="flex-1">Product/Service 2</div>
                        <div className="w-12 text-right">€200.00</div>
                      </div>
                    </div>

                    {/* Totals */}
                    <div className="bg-blue-600 text-white px-3 py-2 rounded-md mt-auto">
                      <div className="flex justify-between text-[6px] font-bold">
                        <span>TOTAL</span>
                        <span>€363.00</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modern Preview - Gradient & Contemporary */}
                {tpl.id === "modern" && (
                  <div className="h-full flex flex-col text-[6px] leading-tight">
                    {/* Header - Gradient */}
                    <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white px-3 py-2.5 rounded-xl shadow-lg">
                      <div className="font-bold text-[8px]">COMPANY</div>
                    </div>

                    {/* Invoice Info - Two columns */}
                    <div className="grid grid-cols-2 gap-2 mt-3 mb-2">
                      <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                        <div className="font-bold text-[5px]">INV-2024-001</div>
                        <div className="text-gray-500 text-[4px]">
                          09/01/2026
                        </div>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-right">
                        <div className="font-semibold text-[5px]">Client</div>
                        <div className="text-gray-500 text-[4px]">
                          VAT: BE...
                        </div>
                      </div>
                    </div>

                    {/* Items - Clean lines */}
                    <div className="flex-1 mt-2 space-y-1">
                      <div className="flex text-[5px] text-gray-500">
                        <div className="flex-1">Description</div>
                        <div className="w-12 text-right">Total</div>
                      </div>
                      <div className="flex text-[5px] py-1">
                        <div className="flex-1">Item 1</div>
                        <div className="w-12 text-right font-medium">
                          €100.00
                        </div>
                      </div>
                      <div className="flex text-[5px] py-1">
                        <div className="flex-1">Item 2</div>
                        <div className="w-12 text-right font-medium">
                          €200.00
                        </div>
                      </div>
                    </div>

                    {/* Total - Gradient */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-2.5 rounded-xl mt-auto shadow-lg">
                      <div className="flex justify-between text-[7px] font-bold">
                        <span>TOTAL</span>
                        <span>€363.00</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Minimal Preview - Clean & Simple */}
                {tpl.id === "minimal" && (
                  <div className="h-full flex flex-col text-[6px] leading-tight">
                    {/* Header - Simple text */}
                    <div className="pb-2 border-b-2 border-gray-900 dark:border-gray-100">
                      <div className="font-bold text-[8px] text-gray-900 dark:text-gray-100">
                        YOUR COMPANY
                      </div>
                      <div className="text-[5px] text-gray-600 dark:text-gray-400 mt-0.5">
                        BE0123456789 • Address
                      </div>
                    </div>

                    {/* Invoice details */}
                    <div className="mt-3 mb-2">
                      <div className="text-[5px] text-gray-500 dark:text-gray-400">
                        INVOICE
                      </div>
                      <div className="font-bold text-[6px]">2024-001</div>
                      <div className="text-[5px] text-gray-500 dark:text-gray-400 mt-1">
                        To: Client Name
                      </div>
                    </div>

                    {/* Items - Minimal table */}
                    <div className="flex-1 mt-3">
                      <div className="flex text-[5px] border-b border-gray-300 dark:border-gray-600 pb-1 mb-1">
                        <div className="flex-1">Item</div>
                        <div className="w-12 text-right">Amount</div>
                      </div>
                      <div className="flex text-[5px] py-1">
                        <div className="flex-1">Service 1</div>
                        <div className="w-12 text-right">€100.00</div>
                      </div>
                      <div className="flex text-[5px] py-1">
                        <div className="flex-1">Service 2</div>
                        <div className="w-12 text-right">€200.00</div>
                      </div>
                    </div>

                    {/* Total - Simple */}
                    <div className="border-t-2 border-gray-900 dark:border-gray-100 pt-2 mt-auto">
                      <div className="flex justify-between text-[7px] font-bold text-gray-900 dark:text-gray-100">
                        <span>TOTAL</span>
                        <span>€363.00</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected indicator */}
                {selected === tpl.id && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg font-bold text-lg border-2 border-white dark:border-gray-900">
                    ✓
                  </div>
                )}
              </div>

              {/* Template info */}
              <div className="p-4 bg-white dark:bg-neutral-800">
                <h3 className="font-semibold text-lg text-black dark:text-white mb-1">
                  {tpl.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tpl.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {t("cancel") || "Cancel"}
          </button>
          <button
            onClick={() => handleSelect(selected)}
            className="px-6 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          >
            {t("confirm") || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
