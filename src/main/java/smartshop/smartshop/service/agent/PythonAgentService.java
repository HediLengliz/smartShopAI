package smartshop.smartshop.service.agent;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import smartshop.smartshop.controller.dto.AgentDtos;

@Service
public class PythonAgentService {

    private final RestTemplate restTemplate;
    private final String pythonApiUrl;

    public PythonAgentService(RestTemplate restTemplate, @Value("${python.agent.api.url}") String pythonApiUrl) {
        this.restTemplate = restTemplate;
        this.pythonApiUrl = pythonApiUrl;
    }

    /**
     * Calls the Python AI agent to analyze a code snippet.
     *
     * @param code The code snippet to analyze.
     * @return A string containing the JSON analysis from the Python service.
     */
    public String analyzeCode(String code) {
        AgentDtos.AnalyzeRequest request = new AgentDtos.AnalyzeRequest();
        request.setCode(code);

        try {
            // Call the Python Flask API's /analyze endpoint
            return restTemplate.postForObject(pythonApiUrl + "/analyze", request, String.class);
        } catch (Exception e) {
            // In case the Python service is down or there's an error
            return "{\"error\": \"Could not connect to the Python analysis service: " + e.getMessage() + "\"}";
        }
    }
}

