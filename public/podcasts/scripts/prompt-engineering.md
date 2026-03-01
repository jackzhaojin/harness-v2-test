HOST: Okay, so I tried something last night with Claude that completely blew my mind. I was asking it to analyze this massive earnings report, right? Like, 80 pages. And at first, it kept giving me these... weird, vague summaries that honestly felt made up.

EXPERT: Oh no, you got hallucinated.

HOST: Right, right. But then I restructured how I asked the question. Same document, different prompt structure—totally different results. Like, night and day. And that's when I realized... I have no idea what I'm actually doing when I write prompts.

EXPERT: Okay but here's the thing—most people don't. They treat prompts like Google searches. Type some words, hope for magic.

HOST: Guilty.

EXPERT: But prompts aren't searches. They're more like... programming? Except instead of writing Python, you're writing instructions in English. And English is way more ambiguous than Python.

HOST: So that's what prompt engineering is? Making English less ambiguous?

EXPERT: That's actually a pretty good way to put it. The whole field is about being precise with language models. Because here's what's wild—these models are incredibly capable, but they're also incredibly literal in weird ways.

HOST: What do you mean by that?

EXPERT: Okay, so, imagine I tell you, "Write a brief summary." What does "brief" mean to you?

HOST: I mean... a few sentences? Maybe a paragraph?

EXPERT: Right. But to a language model, "brief" could mean three sentences, or twelve sentences, or a bulleted list, or— you get the idea. It's subjective. So one of the fundamental principles of prompt engineering is to replace subjective terms with specific, measurable instructions.

HOST: So instead of "brief," I should say... what, "exactly three sentences"?

EXPERT: Exactly! Or "under 50 words" or "three bullet points, each under 20 words." Give it something concrete to aim for.

HOST: Huh. That's... that actually makes so much sense. Because I've definitely had the experience where I ask for a quick answer and get, like, an essay.

EXPERT: Oh yeah. And the flip side is also true—if you say "don't use bullet points," there's a decent chance it'll use bullet points anyway.

HOST: Wait, seriously?

EXPERT: Seriously. Negative instructions are notoriously unreliable with LLMs. The model performs way better when you tell it what to do, not what not to do.

HOST: So instead of "don't use jargon," I should say—

EXPERT: "Use simple language" or "explain this like you're talking to someone without a technical background." Positive framing.

HOST: Okay, this is already changing how I think about writing prompts. But you mentioned structure earlier. What does that actually look like?

EXPERT: So this is where it gets really interesting. Have you ever used XML tags in your prompts?

HOST: XML? Like... the markup language from, I don't know, 2003?

EXPERT: I know, I know, it sounds weirdly retro. But especially with Claude, XML tags are kind of a superpower. Claude was specifically trained to recognize XML as an organizational tool.

HOST: Okay, walk me through this. Why would I use XML tags in a prompt?

EXPERT: Think about a complex request where you're mixing multiple things—like, you've got instructions, you've got context, you've got examples, and you've got the actual input data. Without structure, the model has to guess which is which. "Is this sentence an instruction, or is it an example, or is it the thing I'm supposed to analyze?"

HOST: And XML tags make that explicit.

EXPERT: Exactly. You wrap your instructions in `<instructions>` tags, your examples in `<example>` tags, your context in `<context>` tags. Now there's zero ambiguity. The model knows exactly what each piece of the prompt is for.

HOST: So it's like... semantic boundaries?

EXPERT: Yes! That's a great way to think about it. You're creating clear boundaries so nothing gets conflated.

HOST: Okay, but—sorry, go back to that for a second—are there specific tag names I have to use? Like, is there a canonical list of "these are the magic tags"?

EXPERT: This is one of the gotchas, actually. There are no magic tags. What matters way more than the tag name is consistency.

HOST: Wait, really?

EXPERT: Really. You could use `<ctx>` or `<context>` or `<background>`—it doesn't matter, as long as you pick one and stick with it throughout your prompt. The model cares about the structure, not the specific vocabulary.

HOST: Huh. So it's not like HTML where `<div>` means something specific. It's more about creating consistent patterns.

EXPERT: Exactly. Although, I will say, descriptive tag names help you as the human reading and maintaining these prompts. `<context>` is clearer than `<ctx>` when you're debugging six months later.

HOST: Fair point. So let's say I'm using XML tags. How do I actually organize everything? Like, what's the... the architecture of a good prompt?

EXPERT: Okay, this is going to sound counterintuitive. If you've got a long document or a bunch of data—let's say 20,000 tokens or more—you put that at the top.

HOST: At the top? Not at the bottom after the instructions?

EXPERT: I know, it feels backwards. But there's research showing that when you put the documents first and the instructions last, you can get up to 30% better performance on complex tasks.

HOST: Wait, wait, wait—30%? That's huge. Why does that work?

EXPERT: It has to do with how transformer models process context. When the instructions come last, they're, like, fresh in the model's "mind" as it starts generating. The directive is the last thing it read before it has to perform the task.

HOST: That's actually kind of wild. So the order is: long documents at the top, then context, then role definition, and the actual directive last?

EXPERT: Yep. Think of it as: "Here's the stuff you need to know, here's who you are, now here's what I want you to do."

HOST: Okay but hold on. You mentioned role definition. Is that the "You are a helpful assistant" thing?

EXPERT: Sort of, but way more specific. Role prompting is when you assign the model a persona—like "You are a senior software engineer" or "You are a tax attorney speaking to a non-technical client."

HOST: And that actually changes how it responds?

EXPERT: It changes the tone and communication style, for sure. Whether it changes accuracy... that's complicated.

HOST: Uh oh. I feel like there's a "but" coming.

EXPERT: Okay, so here's the thing. Role prompting works great for creative writing, for matching a specific tone or style, for adjusting vocabulary to an audience. But if you're expecting it to make the model more accurate or more knowledgeable—

HOST: It doesn't?

EXPERT: Not really. Telling the model "You are a world-renowned expert" doesn't give it access to more information. It just changes how it presents the information it already has.

HOST: Huh. So it's more about communication style than factual improvement.

EXPERT: Exactly. And actually, there's some hilarious research on this. There was a study where they tested different personas on reasoning tasks, and sometimes the "You are an idiot" persona outperformed the "You are a genius" persona.

HOST: Get out of here. Seriously?

EXPERT: I'm serious. Which suggests that these role labels don't function the way you'd intuitively expect. It's not like the model is role-playing in a human sense. It's doing something weirder and more statistical.

HOST: So when should I use role prompting, and when should I skip it?

EXPERT: Use it when you need a specific tone or style. Skip it—or keep it minimal—when you're trying to maximize accuracy or reasoning. For those tasks, explicit behavioral instructions work better than vague roles.

HOST: What's an explicit behavioral instruction?

EXPERT: Instead of "You are a financial advisor," try "Analyze this portfolio focusing on risk tolerance and long-term growth potential. Flag any high-risk positions and explain why they're risky."

HOST: Oh, I see. You're telling it exactly what to do, not just who to pretend to be.

EXPERT: Right. Modern models—especially Claude 4, GPT-4, GPT-5—they're sophisticated enough that you often get better results by just saying what you want instead of assigning elaborate personas.

HOST: That's... actually kind of a relief. I always felt weird writing "You are a renowned expert in—"

EXPERT: Yeah, it can feel cringey. And the research backs up that feeling. Less can be more.

HOST: Okay, so we've covered structure, we've covered roles. What about examples? Like, when I give the model examples of what I want.

EXPERT: Oh, this is one of my favorite techniques. Few-shot prompting.

HOST: Few-shot. Meaning, like, a few examples?

EXPERT: Exactly. You give the model two to five examples of input-output pairs, and it learns the pattern from those examples and applies it to new inputs. No fine-tuning, no training—just in-context learning.

HOST: And that actually works?

EXPERT: It works shockingly well. Especially for things like output format, tone, or structure. If you want the model to respond in a very specific way, show it three examples of that exact format, and it'll nail it almost every time.

HOST: So it's like... teaching by demonstration.

EXPERT: Perfect analogy. And the key word there is "teaching." You want your examples to be, like, pedagogically sound. Diverse scenarios, edge cases, clear patterns.

HOST: What's an edge case in this context?

EXPERT: Let's say you're building a sentiment classifier. You'd include an obvious positive example, an obvious negative example, and then—this is the edge case—something ambiguous. Like, "Not what I expected, but actually better!"

HOST: Oh, because that starts negative but ends positive.

EXPERT: Exactly. If you only show the model clear-cut cases, it might stumble on the nuanced ones. But if you include a tricky example in your few-shot set, the model learns to handle that ambiguity.

HOST: How many examples should I give? Like, is there a sweet spot?

EXPERT: Three to five is the magic range for most tasks. Two or three if it's simple, five if it's complex. Beyond that, you hit diminishing returns pretty fast.

HOST: What happens if I give it, like, ten examples?

EXPERT: You're wasting tokens, and you might actually degrade performance. More examples means more noise, more chance of conflicting patterns, more opportunity for the model to latch onto superficial features instead of the actual pattern you want.

HOST: Wait, superficial features? What do you mean?

EXPERT: Okay, so let's say all your examples happen to be short sentences. The model might learn "ah, I should give short answers," even if the actual pattern you wanted was about sentiment or classification or something else entirely.

HOST: Oh no. So the examples can accidentally teach the wrong lesson.

EXPERT: Exactly. That's why diversity matters. Vary the length, the structure, the specific words—everything except the pattern you're trying to teach.

HOST: This is starting to feel like... there's a lot of ways to accidentally mess up a prompt.

EXPERT: Oh, there are. But here's the good news: there are also really reliable patterns you can fall back on.

HOST: Like what?

EXPERT: So one pattern that works great for document analysis is what I call "quote grounding." Before the model answers your question, you explicitly tell it to extract relevant quotes from the document first.

HOST: Why does that help?

EXPERT: Because it forces the model to anchor its reasoning in the actual source material. Instead of just generating a plausible-sounding answer, it has to find evidence first, then reason from that evidence.

HOST: Oh, that's smart. So it's like... showing your work in math class.

EXPERT: Perfect analogy. And it dramatically reduces hallucination, especially for high-stakes domains like legal analysis or medical records.

HOST: So the structure would be, like, "First extract quotes in these tags, then provide your analysis in these other tags"?

EXPERT: Exactly. You can use a `<quotes>` section and then an `<analysis>` section. Or `<thinking>` and `<answer>`. The specific tag names don't matter—what matters is the two-phase structure.

HOST: Okay, that's useful. But I want to go back to something you mentioned earlier about that earnings report I was analyzing. You said I restructured my prompt and got way better results. What specifically did I probably do wrong the first time?

EXPERT: Without seeing it, I'd guess you dumped the whole document in and then asked a vague question like "Summarize the key points."

HOST: ...That's exactly what I did.

EXPERT: Right. So the model has this massive blob of text with no structure, and an instruction that's completely subjective. "Key points" according to who? A CFO? An investor? A regulator? And "summarize" how? Three bullets? A paragraph? A full report?

HOST: Okay, okay, I see where this is going. So what should I have done?

EXPERT: Wrap the document in `<document>` tags. Maybe add a `<source>` tag with the filename. Then, in your instructions—which go after the document, remember—be super specific. "Extract the three most significant financial risks mentioned in this report. For each risk, provide: the risk description in one sentence, the page number where it's mentioned, and the potential financial impact if stated."

HOST: Oh, wow. That's, like, ten times more specific.

EXPERT: And you'd get results that are ten times more useful. Because now the model knows exactly what you're looking for, exactly how many items to return, and exactly what format to use.

HOST: What if the document is huge, though? Like, beyond what I can comfortably fit in one prompt?

EXPERT: Then you've got a few options. One is to chunk it into sections with clear labels—like `[Section 1 – Executive Summary]`, `[Section 2 – Financials]`. That way the model can navigate it more easily.

HOST: And I'd tell it to reference sections by name when it answers?

EXPERT: Exactly. "According to Section 2, the revenue grew by..." That kind of thing.

HOST: What if I have multiple documents?

EXPERT: Oh, then you definitely want XML structure. You'd use a nested hierarchy: `<documents>` as the outer wrapper, then individual `<document>` tags with index numbers and source metadata.

HOST: So each document would have, like, `<document index="1">` and then `<source>annual_report.pdf</source>` and then `<document_content>`?

EXPERT: You've got it. And when the model needs to attribute information, it can say "In document 2" or "According to annual_report.pdf" instead of making vague references.

HOST: This is making so much sense now. But I want to circle back to something. You mentioned JSON earlier in a different context. What about when I actually want the model to output JSON?

EXPERT: Ah, structured outputs. This is where things get really powerful.

HOST: Is that different from just asking the model to "respond in JSON"?

EXPERT: Very different. When you just ask for JSON, you get syntactically valid JSON most of the time, but the schema might be wrong. Fields might be missing, data types might be off, the structure might not match what you need.

HOST: Okay, so what's the better approach?

EXPERT: Structured outputs with schema enforcement. You define a JSON schema—like, exactly what fields you want, what types they should be, which ones are required—and the model is forced to follow that schema. It literally cannot generate invalid output.

HOST: Wait, it can't? How does that work?

EXPERT: It's called constrained decoding. At each token generation step, the system masks out any token that would violate the schema. So the model can only choose from valid continuations.

HOST: That's... okay, that's actually kind of brilliant.

EXPERT: It's game-changing for production systems. No more parsing errors, no more retry logic, no more "oh the model decided to add an extra field that breaks my code."

HOST: Is this available in all the APIs?

EXPERT: OpenAI has it, Claude has it, Cohere has it. The syntax is a little different between providers, but the concept is the same. You pass in a JSON schema, enable strict mode, and you get guaranteed compliance.

HOST: What are the limitations? Because this sounds almost too good to be true.

EXPERT: There are a few. First, not all JSON schema features are supported. No recursive schemas, no external references, and you typically can't use numerical constraints like minimum or maximum values.

HOST: Wait, I can't enforce that a number is between 0 and 100?

EXPERT: Not with the constrained decoding itself. You'd have to validate that in your application code after you get the response.

HOST: Okay, what else?

EXPERT: All fields usually have to be required. If you want optional fields, you have to use union types with null—like, the type would be `["string", "null"]` instead of just `"string"`.

HOST: That's a little awkward, but I can see why.

EXPERT: Yeah, and there's a performance consideration. The first time you use a schema, there's extra latency—like, 100 to 500 milliseconds—because the system has to compile the schema into a grammar. But then it gets cached for 24 hours.

HOST: So subsequent requests are fast?

EXPERT: Yep. Unless you change the schema, in which case you invalidate the cache and pay the compilation cost again.

HOST: Okay, so we've covered a lot of ground here. Structure, roles, examples, JSON outputs. Is there, like, a unifying principle tying all of this together?

EXPERT: I mean... yeah. The unifying principle is: be explicit.

HOST: Be explicit.

EXPERT: Don't hope the model will infer what you want. Don't rely on subjective terms. Don't assume it'll figure out the format or the tone or the level of detail. Just tell it. Directly. With structure, with examples, with measurable constraints.

HOST: So it's almost like... treat the model as incredibly capable but also incredibly literal?

EXPERT: That's a really good way to put it. It can do amazing things, but only if you give it clear, unambiguous instructions.

HOST: Okay, but there's got to be gotchas, right? Like, things that seem like they should work but don't?

EXPERT: Oh, so many. One of my favorites is the emphasis gotcha.

HOST: Emphasis?

EXPERT: Yeah, like, people think if they bold something or put it in all caps or use italics, the model will pay more attention to it.

HOST: And it doesn't?

EXPERT: Research shows it has surprisingly little effect. Structural guidance—like headings, numbered lists, XML tags—works way better than typographic emphasis.

HOST: Huh. So if I want to emphasize something, I should put it in its own section with a heading, not just bold it?

EXPERT: Exactly. Or repeat it. Or place it strategically at the end of the prompt where the model reads it right before generating.

HOST: What about the word "think"? I feel like I've heard that's special somehow.

EXPERT: Oh yeah. In some Claude models, using the word "think" can activate extended reasoning modes. Like, the model will go into this verbose, chain-of-thought style response.

HOST: And if I don't want that?

EXPERT: Use "consider" or "evaluate" instead. Or just restructure the sentence to avoid triggering that pattern.

HOST: That's such a weird specific thing.

EXPERT: Right? It's one of those quirks you only learn through experience or reading the gotchas documentation.

HOST: Are there other model-specific quirks like that?

EXPERT: Oh yeah. Claude loves XML tags—we've talked about that. GPT-4 tends to prefer markdown and numbered instruction lists. GPT-3.5 used to work better with JSON-formatted prompts, though that's less relevant now since everyone's on GPT-4 or newer.

HOST: So I have to tailor my prompting style to the specific model I'm using?

EXPERT: If you want optimal results, yeah. Although the good news is that the core principles—clarity, structure, specificity—those work across all models.

HOST: What's one gotcha that people run into all the time that's super avoidable?

EXPERT: Example-instruction mismatch.

HOST: What's that?

EXPERT: It's when your explicit instructions say one thing, but your examples demonstrate something else. Like, your instructions say "provide 3 to 5 bullet points," but all your examples show exactly 7 bullet points.

HOST: Oh no. And then the model picks up on the examples instead of the instructions?

EXPERT: Sometimes. Or it gets confused and does something inconsistent. The fix is simple: make sure your examples perfectly match your stated rules.

HOST: That seems like the kind of thing that's obvious in retrospect but easy to miss when you're writing the prompt.

EXPERT: Completely. That's why prompt engineering is weirdly iterative. You write a prompt, you test it, you see where it breaks, you refine.

HOST: Is there tooling for this? Like, frameworks or libraries that help you structure prompts correctly?

EXPERT: Yeah, there are a bunch now. DSPy is a big one—it treats prompts as programs and lets you optimize them systematically. There are also schema generators that take Pydantic models or Zod schemas and auto-generate the JSON schema definitions.

HOST: Wait, so I could define my data structure in Python using Pydantic, and it'll automatically create the JSON schema?

EXPERT: Exactly. And some SDKs even have helper methods like `client.messages.parse()` that validate the response against your Pydantic model automatically.

HOST: That's really nice. It means I'm not hand-writing JSON schemas.

EXPERT: Right. And you get type safety in your code for free. The response comes back as a typed object instead of a raw dictionary.

HOST: Okay, I want to go back to long contexts for a second, because you mentioned something earlier that I don't think we fully explored. You said there's this "lost in the middle" effect?

EXPERT: Oh yeah. So even though models like Claude can handle 200,000 tokens and GPT-4.1 can handle a million tokens, they don't treat all those tokens equally.

HOST: What do you mean?

EXPERT: Information at the beginning and the end of the context gets more attention than information in the middle. So if you bury something important deep in a long document, there's a real risk the model will overlook it.

HOST: That's... actually kind of alarming if you're relying on it to analyze long documents.

EXPERT: It is. That's why document structuring is so important. You put critical context near the top, and you put your instructions at the end. And for really long contexts, you might even repeat key instructions in both places—like a bookend pattern.

HOST: So you'd say the instruction once at the beginning and once at the end?

EXPERT: For critical tasks, yeah. "Remember, only use information from the provided documents" at the top, and then again at the bottom right before the model starts generating.

HOST: Does that actually help?

EXPERT: It does. Especially in prompts with 20,000+ tokens. The model's attention can drift in long contexts, so reminders help keep it on track.

HOST: What about if I'm building something like a Q&A system over a bunch of documents? Should I just throw everything into the prompt, or is there a smarter approach?

EXPERT: If you can fit everything in the context window comfortably, and it's well-structured, that can work. But often a better approach is retrieval-augmented generation—RAG.

HOST: Which is... retrieving relevant chunks first, then putting just those chunks in the prompt?

EXPERT: Exactly. You use embeddings or keyword search to find the most relevant passages, then you feed only those to the model. Saves tokens, reduces latency, and often improves accuracy because you're not diluting the context with irrelevant information.

HOST: So it's like a two-stage process. Retrieval, then generation.

EXPERT: Yep. And in the generation step, you'd still use all the techniques we've been talking about—XML tags, quote grounding, explicit instructions.

HOST: This is starting to feel like there are layers to this. Like, basic prompting, then structured prompting, then long-context prompting, then RAG systems...

EXPERT: Oh yeah, it's absolutely a progression. And then beyond that you've got agentic systems where the model is calling tools and making decisions and iterating.

HOST: Wait, tools? Like function calling?

EXPERT: Exactly. You define functions the model can call—like "search the web" or "query a database" or "book a flight"—and the model decides when to use them based on the conversation.

HOST: And structured outputs matter there too, right? Because the model has to provide the right arguments to the function?

EXPERT: Exactly. That's actually one of the primary use cases for strict mode. When `strict: true` is enabled on a tool, the model is guaranteed to provide correctly-typed arguments every single time.

HOST: So no more "oops, the model passed a string where I needed an integer"?

EXPERT: Nope. The schema enforcement prevents that at the token level. It's beautiful.

HOST: Okay, so let's say I'm building an agent that uses tools. What does the prompt structure look like?

EXPERT: You'd have your system prompt defining the agent's role and behavioral guidelines. Then you'd define your tools with strict schemas. And then the conversation flows—user message, model decides to use a tool, you execute the tool and return results, model processes results and responds to the user.

HOST: And each tool call is guaranteed to have valid parameters because of strict mode?

EXPERT: Exactly. No more retry logic, no more parsing errors. It just works.

HOST: That's... honestly kind of game-changing for building reliable systems.

EXPERT: It really is. Before structured outputs and strict mode, you'd spend so much time on error handling and validation. Now you can focus on the actual business logic.

HOST: So if I'm building something in production, I should basically always use structured outputs when I need predictable formats?

EXPERT: Pretty much, yeah. The only time you wouldn't is if you genuinely want freeform text—like a chatbot response or creative writing. But for data extraction, tool calling, classification, anything where format matters—always use structured outputs.

HOST: What's the cost? Like, are there downsides?

EXPERT: The main one is that first-request latency I mentioned. And there are some schema complexity limits—like, you can't have too many optional parameters or too many union types in a single schema.

HOST: How many is too many?

EXPERT: The documentation says around 20 strict tools per request, 24 optional parameters, and 16 union types. Those are pretty generous limits for most use cases.

HOST: Yeah, if I'm hitting 20 tools in a single agent, I probably have bigger design problems.

EXPERT: Exactly.

HOST: Okay, I want to wrap up with something practical. If someone's listening to this and they want to immediately improve their prompts today, what's the one thing they should do?

EXPERT: Add structure. Even if you don't do anything else—even if you don't use examples or roles or strict mode—just wrap your different prompt components in XML tags. `<instructions>` for instructions, `<context>` for context, `<input>` for the actual user data.

HOST: And that alone will make a difference?

EXPERT: Night and day difference. Especially if you're working with complex prompts that mix multiple types of content.

HOST: What's the second thing?

EXPERT: Be specific about output format. Not "summarize this," but "summarize this in exactly three bullet points, each under 20 words, focusing on financial risks."

HOST: Quantify everything.

EXPERT: Exactly. Replace subjective terms with measurable constraints.

HOST: And the third thing?

EXPERT: Put long documents first, instructions last. If you're working with substantial context, that ordering can genuinely improve performance by double-digit percentages.

HOST: Those are all really actionable. I feel like I could go implement those right now.

EXPERT: You should. And then once you've got those down, start experimenting with few-shot examples. That's when things get really fun.

HOST: Because you're teaching by demonstration instead of just giving instructions?

EXPERT: Right. And you start to see patterns in what works and what doesn't. Like, you'll discover that three diverse examples outperform five redundant ones. Or that including edge cases in your examples makes the model way more robust.

HOST: This has been... honestly, this has completely reframed how I think about working with AI.

EXPERT: That's the thing about prompt engineering—it sounds like this niche technical skill, but it's really about understanding how to communicate clearly with a very capable but very literal system.

HOST: And the better you get at it, the more you can unlock from these models.

EXPERT: Exactly. Same model, same API, but wildly different results depending on how you structure your prompts.

HOST: So the technology is powerful, but the interface—the prompt—is where the magic happens.

EXPERT: Couldn't have said it better myself.
