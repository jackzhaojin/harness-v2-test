# Code Execution Tool

**Topic ID:** tool-use.server-tools.code-execution
**Researched:** 2025-03-01T12:00:00Z

## Overview

The Code Execution Tool is a server-side capability in the Claude API that allows Claude to run code in a secure, sandboxed environment. Rather than simply generating code as text output, Claude can execute Bash commands, manipulate files, perform calculations, and create visualizations—all within a single API conversation. This transforms Claude from a code-writing assistant into an active computational agent capable of data analysis, file processing, and iterative problem-solving.

Code execution is a core primitive for building high-performance AI agents. It enables dynamic filtering in web search and web fetch workflows, allowing Claude to process results before they reach the context window—improving accuracy while reducing token consumption. The tool runs in Anthropic's managed containers with complete network isolation, eliminating risks of data exfiltration or unauthorized system access.

The feature is particularly valuable for data analysis workflows where Claude can load datasets, generate exploratory charts, identify patterns, and iteratively refine outputs based on execution results. This end-to-end capability means users can upload a CSV and receive not just analysis but downloadable visualizations, cleaned datasets, or formatted reports.

## Key Concepts

- **Sandboxed Environment**: All code runs in isolated Linux containers with no internet access. Containers have 5GiB RAM, 5GiB disk space, and 1 CPU. This prevents malicious code from affecting host systems or exfiltrating data.

- **Tool Version**: The current version is `code_execution_20250825`, which supports Bash commands and file operations. A legacy version `code_execution_20250522` supported Python only. Tool versions are tied to model versions—always use the matching version.

- **Sub-tools**: When enabled, Claude gains access to two internal tools: `bash_code_execution` for running shell commands and `text_editor_code_execution` for viewing, creating, and editing files.

- **Container Reuse**: Containers can persist across multiple API requests using the container ID returned in responses. This allows multi-turn workflows where files created in one request are available in subsequent requests. Containers expire after 30 days.

- **Files API Integration**: Upload files (CSV, Excel, images, JSON, etc.) via the Files API and reference them using `container_upload` content blocks. Claude can then process these files within the sandbox and generate new files that can be downloaded.

- **Free with Web Tools**: Code execution incurs no additional charges when used alongside `web_search_20260209` or `web_fetch_20260209`. Without these tools, billing is based on execution time at $0.05/hour after 1,550 free hours per month.

- **Pre-installed Libraries**: The Python 3.11 environment includes pandas, numpy, scipy, scikit-learn, matplotlib, seaborn, and numerous file processing libraries (openpyxl, pypdf, pillow, etc.).

## Technical Details

### Enabling Code Execution

Add the tool to your API request's `tools` array:

```json
{
  "tools": [{
    "type": "code_execution_20250825",
    "name": "code_execution"
  }]
}
```

### Python SDK Example

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": "Calculate mean and standard deviation of [1,2,3,4,5,6,7,8,9,10]"
    }],
    tools=[{"type": "code_execution_20250825", "name": "code_execution"}]
)
```

### Uploading Files for Analysis

```python
# Upload file first
file_object = client.beta.files.upload(file=open("data.csv", "rb"))

# Reference in request using container_upload
response = client.beta.messages.create(
    model="claude-opus-4-6",
    betas=["files-api-2025-04-14"],
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Analyze this CSV data"},
            {"type": "container_upload", "file_id": file_object.id}
        ]
    }],
    tools=[{"type": "code_execution_20250825", "name": "code_execution"}]
)
```

### Response Structure

Bash execution results include:
- `stdout`: Command output
- `stderr`: Error messages
- `return_code`: 0 for success, non-zero for failure

File operations return metadata about the changes (line numbers, diff format for edits).

### Platform Availability

- ✅ Claude API (Anthropic)
- ✅ Microsoft Azure AI Foundry
- ❌ Amazon Bedrock
- ❌ Google Vertex AI

## Common Patterns

### Data Analysis Pipeline

Upload a dataset, have Claude explore it, create visualizations, and generate a summary report:

```python
response = client.beta.messages.create(
    model="claude-opus-4-6",
    betas=["files-api-2025-04-14"],
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Analyze this sales data: summarize trends, identify outliers, create visualizations, and save a report"},
            {"type": "container_upload", "file_id": file_id}
        ]
    }],
    tools=[{"type": "code_execution_20250825", "name": "code_execution"}]
)
```

### Container Reuse for Multi-Turn Workflows

Maintain state across requests:

```python
# First request
response1 = client.messages.create(...)
container_id = response1.container.id

# Second request reuses container
response2 = client.messages.create(
    container=container_id,
    ...
)
```

### Combining with Web Search

When used with web tools, Claude can search, fetch content, then process it programmatically:

```python
response = client.messages.create(
    model="claude-opus-4-6",
    messages=[{"role": "user", "content": "Find recent tech stock data and create a comparison chart"}],
    tools=[
        {"type": "code_execution_20250825", "name": "code_execution"},
        {"type": "web_search_20260209", "name": "web_search"}
    ]
)
```

### Programmatic Tool Calling

Enable Claude to call custom tools from within the sandbox:

```python
tools=[
    {"type": "code_execution_20250825", "name": "code_execution"},
    {
        "name": "get_weather",
        "description": "Get weather for a city",
        "input_schema": {...},
        "allowed_callers": ["code_execution_20250825"]  # Enables programmatic calling
    }
]
```

## Gotchas

- **No Network Access**: The sandbox has no internet connectivity. Claude cannot fetch external data during code execution. Use web_search or web_fetch tools separately, then pass results to code execution.

- **Multi-Environment Confusion**: When combining server-side code execution with client-side tools (like a local bash tool), Claude may confuse the two environments. Add explicit system prompt instructions clarifying that state is not shared between environments.

- **Zero Data Retention (ZDR) Not Supported**: Code execution is explicitly excluded from ZDR arrangements. Data is retained according to standard feature retention policies.

- **Minimum Billing**: Execution time has a 5-minute minimum. If files are included, billing applies even if the tool isn't invoked, due to file preloading.

- **Tool Version Compatibility**: Older tool versions may not work with newer models. Always match `code_execution_20250825` with compatible model versions (Claude Opus 4.6, Sonnet 4.6, etc.).

- **Container Expiration**: Containers expire after 30 days. Long-running workflows need to handle recreation and file re-upload.

- **`pause_turn` Stop Reason**: Long-running turns may pause. The response can be sent back as-is to continue, or modified to interrupt.

- **Legacy Migration**: The previous `code_execution_20250522` (Python-only) returns different response types. If parsing responses programmatically, update handlers for `bash_code_execution_result` and `text_editor_code_execution_result`.

- **No GPU Access**: The sandbox lacks GPU acceleration, limiting large-scale ML inference or 3D visualization workloads.

- **Interactive Charts**: Interactive visualizations (Plotly interactive mode) must be downloaded externally; they cannot render in-chat.

## Sources

- [Code execution tool - Claude API Docs](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/code-execution-tool) — Primary documentation covering API usage, parameters, pricing, response formats, and examples
- [Claude Code Sandboxing - Anthropic Engineering](https://www.anthropic.com/engineering/claude-code-sandboxing) — Technical details on sandbox implementation using Linux Bubblewrap and macOS Seatbelt
- [Practical Security Guidance for Sandboxing Agentic Workflows - NVIDIA](https://developer.nvidia.com/blog/practical-security-guidance-for-sandboxing-agentic-workflows-and-managing-execution-risk/) — Security best practices for AI agent sandboxing, network controls, and file system protection
- [Introducing the analysis tool in Claude.ai](https://claude.com/blog/analysis-tool) — Background on the predecessor analysis tool and its evolution into code execution
- [Data Analysis Pipeline with Claude Code - Medium](https://medium.com/aiguys/data-analysis-pipeline-with-claude-code-2-486-medium-articles-to-interactive-insights-45d39417334b) — Real-world example of using Claude Code for data analysis workflows
