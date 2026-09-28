import { jsPDF } from 'jspdf'

export function generateStudyNotesPDF({ courseTitle, lessonTitle, notesData }) {
  if (!notesData) return

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginLeft = 18
  const marginRight = 18
  const contentWidth = pageWidth - marginLeft - marginRight
  const marginBottom = 20

  let y = 18

  function checkNewPage(neededSpace = 15) {
    if (y + neededSpace >= pageHeight - marginBottom) {
      doc.addPage()
      y = 20
    }
  }

  // --- BRAND HEADER ---
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(241, 101, 36) // #F16524
  doc.text('Kitsuno.ai', marginLeft, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(120, 110, 105)
  doc.text('STUDY NOTES NOTEBOOK', marginLeft + 46, y - 0.5)

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  doc.text(dateStr, pageWidth - marginRight, y, { align: 'right' })

  y += 6

  // Decorative Rule
  doc.setDrawColor(241, 101, 36)
  doc.setLineWidth(0.8)
  doc.line(marginLeft, y, pageWidth - marginRight, y)
  y += 7

  // --- TITLE & METADATA ---
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(30, 24, 20)
  const titleLines = doc.splitTextToSize(lessonTitle || notesData.topic || 'Lesson Notes', contentWidth)
  doc.text(titleLines, marginLeft, y)
  y += titleLines.length * 6 + 1

  if (courseTitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 90, 85)
    doc.text(`Course: ${courseTitle}`, marginLeft, y)
    y += 6
  }

  // Divider
  doc.setDrawColor(230, 225, 220)
  doc.setLineWidth(0.3)
  doc.line(marginLeft, y, pageWidth - marginRight, y)
  y += 8

  // Helper for Section Titles
  function addSectionTitle(num, title) {
    checkNewPage(14)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11.5)
    doc.setTextColor(241, 101, 36)
    doc.text(`${num}. ${title.toUpperCase()}`, marginLeft, y)
    y += 5.5
  }

  // 1. Topic Overview
  if (notesData.topic_overview) {
    addSectionTitle('1', 'Topic Overview')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(45, 40, 36)
    const lines = doc.splitTextToSize(notesData.topic_overview, contentWidth)
    lines.forEach((line) => {
      checkNewPage(5)
      doc.text(line, marginLeft, y)
      y += 5
    })
    y += 4
  }

  // 2. Key Concepts
  if (notesData.core_concepts && notesData.core_concepts.length > 0) {
    addSectionTitle('2', 'Key Concepts')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(45, 40, 36)
    notesData.core_concepts.forEach((concept) => {
      checkNewPage(6)
      doc.text('•', marginLeft + 1, y)
      const lines = doc.splitTextToSize(concept, contentWidth - 6)
      lines.forEach((line, idx) => {
        if (idx > 0) checkNewPage(5)
        doc.text(line, marginLeft + 6, y)
        y += 5
      })
      y += 1
    })
    y += 4
  }

  // 3. Important Definitions
  if (notesData.definitions && notesData.definitions.length > 0) {
    addSectionTitle('3', 'Important Definitions')
    notesData.definitions.forEach((def) => {
      checkNewPage(12)
      doc.setFillColor(252, 250, 248)
      doc.setDrawColor(235, 228, 220)
      const lines = doc.splitTextToSize(def, contentWidth - 8)
      const boxHeight = lines.length * 4.8 + 4
      doc.roundedRect(marginLeft, y - 3, contentWidth, boxHeight, 1.5, 1.5, 'FD')

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(45, 40, 36)
      lines.forEach((line, idx) => {
        doc.text(line, marginLeft + 4, y + idx * 4.8 + 1)
      })
      y += boxHeight + 3
    })
    y += 3
  }

  // 4. Core Syntax & Rules
  if (notesData.syntax_rules && notesData.syntax_rules.length > 0) {
    addSectionTitle('4', 'Core Syntax & Rules')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(45, 40, 36)
    notesData.syntax_rules.forEach((rule, idx) => {
      checkNewPage(6)
      doc.text(`${idx + 1}.`, marginLeft + 1, y)
      const lines = doc.splitTextToSize(rule, contentWidth - 8)
      lines.forEach((line, lIdx) => {
        if (lIdx > 0) checkNewPage(5)
        doc.text(line, marginLeft + 8, y)
        y += 4.8
      })
      y += 1.5
    })
    y += 4
  }

  // 5. Examples with Code Blocks
  if (notesData.examples && notesData.examples.length > 0) {
    addSectionTitle('5', 'Practical Examples')
    notesData.examples.forEach((code) => {
      doc.setFont('courier', 'normal')
      doc.setFontSize(8.5)
      const codeLines = doc.splitTextToSize(code, contentWidth - 8)
      const blockHeight = codeLines.length * 4.2 + 5

      checkNewPage(Math.min(blockHeight + 4, 40))
      doc.setFillColor(28, 24, 22)
      doc.roundedRect(marginLeft, y - 2, contentWidth, blockHeight, 1.5, 1.5, 'F')

      doc.setTextColor(240, 235, 230)
      codeLines.forEach((cline, cIdx) => {
        if (y + 4.2 >= pageHeight - marginBottom) {
          doc.addPage()
          y = 20
          doc.setFillColor(28, 24, 22)
          doc.roundedRect(marginLeft, y - 2, contentWidth, (codeLines.length - cIdx) * 4.2 + 5, 1.5, 1.5, 'F')
          doc.setTextColor(240, 235, 230)
        }
        doc.text(cline, marginLeft + 4, y + 2)
        y += 4.2
      })
      y += 6
    })
    y += 2
  }

  // 6. Step-by-Step Explanation
  if (notesData.step_by_step && notesData.step_by_step.length > 0) {
    addSectionTitle('6', 'Step-by-Step Explanation')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(45, 40, 36)
    notesData.step_by_step.forEach((step) => {
      checkNewPage(6)
      const lines = doc.splitTextToSize(step, contentWidth - 4)
      lines.forEach((line, idx) => {
        if (idx > 0) checkNewPage(4.8)
        doc.text(line, marginLeft + 2, y)
        y += 4.8
      })
      y += 1.5
    })
    y += 4
  }

  // 7. Common Mistakes
  if (notesData.common_mistakes && notesData.common_mistakes.length > 0) {
    addSectionTitle('7', 'Common Mistakes to Avoid')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(180, 40, 30)
    notesData.common_mistakes.forEach((mistake) => {
      checkNewPage(6)
      doc.text('⚠', marginLeft + 1, y)
      const lines = doc.splitTextToSize(mistake, contentWidth - 8)
      lines.forEach((line, idx) => {
        if (idx > 0) checkNewPage(4.8)
        doc.text(line, marginLeft + 7, y)
        y += 4.8
      })
      y += 1.5
    })
    y += 4
  }

  // 8. Important Points to Remember
  if (notesData.important_points && notesData.important_points.length > 0) {
    addSectionTitle('8', 'Important Points to Remember')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(45, 40, 36)
    notesData.important_points.forEach((pt) => {
      checkNewPage(6)
      doc.text('★', marginLeft + 1, y)
      const lines = doc.splitTextToSize(pt, contentWidth - 8)
      lines.forEach((line, idx) => {
        if (idx > 0) checkNewPage(4.8)
        doc.text(line, marginLeft + 7, y)
        y += 4.8
      })
      y += 1.5
    })
    y += 4
  }

  // 9. Quick Revision
  if (notesData.quick_revision && notesData.quick_revision.length > 0) {
    addSectionTitle('9', 'Quick Revision Checklist')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(20, 110, 60)
    notesData.quick_revision.forEach((rev) => {
      checkNewPage(6)
      doc.text('✓', marginLeft + 1, y)
      const lines = doc.splitTextToSize(rev, contentWidth - 8)
      lines.forEach((line, idx) => {
        if (idx > 0) checkNewPage(4.8)
        doc.text(line, marginLeft + 7, y)
        y += 4.8
      })
      y += 1.5
    })
  }

  // --- FOOTER & PAGE NUMBERS ---
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(150, 140, 135)
    doc.text(
      'Kitsuno.ai LMS — Personalized AI Study Notes',
      marginLeft,
      pageHeight - 10,
    )
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - marginRight,
      pageHeight - 10,
      { align: 'right' },
    )
  }

  // Clean filename
  const cleanTitle = (lessonTitle || 'Study_Notes')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
  doc.save(`Kitsuno_${cleanTitle}_Study_Notes.pdf`)
}
