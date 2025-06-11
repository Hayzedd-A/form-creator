import { formatDuration } from "@/lib/analytics";
import { toast } from "sonner";

const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .print-area, .print-area * {
      visibility: visible;
    }
    .print-area {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    .no-print {
      display: none !important;
    }
    .print-header {
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #000;
    }
    .print-field {
      margin-bottom: 15px;
      page-break-inside: avoid;
    }
    .print-field-label {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .print-field-answer {
      margin-left: 10px;
      padding: 5px;
      border: 1px solid #ccc;
      background-color: #f9f9f9;
    }
    @page {
      margin: 1in;
      size: A4;
    }
  }
  
  /* Base styles for both screen and print */
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  .print-header {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #333;
  }
  .print-header h1 {
    margin: 0 0 10px 0;
    font-size: 24px;
    color: #333;
  }
  .print-header .subtitle {
    color: #666;
    font-size: 14px;
    margin: 5px 0;
  }
  .print-field {
    margin-bottom: 20px;
    page-break-inside: avoid;
    border-left: 3px solid #e5e7eb;
    padding-left: 15px;
  }
  .print-field-label {
    font-weight: 600;
    font-size: 14px;
    color: #374151;
    margin-bottom: 8px;
    display: block;
  }
  .print-field-type {
    font-size: 11px;
    color: #6b7280;
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 3px;
    margin-left: 8px;
  }
  .print-field-answer {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 12px;
    margin-top: 8px;
    font-size: 14px;
    line-height: 1.5;
  }
  .print-field-answer.no-response {
    color: #9ca3af;
    font-style: italic;
  }
  .print-badge {
    display: inline-block;
    background: #e5e7eb;
    color: #374151;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    margin: 2px 4px 2px 0;
  }
  .print-badge.correct {
    background: #dcfce7;
    color: #166534;
  }
  .print-badge.incorrect {
    background: #fee2e2;
    color: #991b1b;
  }
  .print-rating {
    font-size: 18px;
    color: #fbbf24;
  }
  .print-correct-answer {
    margin-top: 10px;
    padding: 10px;
    background: #dbeafe;
    border: 1px solid #93c5fd;
    border-radius: 6px;
  }
  .print-correct-answer-label {
    font-weight: 600;
    color: #1e40af;
    font-size: 12px;
    margin-bottom: 5px;
  }
  .print-explanation {
    margin-top: 8px;
    font-size: 13px;
    color: #1e40af;
  }
  .print-meta {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #e5e7eb;
    font-size: 12px;
    color: #6b7280;
  }
  .print-meta-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
  }
  .required-indicator {
    color: #dc2626;
  }
`;

export const handlePrintResponse = (
  response: any,
  assignmentMode: boolean,
  formTitle: string,
  formFields: any[]
) => {
  // Create a new window for printing
  const printWindow = window.open("", "_blank", "width=800,height=600");

  if (!printWindow) {
    toast.error(
      "Unable to open print window. Please check your popup blocker."
    );
    return;
  }

  // Generate the print content
  const printContent = generatePrintContent(
    response,
    assignmentMode,
    formTitle,
    formFields
  );

  // Write the complete HTML document
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Response - ${formTitle}</title>
        <style>
          ${printStyles}
        </style>
      </head>
      <body>
        ${printContent}
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for the document to be fully loaded before printing
  const waitForLoad = () => {
    if (printWindow.document.readyState === 'complete') {
      // Additional delay to ensure styles are applied
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
          
          // Close the window after printing (optional)
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        } catch (error) {
          console.error('Print error:', error);
          toast.error('Failed to print. Please try again.');
        }
      }, 500);
    } else {
      setTimeout(waitForLoad, 100);
    }
  };

  // Start checking if document is ready
  waitForLoad();
};

// Alternative method using onload event
export const handlePrintResponseAlternative = (
  response: any,
  assignmentMode: boolean,
  formTitle: string,
  formFields: any[]
) => {
  const printWindow = window.open("", "_blank", "width=800,height=600");

  if (!printWindow) {
    toast.error(
      "Unable to open print window. Please check your popup blocker."
    );
    return;
  }

  const printContent = generatePrintContent(
    response,
    assignmentMode,
    formTitle,
    formFields
  );

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Response - ${formTitle}</title>
        <style>
          ${printStyles}
        </style>
      </head>
      <body>
        ${printContent}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

// Inline print method (prints within the same window)
export const handlePrintResponseInline = (
  response: any,
  assignmentMode: boolean,
  formTitle: string,
  formFields: any[]
) => {
  // Create a hidden div with the print content
  const printDiv = document.createElement('div');
  printDiv.innerHTML = generatePrintContent(response, assignmentMode, formTitle, formFields);
  printDiv.style.display = 'none';
  printDiv.className = 'print-content-only';
  
  // Add print-specific styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @media print {
      body * {
        visibility: hidden;
      }
      .print-content-only, .print-content-only * {
        visibility: visible;
      }
      .print-content-only {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        display: block !important;
      }
    }
    ${printStyles}
  `;
  
  document.head.appendChild(styleSheet);
  document.body.appendChild(printDiv);
  
  // Print
  window.print();
  
  // Clean up
  document.head.removeChild(styleSheet);
  document.body.removeChild(printDiv);
};

// Function to generate print content
export const generatePrintContent = (
  response: any,
  assignmentMode: boolean,
  formTitle: string,
  formFields: any[]
) => {
  const submissionDate = new Date(response.createdAt).toLocaleString();
  const gradeInfo =
    assignmentMode &&
    response.totalScore !== undefined &&
    response.maxScore !== undefined
      ? (() => {
          const percentage = Math.round(
            (response.totalScore / response.maxScore) * 100
          );
          let letter = "F";
          if (percentage >= 90) letter = "A";
          else if (percentage >= 80) letter = "B";
          else if (percentage >= 70) letter = "C";
          else if (percentage >= 60) letter = "D";
          return { percentage, letter };
        })()
      : null;

  let content = `
      <div class="print-header">
        <h1>${formTitle}</h1>
        <div class="subtitle">Form Response Details</div>
        <div class="subtitle">Submitted: ${submissionDate}</div>
        <div class="subtitle">Response ID: ${response._id}</div>
        ${
          response.submitterEmail
            ? `<div class="subtitle">Email: ${response.submitterEmail}</div>`
            : ""
        }
        ${
          gradeInfo
            ? `<div class="subtitle">Score: ${response.totalScore}/${response.maxScore} (${gradeInfo.percentage}% - Grade ${gradeInfo.letter})</div>`
            : ""
        }
      </div>
    `;

  // Add responses
  formFields.forEach((field) => {
    const fieldResponse = response.responses.find(
      (r: any) => r.fieldId === field.id
    );
    const isCorrect = assignmentMode ? fieldResponse?.isCorrect : undefined;

    content += `
        <div class="print-field">
          <div class="print-field-label">
            ${field.label}
            ${field.required ? '<span class="required-indicator">*</span>' : ""}
            <span class="print-field-type">${field.type}</span>
            ${
              assignmentMode && isCorrect !== undefined
                ? `<span class="print-badge ${
                    isCorrect ? "correct" : "incorrect"
                  }">${isCorrect ? "✓ Correct" : "✗ Incorrect"}</span>`
                : ""
            }
          </div>
          ${
            field.description
              ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">${field.description}</div>`
              : ""
          }
          <div class="print-field-answer ${
            !fieldResponse ||
            fieldResponse.value === null ||
            fieldResponse.value === undefined
              ? "no-response"
              : ""
          }">
            ${formatFieldValueForPrint(fieldResponse, field)}
          </div>
          ${
            assignmentMode && field.correctAnswer !== undefined
              ? `
            <div class="print-correct-answer">
              <div class="print-correct-answer-label">Correct Answer:</div>
              <div>${
                Array.isArray(field.correctAnswer)
                  ? field.correctAnswer.join(", ")
                  : String(field.correctAnswer)
              }</div>
              ${
                field.explanation
                  ? `<div class="print-explanation">${field.explanation}</div>`
                  : ""
              }
            </div>
          `
              : ""
          }
        </div>
      `;
  });

  // Add metadata
  content += `
      <div class="print-meta">
        <div class="print-meta-row">
          <span>Response Status:</span>
          <span>${response.status}</span>
        </div>
        ${
          response.timeSpent
            ? `
          <div class="print-meta-row">
            <span>Time Spent:</span>
            <span>${formatDuration(response.timeSpent)}</span>
          </div>
        `
            : ""
        }
        ${
          response.submitterIp
            ? `
          <div class="print-meta-row">
            <span>IP Address:</span>
            <span>${response.submitterIp}</span>
          </div>
        `
            : ""
        }
        ${
          response.deviceInfo?.browser
            ? `
          <div class="print-meta-row">
            <span>Browser:</span>
            <span>${response.deviceInfo.browser} on ${
                response.deviceInfo.os || "Unknown OS"
              }</span>
          </div>
        `
            : ""
        }
        ${
          response.submitterLocation?.city
            ? `
          <div class="print-meta-row">
            <span>Location:</span>
            <span>${response.submitterLocation.city}, ${response.submitterLocation.country}</span>
          </div>
        `
            : ""
        }
        <div class="print-meta-row">
          <span>Printed:</span>
          <span>${new Date().toLocaleString()}</span>
        </div>
      </div>
    `;

  return content;
};

// Function to format field values for print
const formatFieldValueForPrint = (fieldResponse: any, field: any) => {
  if (
    !fieldResponse ||
    fieldResponse.value === null ||
    fieldResponse.value === undefined
  ) {
    return "<em>No response provided</em>";
  }

  const value = fieldResponse.value;

  switch (field?.type) {
    case "multiple-choice":
    case "checkbox":
      if (Array.isArray(value)) {
        return value
          .map((item: string) => `<span class="print-badge">${item}</span>`)
          .join(" ");
      }
      return `<span class="print-badge">${value}</span>`;

    case "rating":
      const stars =
        "★".repeat(value) + "☆".repeat((field.maxRating || 5) - value);
      return `<span class="print-rating">${stars}</span> (${value}/${
        field.maxRating || 5
      })`;

    case "linear-scale":
      return `${value} / ${field.maxScale || 10}${
        field.scaleLabels
          ? ` (${field.scaleLabels.min} - ${field.scaleLabels.max})`
          : ""
      }`;

    case "yes-no":
      return `<span class="print-badge">${
        value === "yes" ? "Yes" : "No"
      }</span>`;

    case "date":
    case "datetime":
      return new Date(value).toLocaleDateString();

    case "file-upload":
      if (fieldResponse.fileUrl) {
        return `<a href="${fieldResponse.fileUrl}">📎 View File</a>`;
      }
      return "<em>No file uploaded</em>";

    case "address":
      if (typeof value === "object" && value !== null) {
        const parts = [
          value.street,
          value.city,
          value.state,
          value.zip,
          value.country,
        ].filter(Boolean);
        return parts.join(", ") || "<em>Incomplete address</em>";
      }
      return String(value);

    default:
      if (typeof value === "object") {
        return `<pre style="font-size: 11px; white-space: pre-wrap;">${JSON.stringify(
          value,
          null,
          2
        )}</pre>`;
      }
      return String(value);
  }
};

