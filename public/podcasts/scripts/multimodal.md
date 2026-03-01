HOST: Okay, so I have to tell you about this thing that happened to me yesterday. I'm building this app, right? And I need to extract invoice data. So I'm thinking, great, I'll use some OCR library, parse the text, write regex patterns for all the fields—

EXPERT: Oh no.

HOST: Yeah. And then I remember — wait, Claude can just... look at the image.

EXPERT: Just look at it.

HOST: Like a human would! I send it the invoice as an image, tell it what I want, and it gives me back perfect JSON. No regex. No field mapping. It just... understood.

EXPERT: See, this is what gets me excited about multimodal capabilities. Because most people think of it as "oh cool, the AI can see pictures now." But that's not the interesting part.

HOST: Right, right, what's the interesting part?

EXPERT: The interesting part is that it doesn't just see — it *reasons* about what it sees. There's a huge difference between "describe this image" and "understand this chart in the context of quarterly earnings and tell me what's concerning."

HOST: Okay, break that down for me. What's actually happening when I send Claude an image?

EXPERT: So when you pass an image to Claude through the API, you're adding it as a content block in your message. Think of it like... you know how you can send someone a text message with a photo attached? It's basically that structure. The message has multiple parts — some text, some images, all together in one conversation.

HOST: And it can handle any image format?

EXPERT: Well, the main ones. JPEG, PNG, GIF, WebP. You can send them three different ways, which is actually pretty clever. You can base64 encode the image and send it directly in the request—

HOST: Okay, hold on. For people who don't live in API-land, what's base64 encoding?

EXPERT: Fair point. So base64 is just a way to represent binary data — like an image file — as text. Because APIs basically speak in text, right? You can't just throw raw image bytes at them. So you convert the image to this text representation, send it along, and Claude decodes it back into the actual image.

HOST: Got it. That's one way. What are the other two?

EXPERT: You can just give it a URL. If your image is already hosted somewhere, you just point Claude to it. "Hey, go look at this URL." Super simple.

HOST: That's way easier.

EXPERT: It is! But here's the third method, and this is the one that gets interesting for production apps. There's this thing called the Files API. You upload the image once, get back a file ID, and then you can reference that ID in multiple requests without re-uploading the image every time.

HOST: Oh, that's smart. So if I'm processing, like, a hundred invoices that all use the same template logo or something—

EXPERT: Exactly. Or if you want to ask multiple questions about the same document. Upload once, query many times. Way more efficient.

HOST: Okay, so I can send Claude an image. Now what can it actually *do* with it? Because you said reasoning, not just describing.

EXPERT: Right. So here's where it gets fun. Let's say you send it a chart — revenue over time, whatever. You could ask it to describe the chart, and it'll tell you "this is a line graph with X and Y axes showing revenue from 2020 to 2024." Boring. Useless.

HOST: Yeah, I could see that myself.

EXPERT: Exactly! But if you ask it "what trend does this chart reveal" or "identify the anomaly in Q3" — now it's reasoning. It's not just reporting what it sees, it's interpreting it. It understands what a trend is. It knows that revenue dropping 40% in one quarter is probably worth noting.

HOST: That's... okay, that's actually kind of wild when you think about it.

EXPERT: It is! And it gets better. You can send it multiple images in one request. So you can say "here's our chart from last quarter, here's this quarter, tell me what changed."

HOST: Wait, how many images can you send?

EXPERT: Up to 100 images per request through the API.

HOST: Get out of here. A hundred?

EXPERT: Yeah. Now, there are some constraints — each image can be up to 8000 by 8000 pixels if you're sending just a few. But if you're sending more than 20 images, the limit drops to 2000 by 2000 per image. And there's a total request size limit of 32 megabytes.

HOST: Okay, so I can't just send a hundred giant screenshots.

EXPERT: Right. But here's the thing most people don't think about — images have a token cost.

HOST: Wait, what? I thought tokens were just for text.

EXPERT: Nope! Images consume tokens too. And the formula is actually pretty straightforward. It's width times height divided by 750.

HOST: So a 1000 by 1000 image is...

EXPERT: About 1,333 tokens. Which, if you're used to text where 1,000 tokens is like 750 words — that's a lot.

HOST: That adds up fast.

EXPERT: It does. So there's this recommendation in the docs that I think is actually pretty smart. Resize your images to around 1.15 megapixels before you send them. That's about 1,568 pixels on the longest edge. You get basically the same quality for analysis, but way fewer tokens.

HOST: So don't just blindly send your 4K screenshots.

EXPERT: Exactly. Be strategic about it.

HOST: Okay, I want to go back to something you mentioned earlier. You said Claude can give you structured JSON output from an image. How does that work? Because that seems like magic.

EXPERT: Okay, this is one of my favorite features. So normally when you ask Claude to extract data, it'll give you a text response, right? Maybe formatted nicely, but it's still just text. You'd have to parse it, hope the format is consistent, deal with edge cases...

HOST: Yeah, classic AI output problem.

EXPERT: Right. But Claude has this feature where you can define a tool — basically a schema that says "here are the exact fields I want, here are their types, here's what's required." And then Claude uses what's called constrained decoding to guarantee that the output matches that schema.

HOST: Wait, guarantee? Like, it won't hallucinate extra fields or mess up the format?

EXPERT: That's the idea. You define an input schema for a tool, and Claude will call that tool with valid JSON that conforms to your schema. So for your invoice example, you'd define a tool called "extract_invoice_data" with fields for vendor name, invoice number, date, total amount, line items...

HOST: And line items would be an array of objects with their own schema?

EXPERT: Yep. Description, quantity, unit price. You specify all of it upfront. Then you send the invoice image and say "extract all the invoice information." Claude analyzes the image and calls your tool with properly structured JSON.

HOST: That's so much cleaner than trying to parse free-form text.

EXPERT: It's a game changer for document processing pipelines. Invoices, forms, receipts, contracts — anything where you need structured data out of an unstructured visual document.

HOST: Okay, but I have to imagine there are limits. Like, things Claude just can't do with images.

EXPERT: Oh, absolutely. And some of them are... surprising.

HOST: Hit me with the weird ones.

EXPERT: Okay, so Claude cannot identify people. Like, you can't send it a photo and ask "who is this person?"

HOST: Is that a technical limitation or a policy thing?

EXPERT: Policy. They're very clear about that. Privacy, safety, all that. Makes sense, but it's good to know upfront.

HOST: What else?

EXPERT: Spatial reasoning is rough. Don't ask it to read an analog clock face. Don't ask it to tell you the exact position of chess pieces on a board. It struggles with precise localization.

HOST: Really? I would've thought—

EXPERT: I know, right? It can analyze a chess game if you describe the position, but looking at a photo of a board and telling you "the knight is on E4"? Not great.

HOST: Huh.

EXPERT: And counting. If you show it a photo of, like, a jar of marbles and ask "how many marbles?" the answer is an estimate at best.

HOST: So no inventory counting.

EXPERT: Not reliably. Especially with small objects. The docs actually call it out — "approximate counting."

HOST: What about image quality? Does that matter?

EXPERT: Huge. If any edge of your image is under 200 pixels, or if it's blurry or rotated weirdly, accuracy tanks. You've got to pre-process your images. Make sure they're clear, properly oriented, decent resolution.

HOST: Okay, so here's something I've been wondering. PDFs. Can Claude handle PDFs?

EXPERT: Oh, this is where it gets really interesting.

HOST: I'm listening.

EXPERT: So PDFs are this whole other content block type in the API. You send them the same way — URL, base64, or Files API. But here's the thing: when Claude processes a PDF, it's doing two things simultaneously.

HOST: Okay...

EXPERT: It converts each page into an image *and* it extracts the text. So it can understand the text content and the visual elements — charts, diagrams, tables, whatever — at the same time.

HOST: Wait, so it's running both text extraction and image analysis on every page?

EXPERT: Yep.

HOST: That must cost a fortune in tokens.

EXPERT: That's the gotcha. Each page costs you text tokens — usually 1,500 to 3,000 depending on content density — *plus* image tokens because each page is rendered as an image.

HOST: Oh, wow. So a three-page PDF could be like—

EXPERT: Seven thousand tokens, yeah. Versus maybe a thousand if it was text-only extraction.

HOST: But you get the visual understanding.

EXPERT: Exactly. Which is huge for things like financial reports where the charts matter just as much as the text. Or legal documents with tables and diagrams.

HOST: How many pages can you send at once?

EXPERT: A hundred. Hard limit. And the total request size is still 32 megabytes. If you have a bigger document, you've got to chunk it.

HOST: Are there any weird platform differences? Like, does this work the same everywhere?

EXPERT: Okay, so this is annoying. If you're using Claude through Amazon Bedrock — which some enterprises do — there's this bizarre constraint.

HOST: Uh oh.

EXPERT: If you want Claude to actually analyze the visual elements of a PDF — like the charts and images — you have to enable citations.

HOST: Wait, what? Why?

EXPERT: I have no idea. It's just how Bedrock's Converse API works. Without citations enabled, it falls back to basic text extraction only. It just... ignores the visual stuff.

HOST: That seems like a really random requirement.

EXPERT: Right? And it only applies to Bedrock's Converse API. If you use the InvokeModel API you can get visual analysis without citations. Or just use the direct Claude API and it's not an issue at all.

HOST: Man, that would be confusing to debug. You think your PDF analysis is working, but it's just silently skipping all the charts.

EXPERT: Yep. And you wouldn't necessarily notice right away if the text extraction was giving you useful stuff.

HOST: Okay, so let's talk practical stuff. If I'm building a real production app that processes documents — invoices, contracts, whatever — what's the actual workflow?

EXPERT: Alright, here's what I'd recommend. First, use the Files API.

HOST: Upload once, use many times.

EXPERT: Exactly. Upload your documents, get file IDs. Then enable prompt caching on the document blocks.

HOST: What's prompt caching?

EXPERT: It's this feature where Claude caches parts of your request so that if you send the same document again with a different question, it doesn't have to reprocess the whole thing. Way faster, way cheaper.

HOST: Oh, that's smart. So I upload an invoice, cache it, and then I can ask multiple questions without paying the full cost each time?

EXPERT: Yep. "What's the total?" "Who's the vendor?" "What's the date?" Each follow-up query is much cheaper and faster because the document is cached.

HOST: And you said there's a batch API for high-volume stuff?

EXPERT: Yeah, Message Batches API. If you're processing hundreds or thousands of documents, you can submit them as a batch and Claude will work through them asynchronously. Good for overnight processing, bulk data extraction, that kind of thing.

HOST: What about when you have multiple documents? Like, comparing two versions of a contract?

EXPERT: Just include multiple document blocks in one request. "Here's version one, here's version two, tell me what changed."

HOST: And it can reason across both of them?

EXPERT: Yep. It treats the whole message context as one unified thing. So it can compare, contrast, identify differences, all of that.

HOST: That's really cool for legal review, contract analysis...

EXPERT: Financial reports too. "Here's Q3, here's Q4, what trends are emerging?" Or A/B testing. "Here's design A, here's design B, which one has better visual hierarchy?"

HOST: Okay, I want to make sure I'm understanding the image ordering thing. You mentioned earlier that image placement matters?

EXPERT: Right, so the docs say Claude performs best when images come *before* the text prompt in the content array.

HOST: Why does that matter?

EXPERT: I'm not entirely sure of the internal reasoning, but I think it's about context flow. Like, the model processes the image first, builds up its understanding of the visual content, and then the text prompt tells it what to do with that understanding.

HOST: Versus showing it the question first and then the image?

EXPERT: Yeah. It still works if you do text-then-image, but image-then-text is the recommended pattern.

HOST: Good to know. Okay, what are some gotchas we haven't covered? Because there are always gotchas.

EXPERT: Oh, man. Okay, here's one that surprised me. Claude doesn't have access to image metadata.

HOST: Like EXIF data? GPS coordinates, camera info, that stuff?

EXPERT: None of it. It only sees the visual content. So if you need to know when a photo was taken or what camera was used, that metadata isn't available to Claude.

HOST: What about AI-generated images? Can it tell if an image is synthetic?

EXPERT: Nope. The docs explicitly say not to use it for that. It can't reliably detect AI-generated images.

HOST: Really? I would've thought with all the training data it has—

EXPERT: Yeah, but think about how good image generation has gotten. The artifacts that used to give it away — weird fingers, text that doesn't make sense — those are disappearing. It's just too hard to distinguish now.

HOST: Fair point. What about medical images? Because I imagine people are going to try to use this for healthcare stuff.

EXPERT: So, Claude can analyze general medical images. Like, you can show it a photo of a rash or whatever. But it's not designed for diagnostic imaging — CTs, MRIs, X-rays. And the docs are very clear: do not substitute Claude's output for professional medical diagnosis.

HOST: That seems like an important disclaimer.

EXPERT: Yeah. This is a tool to assist, not replace, medical professionals. You can use it for things like extracting text from medical documents or helping organize patient data, but not for actual diagnosis.

HOST: Makes sense. What else?

EXPERT: Base64 formatting. This one trips people up. When you're sending base64-encoded images, you send just the raw base64 string. You don't include the data URL prefix.

HOST: The "data:image/png;base64," part?

EXPERT: Right. Just the encoded string. If you include that prefix, it won't work.

HOST: That's an easy mistake to make if you're used to data URLs in web development.

EXPERT: Super common error.

HOST: Okay, so we've talked about images, we've talked about PDFs. Is there anything else in the multimodal world that we're missing?

EXPERT: Well, the Files API has some interesting nuances. It's still in beta—

HOST: Which means?

EXPERT: It requires a specific header — `anthropic-beta: files-api-2025-04-14` — to use it. And it's not covered by Zero Data Retention arrangements yet.

HOST: So if you're in a compliance-heavy industry...

EXPERT: You might need to stick with base64 or URL methods for now. At least until it comes out of beta.

HOST: And the Files API isn't available on Bedrock or Vertex?

EXPERT: Nope, just direct API access for now.

HOST: Got it. What about storage limits?

EXPERT: Individual files can be up to 500 megabytes. And each organization gets 100 gigabytes of total storage.

HOST: That's pretty generous.

EXPERT: It is. But here's a weird one — you can't download files that you uploaded.

HOST: Wait, what?

EXPERT: You can only download files that were created by skills or the code execution tool. If you upload a PDF, you can reference it in requests, but you can't download it back.

HOST: That's... bizarre. Why would they do that?

EXPERT: I assume it's to prevent people from using it as file storage? Like, it's not Dropbox. It's meant for processing, not archiving.

HOST: Okay, but if I uploaded it, I already have it.

EXPERT: Right, so it's not really a limitation in practice. Just a weird design choice.

HOST: Fair enough. Alright, let's talk best practices. If someone's listening to this and thinking "I want to build something with Claude's vision capabilities," what do you tell them?

EXPERT: First thing — be intentional about image size. Don't send giant images unless you need that resolution. Resize to around 1.15 megapixels. Saves tokens, saves money, barely any quality loss for most analysis tasks.

HOST: Preprocess your images.

EXPERT: Exactly. Make sure they're clear, properly oriented, good contrast. Especially if you're doing OCR-style extraction. Garbage in, garbage out.

HOST: What about prompting? Does that matter more with images than with text?

EXPERT: Yeah, actually. Be specific about what you want. Don't just say "analyze this image." Say "extract the key data points from this chart and identify any anomalies." Or "read all the text from this document and preserve the layout structure."

HOST: Give it a clear task.

EXPERT: Right. And if you're working with complex documents, consider a multi-turn approach. First request: "Give me an overview of this financial report." Second request: "Now dig into the Q4 revenue section." Let it build context progressively.

HOST: Oh, that's smart. So you're not asking it to do everything at once.

EXPERT: Exactly. Especially with long documents. Break it into stages.

HOST: What about structured output? When should I use the tool-based approach versus just asking for JSON in the prompt?

EXPERT: If you need guaranteed schema compliance — like you're feeding this data into a database and it has to match exact field types — use tools with input schemas. That constrained decoding is worth it.

HOST: And if I just need loosely structured data?

EXPERT: You can probably get away with prompting for JSON format. It's less setup, and Claude is pretty good at following format instructions. But if you need to be absolutely sure, tools are the way to go.

HOST: Got it. Anything else?

EXPERT: Caching. Use it. Especially if you're asking multiple questions about the same document or processing similar documents repeatedly. The cost savings add up fast.

HOST: And that's just adding the cache control parameter?

EXPERT: Yep. `cache_control: {"type": "ephemeral"}` on your document block. Dead simple, huge impact.

HOST: Okay, so here's my big question. Where is this all going? Like, what's next for multimodal AI?

EXPERT: That's the question, right? I think we're going to see a few things. One, the quality is going to keep improving. Claude already does pretty well with charts and diagrams, but spatial reasoning, counting, fine-grained detail — that stuff will get better.

HOST: What else?

EXPERT: I think we'll see more modalities. Right now it's text and images. But video is the obvious next step. Imagine sending Claude a screen recording and asking it to identify where a bug happens. Or analyzing security camera footage.

HOST: Oh, that's interesting.

EXPERT: Audio too. Not just transcription, but understanding. "Listen to this customer service call and identify where the conversation went wrong."

HOST: Multimodal becomes... all-modal?

EXPERT: Eventually, yeah. The goal is AI that can work with information the way humans do — reading, looking, listening, all at once.

HOST: And reasoning across all of it simultaneously.

EXPERT: Exactly. That's where it gets really powerful. Not just "what's in this image" but "here's a video, a transcript, and a spreadsheet — tell me what happened and why."

HOST: Okay, but here's what I keep coming back to. We started this conversation with me talking about invoice processing. And the thing that struck me was how... easy it was. Like, I didn't have to do anything special. I just sent an image and asked for what I wanted.

EXPERT: Right.

HOST: And that feels like a big shift. Because I've been building software for a while, and there's always this huge gap between "what I want to happen" and "what I have to do to make it happen."

EXPERT: The impedance mismatch.

HOST: Exactly! And this... this just closes that gap. I described what I wanted in plain language, and it happened.

EXPERT: That's the thing people underestimate about multimodal AI. It's not just adding a feature — "oh cool, now it can see pictures." It's fundamentally changing the interface between humans and computers.

HOST: Because you're not programming anymore. You're just... communicating.

EXPERT: Right. And that opens up who can build things. You don't need to know how to write regex patterns for invoice parsing. You don't need to understand OCR libraries or field extraction algorithms. You just need to be able to describe what you want.

HOST: That's kind of profound.

EXPERT: It is. And I think we're still figuring out what that means. Like, what problems become solvable when the barrier to solution drops that low?

HOST: What kind of stuff becomes possible that wasn't before?

EXPERT: Exactly. I mean, think about document processing. That used to be this whole specialized field. You'd hire consultants, buy enterprise software, train models on your specific document types...

HOST: Now you just send the image to Claude.

EXPERT: Pretty much. And that's just one use case. There are probably dozens of things that are suddenly trivial that used to be hard problems.

HOST: So what should people be building?

EXPERT: I think the interesting stuff is going to be in combining these capabilities with domain knowledge. Like, don't just use Claude to extract invoice data. Use it to extract invoice data *and* flag anomalies based on your company's spending patterns. Or compare contract language across hundreds of agreements to find inconsistencies.

HOST: Using the multimodal capabilities as building blocks for something bigger.

EXPERT: Right. The vision stuff is powerful, but it's most powerful when you combine it with context, memory, reasoning, all the other things Claude can do.

HOST: Okay, last question. If someone's listening to this and they want to try this out tonight, what's the fastest way to get started?

EXPERT: Honestly? Grab the Python SDK, grab an image, write five lines of code. Send a base64-encoded image with a text prompt. See what happens.

HOST: That's it?

EXPERT: That's it. You can literally be up and running in five minutes. And then once you see how it works, you can get fancy with the Files API, caching, structured outputs, all that. But the core concept is dead simple.

HOST: Send image, get insight.

EXPERT: Exactly. And then you start thinking about what problems you can solve with that. And that's where it gets fun.

HOST: Alright, I'm sold. I'm going to go process some documents.

EXPERT: Let me know how it goes.

HOST: Will do. This was great.

EXPERT: Yeah, this was fun.
