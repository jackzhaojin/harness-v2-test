HOST: So imagine you've got this incredibly smart friend, right? Like, scary smart. They can write essays, they can reason through complex problems, they can hold a conversation about literally anything. But they're locked in a room with no phone, no computer, no internet. They can tell you how to look something up, but they can't actually do it themselves.

EXPERT: Right, and that's basically what an LLM is without tool use. It's this powerful reasoning engine trapped behind a text interface. It can describe how to call an API, but it can't actually call one.

HOST: Until you give it tools.

EXPERT: Until you give it tools. And that's... honestly, that's the thing that turns a chatbot into an agent. That's the leap.

HOST: Okay so let's talk about how that actually works, because I think a lot of people hear "function calling" and think it's this magical thing where the model just, like, reaches out into the world. But it's not that at all, is it?

EXPERT: No, no, not even close. And I think that's the first misconception worth clearing up. Claude never executes a tool. It never calls your API. What it does is it says, "Hey, I think we should call this function with these parameters." And then your code actually does the work.

HOST: So it's more like... a really smart dispatcher?

EXPERT: That's a great way to put it. It's a dispatcher that reads a menu of available tools, figures out which one to use, fills in the order form correctly, and hands it to you. You go to the kitchen, make the thing, and bring it back.

HOST: I love that. The restaurant analogy. So what does this menu look like? What do you actually hand Claude?

EXPERT: So every tool has three parts. You've got a name, which is just an identifier -- something like "get_weather" or "database_query." You've got a description, which tells Claude when and how to use it. And then you've got an input schema, which is a JSON Schema that defines the parameters.

HOST: And I'm guessing the description is where people get lazy?

EXPERT: Oh, so lazy. And here's the thing that surprises people -- the description is the single most important factor in whether your tool works well. Not the schema, not the name. The description.

HOST: Wait, really? More important than the actual schema?

EXPERT: Way more. Think about it -- if you write a description that just says "Gets stock price," Claude doesn't know... should I use this for historical prices? Real-time quotes? Crypto? What does it return? But if you write three or four sentences explaining exactly what the tool does, when to use it, what it returns, and what its limitations are -- suddenly Claude picks the right tool almost every time.

HOST: Huh. So it's almost like writing a really good job description for a position you're hiring for.

EXPERT: Exactly! Vague job posting, you get random applicants. Detailed, specific job posting, you get exactly who you need.

HOST: Okay, so Claude reads these definitions, decides to use a tool, and then what? Walk me through the actual mechanics.

EXPERT: So Claude responds with a special content block -- a "tool_use" block. It's got the tool name, a unique ID, and the input parameters. Your application sees that, executes the actual function -- maybe it's calling a weather API, maybe it's querying a database -- and then you send the result back to Claude in a "tool_result" block.

HOST: And you have to match the IDs, right?

EXPERT: You have to match the IDs exactly. Every tool_use needs a corresponding tool_result with the same ID. Miss one, mismatch one, and the whole thing blows up with an error.

HOST: So it's like a call-and-response. Claude says "I need this," you go get it, you bring it back, and then Claude incorporates it into its answer.

EXPERT: Right, right, right. And the cool thing is this can loop. Claude might use a tool, get the result, realize it needs more information, use another tool, get that result, and finally give you the answer. It's this back-and-forth dance.

HOST: Okay, so here's where it gets interesting to me. What happens when Claude wants to use multiple tools at once? Like, "What's the weather in Tokyo and Paris and New York?"

EXPERT: So this is parallel tool calling, and it's... honestly, it's a game-changer for performance. Instead of calling get_weather for Tokyo, waiting for the result, then calling it for Paris, waiting, then New York -- Claude just fires off all three in a single response.

HOST: And your application runs them all at the same time.

EXPERT: Exactly. And the math here is pretty dramatic. If each API call takes 300 milliseconds, sequential execution takes 900 milliseconds. Parallel? Still 300. For the user, that's the difference between "wow, that was fast" and "ugh, why is this taking so long."

HOST: That's like... going from O(n) to O(1) for the data-fetching step.

EXPERT: Precisely. And it's not just speed -- it lets agents cross-reference multiple data sources without killing the user experience. Imagine an agent that needs to check your calendar, your email, and your task list to plan your day. Sequential, that's painful. Parallel, it feels instant.

HOST: But you can't always parallelize, right? Sometimes one tool's output feeds into another.

EXPERT: Right, and Claude is actually smart about this. If you ask "What's the weather where I am?" -- that's two steps. First, figure out the location, then get the weather for that location. Claude will correctly sequence those. It calls the location tool first, gets the result, then uses that result to call the weather tool.

HOST: So it understands data dependencies automatically.

EXPERT: It does. But here's a gotcha -- if you prompt it aggressively to parallelize things that actually have dependencies, it might try to guess the intermediate values. And that's... bad.

HOST: Oh no. "I'll just assume you're in San Francisco."

EXPERT: Exactly. So the rule of thumb is: let the model decide the execution order based on your tool descriptions. Don't try to force it.

HOST: Okay, now I want to talk about something that I think is really clever. Tool choice. Because sometimes you don't want Claude to decide whether to use a tool -- you want to force it.

EXPERT: Yeah, tool_choice is this parameter that gives you fine-grained control. There are four modes. Auto is the default -- Claude decides. Any means Claude must use at least one tool, but it picks which one. Tool mode forces a specific tool. And none means no tools, even if you provided them.

HOST: So when would you use "any"? That seems like a weird middle ground.

EXPERT: Okay, this is going to sound nerdy but it's one of my favorite patterns. Imagine you're building an SMS chatbot. Every response has to go through a send_message tool because that's how SMS works. There's no "just respond with text" option. So you set tool_choice to "any" and now Claude must route everything through a tool.

HOST: Oh! Oh, that's interesting. So it's not just about getting data -- it's about making sure the output goes through the right channel.

EXPERT: Exactly. And the tool mode -- forcing a specific tool -- is amazing for data extraction. Say you need to classify support tickets. You define a classify_ticket tool with categories, priorities, and you force Claude to use it. Now every response is guaranteed to be structured data matching your schema.

HOST: That's basically using tool use as a structured output mechanism.

EXPERT: That's exactly what it is. And here's a subtle thing that catches people -- when you set tool_choice to "any" or "tool," the API prefills the response to force tool usage. Which means Claude won't write any natural language before the tool call. No "Sure, let me look that up for you."

HOST: So if you need both the conversational lead-in and the structured output, you're stuck with auto mode?

EXPERT: Right, you'd use auto mode with explicit instructions in your prompt. But honestly, for most extraction pipelines, you don't want the conversational fluff anyway.

HOST: Fair point. Okay, so let's talk about strict mode because this one kind of blew my mind when I first learned how it works.

EXPERT: So, okay, here's the thing. Without strict mode, Claude is doing its best to produce valid JSON that matches your schema. And it's pretty good at it! But "pretty good" is not good enough for production. You might define a parameter as an integer, and Claude returns the string "two." Or it returns "2" as a string instead of the number 2.

HOST: And your parser just dies.

EXPERT: Your parser dies, your downstream function throws a type error, and now you need retry logic. But with strict mode, you set strict: true on the tool definition, and Anthropic guarantees the output matches your schema. Not "tries really hard." Guarantees.

HOST: How can they guarantee it? That's... that feels impossible for a language model.

EXPERT: And this is the part that's actually wild. They're not just prompting the model to be more careful. They compile your JSON Schema into a grammar -- like, an actual formal grammar -- and they use that grammar during token generation to physically restrict which tokens can be produced.

HOST: Wait, wait, wait. So the model literally cannot generate a token that would violate the schema?

EXPERT: Cannot. Physically impossible. It's called constrained decoding. The token probabilities for anything that would break the schema are zeroed out during inference. So if a field expects an integer, the model can only produce integer tokens at that position.

HOST: That's... actually kind of wild. It's not a validation layer after the fact. It's baked into the generation process itself.

EXPERT: Right! And there's this neat consequence -- the first time you use a new schema, there's a small latency hit, maybe 100 to 300 milliseconds, because they have to compile the grammar. But then it's cached for 24 hours. So subsequent requests with the same schema are fast.

HOST: Okay but there have to be limitations, right? You can't just throw any JSON Schema at it.

EXPERT: Oh yeah, there are real constraints. No recursive schemas. No minimum/maximum on numbers. No minLength/maxLength on strings. And here's a fun one -- optional parameters roughly double the grammar's state space.

HOST: So if you have a bunch of optional fields...

EXPERT: You hit complexity limits fast. They cap it at 24 total optional parameters across all strict tools in a request, and max 20 strict tools per request. So you want to mark things as required wherever you can.

HOST: And you have to set additionalProperties to false on every object.

EXPERT: Every single one. Nested objects too. Forget it on one nested object and you get a 400 error.

HOST: Okay, I want to shift gears to something that I think is really exciting -- server-side tools. Because everything we've talked about so far is client tools, where your code does the execution. But there's this other category where Anthropic handles it.

EXPERT: Yeah, so web search and web fetch are what they call server tools. When Claude wants to search the web, it's not sending you a tool_use block for you to execute. Anthropic's servers actually perform the search and inject the results directly.

HOST: So it's fully managed. You just say "give Claude web search" and it handles everything.

EXPERT: You add the tool to your request, specify some configuration -- maybe limit it to certain domains, set a max number of searches -- and Claude just... goes and searches the internet.

HOST: And the results come back with citations?

EXPERT: Always, for web search. It links response text back to the source URLs. And there's this really clever security constraint on web fetch that I love.

HOST: Oh?

EXPERT: Claude can only fetch URLs that have already appeared in the conversation. Either the user provided them, or they came up in search results. It cannot construct a URL from scratch and go fetch it.

HOST: So you can't say "Hey Claude, go fetch the HTML from my competitor's website" out of nowhere?

EXPERT: Nope. The URL has to have appeared earlier. And the reason is data exfiltration prevention. If Claude could construct arbitrary URLs, a malicious prompt could trick it into encoding sensitive data into URL parameters and sending it to an attacker's server.

HOST: I mean, think about it -- you've got tool results in the conversation that might contain private data. If Claude could just ping any URL it wanted...

EXPERT: Exactly. So this URL validation rule is a fundamental security guardrail, not just a limitation.

HOST: What about the code execution tool? Because that one feels like it opens up a whole different world.

EXPERT: It really does. So the code execution tool gives Claude access to a sandboxed Linux container. It can run Bash commands, write and edit files, do data analysis with Python libraries like pandas and matplotlib. And it all runs in a container with no network access.

HOST: No network at all?

EXPERT: Zero. Completely air-gapped. Five gigs of RAM, five gigs of disk, one CPU, and absolutely no ability to reach the internet. Which is exactly what you want when you're running untrusted code.

HOST: So if Claude is analyzing a CSV you uploaded, it's doing it in this isolated sandbox. It can't phone home, it can't exfiltrate data.

EXPERT: Right. And the really powerful pattern is combining these tools. You can use web search to find information, web fetch to grab the full content, and then code execution to process it programmatically. Like, search for stock data, fetch the results, then write Python to plot a comparison chart.

HOST: That's three different tools working in sequence, each one building on the last.

EXPERT: And here's a cool detail -- when you use code execution alongside the newer versions of web search and web fetch, Claude can actually run code to filter search results before they enter the context window. So instead of dumping twenty search results into context, it processes them programmatically and keeps only the relevant ones.

HOST: That's a token optimization thing?

EXPERT: Token optimization and accuracy. Less noise in the context means better answers.

HOST: Okay, I want to make sure we talk about MCP because I think this is where the ecosystem is heading. What's the deal with the MCP Connector?

EXPERT: So MCP -- Model Context Protocol -- is this open standard that Anthropic created for connecting AI to external systems. And the analogy they use is USB-C, which I think is actually perfect.

HOST: Because before USB-C you had like twelve different cables for every device.

EXPERT: Exactly! And before MCP, every tool integration was custom. You'd write bespoke code to connect Claude to your CRM, then different code for your calendar, different code for your database. MCP standardizes that. One protocol, any system.

HOST: So the MCP Connector lets you plug into MCP servers directly from the API?

EXPERT: Right. You add an mcp_servers configuration to your request pointing to a remote MCP server, and Claude handles the protocol negotiation, discovers what tools are available, and can invoke them. No separate MCP client needed.

HOST: That's... really clean. So someone builds an MCP server for, say, Google Calendar, and anyone using the Claude API can just connect to it?

EXPERT: That's the vision. And they've got these nice configuration patterns. You can enable all tools from a server, or do an allowlist where you disable everything by default and explicitly enable only the safe ones, or do a denylist where everything's enabled except the dangerous stuff like delete_all or drop_database.

HOST: I appreciate that the example dangerous tool is literally called drop_database.

EXPERT: I mean, if you're going to name it that, you're asking for trouble. But seriously, the security patterns here are important. You can connect to multiple MCP servers in a single request, each with their own access controls. And there's this defer_loading option that's clever.

HOST: What does that do?

EXPERT: So if an MCP server exposes, like, fifty tools, you don't want all fifty descriptions crammed into Claude's context. That eats tokens and confuses the model. With defer_loading, the tool descriptions aren't sent to the model initially. Claude uses a tool search mechanism to find relevant tools on demand.

HOST: Oh, that's smart. It's like... lazy loading for tools.

EXPERT: Exactly. Load them when you need them, not upfront.

HOST: So let me see if I can connect all of this together. You've got these layers. At the bottom, you have basic tool definitions -- the contract between your app and Claude. You've got tool choice to control when tools get used. Strict mode to guarantee the parameters are valid. Parallel execution to make it fast. Server-side tools for managed capabilities like search and code execution. And MCP to standardize how you connect to everything else.

EXPERT: And the thing I think people miss is that these all compose. You can have strict mode on your client tools, web search running as a server tool, an MCP connection to your internal systems, Claude making parallel calls across all of them, and tool choice set to auto so it picks intelligently. All in one request.

HOST: That's an agent right there. That's not a chatbot anymore.

EXPERT: That's an agent. And when you add the execution loop -- where your code keeps calling the API as long as Claude keeps requesting tools -- you get this autonomous system that can reason, act, observe, and repeat.

HOST: The thing that sticks with me is how much of the intelligence is in the plumbing. Like, the description quality, the error message quality, knowing when to use strict mode versus not, understanding which things can parallelize...

EXPERT: Right. The model is only as good as the tools you give it. And I'd push back slightly on the framing -- it's not really plumbing. It's interface design. You're designing the interface between an AI and the world. And just like a badly designed UI makes a powerful app unusable, badly designed tool definitions make a powerful model useless.

HOST: So what should someone do if they're just getting started with all this?

EXPERT: Start with one well-defined tool. Write a really detailed description -- three or four sentences minimum. Use strict mode from day one so you never have to deal with malformed parameters. Get the basic loop working where you execute the tool and send results back. And then expand from there.

HOST: Don't try to build the entire agentic system on day one.

EXPERT: Please don't. Get one tool working perfectly, then add the next one. And when you're ready for server-side tools, web search is the easiest on-ramp because Anthropic handles all the execution.

HOST: You know what I keep coming back to? That constrained decoding thing. The idea that the guarantees aren't coming from "we prompted it really hard" -- they're coming from actual mathematical constraints on the token generation process. That feels like a fundamentally different approach to reliability.

EXPERT: It is. And I think it points to where this whole field is going. The shift from "hope the model gets it right" to "make it structurally impossible to get it wrong." At least for the formatting layer. The content can still be wrong -- strict mode guarantees the JSON is valid, not that the values are accurate. But eliminating an entire class of errors at the generation level? That's huge.

HOST: Which means your retry logic gets simpler, your error handling gets simpler, and you can focus on the actual application logic instead of babysitting the model's output format.

EXPERT: And that's really what tool use is about at the end of the day. It's about letting the model do what it's good at -- reasoning, language understanding, deciding what to do -- while your application handles the actual doing. The model is the brain, the tools are the hands. And the better the interface between them, the more capable the whole system becomes.

HOST: The brain and the hands. I think that's going to stick with me. Because right now, we're in this moment where the brains are getting really good, and the hands -- the tool ecosystem -- are finally catching up. What happens when both sides are world-class?

EXPERT: That's the question, isn't it? When you have a model that can reason through complex multi-step plans, tools that can reliably execute any operation, MCP servers connecting to every system in an enterprise... I mean, that's when AI goes from being a copilot to being a colleague. And I don't think we're as far from that as people think.

HOST: Something to sit with. Especially if you're designing those tool descriptions right now -- you're literally shaping how capable these systems can be. No pressure.

EXPERT: No pressure at all.
