package smartshop.smartshop.controller.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

public class AgentDtos {

    @Data
    @NoArgsConstructor
    public static class AnalyzeRequest {
        private String code;
    }
    @Data
    @NoArgsConstructor
    public static class AnalyzeFileResponse {
        // Raw JSON string returned by Python, preserved as-is
        private String analysisJson;
        // Optional metadata
        private String path;
        private long sizeBytes;
    }
    @Data
    @NoArgsConstructor
    public static class AnalyzeFolderResponse {
        private String folderPath;
        private int filesAnalyzed;
        private List<FileAnalysis> results;
        // Optional: summary counts per predicted language (if you choose to parse downstream)
        private Map<String, Integer> languageSummary;
    }

    @Data
    @NoArgsConstructor
    public static class FileAnalysis {
        private String path;
        private long sizeBytes;
        private String analysisJson; // raw JSON from Python per file
        private String error;        // populated if read/call failed
    }
}

