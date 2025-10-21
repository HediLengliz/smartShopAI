package smartshop.smartshop.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import smartshop.smartshop.controller.dto.AgentDtos.AnalyzeFileResponse;
import smartshop.smartshop.controller.dto.AgentDtos.AnalyzeFolderResponse;
import smartshop.smartshop.controller.dto.AgentDtos.FileAnalysis;
import smartshop.smartshop.service.agent.PythonAgentService;
import smartshop.smartshop.service.agent.PdfGenerationService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping(path = "/api/agent/ai")
@Tag(name = "AI Code Analysis", description = "Run Python AI code analysis on files or folders.")
@RequiredArgsConstructor
public class AgentAiController {

    private final PythonAgentService pythonAgentService;
    private final PdfGenerationService pdfGenerationService;

    @PostMapping(value = "/analyze/file", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Analyze a single file",
            description = "Reads a file from disk and sends its content to the Python AI analyzer.")
    public AnalyzeFileResponse analyzeSingleFile(@RequestParam("path") String path) {
        AnalyzeFileResponse resp = new AnalyzeFileResponse();
        resp.setPath(path);

        if (!StringUtils.hasText(path)) {
            resp.setAnalysisJson("{\"error\":\"Missing 'path' query param\"}");
            return resp;
        }

        Path p = Paths.get(path);
        if (!Files.exists(p) || Files.isDirectory(p)) {
            resp.setAnalysisJson("{\"error\":\"Path does not exist or is a directory\"}");
            return resp;
        }

        try {
            byte[] bytes = Files.readAllBytes(p);
            resp.setSizeBytes(bytes.length);
            String code = new String(bytes, StandardCharsets.UTF_8);

            String analysisJson = pythonAgentService.analyzeCode(code);
            resp.setAnalysisJson(analysisJson);
            return resp;
        } catch (IOException e) {
            resp.setAnalysisJson("{\"error\":\"Failed to read file: " + escape(e.getMessage()) + "\"}");
            return resp;
        } catch (Exception e) {
            resp.setAnalysisJson("{\"error\":\"Analysis call failed: " + escape(e.getMessage()) + "\"}");
            return resp;
        }
    }

    @PostMapping(value = "/analyze/file/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Analyze a single file and download PDF report",
            description = "Reads a file from disk, analyzes it with AI, and generates a structured PDF report.")
    public ResponseEntity<byte[]> analyzeSingleFileAndDownloadPdf(@RequestParam("path") String path) {
        try {
            // First, perform the analysis
            AnalyzeFileResponse analysisResult = analyzeSingleFile(path);

            // Generate PDF from analysis results
            byte[] pdfBytes = pdfGenerationService.generateSingleFileReport(analysisResult);

            // Prepare filename
            String fileName = "file_analysis_report_" + System.currentTimeMillis() + ".pdf";

            // Set headers for file download
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", fileName);
            headers.setContentLength(pdfBytes.length);

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    @PostMapping(value = "/analyze/folder", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Analyze a folder",
            description = "Recursively analyzes code files in a folder. Use 'path' to target a directory. Optional 'maxFiles' and 'extensions' filter.")
    public AnalyzeFolderResponse analyzeFolder(@RequestParam("path") String folderPath,
                                               @RequestParam(value = "maxFiles", required = false, defaultValue = "200") int maxFiles,
                                               @RequestParam(value = "extensions", required = false) List<String> extensions) {
        AnalyzeFolderResponse folderResp = new AnalyzeFolderResponse();
        // ... existing code ...
        try {
            // Folder path validation
            if (!StringUtils.hasText(folderPath)) {
                List<FileAnalysis> results = new ArrayList<>();
                results.add(errorResult("Missing 'path' query param"));
                AnalyzeFolderResponse response = new AnalyzeFolderResponse();
                response.setFilesAnalyzed(0);
                response.setResults(results);
                return response;
            }
            // ... existing code ...
            Path root = Paths.get(folderPath);
            if (!Files.exists(root) || !Files.isDirectory(root)) {
                List<FileAnalysis> results = new ArrayList<>();
                results.add(errorResult("Path does not exist or is not a directory: " + folderPath));
                AnalyzeFolderResponse response = new AnalyzeFolderResponse();
                response.setFilesAnalyzed(0);
                response.setResults(results);
                return response;
            }

            // Default extensions if none provided
            Set<String> exts = (extensions == null || extensions.isEmpty())
                    ? Set.of(".java", ".kt", ".py", ".js", ".ts", ".tsx", ".cs", ".html", ".css")
                    : extensions.stream()
                    .map(s -> s.startsWith(".") ? s.toLowerCase(Locale.ROOT) : "." + s.toLowerCase(Locale.ROOT))
                    .collect(Collectors.toSet());

            List<FileAnalysis> results = new ArrayList<>();
            try (Stream<Path> stream = Files.walk(root)) {
                List<Path> files = stream
                        .filter(Files::isRegularFile)
                        .filter(p -> hasAllowedExtension(p, exts))
                        .limit(Math.max(maxFiles, 1))
                        .collect(Collectors.toList());

                for (Path f : files) {
                    results.add(analyzeOne(f));
                }
            } catch (IOException e) {
                results.add(errorResult("Failed to traverse folder: " + e.getMessage()));
            }

            int analyzedCount = (int) results.stream().filter(r -> r.getError() == null).count();
            AnalyzeFolderResponse response = new AnalyzeFolderResponse();
            response.setFolderPath(folderPath);
            response.setFilesAnalyzed(analyzedCount);
            response.setResults(results);
            return response;
        } catch (NoSuchMethodError | IllegalArgumentException ignored) {
            AnalyzeFolderResponse fallback = new AnalyzeFolderResponse();
            return fallback;
        }
    }

    private FileAnalysis analyzeOne(Path f) {
        FileAnalysis r = new FileAnalysis();
        r.setPath(f.toString());
        try {
            byte[] bytes = Files.readAllBytes(f);
            r.setSizeBytes(bytes.length);
            String code = new String(bytes, StandardCharsets.UTF_8);
            String json = pythonAgentService.analyzeCode(code);
            r.setAnalysisJson(json);
        } catch (Exception e) {
            r.setError("Failed to analyze: " + e.getMessage());
        }
        return r;
    }

    private static boolean hasAllowedExtension(Path p, Set<String> exts) {
        String name = p.getFileName().toString().toLowerCase(Locale.ROOT);
        for (String ext : exts) {
            if (name.endsWith(ext)) return true;
        }
        return false;
    }

    private static FileAnalysis errorResult(String message) {
        FileAnalysis r = new FileAnalysis();
        r.setPath("");
        r.setError(message);
        return r;
    }

    private static String escape(String s) {
        return s == null ? "" : s.replace("\"", "\\\"");
    }

    @PostMapping(value = "/analyze/folder/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Analyze a folder and download PDF report",
            description = "Recursively analyzes code files in a folder and generates a structured PDF report. Use 'path' to target a directory. Optional 'maxFiles' and 'extensions' filter.")
    public ResponseEntity<byte[]> analyzeFolderAndDownloadPdf(@RequestParam("path") String folderPath,
                                                               @RequestParam(value = "maxFiles", required = false, defaultValue = "200") int maxFiles,
                                                               @RequestParam(value = "extensions", required = false) List<String> extensions) {
        try {
            // First, perform the analysis
            AnalyzeFolderResponse analysisResult = analyzeFolder(folderPath, maxFiles, extensions);

            // Generate PDF from analysis results
            byte[] pdfBytes = pdfGenerationService.generateAnalysisReport(analysisResult);

            // Prepare filename
            String fileName = "code_analysis_report_" + System.currentTimeMillis() + ".pdf";

            // Set headers for file download
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", fileName);
            headers.setContentLength(pdfBytes.length);

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }
}