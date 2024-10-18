// components/DiagramExporter.js
import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';

const DiagramExporter = ({ modelerRef, diagramToEdit, diagramName }) => {
  const exportDiagram = async () => {
    const canvas = modelerRef.current.get('canvas');
    canvas.zoom('fit-viewport'); // Ensure the diagram fits within the viewport

    const diagramCanvas = canvas._container;
    const svgElement = diagramCanvas.querySelector('svg');

    if (!svgElement) {
      alert('BPMN diagram element not found');
      return;
    }

    const canvasElement = diagramCanvas.cloneNode(true);
    const palette = canvasElement.querySelector('.djs-palette');
    const minimap = canvasElement.querySelector('.djs-minimap');
    const tool = canvasElement.querySelector('.djs-tool');
    if (palette) palette.remove();
    if (minimap) minimap.remove();
    if (tool) tool.remove();

    // Fetch company info
    let companyName = '';
    let phoneNumber = '';

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('employeeToken');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_HOST}/api/company/company-info/${diagramToEdit._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      companyName = response.data.companyName;
      phoneNumber = response.data.phoneNumber;
    } catch (error) {
      console.error('Error fetching company info:', error);
      alert('Error fetching company info. Please try again.');
      return;
    }

    // Create a temporary container for the cloned canvas
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.top = '0';
    tempContainer.style.left = '0';
    tempContainer.style.width = '100%';
    tempContainer.style.height = '100%';
    tempContainer.style.zIndex = '-1';
    document.body.appendChild(tempContainer);
    tempContainer.appendChild(canvasElement);

    // Use html2canvas to capture the diagram as a canvas
    html2canvas(canvasElement, { scale: 3 }).then((canvas) => {
      document.body.removeChild(tempContainer); // Clean up the temporary container

      const context = canvas.getContext('2d');
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      // Calculate the bounding box of the non-transparent pixels
      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = 0;
      let maxY = 0;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const index = (y * canvas.width + x) * 4;
          const alpha = imageData.data[index + 3];
          if (alpha > 0) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }

      const croppedWidth = maxX - minX + 1;
      const croppedHeight = maxY - minY + 1;
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = croppedWidth;
      croppedCanvas.height = croppedHeight;
      const croppedContext = croppedCanvas.getContext('2d');
      croppedContext.putImageData(context.getImageData(minX, minY, croppedWidth, croppedHeight), 0, 0);

      const imgData = croppedCanvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', undefined, [croppedWidth / 3, croppedHeight / 3]);

      // Add diagram name, company name, and phone number at the top
      pdf.setFontSize(36);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const text = `${companyName}     ${diagramName}     ${phoneNumber}`;
      const textWidth = pdf.getStringUnitWidth(text) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
      const textX = (pageWidth - textWidth) / 2;
      pdf.text(text, textX, 20);

      pdf.addImage(imgData, 'PNG', 0, 40, pageWidth, pdf.internal.pageSize.getHeight() - 50);
      pdf.save(`${diagramName}.pdf`);
    }).catch((error) => {
      console.error('Error capturing diagram:', error);
      alert('Error exporting diagram. Please try again.');
    });
  };

  return (
    <button 
      onClick={exportDiagram} 
      className="text-center w-full text-gray-500 py-2 px-4 rounded-md transition-all hover:bg-gray-200"
    >
      Export as PDF
    </button>
  );
};

export default DiagramExporter;
