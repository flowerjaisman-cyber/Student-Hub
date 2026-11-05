import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { UserDocument, DocumentCategory, PageSize, PageOrientation, PageMarginPreset } from '../types/index.ts';

/**
 * Clean plain-text extraction from an HTML string
 */
export function extractTextFromHtml(html: string): string {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Calculate real-time document statistics
 */
export interface DocumentStats {
  words: number;
  charactersWithSpaces: number;
  charactersWithoutSpaces: number;
  paragraphs: number;
  sentences: number;
  readingTimeMinutes: number;
  readingTimeString: string;
}

export function calculateDocumentStats(html: string): DocumentStats {
  const text = extractTextFromHtml(html).trim();

  if (!text) {
    return {
      words: 0,
      charactersWithSpaces: 0,
      charactersWithoutSpaces: 0,
      paragraphs: 0,
      sentences: 0,
      readingTimeMinutes: 0,
      readingTimeString: '< 1 min read',
    };
  }

  // Word count: split by whitespace
  const wordsArray = text.split(/\s+/).filter((w) => w.length > 0);
  const words = wordsArray.length;

  const charactersWithSpaces = text.length;
  const charactersWithoutSpaces = text.replace(/\s+/g, '').length;

  // Paragraph count: count non-empty line blocks
  const paragraphs = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0).length || (text ? 1 : 0);

  // Sentences count: split by . ! ?
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0).length || (text ? 1 : 0);

  // Reading time: standard average 200 words per minute for student reading
  const readingTimeMinutes = Math.max(1, Math.round(words / 200));
  const readingTimeString =
    words < 150
      ? '< 1 min read'
      : `${readingTimeMinutes} min${readingTimeMinutes === 1 ? '' : 's'} read (est.)`;

  return {
    words,
    charactersWithSpaces,
    charactersWithoutSpaces,
    paragraphs,
    sentences,
    readingTimeMinutes,
    readingTimeString,
  };
}

/**
 * Document Templates (Pure structure, zero fake student names/grades)
 */
export interface DocumentTemplate {
  id: string;
  name: string;
  category: DocumentCategory;
  description: string;
  defaultTitle: string;
  content: string;
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Document',
    category: 'Blank',
    description: 'Clean blank sheet ready for any student notes, coursework, or essay.',
    defaultTitle: 'Untitled Document',
    content: '<p></p>',
  },
  {
    id: 'study-notes',
    name: 'Study Notes',
    category: 'Study Notes',
    description: 'Cornell-inspired study format with key terms, lecture points, and summary.',
    defaultTitle: 'Study & Lecture Notes',
    content: `
      <h2>[Course Code / Topic Name] &mdash; Study Notes</h2>
      <p><strong>Date:</strong> [Study Date] &bull; <strong>Lecturer / Unit:</strong> [Instructor / Unit]</p>
      <hr/>
      <h3>Key Concepts &amp; Terminology</h3>
      <ul>
        <li><strong>Concept 1:</strong> Definition, core principles, and significance...</li>
        <li><strong>Concept 2:</strong> Real-world applications and exam relevance...</li>
      </ul>
      <h3>Detailed Lecture / Chapter Content</h3>
      <p>Record chronological observations, formulas, definitions, and proofs here...</p>
      <h3>Summary &amp; Review Questions</h3>
      <p>Summarize the overarching concept in 2-3 sentences for rapid exam review...</p>
    `,
  },
  {
    id: 'assignment',
    name: 'Assignment',
    category: 'Assignment',
    description: 'Structured layout with standard academic title block and section headings.',
    defaultTitle: 'Coursework Assignment',
    content: `
      <h2>Assignment Title</h2>
      <p><strong>Student Name:</strong> [Your Name]</p>
      <p><strong>Course:</strong> [Course Code &amp; Title]</p>
      <p><strong>Instructor:</strong> [Instructor Name]</p>
      <p><strong>Date:</strong> [Submission Date]</p>
      <hr/>
      <h3>1. Introduction &amp; Problem Statement</h3>
      <p>Introduce the topic, scope, and objective of this assignment here...</p>
      <h3>2. Analysis &amp; Methodology</h3>
      <p>Present your detailed exploration, evidence, and critical findings...</p>
      <h3>3. Discussion</h3>
      <p>Discuss the implications of your findings and any constraints...</p>
      <h3>4. Conclusion</h3>
      <p>Summarize the core takeaways and proposed recommendations...</p>
      <h3>References</h3>
      <p>[1] Author, A. (Year). Title of Publication. Publisher.</p>
    `,
  },
  {
    id: 'project-report',
    name: 'Project Report',
    category: 'Project Report',
    description: 'Formal academic report structure with executive summary, methodology, and findings.',
    defaultTitle: 'Academic Project Report',
    content: `
      <h1>Project / Research Report</h1>
      <p><em>Prepared for [Department / Course Name]</em></p>
      <hr/>
      <h2>Executive Summary</h2>
      <p>Provide a high-level overview of the background, core investigation, and primary conclusions...</p>
      <h2>1. Background &amp; Objectives</h2>
      <p>Describe why this project was conducted and the specific questions it addresses...</p>
      <h2>2. Methodology &amp; Implementation</h2>
      <p>Detail the procedures, experiments, or architecture developed...</p>
      <h2>3. Key Findings &amp; Results</h2>
      <p>Detail the qualitative or quantitative findings identified during the project...</p>
      <h2>4. Recommendations &amp; Next Steps</h2>
      <p>Outline recommended steps or further avenues for investigation...</p>
      <h2>References</h2>
      <p>[1] Author, A. (Year). Title of Source.</p>
    `,
  },
  {
    id: 'class-summary',
    name: 'Class Summary',
    category: 'Class Summary',
    description: 'Weekly or unit recap format synthesizing textbook chapters and classroom topics.',
    defaultTitle: 'Class Summary & Review',
    content: `
      <h2>Class Summary: [Topic / Week #]</h2>
      <p><strong>Subject:</strong> [Course Name] &bull; <strong>Week:</strong> [Week #] &bull; <strong>Date:</strong> [Date]</p>
      <hr/>
      <h3>Core Topics Covered</h3>
      <ul>
        <li><strong>Topic 1:</strong> Essential concepts and definitions...</li>
        <li><strong>Topic 2:</strong> Theorems, models, or examples analyzed...</li>
      </ul>
      <h3>Important Formulas &amp; Rules</h3>
      <p>Write down key formulas, equations, or structural rules covered this week...</p>
      <h3>Key Takeaways</h3>
      <p>Outline the most critical takeaways likely to appear on upcoming quizzes or exams...</p>
      <h3>Action Items &amp; Homework</h3>
      <ul>
        <li>Complete assigned readings for next class</li>
        <li>Review practice problems #1 to #5</li>
      </ul>
    `,
  },
  {
    id: 'meeting-notes',
    name: 'Meeting / Discussion Notes',
    category: 'Meeting Notes',
    description: 'Study group or project meeting agenda, discussion points, decisions, and action items.',
    defaultTitle: 'Group Discussion Notes',
    content: `
      <h2>Study Group / Project Meeting</h2>
      <p><strong>Date &amp; Time:</strong> [Meeting Date] &bull; <strong>Attendees:</strong> [List of Members]</p>
      <p><strong>Goal / Agenda:</strong> [Primary Objective of Meeting]</p>
      <hr/>
      <h3>1. Agenda Topics Discussed</h3>
      <ul>
        <li><strong>Topic A:</strong> Key points discussed and shared insights...</li>
        <li><strong>Topic B:</strong> Unresolved questions and debate...</li>
      </ul>
      <h3>2. Decisions Made</h3>
      <p>Summarize group consensus and decisions agreed upon...</p>
      <h3>3. Action Items &amp; Responsibilities</h3>
      <ul>
        <li>[Name 1] &mdash; Complete section draft by [Date]</li>
        <li>[Name 2] &mdash; Review research data and sources by [Date]</li>
      </ul>
      <h3>Next Meeting</h3>
      <p>Scheduled for [Next Date &amp; Time] &bull; Topic: [Focus]</p>
    `,
  },
  {
    id: 'personal-notes',
    name: 'Personal Notes',
    category: 'Personal Notes',
    description: 'Flexible personal student thoughts, goals, reflections, and planning ideas.',
    defaultTitle: 'Personal Notes',
    content: `
      <h2>Personal Academic Notes</h2>
      <p><strong>Date:</strong> [Today's Date] &bull; <strong>Category:</strong> [Academic Reflection / Goal]</p>
      <hr/>
      <h3>Thoughts &amp; Focus</h3>
      <p>Jot down your observations, brainstorming ideas, or personal study plans here...</p>
      <h3>Priorities for This Week</h3>
      <ul>
        <li>Priority 1: [Task description]</li>
        <li>Priority 2: [Task description]</li>
        <li>Priority 3: [Task description]</li>
      </ul>
      <h3>Reflection</h3>
      <p>Reflect on what went well this week and what study habits to improve...</p>
    `,
  },
  {
    id: 'letter',
    name: 'Application Letter',
    category: 'Application',
    description: 'Clean formal letter structure for scholarship, internship, or college applications.',
    defaultTitle: 'Application Letter',
    content: `
      <p>[Your Full Name]<br/>[Your Address or Email]<br/>[Your Phone Number]</p>
      <p>[Date]</p>
      <p>[Hiring Manager / Admissions Committee]<br/>[Organization / Department Name]<br/>[Address]</p>
      <p>Dear [Recipient Name / Admissions Committee],</p>
      <p>I am writing to express my strong interest in the [Position / Program Name] with [Organization / University Name]. As a student focusing on [Area of Study], I bring a dedicated academic background and enthusiasm for [Field / Objective].</p>
      <p>During my academic coursework, I have developed core competencies in [Key Skill 1], [Key Skill 2], and [Key Skill 3]. An example of this was when I [Brief Description of Course Project or Leadership Experience].</p>
      <p>Thank you very much for your time and consideration. I welcome the opportunity to discuss my qualifications further.</p>
      <p>Sincerely,</p>
      <p>[Your Name]</p>
    `,
  },
  {
    id: 'resume',
    name: 'Simple Student Resume',
    category: 'Resume',
    description: 'Clean chronological student resume format emphasizing education and skills.',
    defaultTitle: 'Student Resume',
    content: `
      <h1 style="text-align: center;">[Your Full Name]</h1>
      <p style="text-align: center;">[Email] &bull; [Phone] &bull; [City, State] &bull; [LinkedIn / Portfolio]</p>
      <hr/>
      <h3>Education</h3>
      <p><strong>[University / College / School Name]</strong><br/>
      Degree / Major in [Field of Study] &bull; Expected Graduation: [Year]<br/>
      Relevant Coursework: [Course 1, Course 2, Course 3]</p>
      <h3>Academic Projects &amp; Experience</h3>
      <p><strong>[Project / Role Title]</strong> &bull; [Course or Organization] &bull; [Dates]<br/>
      &bull; Implemented key research or solution addressing [Topic].<br/>
      &bull; Collaborated with team members to deliver formatted report and presentation.</p>
      <h3>Skills &amp; Certifications</h3>
      <p><strong>Technical:</strong> [List software, languages, or lab skills]<br/>
      <strong>Languages:</strong> [Languages spoken and proficiency levels]</p>
    `,
  },
];

/**
 * Import TXT file into editor format
 */
export async function importTxtFile(file: File): Promise<{ title: string; content: string }> {
  const text = await file.text();
  const title = file.name.replace(/\.[^/.]+$/, '') || 'Imported Text Document';

  // Format paragraphs safely into HTML
  const paragraphs = text.split(/\r?\n\r?\n/);
  const htmlContent = paragraphs
    .map((p) => {
      const clean = p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r?\n/g, '<br/>');
      return `<p>${clean || '<br/>'}</p>`;
    })
    .join('');

  return {
    title,
    content: htmlContent || '<p></p>',
  };
}

/**
 * Import Markdown file into editor format
 */
export async function importMarkdownFile(file: File): Promise<{ title: string; content: string }> {
  const raw = await file.text();
  const title = file.name.replace(/\.[^/.]+$/, '') || 'Imported Markdown Document';

  const lines = raw.split(/\r?\n/);
  const htmlParts: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Close list if line is not a list item
    const isBullet = line.trim().match(/^[-*+]\s+(.*)/);
    const isNumber = line.trim().match(/^(\d+)\.\s+(.*)/);

    if (inList && !isBullet && !isNumber) {
      htmlParts.push(listType === 'ul' ? '</ul>' : '</ol>');
      inList = false;
    }

    if (!line.trim()) {
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      htmlParts.push(`<h3>${formatInlineMd(line.slice(4))}</h3>`);
    } else if (line.startsWith('## ')) {
      htmlParts.push(`<h2>${formatInlineMd(line.slice(3))}</h2>`);
    } else if (line.startsWith('# ')) {
      htmlParts.push(`<h1>${formatInlineMd(line.slice(2))}</h1>`);
    } else if (line.startsWith('> ')) {
      htmlParts.push(`<blockquote>${formatInlineMd(line.slice(2))}</blockquote>`);
    } else if (isBullet) {
      if (!inList || listType !== 'ul') {
        if (inList) htmlParts.push(listType === 'ul' ? '</ul>' : '</ol>');
        htmlParts.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      htmlParts.push(`<li>${formatInlineMd(isBullet[1])}</li>`);
    } else if (isNumber) {
      if (!inList || listType !== 'ol') {
        if (inList) htmlParts.push(listType === 'ul' ? '</ul>' : '</ol>');
        htmlParts.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      htmlParts.push(`<li>${formatInlineMd(isNumber[2])}</li>`);
    } else if (line.startsWith('```')) {
      // Code block start/end
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      const codeText = codeLines.join('\n').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      htmlParts.push(`<pre><code>${codeText}</code></pre>`);
    } else {
      htmlParts.push(`<p>${formatInlineMd(line)}</p>`);
    }
  }

  if (inList) {
    htmlParts.push(listType === 'ul' ? '</ul>' : '</ol>');
  }

  return {
    title,
    content: htmlParts.join('\n') || '<p></p>',
  };
}

function formatInlineMd(str: string): string {
  let s = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold & Italic
  s = s.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  s = s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*(.*?)\*/g, '<em>$1</em>');
  s = s.replace(/~~(.*?)~~/g, '<del>$1</del>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Links
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  return s;
}

/**
 * Import DOCX file using mammoth (browser-compatible client-side conversion)
 */
export async function importDocxFile(file: File): Promise<{ title: string; content: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const title = file.name.replace(/\.[^/.]+$/, '') || 'Imported Word Document';

  const result = await mammoth.convertToHtml({ arrayBuffer });
  let html = result.value || '<p></p>';

  return {
    title,
    content: html,
  };
}

/**
 * Generate DOCX Blob using docx.js
 */
export async function generateDocxBlob(title: string, htmlContent: string): Promise<Blob> {
  const container = document.createElement('div');
  container.innerHTML = htmlContent;

  const children: (Paragraph | Table)[] = [];

  // Parse container nodes into docx elements
  Array.from(container.childNodes).forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (tag === 'h1') {
        children.push(
          new Paragraph({
            text: el.textContent || '',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          })
        );
      } else if (tag === 'h2') {
        children.push(
          new Paragraph({
            text: el.textContent || '',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
      } else if (tag === 'h3') {
        children.push(
          new Paragraph({
            text: el.textContent || '',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 160, after: 80 },
          })
        );
      } else if (tag === 'ul' || tag === 'ol') {
        Array.from(el.querySelectorAll('li')).forEach((li) => {
          children.push(
            new Paragraph({
              children: [new TextRun(li.textContent || '')],
              bullet: { level: 0 },
              spacing: { after: 60 },
            })
          );
        });
      } else if (tag === 'blockquote') {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: el.textContent || '',
                italics: true,
              }),
            ],
            indent: { left: 720 },
            spacing: { before: 120, after: 120 },
          })
        );
      } else if (tag === 'table') {
        const rows: TableRow[] = [];
        const trs = el.querySelectorAll('tr');
        trs.forEach((tr) => {
          const cells: TableCell[] = [];
          const tds = tr.querySelectorAll('td, th');
          tds.forEach((td) => {
            cells.push(
              new TableCell({
                children: [new Paragraph(td.textContent || '')],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                  left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                  right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                },
                width: { size: 100 / Math.max(1, tds.length), type: WidthType.PERCENTAGE },
              })
            );
          });
          if (cells.length > 0) {
            rows.push(new TableRow({ children: cells }));
          }
        });

        if (rows.length > 0) {
          children.push(
            new Table({
              rows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            })
          );
        }
      } else {
        // Standard paragraph
        const textRuns: TextRun[] = [];
        extractRunsFromElement(el, textRuns);
        children.push(
          new Paragraph({
            children: textRuns.length > 0 ? textRuns : [new TextRun(el.textContent || '')],
            spacing: { after: 120, line: 276 },
          })
        );
      }
    } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      children.push(
        new Paragraph({
          children: [new TextRun(node.textContent.trim())],
          spacing: { after: 120 },
        })
      );
    }
  });

  if (children.length === 0) {
    children.push(new Paragraph({ text: '' }));
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Export Document to DOCX using docx.js (download)
 */
export async function exportToDocx(title: string, htmlContent: string): Promise<void> {
  const blob = await generateDocxBlob(title, htmlContent);
  triggerDownload(blob, `${slugify(title)}.docx`);
}

function extractRunsFromElement(el: HTMLElement, runs: TextRun[], inherited?: { bold?: boolean; italics?: boolean; underline?: boolean }) {
  el.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      if (child.textContent) {
        runs.push(
          new TextRun({
            text: child.textContent,
            bold: inherited?.bold,
            italics: inherited?.italics,
            underline: inherited?.underline ? {} : undefined,
          })
        );
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const childEl = child as HTMLElement;
      const tag = childEl.tagName.toLowerCase();
      const bold = inherited?.bold || tag === 'strong' || tag === 'b';
      const italics = inherited?.italics || tag === 'em' || tag === 'i';
      const underline = inherited?.underline || tag === 'u';

      extractRunsFromElement(childEl, runs, { bold, italics, underline });
    }
  });
}

/**
 * Generate PDF Blob for download or uploading to cloud storage
 */
export async function generatePdfBlob(docData: UserDocument): Promise<Blob> {
  const pageSize = docData.pageSize || 'A4';
  const orientation = docData.orientation || 'portrait';

  // Map page dimensions for jsPDF
  const formatMap: Record<PageSize, [number, number]> = {
    A4: [210, 297],
    A5: [148, 210],
    Letter: [215.9, 279.4],
    Legal: [215.9, 355.6],
  };

  const dims = formatMap[pageSize] || formatMap.A4;
  const isLandscape = orientation === 'landscape';
  const pageWidth = isLandscape ? dims[1] : dims[0];
  const pageHeight = isLandscape ? dims[0] : dims[1];

  const marginMap: Record<PageMarginPreset, number> = {
    normal: 25.4, // 1 inch
    narrow: 12.7, // 0.5 inch
    wide: 38.1,   // 1.5 inch
    custom: 25.4,
  };

  const margin = marginMap[docData.margins || 'normal'];
  const contentWidth = pageWidth - margin * 2;

  const pdf = new jsPDF({
    orientation: isLandscape ? 'l' : 'p',
    unit: 'mm',
    format: [pageWidth, pageHeight],
  });

  let currentY = margin;
  const bottomThreshold = pageHeight - margin;

  // Header Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  const titleLines = pdf.splitTextToSize(docData.title, contentWidth);
  pdf.text(titleLines, margin, currentY);
  currentY += titleLines.length * 8 + 4;

  // Thin separator rule
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.3);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  // Parse HTML elements
  const container = document.createElement('div');
  container.innerHTML = docData.content || '';

  const blocks = Array.from(container.children);

  if (blocks.length === 0) {
    const text = extractTextFromHtml(docData.content);
    if (text) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      const lines = pdf.splitTextToSize(text, contentWidth);
      lines.forEach((l: string) => {
        if (currentY > bottomThreshold) {
          pdf.addPage();
          currentY = margin;
        }
        pdf.text(l, margin, currentY);
        currentY += 6;
      });
    }
  } else {
    for (const block of blocks) {
      const tag = block.tagName.toLowerCase();
      const text = block.textContent?.trim() || '';

      if (!text && tag !== 'hr') continue;

      if (tag === 'h1') {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        currentY += 4;
        const lines = pdf.splitTextToSize(text, contentWidth);
        for (const line of lines) {
          if (currentY > bottomThreshold) {
            pdf.addPage();
            currentY = margin;
          }
          pdf.text(line, margin, currentY);
          currentY += 7;
        }
        currentY += 2;
      } else if (tag === 'h2') {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        currentY += 3;
        const lines = pdf.splitTextToSize(text, contentWidth);
        for (const line of lines) {
          if (currentY > bottomThreshold) {
            pdf.addPage();
            currentY = margin;
          }
          pdf.text(line, margin, currentY);
          currentY += 6;
        }
        currentY += 2;
      } else if (tag === 'h3') {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        currentY += 2;
        const lines = pdf.splitTextToSize(text, contentWidth);
        for (const line of lines) {
          if (currentY > bottomThreshold) {
            pdf.addPage();
            currentY = margin;
          }
          pdf.text(line, margin, currentY);
          currentY += 5.5;
        }
        currentY += 1.5;
      } else if (tag === 'ul' || tag === 'ol') {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10.5);
        const lis = block.querySelectorAll('li');
        let idx = 1;
        for (const li of Array.from(lis)) {
          const bullet = tag === 'ul' ? '\u2022 ' : `${idx}. `;
          idx++;
          const liText = bullet + (li.textContent || '').trim();
          const lines = pdf.splitTextToSize(liText, contentWidth - 4);
          for (let liLineIdx = 0; liLineIdx < lines.length; liLineIdx++) {
            if (currentY > bottomThreshold) {
              pdf.addPage();
              currentY = margin;
            }
            const indent = liLineIdx === 0 ? margin : margin + 4;
            pdf.text(lines[liLineIdx], indent, currentY);
            currentY += 5;
          }
        }
        currentY += 2;
      } else if (tag === 'blockquote') {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(10.5);
        pdf.setDrawColor(180, 180, 220);
        pdf.setLineWidth(0.8);
        const lines = pdf.splitTextToSize(text, contentWidth - 8);
        const quoteStartY = currentY;
        for (const line of lines) {
          if (currentY > bottomThreshold) {
            pdf.addPage();
            currentY = margin;
          }
          pdf.text(line, margin + 6, currentY);
          currentY += 5;
        }
        pdf.line(margin + 2, quoteStartY - 3, margin + 2, currentY - 2);
        currentY += 3;
      } else if (tag === 'hr') {
        if (currentY > bottomThreshold) {
          pdf.addPage();
          currentY = margin;
        }
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.2);
        pdf.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 6;
      } else {
        // Standard Paragraph
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        const lines = pdf.splitTextToSize(text, contentWidth);
        for (const line of lines) {
          if (currentY > bottomThreshold) {
            pdf.addPage();
            currentY = margin;
          }
          pdf.text(line, margin, currentY);
          currentY += 5.5;
        }
        currentY += 2.5;
      }
    }
  }

  // Add clean page numbers in footer
  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(140, 140, 140);
    pdf.text(
      `Page ${p} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - margin / 2,
      { align: 'center' }
    );
  }

  return pdf.output('blob');
}

/**
 * Export Document to PDF using jsPDF (trigger download)
 */
export async function exportToPdf(docData: UserDocument): Promise<void> {
  const blob = await generatePdfBlob(docData);
  triggerDownload(blob, `${slugify(docData.title)}.pdf`);
}

/**
 * Generate plain text Blob
 */
export function generateTxtBlob(htmlContent: string): Blob {
  const text = extractTextFromHtml(htmlContent);
  return new Blob([text], { type: 'text/plain;charset=utf-8' });
}

/**
 * Download document as plain text (.txt)
 */
export function exportToTxt(title: string, htmlContent: string): void {
  const blob = generateTxtBlob(htmlContent);
  triggerDownload(blob, `${slugify(title)}.txt`);
}

/**
 * Generate HTML Blob
 */
export function generateHtmlBlob(
  title: string,
  htmlContent: string,
  options: {
    fontFamily?: string;
    fontSize?: string;
    pageSize?: string;
  }
): Blob {
  const font = options.fontFamily || 'Arial, sans-serif';
  const size = options.fontSize || '14px';

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      font-family: ${font};
      font-size: ${size};
      line-height: 1.6;
      color: #1e293b;
      background-color: #f8fafc;
      padding: 40px 20px;
      margin: 0;
    }
    .page-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 50px 60px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    h1, h2, h3, h4 { color: #0f172a; margin-top: 1.5em; margin-bottom: 0.5em; }
    h1 { font-size: 1.8em; }
    h2 { font-size: 1.4em; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    h3 { font-size: 1.2em; }
    p { margin: 0.8em 0; }
    blockquote {
      border-left: 4px solid #6366f1;
      padding-left: 16px;
      margin: 1.2em 0;
      color: #475569;
      font-style: italic;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5em 0;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      text-align: left;
    }
    th { background: #f1f5f9; font-weight: bold; }
    code {
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }
    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
    }
    @media print {
      body { background: white; padding: 0; }
      .page-container { box-shadow: none; border: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <h1>${escapeHtml(title)}</h1>
    <hr/>
    ${htmlContent}
  </div>
</body>
</html>`;

  return new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
}

/**
 * Download document as formatted HTML (.html)
 */
export function exportToHtml(
  title: string,
  htmlContent: string,
  options: {
    fontFamily?: string;
    fontSize?: string;
    pageSize?: string;
  }
): void {
  const blob = generateHtmlBlob(title, htmlContent, options);
  triggerDownload(blob, `${slugify(title)}.html`);
}

/**
 * Generate Markdown Blob
 */
export function generateMarkdownBlob(htmlContent: string): Blob {
  const md = htmlToMarkdown(htmlContent);
  return new Blob([md], { type: 'text/markdown;charset=utf-8' });
}

/**
 * Download document as Markdown (.md)
 */
export function exportToMarkdown(title: string, htmlContent: string): void {
  const blob = generateMarkdownBlob(htmlContent);
  triggerDownload(blob, `${slugify(title)}.md`);
}

/**
 * Convert HTML content to standard Markdown string
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  const container = document.createElement('div');
  container.innerHTML = html;

  const parts: string[] = [];

  container.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      const text = el.textContent?.trim() || '';

      if (tag === 'h1') parts.push(`# ${text}\n`);
      else if (tag === 'h2') parts.push(`## ${text}\n`);
      else if (tag === 'h3') parts.push(`### ${text}\n`);
      else if (tag === 'h4') parts.push(`#### ${text}\n`);
      else if (tag === 'blockquote') parts.push(`> ${text}\n`);
      else if (tag === 'ul') {
        const lis = el.querySelectorAll('li');
        lis.forEach((li) => parts.push(`* ${li.textContent?.trim() || ''}`));
        parts.push('');
      } else if (tag === 'ol') {
        const lis = el.querySelectorAll('li');
        lis.forEach((li, idx) => parts.push(`${idx + 1}. ${li.textContent?.trim() || ''}`));
        parts.push('');
      } else if (tag === 'hr') {
        parts.push('---\n');
      } else if (tag === 'p') {
        if (text) parts.push(`${text}\n`);
      } else {
        if (text) parts.push(`${text}\n`);
      }
    } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      parts.push(`${node.textContent.trim()}\n`);
    }
  });

  return parts.join('\n').trim();
}

/**
 * Import HTML file into document content
 */
export async function importHtmlFile(file: File): Promise<{ title: string; content: string }> {
  const text = await file.text();
  const title = file.name.replace(/\.[^/.]+$/, '') || 'Imported HTML Document';

  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');

  // Strip script, style, head
  doc.querySelectorAll('script, style, noscript, meta, link').forEach((el) => el.remove());

  const bodyContent = doc.body ? doc.body.innerHTML : text;

  return {
    title,
    content: bodyContent.trim() || '<p></p>',
  };
}

/**
 * Document Outline Heading interface
 */
export interface DocumentHeadingItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Extract H1, H2, H3 headings from HTML content for clickable Outline Navigation
 */
export function extractDocumentHeadings(htmlContent: string): DocumentHeadingItem[] {
  if (!htmlContent) return [];
  const container = document.createElement('div');
  container.innerHTML = htmlContent;

  const headings = container.querySelectorAll('h1, h2, h3, h4');
  const items: DocumentHeadingItem[] = [];

  headings.forEach((h, idx) => {
    const text = h.textContent?.trim() || '';
    if (text) {
      const tag = h.tagName.toLowerCase();
      const level = parseInt(tag.replace('h', ''), 10) || 1;
      items.push({
        id: `outline-heading-${idx}`,
        text,
        level,
      });
    }
  });

  return items;
}

/**
 * Print document cleanly with print styles
 */
export function printDocument(
  title: string,
  htmlContent: string,
  options: {
    fontFamily?: string;
    fontSize?: string;
    pageSize?: PageSize;
    orientation?: PageOrientation;
    margins?: PageMarginPreset;
  }
): void {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const font = options.fontFamily || 'Arial, sans-serif';
  const size = options.fontSize || '14px';

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          @page {
            size: ${options.pageSize || 'A4'} ${options.orientation || 'portrait'};
            margin: ${options.margins === 'narrow' ? '12mm' : options.margins === 'wide' ? '35mm' : '25mm'};
          }
          body {
            font-family: ${font};
            font-size: ${size};
            line-height: 1.6;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 0;
          }
          h1, h2, h3 { color: #000; }
          h1 { font-size: 1.7em; }
          h2 { font-size: 1.35em; border-bottom: 1px solid #ccc; }
          h3 { font-size: 1.15em; }
          blockquote {
            border-left: 3px solid #666;
            margin-left: 0;
            padding-left: 12px;
            font-style: italic;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 1em 0;
          }
          td, th {
            border: 1px solid #999;
            padding: 6px 10px;
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <hr style="border: none; border-top: 1px solid #999; margin: 12px 0 20px 0;"/>
        ${htmlContent}
      </body>
    </html>
  `);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 250);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'document';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
