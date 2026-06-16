require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const Groq = require('groq-sdk');
const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const summarizeDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await prisma.document.findFirst({
      where: { id: parseInt(documentId) }
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const pdfPath = path.resolve(document.filepath);
    const pdfBytes = fs.readFileSync(pdfPath);
    const parser = new PDFParse({ data: pdfBytes });
    const pdfData = await parser.getText();

    // Limit text to avoid token overflow
    const text = pdfData.text.slice(0, 8000);

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a document analysis assistant. Summarize documents concisely and help users decide whether to sign or reject them. Be objective and highlight any concerning clauses, obligations, or red flags if present.'
        },
        {
          role: 'user',
          content: `Summarize this document in 4-6 short bullet points. Then give a one-line recommendation on whether the user should "Sign" or "Review carefully before signing", based on the content. Keep it concise and easy to read.\n\nDocument content:\n${text}`
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const summary = completion.choices[0]?.message?.content || 'Unable to generate summary.';

    res.json({ summary, filename: document.filename });
  } catch (error) {
    console.error('AI Summarize error:', error);
    res.status(500).json({ message: 'Failed to summarize document', error: error.message });
  }
};

module.exports = { summarizeDocument };