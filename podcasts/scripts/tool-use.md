# Podcast: Tool Use and Function Calling

**Episode Topic:** Tool Use and Function Calling
**Estimated Duration:** 35 minutes
**Based on:** /Users/jackjin/dev/harness-v2-test/research/_combined_tool-use.md

---

## Opening

HOST: So picture this—you're building an AI chatbot to help users check the weather. The user asks "What's the weather in San Francisco?" and your AI responds with something like "I'm not sure, my training data only goes up to early 2024." Frustrating, right? The AI can write beautiful prose about weather patterns, but it can't actually tell you if you need an umbrella today.

EXPERT: Exactly! And that's the fundamental limitation that tool use solves. LLMs are basically frozen in time at their training cutoff. They're incredibly knowledgeable, but they can't reach out to the real world—they can't check a weather API, query your database, or send an email. Tool use bridges that gap by letting Claude say "I need to call this function to get current information" instead of just generating text based on old training data.

HOST: So when we talk about "tool use" or "function calling"—are those the same thing?

EXPERT: They're used pretty interchangeably. OpenAI calls it "function calling," Anthropic calls it "tool use," but the concept is identical: you define functions the AI can invoke, and the AI decides when to call them and what parameters to use. Think of it like giving Claude a toolkit—instead of just talking about hammering a nail, Claude can actually pick up the hammer.

HOST: That metaphor is perfect. So how does this actually work under the hood? Does Claude execute these tools itself?

EXPERT: That's a critical distinction, and it trips people up constantly. Claude doesn't execute anything. When you make an API request, you include tool definitions—basically a menu of available functions. Claude reads the user's question, decides which tool would help, and returns a structured request saying "Hey, I want to call the get_weather function with location set to San Francisco." Your application receives that request, executes the actual API call to your weather service, and sends the result back to Claude. Then Claude uses that real data to formulate its final answer.

HOST: So it's more like Claude is writing a shopping list, and we're the ones who go to the store?

EXPERT: Perfect analogy. Claude orchestrates, you execute. The back-and-forth might happen multiple times in one conversation, too—Claude could call three different tools to gather information before giving the user a final answer.

## Tool Definitions: The Contract

HOST: Alright, let's dig into how we actually tell Claude about these tools. What does a tool definition look like?

EXPERT: Every tool has three essential parts: a name, a description, and an input schema. The name is straightforward—something like `get_weather` or `send_email`. It has to match a specific pattern: letters, numbers, underscores, and hyphens only, up to 64 characters. When you have tools from multiple services, use namespacing like `github_list_prs` or `slack_send_message` to avoid collisions.

HOST: Makes sense. What about the description?

EXPERT: This is where people underestimate the importance. The description is how Claude decides whether to use the tool. If you write something vague like "Gets stock price," Claude won't know when to use it versus other tools. You want 3-4 sentences minimum explaining what the tool does, when to use it, what it returns, and any important limitations. For example: "Get the current weather in a given location. Returns temperature and conditions. Use when the user asks about current weather, not forecasts."

HOST: So it's like writing documentation that Claude reads to make decisions?

EXPERT: Exactly. And Claude reads that documentation every single time, so the quality directly impacts performance. A well-written description means Claude picks the right tool and provides valid parameters. A bad description leads to Claude calling the wrong tool or passing garbage data.

HOST: Okay, and the input schema—I'm guessing this is where we define what parameters the function accepts?

EXPERT: Yep, and it's formatted as JSON Schema. At the root level, you always have `type: "object"` with a `properties` field listing each parameter. Each property gets its own type—string, integer, number, boolean, arrays, nested objects. You can add constraints like `enum` to limit values to a specific set, or use string formats like `date`, `email`, or `uri` for validation.

HOST: Can you show me a concrete example?

EXPERT: Sure. Let's say you're building a flight search tool:

```json
{
  "name": "search_flights",
  "description": "Search for available flights between two cities on a specific date. Returns a list of flights with prices and times. Use when the user wants to find flight options.",
  "input_schema": {
    "type": "object",
    "properties": {
      "origin": {
        "type": "string",
        "description": "Departure city or airport code"
      },
      "destination": {
        "type": "string",
        "description": "Arrival city or airport code"
      },
      "date": {
        "type": "string",
        "format": "date",
        "description": "Departure date in YYYY-MM-DD format"
      },
      "passengers": {
        "type": "integer",
        "enum": [1, 2, 3, 4, 5, 6]
      }
    },
    "required": ["origin", "destination", "date"]
  }
}
```

HOST: So `origin`, `destination`, and `date` are required, but `passengers` is optional because it's not in the `required` array?

EXPERT: Exactly right. And notice the `enum` on passengers—that restricts Claude to only picking 1 through 6. Without that constraint, Claude might say 2.5 passengers or "two," which would break your function.

HOST: That makes me think—how do we handle cases where Claude gives us bad data? Like if it somehow passes an invalid date?

EXPERT: That's where strict mode comes in, which we'll get to in a bit. But even without it, you should validate inputs in your application code before executing the tool. Treat Claude's output like user input—never trust it blindly.

## The Request-Response Cycle

HOST: So once we've defined our tools and made an API request, what does Claude's response look like when it wants to use a tool?

EXPERT: The response will have a `stop_reason` of `"tool_use"` which signals "Hey, I'm not done yet, I need you to run something for me." The content array includes one or more `tool_use` blocks. Each block has a unique ID, the tool name, and the input parameters matching your schema.

HOST: Can you walk through what that looks like in code?

EXPERT: Sure. Let's say the user asks "What's the weather in San Francisco?" Here's what Claude returns:

```json
{
  "stop_reason": "tool_use",
  "content": [
    {
      "type": "text",
      "text": "I'll check the weather for you."
    },
    {
      "type": "tool_use",
      "id": "toolu_01A09q90qw90lq917835lq9",
      "name": "get_weather",
      "input": {
        "location": "San Francisco, CA",
        "unit": "celsius"
      }
    }
  ]
}
```

HOST: Okay, so there's a conversational text block and then a tool_use block with the actual function call. That ID looks randomly generated—what's it for?

EXPERT: It's a correlation ID. When you execute the weather API call and get the result—let's say "15 degrees, partly cloudy"—you send that back to Claude in a `tool_result` block that references the original ID. That's how Claude knows which tool call this result corresponds to, especially when there are multiple tools in play.

HOST: So I'd send something like this back?

```json
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_01A09q90qw90lq917835lq9",
      "content": "15 degrees celsius, partly cloudy"
    }
  ]
}
```

EXPERT: Perfect. And critically, you include that in a new *user* message. The conversation flow is: user asks question → assistant returns tool_use → user provides tool_result → assistant gives final answer. The tool results always come from the user role, not from some special "tool" role.

HOST: Wait, that's a bit counterintuitive. Why does the tool result come from the user when it's really our application providing it?

EXPERT: Think of it this way: from Claude's perspective, you—the application developer—are part of the "user" side of the conversation. Claude made a request to the external world, and the external world is responding. In Anthropic's API design, anything that isn't Claude's voice is lumped into the user role. It's different from OpenAI's API, which has a dedicated `tool` role, but the concept is the same.

## Parallel Tool Calling

HOST: You mentioned multiple tools earlier. Can Claude call several tools at once, or does it do them one by one?

EXPERT: Both! This is a huge performance optimization that people miss. By default, Claude supports parallel tool calling. If the user asks "What's the weather in Tokyo, Paris, and New York?" Claude can return three `tool_use` blocks in a single response—one for each city. You execute all three weather API calls concurrently, then return all three results in a single user message.

HOST: That sounds way faster than doing them sequentially. What's the catch?

EXPERT: The catch is data dependencies. If one tool's output is needed as input to another tool, you can't parallelize. For example, if the user asks "What's the weather where I am?" Claude needs to first call `get_location` to find out where you are, wait for that result, then call `get_weather` with the location. Sequential execution is mandatory here.

HOST: So Claude figures out which approach to use based on the logic of the request?

EXPERT: Exactly. Claude is actually pretty smart about this. If you give it tools like `get_user_profile`, `get_user_preferences`, and `get_notifications`—all independent data sources—it'll naturally parallelize them to gather everything at once. But if you have a workflow like "search for flights, then book the cheapest one," Claude will sequence the calls correctly.

HOST: What if I don't want Claude using multiple tools at once? Like, maybe I have rate limits or I want tighter control over execution?

EXPERT: You can disable parallel tool use with a parameter. In Anthropic's API, you add `disable_parallel_tool_use: true` to the `tool_choice` configuration. In OpenAI's API, you set `parallel_tool_calls: false`. This forces Claude to use at most one tool per turn.

HOST: Does disabling it make things slower?

EXPERT: Absolutely. Imagine four API calls that each take 300 milliseconds. In parallel, that's 300ms total. Sequentially, it's 1.2 seconds. For user-facing applications, that difference is huge—the parallel approach feels instantaneous while sequential execution feels sluggish.

HOST: So unless you have a specific reason, parallelize everything?

EXPERT: As a rule of thumb, yes. But you have to handle errors gracefully. In parallel execution, one failed tool shouldn't necessarily kill the others. Use something like `asyncio.gather()` with `return_exceptions=True` in Python so you can handle each result individually—some might succeed, some might fail, and you deal with each case.

## Tool Choice Configuration

HOST: Let's talk about the `tool_choice` parameter you mentioned. What level of control does that give us?

EXPERT: `tool_choice` is where you decide how much autonomy Claude has. There are four modes: `auto`, `any`, `tool`, and `none`. Each has a very different use case.

HOST: Let's go through them. What's `auto`?

EXPERT: `auto` is the default when you provide tools. It means "Claude, you decide whether to use a tool based on the user's question." If the user asks about weather, Claude calls the weather tool. If they ask "What's your favorite color?" Claude just responds with text—no tool needed.

HOST: That seems like what you'd want most of the time.

EXPERT: For conversational interfaces, absolutely. It gives Claude the flexibility to use tools when appropriate but not force unnecessary calls.

HOST: What about `any`?

EXPERT: `any` means "Claude must use at least one tool from the set I've provided, but you pick which one." This is great for systems where every response requires an action. For example, imagine an SMS chatbot where all output has to go through a `send_message` tool. You might also have a `lookup_order` tool for database queries. With `tool_choice: any`, Claude will always call one of those tools—it can't just respond with plain text.

HOST: Interesting. So it forces tool use but not a specific tool?

EXPERT: Correct. The third mode, `tool`, goes further—it forces a specific named tool. You'd write `tool_choice: {"type": "tool", "name": "get_weather"}` and Claude will always call `get_weather` no matter what the user says.

HOST: That seems overly rigid. When would you want that?

EXPERT: It's perfect for structured data extraction. Let's say you're processing support tickets and you want to classify them by category and priority. You define a tool called `classify_ticket` with a schema for category, priority, and summary. You set `tool_choice` to force that tool, and boom—every ticket gets classified in a predictable JSON structure. No chance of Claude deciding "Oh, I'll just describe this ticket in prose instead."

HOST: So it's like using tools as a way to enforce structured outputs?

EXPERT: Exactly. It's one of the most reliable ways to get consistent JSON from an LLM. You're essentially saying "I don't care what you think—call this function and fill out this form."

HOST: And `none` just disables tools entirely?

EXPERT: Yep. Even if you've provided tool definitions, `none` says "don't use any of them this turn." It's useful in multi-turn conversations where you want to temporarily disable tool access, or if you want Claude to respond purely from its training data.

HOST: Okay, here's a scenario: I want Claude to usually pick tools intelligently, but I really want it to use a specific tool for this one request. Should I use `tool` mode or just prompt it in natural language?

EXPERT: If you need a guarantee, use `tool` mode. If you're okay with Claude occasionally ignoring your prompt, you can use `auto` and add explicit instructions like "Use the get_weather tool in your response." But prompting is never as reliable as setting `tool_choice` programmatically.

HOST: Are there any weird interactions between `tool_choice` and other features?

EXPERT: Yes! And this catches people off guard. When you use `any` or `tool` mode, Claude can't provide natural language before the tool call. The API actually prefills the response to force immediate tool usage. So if you wanted Claude to say "Let me check that for you" before calling the tool, too bad—it won't happen with those modes. You'd need to stick with `auto` and rely on prompting.

## Strict Tool Use

HOST: Alright, we touched on validation earlier. What's this "strict mode" that guarantees valid parameters?

EXPERT: Strict tool use is a feature where you add `strict: true` to your tool definition, and Claude uses something called constrained decoding to ensure the parameters match your schema exactly. No type mismatches, no missing required fields, no unexpected properties.

HOST: How does that work? Is it just better prompting?

EXPERT: No, it's fundamentally different. Instead of prompting Claude to "please follow this schema," Anthropic compiles your JSON schema into a grammar that restricts which tokens the model can generate during inference. The model literally cannot produce tokens that would violate your schema.

HOST: Wait, so it's a hard guarantee, not a probabilistic best-effort thing?

EXPERT: Exactly. If your schema says `passengers` is an integer, Claude will never return `passengers: "two"` or `passengers: 2.5`. It can only output valid integers. If you specify an enum of `["economy", "business"]`, Claude can't invent a third option like "first-class."

HOST: That's wild. What's the performance cost?

EXPERT: First request with a new schema adds 100-300ms for grammar compilation. But compiled grammars are cached for 24 hours, so subsequent requests with the same schema are much faster. It's a one-time cost that's usually worth it for production systems where reliability matters.

HOST: Are there any limitations to what schemas strict mode supports?

EXPERT: Yeah, a few. You can't use recursive schemas, you can't set `minimum` or `maximum` constraints on numbers, and you can't use `minLength` or `maxLength` on strings. The SDK will sometimes auto-transform these constraints by moving them into the description instead of enforcing them in the schema.

HOST: Why those limitations?

EXPERT: It's related to how the grammar compilation works—those constraints create exponentially large state spaces that make the grammar impractical to compute. So you get basic type safety, enums, and format validation, but numerical constraints have to be checked in your application logic after Claude returns the result.

HOST: What about the `additionalProperties` thing I keep seeing in the docs?

EXPERT: Oh, that's mandatory for strict mode. You have to set `additionalProperties: false` on every object in your schema. This prevents Claude from adding unexpected fields that aren't in your schema. Without it, strict mode will fail with a 400 error.

HOST: And there's a limit to how many strict tools you can have per request?

EXPERT: Yes—20 strict tools maximum. You also can't have more than 24 optional parameters across all strict schemas, or more than 16 parameters using union types. If you hit those limits, the API returns an error. The reasoning is the same: complex schemas blow up the grammar size.

HOST: Gotcha. So strict mode is a big reliability win but comes with some constraints and a bit of latency on first use.

EXPERT: Exactly. For production agents where you can't afford parsing failures, it's absolutely worth it. The alternative is writing error handling and retry logic for malformed responses, which is way more complex.

## Tool Results and Error Handling

HOST: Let's talk about what happens after we execute a tool. How should we format results that we send back to Claude?

EXPERT: Tool results must be strings. If you're returning JSON, call `json.dumps()` first. Numbers, booleans—convert them to strings. You can also return arrays of content blocks if you want to include images, documents, or mixed content alongside text.

HOST: What if the tool fails? Like the API is down or we hit a rate limit?

EXPERT: You include `is_error: true` on the `tool_result` block and put an informative error message in the content. Don't just say "failed"—explain what went wrong and give hints for recovery. For example: "Rate limit exceeded. Retry after 60 seconds."

HOST: Does Claude do anything smart with that error?

EXPERT: Typically Claude will retry with corrected parameters 2-3 times before giving up. Sometimes it'll try a different approach entirely. If you return a good error message, Claude can adjust its strategy—maybe it'll wait, use a different tool, or inform the user about the limitation.

HOST: What if I just don't return a tool result at all?

EXPERT: The conversation breaks. Every `tool_use` block must have a corresponding `tool_result` with a matching ID. If you skip it, the next API request will fail with an error about missing tool results.

HOST: Even if the tool did nothing and there's no data to return?

EXPERT: Even then. You can return an empty string or omit the `content` field entirely for tools that perform actions without producing output. But the `tool_result` block itself is mandatory.

HOST: Are there any gotchas around ordering or formatting?

EXPERT: Yes! In user messages that contain tool results, the `tool_result` blocks must come *before* any text content. If you put text first, you'll get a 400 error. Also, when Claude makes parallel tool calls, all results must be in a *single* user message. Sending separate messages—one per result—teaches Claude to avoid parallel calls in the future, which kills your performance.

HOST: Oh, that's sneaky. So by accidentally splitting results across messages, you're training Claude to stop parallelizing?

EXPERT: Exactly. It's like negative reinforcement. Claude learns "every time I call multiple tools, the user sends them back one at a time, which means I should probably just call one tool at a time."

## Web Search and Web Fetch

HOST: Let's shift to some of the built-in server-side tools. I've heard Claude can now search the web and fetch content directly. How does that work?

EXPERT: Web search and web fetch are "server tools" meaning Anthropic's infrastructure executes them, not your application. You enable them by including tool configurations in your request, and Claude automatically uses them to access real-time information from the internet.

HOST: So instead of Claude being stuck with knowledge from its training cutoff, it can pull fresh data?

EXPERT: Yep. Web search lets Claude query the web and get search results with URLs, titles, and snippets. Web fetch lets Claude retrieve full content from specific URLs, including HTML pages and PDFs. Together they enable powerful research workflows—Claude can search for sources, then fetch and analyze the most relevant ones.

HOST: Do I have to execute these tools in my code like client-side tools?

EXPERT: Nope, that's the beauty of server tools. You define them in the `tools` array, and when Claude decides to use them, Anthropic's servers handle the execution. The results automatically appear in the response. You don't write any tool execution code at all.

HOST: That's convenient. Are there security controls?

EXPERT: Lots. Both tools support `allowed_domains` and `blocked_domains` parameters. You can restrict Claude to only trusted sites like official documentation domains, or block specific untrusted sites. You can set these at the request level or organization level.

HOST: What about preventing Claude from fetching arbitrary URLs I don't want it accessing?

EXPERT: Web fetch has a strict security model: Claude can only fetch URLs that have already appeared in the conversation—either in user messages, previous tool results, or from web search. It can't fetch URLs it generates or constructs itself.

HOST: So if I ask Claude "go fetch example.com/secret-data," it would work?

EXPERT: It would work if you explicitly provided that URL in your message, yes. That's why you'd use domain controls to prevent access to sensitive internal URLs if needed.

HOST: What's the pricing model?

EXPERT: Web search costs $10 per 1,000 searches, plus standard token costs for the results. Web fetch has no additional cost beyond tokens. A typical web page is around 2,500 tokens, a large docs page might be 25,000 tokens, and a research paper PDF can be 125,000 tokens.

HOST: Wow, so a PDF could be expensive if you're not careful.

EXPERT: That's why there's a `max_content_tokens` parameter on web fetch. You can cap it at, say, 50,000 tokens to prevent runaway costs with huge documents.

HOST: Can you give me a practical example of how you'd use these together?

EXPERT: Sure. Imagine you ask Claude: "Find recent articles about quantum computing and analyze the most relevant one." Claude would first use web search to find articles, evaluate the results, then use web fetch to retrieve the full content of the best article, and finally provide a cited analysis. All in one conversation turn.

HOST: And Claude handles the orchestration—deciding which tool to use when?

EXPERT: Exactly. You just enable both tools and let Claude figure out the workflow. The newer tool versions even support dynamic filtering, where Claude can write code to filter search results before they hit the context window. This keeps only relevant information and reduces token costs.

## Code Execution

HOST: Okay, this code execution tool sounds pretty sci-fi. Claude can actually run code?

EXPERT: It can. The code execution tool is another server-side tool where Claude can run Bash commands, manipulate files, perform calculations, and generate visualizations—all in a secure, sandboxed Linux container.

HOST: Wait, that sounds dangerous. What prevents Claude from doing something malicious?

EXPERT: The sandbox is completely network-isolated. No internet access whatsoever. The container has 5 gigs of RAM and disk space, 1 CPU, and it's fully ephemeral. Even if Claude tried something sketchy, it's locked in a box with no way to communicate with the outside world.

HOST: So what would you actually use this for?

EXPERT: Data analysis is the killer use case. You upload a CSV file, and Claude can load it, explore the data, generate charts, identify trends, clean the dataset, and produce a downloadable report—all without you writing any analysis code. It's like having a data scientist that executes Python in real-time.

HOST: How do you get files into the sandbox?

EXPERT: You use the Files API to upload files first, then reference them with a `container_upload` content block in your message. Claude can access those files in the sandbox, process them, and create new files you can download afterward.

HOST: Can Claude install packages or is it limited to pre-installed libraries?

EXPERT: The environment comes with a rich set of pre-installed libraries—pandas, numpy, scipy, scikit-learn, matplotlib, seaborn, and a bunch of file processing tools like openpyxl for Excel, pypdf for PDFs, and pillow for images. You can't install arbitrary packages because there's no network access, but the pre-installed set covers most data analysis and visualization needs.

HOST: Does the sandbox reset after every request?

EXPERT: By default, yes. But you can reuse containers across requests using a container ID. This lets you have multi-turn workflows where files created in one request are available in the next. Containers expire after 30 days.

HOST: What's the pricing?

EXPERT: If you use it alongside web search or web fetch, there's no additional cost. Otherwise, it's billed based on execution time at $0.05 per hour, with 1,550 free hours per month. There's a 5-minute minimum though, so even a quick execution gets billed for 5 minutes.

HOST: And you mentioned dynamic filtering earlier—how does that tie in?

EXPERT: When you enable code execution with the latest web search and web fetch tool versions, Claude can write code to filter results programmatically before they consume your context window. For example, if a search returns 50 results, Claude might write a script to extract just the URLs and titles from the top 10 most relevant ones, discarding the rest. You save tokens and get more focused results.

## MCP Connector

HOST: Last topic—what's this MCP connector all about?

EXPERT: MCP stands for Model Context Protocol. It's an open standard introduced by Anthropic for connecting AI applications to external systems—think of it as a universal plug for AI integrations. The MCP connector is a beta feature that lets you connect Claude directly to remote MCP servers without building your own MCP client.

HOST: So instead of defining tools manually in my API request, I point Claude at an MCP server and it discovers the tools automatically?

EXPERT: Exactly. You include an `mcp_servers` configuration with a URL and authentication token, and Claude handles the MCP protocol negotiation, tool discovery, and invocation. You get access to third-party integrations or custom tooling without managing MCP client infrastructure yourself.

HOST: What kind of tools are available through MCP?

EXPERT: There's a growing ecosystem—calendar integrations, database connectors, CRM tools, you name it. Anyone can publish an MCP server exposing their API as tools. The protocol standardizes how tools are defined, how parameters are validated, and how results are returned.

HOST: How do you control which tools from the MCP server Claude can use?

EXPERT: You configure an `MCPToolset` in your `tools` array. You can enable all tools by default, or use an allowlist/denylist approach. For example, you might enable everything except dangerous operations like `delete_all` or `drop_database`.

HOST: Can Claude use multiple MCP servers in one request?

EXPERT: Yes! You can connect to several servers—each gets a unique name and a corresponding toolset configuration. So you might have one MCP server for Google Calendar, another for Slack, and another for your internal database—all accessible in a single conversation.

HOST: Are there limitations compared to defining tools manually?

EXPERT: The MCP connector only supports tools—MCP's resource and prompt features aren't available through the connector. If you need those, you'd use the TypeScript SDK's client-side helpers instead. Also, the MCP server must be accessible via HTTPS; local servers won't work unless you expose them through a tunnel.

HOST: And this is all still in beta?

EXPERT: Yeah, it's under the `anthropic-beta: mcp-client-2025-11-20` header. It's excluded from Zero Data Retention arrangements and not available on Bedrock or Vertex AI yet—only direct Anthropic API access.

## Common Mistakes

HOST: We've covered a lot. What are the biggest mistakes you see developers make with tool use?

EXPERT: Number one: vague tool descriptions. People write "Gets stock price" and wonder why Claude doesn't use it correctly. You need to explain what the tool does, when to use it, what it returns, and any edge cases. Descriptions are *how Claude decides*, so treat them like documentation for a teammate.

HOST: That makes sense. What else?

EXPERT: Not validating tool results. Developers assume Claude's output will always be perfect, then their function crashes because it got a string instead of an integer. Always validate inputs before executing tools, just like you'd validate user input.

HOST: What about the structural mistakes—like how messages are formatted?

EXPERT: Sending tool results in separate messages instead of one combined message. This breaks parallel execution and trains Claude to stop parallelizing. Also, putting text before tool_result blocks in user messages causes instant 400 errors.

HOST: Are there issues around caching or performance?

EXPERT: Changing `tool_choice` or the tool definitions between requests invalidates prompt caching, so your costs go up and latency increases. If you want cache hits, keep your tool configurations consistent across related requests.

HOST: What about strict mode?

EXPERT: Forgetting to set `additionalProperties: false` is the most common error. Without it, strict mode fails with a 400 error. Also, people hit the complexity limits—20 strict tools max, 24 optional parameters across all schemas—and get confused by the error messages.

HOST: Any gotchas with the server-side tools like web search?

EXPERT: Web fetch can't construct URLs dynamically. Claude can only fetch URLs that already appeared in the conversation. This is a security feature, but it confuses people who expect Claude to "just figure out the URL" on its own.

HOST: And code execution?

EXPERT: No network access catches people constantly. Developers expect Claude to pip install packages or fetch data from the internet, but the sandbox is completely isolated. You have to use the pre-installed libraries and pass data in via file uploads.

## Wrap-up

HOST: Alright, let's bring this home. If someone's building their first AI agent with tool use, what are the 3-4 key takeaways they absolutely need to remember?

EXPERT: First: tool descriptions are critical. Spend time writing clear, detailed descriptions because that's how Claude decides what to use. Second: always validate tool inputs and results in your application code—never trust AI output blindly. Third: understand the difference between parallel and sequential execution, and structure your tools to enable parallelization where possible for performance. And fourth: use strict mode for production systems where reliability matters—it's the easiest way to guarantee valid tool calls.

HOST: And if I had to pick one mistake to avoid above all others?

EXPERT: Treating tool use like a black box. Understand the request-response cycle, know where execution happens (client vs server tools), and validate your assumptions by reading the actual API responses. Too many people cargo-cult examples without understanding the flow, then get stuck debugging subtle issues.

HOST: Perfect. This has been incredibly helpful—thank you!

EXPERT: My pleasure. Now go build some agents that actually interact with the real world!
