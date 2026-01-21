"use client";

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useToast } from "@/app/contexts/ToastContext";

interface SlidesPreviewModalProps {
  onClose: () => void;
  htmlContent: string;
  isGeneratingPDF: boolean;
  topic?: string;
}

export default function SlidesPreviewModal({
  onClose,
  htmlContent,
  isGeneratingPDF,
  topic = "Presentation",
}: SlidesPreviewModalProps) {
  const { addToast } = useToast();

  if (!htmlContent) return null;

  // Handle PDF download from modal
  const handleDownloadPDF = async () => {
    if (!htmlContent) return;

    try {
      addToast("Generating PDF...", "info");

      await generatePDFFromHTML(htmlContent, topic);

      addToast("Presentation PDF downloaded!", "success");

      // Track PDF generation
      // trackAction("download_pdf_from_preview", {
      //   topic: stepContents.setup.topic,
      // });
    } catch (error) {
      console.error("Error generating PDF:", error);
      addToast(
        `Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error",
      );
    }
  };

  // Generate PDF from HTML slides
  const generatePDFFromHTML = async (htmlContent: string, topic: string) => {
    // Dynamically import required libraries

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Create a temporary iframe to render the HTML
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.left = "-9999px";
    iframe.style.top = "-9999px";
    iframe.style.width = "1920px";
    iframe.style.height = "1080px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    try {
      // Write HTML to iframe
      iframe.contentDocument?.write(htmlContent);
      iframe.contentDocument?.close();

      // Wait for iframe to load
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Get all slide elements (assuming slides have a class like 'slide' or are section elements)
      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error("Failed to access iframe document");
      }

      // Try to find slides - common patterns
      let slides: HTMLElement[] = [];

      // Pattern 1: Elements with class containing 'slide'
      const slideElements = iframeDoc.querySelectorAll(
        '[class*="slide"], .slide, section, .slide-container, .presentation-slide',
      );
      if (slideElements.length > 0) {
        slides = Array.from(slideElements) as HTMLElement[];
      } else {
        // Pattern 2: Direct children of body
        const bodyChildren = Array.from(
          iframeDoc.body.children,
        ) as HTMLElement[];
        slides = bodyChildren.filter(
          (el) =>
            el.tagName !== "SCRIPT" &&
            el.tagName !== "STYLE" &&
            el.tagName !== "LINK",
        );
      }

      // If no slides found, create one from the entire document
      if (slides.length === 0) {
        slides = [iframeDoc.body];
      }

      // Generate PDF from each slide
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];

        // Capture slide as canvas
        const canvas = await html2canvas(slide, {
          scale: 2, // Higher quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
        });

        // Convert canvas to image data
        const imgData = canvas.toDataURL("image/png");

        // Add new page for each slide (except first)
        if (i > 0) {
          doc.addPage();
        }

        // Calculate dimensions to fit page
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        // Calculate aspect ratio
        const ratio = imgWidth / imgHeight;
        let width = pageWidth;
        let height = pageWidth / ratio;

        // If height is too tall, scale by height instead
        if (height > pageHeight) {
          height = pageHeight;
          width = pageHeight * ratio;
        }

        // Center the image on the page
        const x = (pageWidth - width) / 2;
        const y = (pageHeight - height) / 2;

        // Add image to PDF
        doc.addImage(imgData, "PNG", x, y, width, height);

        // Add slide number
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Slide ${i + 1}`, pageWidth - 20, pageHeight - 10);
      }

      // Add title page if we have multiple slides
      if (slides.length > 1) {
        // Create title page
        doc.deletePage(1); // Remove first page (will be replaced)
        doc.insertPage(1);

        // Title page design
        doc.setFillColor(52, 152, 219);
        doc.rect(
          0,
          0,
          doc.internal.pageSize.getWidth(),
          doc.internal.pageSize.getHeight(),
          "F",
        );

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(36);
        doc.setFont("helvetica", "bold");
        doc.text(
          topic || "Presentation",
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() / 2 - 20,
          { align: "center" },
        );

        doc.setFontSize(18);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Prepared with Prez AI`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() / 2 + 20,
          { align: "center" },
        );

        doc.setFontSize(14);
        doc.text(
          `${slides.length - 1} slides • ${new Date().toLocaleDateString()}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 30,
          { align: "center" },
        );
      }

      // Download the PDF
      const filename = `presentation-${topic?.replace(/\s+/g, "-").toLowerCase() || "slides"}-${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(filename);
    } finally {
      // Clean up iframe
      document.body.removeChild(iframe);
    }
  };

  const handleCopyHTML = () => {
    navigator.clipboard.writeText(htmlContent);
    addToast("HTML code copied to clipboard!", "success");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Presentation Slides Preview
            </h2>
            <p className="text-gray-600 mt-1">
              Preview your AI-generated slides. Click "Download as PDF" to save.
            </p>
            {topic && (
              <p className="text-sm text-gray-500 mt-1">
                Topic: <span className="font-medium">{topic}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isGeneratingPDF ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                  </svg>
                  Download as PDF
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body - Iframe with slides */}
        <div className="flex-1 min-h-0 p-2">
          <div className="w-full h-full border-2 border-gray-200 rounded-lg overflow-auto">
            <iframe
              srcDoc={htmlContent}
              title="Presentation Slides Preview"
              className="w-full min-h-[600px]"
              sandbox="allow-scripts allow-same-origin"
              loading="lazy"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                AI-generated slides
              </span>
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                Interactive preview
              </span>
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  ></path>
                </svg>
                {Math.ceil(htmlContent.length / 1024)} KB
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyHTML}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Copy HTML
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([htmlContent], { type: "text/html" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `slides-${topic.replace(/\s+/g, "-").toLowerCase()}.html`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  addToast("HTML file downloaded!", "success");
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Download HTML
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
