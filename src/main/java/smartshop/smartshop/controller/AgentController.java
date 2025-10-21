package smartshop.smartshop.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import smartshop.smartshop.service.agent.CodeAnalysisAgent;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@RestController
@RequestMapping("/api/agent")
@Tag(name = "AI Agent", description = "Endpoints for interacting with the AI analysis and recommendation agent.")
public class AgentController {

    @Autowired
    private CodeAnalysisAgent codeAnalysisAgent;

    @GetMapping("/analyze/structure")
    @Operation(summary = "Analyze Project Structure", description = "Returns an analysis of the project's directory structure.")
    public String analyzeStructure() {
        return codeAnalysisAgent.analyzeProjectStructure();
    }

    @GetMapping("/analyze/dependencies")
    @Operation(summary = "Analyze Project Dependencies", description = "Analyzes the pom.xml and provides dependency recommendations.")
    public String analyzeDependencies() {
        try {
            String pomContent = Files.readString(Path.of("pom.xml"));
            return codeAnalysisAgent.analyzeDependencies(pomContent);
        } catch (IOException e) {
            return "Error reading pom.xml: " + e.getMessage();
        }
    }

    @GetMapping("/suggest/features")
    @Operation(summary = "Suggest New Features", description = "Suggests new features to enhance the application.")
    public String suggestFeatures() {
        return codeAnalysisAgent.suggestNewFeatures();
    }

    @GetMapping("/recommendations")
    @Operation(summary = "Get Full AI Agent Report", description = "Returns a comprehensive report including structure analysis, dependency analysis, and feature suggestions.")
    public String getFullRecommendations() {
        StringBuilder fullReport = new StringBuilder();
        fullReport.append("# AI Agent Full Report\n\n");
        fullReport.append(codeAnalysisAgent.analyzeProjectStructure());
        fullReport.append("\n---\n\n");
        try {
            String pomContent = Files.readString(Path.of("pom.xml"));
            fullReport.append(codeAnalysisAgent.analyzeDependencies(pomContent));
        } catch (IOException e) {
            fullReport.append("## Dependency Analysis\n\nCould not read `pom.xml`: ").append(e.getMessage());
        }
        fullReport.append("\n---\n\n");
        fullReport.append(codeAnalysisAgent.suggestNewFeatures());

        return fullReport.toString();
    }
}
