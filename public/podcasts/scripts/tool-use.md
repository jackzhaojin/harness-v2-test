HOST: Okay, so — you know how everyone's talking about AI agents now? Like, "oh, AI agents are going to do everything for us"?

EXPERT: Right, right. The hype is real.

HOST: Yeah, but here's what I couldn't figure out until recently — how do they actually... do things? Like, an LLM is just text in, text out. How does it check the weather, or book a flight, or pull data from your CRM?

EXPERT: Oh! So that's where tool use comes in. And honestly, it's way simpler than people think, but also... there's some genuinely wild stuff happening under the hood.

HOST: Okay, break it down for me. What is tool use?

EXPERT: So, imagine you're texting with someone who's helping you plan a trip. You say "what's the weather in Tokyo?" and they can't just... know that. They need to check a weather service, right?

HOST: Sure.

EXPERT: Tool use is basically that, but for AI. You define a set of functions — tools — that Claude can request. You give it a name, a description, and a schema that says what parameters it needs. Then when someone asks "what's the weather in Tokyo?", Claude doesn't hallucinate an answer. It says "I need to call the get_weather tool with location equals Tokyo."

HOST: Wait, so Claude doesn't actually execute the function?

EXPERT: No! That's the key thing people get wrong. Claude just requests it. The API returns a tool_use block — basically a JSON object saying "hey, call this function with these parameters." Your application reads that, runs the actual function, and sends the result back to Claude. Then Claude uses that real data to answer the user.

HOST: Huh. So it's like... Claude is the brain, but my code is the hands?

EXPERT: Exactly. Claude figures out what needs to happen, your code makes it happen.

HOST: Okay, that makes sense. But how does Claude know which tool to use? Like, if I give it ten different tools, how does it pick the right one?

EXPERT: This is where the description field becomes absolutely critical. And I mean critical. The tool name and parameter schema matter, but the description is what Claude actually reads to decide "should I use this?"

HOST: So it's not just like, "gets weather"?

EXPERT: God, no. That's the mistake everyone makes at first. If you write "Gets stock price" as your description, Claude's going to use that tool at the wrong times — or not use it when it should. You want 3-4 sentences minimum. Explain what it does, when to use it, what it returns, any edge cases.

HOST: Give me an example.

EXPERT: Okay, so instead of "Gets stock price," you'd write: "Retrieves the current stock price for a given ticker symbol from the NYSE or NASDAQ. Use this when the user asks about current stock values, not historical data or predictions. Returns price in USD and timestamp of last trade."

HOST: Oh wow, that's way more specific.

EXPERT: Yeah! Because now Claude knows: don't use this for crypto, don't use this for historical trends, and the result will have a timestamp. That context prevents so many errors.

HOST: So it's like... you're teaching Claude through descriptions?

EXPERT: Basically, yeah. The description is your chance to do prompt engineering at the tool level.

HOST: Okay, that's smart. What about the schema part? That's the JSON thing, right?

EXPERT: Yeah, the input_schema. It's just JSON Schema — you define what parameters the tool expects, their types, whether they're required or optional.

HOST: And that's how Claude knows to ask for, like, location and unit for the weather tool?

EXPERT: Exactly. You'd have a "location" field that's a string, a "unit" field that's an enum with "celsius" and "fahrenheit," and you'd mark location as required.

HOST: What happens if Claude doesn't provide a required parameter?

EXPERT: So here's the thing — by default, Claude is pretty good about following the schema, but it's not perfect. It might skip a required field or pass the wrong type. Like, you want an integer for number of passengers, but Claude gives you the string "two."

HOST: Oh, that would break everything.

EXPERT: Yep. Which is why there's this feature called strict tool use. And this is where it gets interesting.

HOST: Okay, I'm listening.

EXPERT: So normally, Claude generates tool calls the same way it generates any text — it's probabilistic, right? It's predicting the next token. But with strict mode, Anthropic does something called constrained decoding.

HOST: Wait, what does that mean?

EXPERT: They compile your JSON schema into a grammar — like, a formal grammar — and then during inference, Claude literally cannot generate tokens that would violate your schema.

HOST: Get out of here. Seriously?

EXPERT: I'm serious! It's not prompting Claude to "please follow the schema." The model physically cannot produce invalid JSON. If your schema says passengers must be an integer between 1 and 6, Claude will only generate tokens that satisfy that.

HOST: That's... actually kind of wild. So you get a hard guarantee?

EXPERT: You get a hard guarantee. No type mismatches, no missing required fields, no extra fields you didn't ask for.

HOST: What's the catch?

EXPERT: Well, there's a few. First, there's a compilation step the first time you use a schema, so you get like 100-300 milliseconds of latency. But it caches for 24 hours, so subsequent requests are fast.

HOST: Okay, that's not too bad.

EXPERT: Second, there are complexity limits. You can only have 20 strict tools per request, and there's limits on optional parameters and union types — things that make the grammar really complex.

HOST: Why?

EXPERT: Because the grammar size explodes. Every optional parameter roughly doubles the state space. So if you have a bunch of optional fields, the grammar becomes huge and slow to compile.

HOST: So the advice is to make things required when you can?

EXPERT: Exactly. Or accept that Claude will infer reasonable defaults. Which it does pretty well, actually — Sonnet models especially are aggressive about filling in optional parameters.

HOST: Huh. Okay, so we've got tools, we've got schemas, we've got strict mode. What about when Claude needs to call multiple tools?

EXPERT: Oh! Okay, this is one of my favorite parts. So there's parallel and sequential tool calling.

HOST: I assume parallel means calling multiple tools at once?

EXPERT: Yep. And the performance difference is dramatic. Like, if you need to fetch weather for Tokyo, Paris, and New York — three API calls at 300 milliseconds each — that's 900ms if you do them sequentially, right?

HOST: Right.

EXPERT: But if Claude requests all three in one response and you run them in parallel with async code, it's just 300ms total.

HOST: Oh, that's a huge difference for user experience.

EXPERT: Yeah! The difference between feeling snappy and feeling sluggish. And both OpenAI and Anthropic models support this by default.

HOST: So Claude just... knows to do it?

EXPERT: It depends. Claude will parallelize when it makes sense — when the operations are independent. Like, fetching weather for three different cities? Obviously parallel. But if you ask "what's the weather where I am?", Claude needs to call a location tool first, then use that result to call the weather tool. That's sequential.

HOST: Because there's a dependency.

EXPERT: Exactly. And Claude's pretty good at figuring that out. But there's this parameter you can set — disable_parallel_tool_use — if you want to force it to only call one tool at a time.

HOST: Why would you want that?

EXPERT: Rate limiting, mostly. If you're hitting external APIs that have strict rate limits, you might not want Claude firing off four requests simultaneously and blowing your quota.

HOST: Fair enough. Are there gotchas with parallel execution?

EXPERT: Oh yeah. So when Claude makes parallel tool calls, it returns multiple tool_use blocks, each with a unique ID. You have to execute all of them, then return all the results in a single message. If you send results in separate messages, you actually teach Claude to stop doing parallel calls.

HOST: Wait, really?

EXPERT: Yeah. It learns from the conversation structure. If you always send results one at a time, Claude adapts and starts making sequential requests. So always bundle your results.

HOST: That's... kind of fascinating, actually. It's learning from how you structure the API calls.

EXPERT: Right? I mean, these models are pattern-matching machines.

HOST: Okay, so — I'm curious about something. You mentioned earlier that your code has to execute the tools and return results. What does that actually look like?

EXPERT: So, the basic loop is: you send a message, Claude responds with a tool_use block, you extract the tool name and parameters, execute the function, and send back a tool_result block with the output.

HOST: And that goes back to Claude?

EXPERT: Yep. Then Claude continues generating its response using that data. It's a turn-by-turn conversation.

HOST: Does the SDK help with this?

EXPERT: Oh yeah. Anthropic has a tool runner in the SDK that handles the whole loop for you. You just decorate your Python functions with a @beta_tool decorator, pass them to the runner, and it automatically executes tools and feeds results back until Claude is done.

HOST: That sounds way easier than managing it yourself.

EXPERT: It is. But if you're doing something custom — like you need to add logging, or handle errors in a specific way — you might want to implement the loop yourself.

HOST: Makes sense. What about errors? Like, what if a tool fails?

EXPERT: You can send back a tool_result with is_error set to true, and Claude will see that the tool failed. The important thing is to make your error messages instructive.

HOST: What do you mean?

EXPERT: Don't just return "failed" or "error." Say what went wrong and give Claude a hint about how to recover. Like, "Rate limit exceeded. Retry after 60 seconds."

HOST: Oh, so Claude can adapt?

EXPERT: Yeah! Claude will usually retry 2-3 times with corrected parameters or a different approach. It's surprisingly resilient if you give it good error messages.

HOST: Huh. Okay, I want to switch gears for a second. There's this thing called tool_choice that I've seen in the docs. What is that?

EXPERT: So tool_choice is how you control whether Claude must use a tool, can use a tool, or cannot use tools. It's got four modes: auto, any, tool, and none.

HOST: Okay, break those down.

EXPERT: Auto is the default — Claude decides whether to use a tool based on the query. Any means Claude must use at least one tool, but it picks which one. Tool means Claude must use a specific tool you name. And none means Claude can't use any tools.

HOST: Why would you use any or tool?

EXPERT: So, tool mode is perfect for structured data extraction. Like, you want to classify support tickets into categories — billing, technical, general. You define a tool with an enum for categories, set tool_choice to force that specific tool, and boom — you get guaranteed JSON output matching your schema.

HOST: Oh! So it's like... forcing structured output?

EXPERT: Exactly. It's one of the most common use cases. Any mode is useful for things like SMS chatbots where every response has to go through a tool — like a send_message tool.

HOST: Because you don't want Claude generating text directly?

EXPERT: Right. You want everything to flow through your tool so you can control formatting, rate limiting, whatever.

HOST: That's clever. Are there gotchas with tool_choice?

EXPERT: Yeah, a big one: when you use any or tool mode, Claude doesn't generate natural language before the tool call. It just goes straight to the tool.

HOST: Wait, really?

EXPERT: Yeah. The API prefills the assistant's response to force tool usage. So if you want Claude to explain what it's doing before calling a tool, you have to use auto mode and explicitly ask for an explanation in the prompt.

HOST: Huh. That seems like something people would trip over.

EXPERT: Oh, they do. All the time. You expect a conversational lead-in, but Claude just calls the tool immediately.

HOST: Okay, so we've talked about tools that your application executes. But I know there are some tools that Claude can execute on its own, right? Like, server-side tools?

EXPERT: Oh yeah! This is where things get really powerful. Anthropic provides a few server tools: web search, web fetch, and code execution.

HOST: Let's start with web search. How does that work?

EXPERT: So normally, Claude's knowledge has a cutoff date — it doesn't know what happened yesterday or even last month. Web search gives Claude the ability to query the web and get real-time information.

HOST: And Anthropic's servers handle the actual search?

EXPERT: Exactly. You just add the web_search tool to your tools array, and when Claude needs current information, it sends a server_tool_use block. Anthropic's backend runs the search and returns results automatically.

HOST: What do the results look like?

EXPERT: You get URLs, titles, page age, and snippets. And here's the cool part — Claude automatically cites its sources.

HOST: Oh, that's huge for credibility.

EXPERT: Yeah! Every time Claude references something from a search result, it includes the citation with the source URL.

HOST: What about web fetch? Is that different?

EXPERT: Yeah, web fetch retrieves the full content of a specific URL. So you can combine them — search for relevant articles, then fetch the most promising one and analyze it in detail.

HOST: That's like a two-step research workflow.

EXPERT: Exactly. And web fetch supports PDFs too, so you can pull in research papers, documentation, all that.

HOST: Are there security concerns with giving Claude web access?

EXPERT: Oh, absolutely. Which is why there are domain controls. You can set allowed_domains and blocked_domains at the request level or the organization level.

HOST: So I could restrict Claude to only search specific sites?

EXPERT: Yep. Like, you could limit it to docs.aws.amazon.com and cloud.google.com for official documentation only.

HOST: That's smart. What's the catch with web fetch?

EXPERT: The big one is that Claude can't just fetch arbitrary URLs it generates. It can only fetch URLs that appear in the conversation — from user messages, previous tool results, or search results.

HOST: Why?

EXPERT: Security. To prevent data exfiltration. If Claude could construct and fetch URLs dynamically, it could potentially leak data by encoding it in URL parameters.

HOST: Oh wow, I hadn't thought of that.

EXPERT: Yeah, it's a subtle but important safeguard.

HOST: Okay, what about code execution? That sounds... kind of scary?

EXPERT: It's actually super well sandboxed. Claude can write and run code in an isolated container — no internet access, limited disk and memory. But within that sandbox, it can manipulate files, run calculations, generate visualizations.

HOST: So it's like... Claude has a little computer it can play with?

EXPERT: Basically, yeah. And the use cases are incredible. Data analysis is the big one.

HOST: How so?

EXPERT: You upload a CSV, tell Claude to analyze it. Claude loads the data, explores it, generates charts, identifies trends, and saves a report — all in one conversation.

HOST: Wait, it can create files?

EXPERT: Yep. You can upload files via the Files API, Claude processes them in the sandbox, and it can generate new files that you download.

HOST: That's... okay, that's pretty wild. What's the sandbox environment like?

EXPERT: Python 3.11, 5GB of RAM, 5GB of disk, 1 CPU. No network access. It's got pandas, numpy, matplotlib, all the standard data science libraries.

HOST: What about multi-turn workflows? Like, can Claude remember files between requests?

EXPERT: Yeah! Containers can persist across requests using a container ID. So you can upload data in one request, process it, then in a follow-up request, Claude still has access to the files it created.

HOST: How long do containers last?

EXPERT: 30 days. After that, they expire and you'd need to re-upload.

HOST: Gotcha. Are there security implications with code execution?

EXPERT: The sandbox is solid — network isolation, no host access. But it's not covered by Zero Data Retention agreements, so if you're working with sensitive data and need ZDR compliance, you can't use code execution.

HOST: That's good to know. Is there a cost?

EXPERT: It's free if you use it alongside web search or web fetch. Otherwise, it's five cents per hour after a generous free tier.

HOST: That's... surprisingly affordable.

EXPERT: Yeah, Anthropic's pricing on this is pretty reasonable.

HOST: Okay, so — we've covered a lot. Tools you define, tools Anthropic provides. But there's one more thing I wanted to ask about: MCP. What is that?

EXPERT: Oh, Model Context Protocol. So this is Anthropic's attempt to standardize how AI applications connect to external systems.

HOST: Like a standard interface?

EXPERT: Exactly. Think of it like USB-C for AI. Instead of every app building custom integrations, you use MCP servers that expose tools, data sources, and workflows in a consistent way.

HOST: And Claude can talk to MCP servers directly?

EXPERT: Yeah, through the MCP Connector. It's a beta feature where you just specify an MCP server URL in your API request, and Claude handles the protocol negotiation and tool discovery automatically.

HOST: So I don't need to build an MCP client?

EXPERT: Nope. The API does it for you. You just configure which MCP server to connect to, and optionally which tools to enable or disable.

HOST: Why would you disable tools?

EXPERT: Security. An MCP server might expose a mix of read-only and destructive operations. You can enable the safe ones and block the dangerous ones.

HOST: That makes sense. Is there a catch?

EXPERT: The MCP Connector only supports tools, not the other parts of MCP like resources and prompts. If you need those, you'd use the client-side SDK helpers instead.

HOST: And I assume this requires HTTPS?

EXPERT: Yep. Local servers need to be exposed through a tunnel or run via the SDK's local client helpers.

HOST: Gotcha. So the MCP Connector is for remote, HTTPS-accessible servers.

EXPERT: Exactly.

HOST: Okay, so — stepping back. We've talked about tool definitions, parallel calls, strict mode, tool_choice, server tools, MCP. What's the big picture here? Like, why does all this matter?

EXPERT: Because this is how you go from a chatbot to an agent. An LLM that can only generate text is impressive, but limited. The moment it can check a database, call an API, search the web, run code — now it's interacting with the real world.

HOST: Right, but... isn't that kind of dangerous?

EXPERT: It can be, if you're not careful. That's why all the guardrails exist — strict schemas, domain filtering, sandboxing, error handling. The tools are powerful, but you have to design them thoughtfully.

HOST: What's the biggest mistake people make?

EXPERT: Honestly? Vague tool descriptions. People assume the schema is enough, but Claude needs context to make good decisions. If your description doesn't explain when to use a tool, what it returns, and what the edge cases are, you're going to get unpredictable behavior.

HOST: So it's like... the more explicit you are, the better?

EXPERT: Yeah. And I mean, that applies to everything with LLMs, right? But with tools, the stakes are higher because you're executing code, hitting APIs, spending money.

HOST: Fair point. What about the future of this? Like, where is tool use heading?

EXPERT: I think we're going to see a lot more emphasis on reliability — strict mode is a step in that direction. But also, I think the MCP ecosystem is going to get really interesting. If you have a standard protocol, third parties can build integrations that just... work. You don't need custom code for every SaaS app.

HOST: So like, plug-and-play integrations for AI?

EXPERT: Exactly. And that unlocks a lot of use cases. Instead of spending weeks building connectors to Salesforce, Slack, your database, whatever — you just point Claude at an MCP server and go.

HOST: That would be huge for developers.

EXPERT: Yeah, it lowers the barrier to building sophisticated agents. Which I think is the whole point.

HOST: Okay, last question. If someone's building their first AI agent with tool use, what's the one piece of advice you'd give them?

EXPERT: Start simple. Don't try to give Claude 50 tools on day one. Start with one or two, get the loop working, understand how tool results flow back into the conversation. Then add complexity.

HOST: Because it's easy to overcomplicate?

EXPERT: Oh yeah. And when things break — and they will — it's way easier to debug if you've only got two tools instead of twenty.

HOST: That's solid advice.

EXPERT: Also, test your error handling. Like, actually break things on purpose. Disconnect your API, pass invalid parameters, hit rate limits. See how Claude responds.

HOST: Because you want to know what happens when things go wrong?

EXPERT: Exactly. The happy path is easy. The real test of your agent is how it handles failures. And if you've written good error messages and given Claude enough context, it's surprisingly good at recovering.

HOST: Huh. So it's not just about making tools — it's about making resilient systems.

EXPERT: Yeah. And I think that's the shift people need to make. You're not just prompting a model anymore. You're building an architecture.

HOST: That's a good way to put it. Alright, I think we covered a ton here. Tool definitions, schemas, strict mode, parallel calls, tool_choice, server tools, MCP — this is basically the whole playbook, right?

EXPERT: Pretty much. There's always more detail you can go into, but yeah, those are the core concepts.

HOST: And the key takeaway is: tools turn text generation into action, but you have to be thoughtful about how you design them.

EXPERT: Exactly. Because with great power comes great... you know.

HOST: Responsibility?

EXPERT: I was going to say "token costs," but sure, responsibility works too.

HOST: Ha! Fair enough. Alright, this was fun. I feel like I actually understand this now.

EXPERT: Yeah, same. It's one of those things that seems intimidating until you break it down, and then it's like, oh, okay, this is just structured API calls.

HOST: Structured, intelligent API calls.

EXPERT: Right. That can run code and search the web.

HOST: No big deal.

EXPERT: No big deal.
