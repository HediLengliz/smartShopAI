package smartshop.smartshop.service.agent;

import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class CodeAnalysisAgent {

    private final Path projectRoot;

    public CodeAnalysisAgent() {
        this.projectRoot = Path.of("").toAbsolutePath();
    }

    public String analyzeProjectStructure() {
        StringBuilder analysis = new StringBuilder();
        analysis.append("## Project Structure Analysis\n\n");

        List<String> directories = listDirectories(projectRoot.toString());
        analysis.append("### Key Directories:\n");
        directories.forEach(dir -> analysis.append("- ").append(dir).append("\n"));

        // Add more specific checks here, for example:
        if (directories.contains("src/main/java")) {
            analysis.append("\n- Standard Java project layout found.\n");
        }
        if (directories.contains("src/main/resources")) {
            analysis.append("- Standard resources directory found.\n");
        }
        if (directories.contains("src/test")) {
            analysis.append("- Standard test directory found.\n");
        }

        return analysis.toString();
    }

    public String analyzeDependencies(String pomContent) {
        StringBuilder analysis = new StringBuilder();
        analysis.append("## Dependency Analysis\n\n");
        analysis.append("Based on your `pom.xml`, here are some recommendations:\n\n");

        // Example recommendations (can be expanded with more sophisticated checks)
        if (pomContent.contains("spring-boot-starter-parent")) {
            analysis.append("- **Spring Boot Version**: You are using a version of Spring Boot. It's a good practice to periodically check for newer stable releases to get the latest features and security patches.\n");
        }
        if (pomContent.contains("spring-ai-starter-model-openai")) {
            analysis.append("- **Spring AI**: You have the Spring AI starter for OpenAI. This is great for integrating AI capabilities. Consider exploring other models or features from the Spring AI project as your needs evolve.\n");
        }
        if (pomContent.contains("lombok")) {
            analysis.append("- **Lombok**: Lombok is used, which helps in reducing boilerplate code. Ensure it's configured correctly in your IDE.\n");
        }
        if (pomContent.contains("springdoc-openapi-starter-webmvc-ui")) {
            analysis.append("- **SpringDoc OpenAPI**: You are using SpringDoc for API documentation. This is a best practice for RESTful services.\n");
        }

        analysis.append("\n### General Recommendations:\n");
        analysis.append("- **Dependency Versions**: Consider using the Maven Enforcer Plugin to manage dependency convergence and avoid version conflicts.\n");
        analysis.append("- **Security Audits**: Regularly run security audits on your dependencies (e.g., using `mvn dependency-check:check`) to identify known vulnerabilities.\n");

        return analysis.toString();
    }

    public String suggestNewFeatures() {
        StringBuilder suggestions = new StringBuilder();
        suggestions.append("## New Feature Suggestions\n\n");

        suggestions.append("### 1. User Profile Management\n");
        suggestions.append("- Allow users to view and edit their profile information (name, email, shipping addresses).\n");
        suggestions.append("- Implement a feature for users to view their order history.\n\n");

        suggestions.append("### 2. Product Reviews and Ratings\n");
        suggestions.append("- Allow authenticated users to leave reviews and ratings for products they have purchased.\n");
        suggestions.append("- Display average ratings on product pages.\n\n");

        suggestions.append("### 3. Enhanced Search and Filtering\n");
        suggestions.append("- Implement more advanced search capabilities, such as searching by category, price range, or brand.\n");
        suggestions.append("- Add sorting options for product lists (e.g., by price, rating, or popularity).\n\n");

        return suggestions.toString();
    }

    private List<String> listDirectories(String path) {
        try (Stream<Path> stream = Files.walk(Path.of(path), 2)) {
            return stream
                    .filter(Files::isDirectory)
                    .map(p -> projectRoot.relativize(p).toString().replace('\\', '/'))
                    .filter(name -> !name.isEmpty() && !name.startsWith(".") && !name.equals("target"))
                    .collect(Collectors.toList());
        } catch (IOException e) {
            return new ArrayList<>();
        }
    }
}

