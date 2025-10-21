package smartshop.smartshop.service.agent;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import org.springframework.stereotype.Service;
import smartshop.smartshop.controller.dto.AgentDtos.AnalyzeFolderResponse;
import smartshop.smartshop.controller.dto.AgentDtos.AnalyzeFileResponse;
import smartshop.smartshop.controller.dto.AgentDtos.FileAnalysis;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class PdfGenerationService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final DeviceRgb HEADER_COLOR = new DeviceRgb(41, 128, 185);
    private static final DeviceRgb SECTION_COLOR = new DeviceRgb(52, 152, 219);

    public byte[] generateAnalysisReport(AnalyzeFolderResponse analysisData) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        // Title
        addTitle(document, "AI Code Analysis Report");

        // Summary Section
        addSummarySection(document, analysisData);

        // Detailed Results
        addDetailedResults(document, analysisData);

        // Footer
        addFooter(document);

        document.close();
        return baos.toByteArray();
    }

    private void addTitle(Document document, String title) {
        Paragraph titlePara = new Paragraph(title)
                .setFontSize(24)
                .setBold()
                .setFontColor(HEADER_COLOR)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(20);
        document.add(titlePara);

        // Add generation timestamp
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        Paragraph timestampPara = new Paragraph("Generated on: " + timestamp)
                .setFontSize(10)
                .setItalic()
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(20);
        document.add(timestampPara);
    }

    private void addSummarySection(Document document, AnalyzeFolderResponse data) {
        // Section Header
        Paragraph sectionHeader = new Paragraph("Summary")
                .setFontSize(18)
                .setBold()
                .setFontColor(SECTION_COLOR)
                .setMarginTop(10)
                .setMarginBottom(10);
        document.add(sectionHeader);

        // Summary Table
        Table summaryTable = new Table(UnitValue.createPercentArray(new float[]{40, 60}))
                .setWidth(UnitValue.createPercentValue(100));

        addSummaryRow(summaryTable, "Folder Path:", data.getFolderPath() != null ? data.getFolderPath() : "N/A");
        addSummaryRow(summaryTable, "Total Files Analyzed:", String.valueOf(data.getFilesAnalyzed()));
        addSummaryRow(summaryTable, "Total Files Processed:", String.valueOf(data.getResults() != null ? data.getResults().size() : 0));

        int errorCount = data.getResults() != null ?
                (int) data.getResults().stream().filter(r -> r.getError() != null).count() : 0;
        addSummaryRow(summaryTable, "Files with Errors:", String.valueOf(errorCount));

        document.add(summaryTable);
    }

    private void addSummaryRow(Table table, String label, String value) {
        Cell labelCell = new Cell()
                .add(new Paragraph(label).setBold())
                .setBackgroundColor(new DeviceRgb(236, 240, 241))
                .setPadding(8);
        Cell valueCell = new Cell()
                .add(new Paragraph(value))
                .setPadding(8);
        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private void addDetailedResults(Document document, AnalyzeFolderResponse data) {
        if (data.getResults() == null || data.getResults().isEmpty()) {
            return;
        }

        // Section Header
        Paragraph sectionHeader = new Paragraph("Detailed Analysis Results")
                .setFontSize(18)
                .setBold()
                .setFontColor(SECTION_COLOR)
                .setMarginTop(20)
                .setMarginBottom(10);
        document.add(sectionHeader);

        int fileNumber = 1;
        for (FileAnalysis file : data.getResults()) {
            addFileAnalysis(document, file, fileNumber++);
        }
    }

    private void addFileAnalysis(Document document, FileAnalysis file, int fileNumber) {
        // File Header
        Paragraph fileHeader = new Paragraph("File #" + fileNumber + ": " + getFileName(file.getPath()))
                .setFontSize(14)
                .setBold()
                .setMarginTop(15)
                .setMarginBottom(5);
        document.add(fileHeader);

        // File Details Table
        Table fileTable = new Table(UnitValue.createPercentArray(new float[]{30, 70}))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginBottom(10);

        // File Path
        addDetailRow(fileTable, "Path:", file.getPath());

        // File Size
        if (file.getSizeBytes() > 0) {
            addDetailRow(fileTable, "Size:", formatBytes(file.getSizeBytes()));
        }

        // Error (if any)
        if (file.getError() != null) {
            Cell errorLabelCell = new Cell()
                    .add(new Paragraph("Error:").setBold())
                    .setBackgroundColor(new DeviceRgb(231, 76, 60))
                    .setFontColor(ColorConstants.WHITE)
                    .setPadding(8);
            Cell errorValueCell = new Cell()
                    .add(new Paragraph(file.getError()))
                    .setBackgroundColor(new DeviceRgb(255, 230, 230))
                    .setPadding(8);
            fileTable.addCell(errorLabelCell);
            fileTable.addCell(errorValueCell);
        }

        document.add(fileTable);

        // Analysis Results (parse JSON)
        if (file.getAnalysisJson() != null && !file.getAnalysisJson().isEmpty() && file.getError() == null) {
            addAnalysisContent(document, file.getAnalysisJson());
        }
    }

    private void addDetailRow(Table table, String label, String value) {
        Cell labelCell = new Cell()
                .add(new Paragraph(label).setBold())
                .setBackgroundColor(new DeviceRgb(189, 195, 199))
                .setPadding(5);
        Cell valueCell = new Cell()
                .add(new Paragraph(value))
                .setPadding(5);
        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private void addAnalysisContent(Document document, String analysisJson) {
        try {
            JsonNode analysis = objectMapper.readTree(analysisJson);

            // Create Analysis Table
            Table analysisTable = new Table(UnitValue.createPercentArray(new float[]{30, 70}))
                    .setWidth(UnitValue.createPercentValue(100))
                    .setMarginBottom(5);

            // Parse common fields from AI analysis
            if (analysis.has("language")) {
                addAnalysisRow(analysisTable, "Language:", analysis.get("language").asText());
            }
            if (analysis.has("complexity")) {
                addAnalysisRow(analysisTable, "Complexity:", analysis.get("complexity").asText());
            }
            if (analysis.has("quality_score")) {
                addAnalysisRow(analysisTable, "Quality Score:", analysis.get("quality_score").asText());
            }
            if (analysis.has("issues")) {
                JsonNode issues = analysis.get("issues");
                if (issues.isArray() && issues.size() > 0) {
                    StringBuilder issuesList = new StringBuilder();
                    for (JsonNode issue : issues) {
                        issuesList.append("• ").append(issue.asText()).append("\n");
                    }
                    addAnalysisRow(analysisTable, "Issues Found:", issuesList.toString().trim());
                }
            }
            if (analysis.has("suggestions")) {
                JsonNode suggestions = analysis.get("suggestions");
                if (suggestions.isArray() && suggestions.size() > 0) {
                    StringBuilder suggestionsList = new StringBuilder();
                    for (JsonNode suggestion : suggestions) {
                        suggestionsList.append("• ").append(suggestion.asText()).append("\n");
                    }
                    addAnalysisRow(analysisTable, "Suggestions:", suggestionsList.toString().trim());
                }
            }

            // If no specific fields found, show raw JSON (formatted)
            if (analysisTable.getNumberOfRows() == 0) {
                Paragraph rawAnalysis = new Paragraph("Analysis Result:")
                        .setBold()
                        .setMarginTop(5);
                document.add(rawAnalysis);

                Paragraph jsonContent = new Paragraph(analysisJson)
                        .setFontSize(9)
                        .setBackgroundColor(new DeviceRgb(245, 245, 245))
                        .setPadding(10)
                        .setMarginBottom(10);
                document.add(jsonContent);
            } else {
                document.add(analysisTable);
            }

        } catch (Exception e) {
            // If JSON parsing fails, display as text
            Paragraph analysisText = new Paragraph("Analysis Result:")
                    .setBold()
                    .setMarginTop(5);
            document.add(analysisText);

            Paragraph content = new Paragraph(analysisJson)
                    .setFontSize(9)
                    .setBackgroundColor(new DeviceRgb(245, 245, 245))
                    .setPadding(10)
                    .setMarginBottom(10);
            document.add(content);
        }
    }

    private void addAnalysisRow(Table table, String label, String value) {
        Cell labelCell = new Cell()
                .add(new Paragraph(label).setBold())
                .setBackgroundColor(new DeviceRgb(214, 234, 248))
                .setPadding(5);
        Cell valueCell = new Cell()
                .add(new Paragraph(value))
                .setPadding(5);
        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private void addFooter(Document document) {
        Paragraph footer = new Paragraph("End of Report")
                .setFontSize(10)
                .setItalic()
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(30)
                .setFontColor(ColorConstants.GRAY);
        document.add(footer);
    }

    private String getFileName(String path) {
        if (path == null) return "Unknown";
        int lastSeparator = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
        return lastSeparator >= 0 ? path.substring(lastSeparator + 1) : path;
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.2f KB", bytes / 1024.0);
        return String.format("%.2f MB", bytes / (1024.0 * 1024.0));
    }

    public byte[] generateSingleFileReport(AnalyzeFileResponse analysisData) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        // Title
        addTitle(document, "AI Code Analysis Report - Single File");

        // File Information Section
        addSingleFileSection(document, analysisData);

        // Analysis Results
        if (analysisData.getAnalysisJson() != null && !analysisData.getAnalysisJson().isEmpty()) {
            Paragraph sectionHeader = new Paragraph("Analysis Results")
                    .setFontSize(18)
                    .setBold()
                    .setFontColor(SECTION_COLOR)
                    .setMarginTop(20)
                    .setMarginBottom(10);
            document.add(sectionHeader);

            addAnalysisContent(document, analysisData.getAnalysisJson());
        }

        // Footer
        addFooter(document);

        document.close();
        return baos.toByteArray();
    }

    private void addSingleFileSection(Document document, AnalyzeFileResponse data) {
        // Section Header
        Paragraph sectionHeader = new Paragraph("File Information")
                .setFontSize(18)
                .setBold()
                .setFontColor(SECTION_COLOR)
                .setMarginTop(10)
                .setMarginBottom(10);
        document.add(sectionHeader);

        // File Info Table
        Table fileTable = new Table(UnitValue.createPercentArray(new float[]{40, 60}))
                .setWidth(UnitValue.createPercentValue(100));

        addSummaryRow(fileTable, "File Name:", getFileName(data.getPath()));
        addSummaryRow(fileTable, "File Path:", data.getPath() != null ? data.getPath() : "N/A");

        if (data.getSizeBytes() > 0) {
            addSummaryRow(fileTable, "File Size:", formatBytes(data.getSizeBytes()));
        }

        document.add(fileTable);
    }
}
