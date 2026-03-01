HOST: Okay so imagine this. You're an accountant. It's tax season. And your desk — your actual physical desk — is buried under like three hundred invoices from different vendors, all in different formats. Some are PDFs, some are photos somebody took with their phone at a weird angle, some are scanned copies that look like they went through a fax machine in 1997.

EXPERT: Oh, I've seen those. The ones where you're like, "Is that a seven or a one?"

HOST: Exactly! And your job is to get all of that into a spreadsheet by Friday. Now, what if I told you that you could basically throw all of that at an API and get back clean, structured JSON?

EXPERT: I mean, that's... that's essentially what multimodal capabilities let you do now. And it's not just "here's some text I extracted." It's actually understanding what it's looking at.

HOST: Right, and that distinction is huge. So let's get into it because there's a lot here that I think surprises people. Let's start with the basics — how does image processing actually work in the API?

EXPERT: So, okay, the fundamental thing to understand is that images go into the Messages API as content blocks. You're building a message, and instead of just having text, you can include image blocks alongside your text. And Claude processes the whole thing together — the visual and the textual — as one unified input.

HOST: So it's not like you send an image to one endpoint and text to another and then mash the results together.

EXPERT: No, no, no. It's all in one request. And this is what makes it powerful — Claude doesn't just describe what it sees in isolation. It reasons about the image in the context of whatever you asked. So if you show it a sales chart and say "what should I be worried about," it's not going to list every data point. It's going to tell you about the downward trend in Q3.

HOST: Interpretation over description. That's a really important distinction.

EXPERT: That's the phrase. And it applies to basically everything — charts, screenshots, documents, UI mockups. You're asking for understanding, not just recognition.

HOST: Now here's something I want to make sure people catch early because I think it trips people up. Claude can understand images but it cannot generate them. Right?

EXPERT: Correct. This is an image understanding model. It can analyze, it can extract, it can interpret. But if you ask it to create an image or edit a photo or, I don't know, add a watermark to something — that's not what this does. It's a one-way street. Images come in, insights come out.

HOST: Got it. So let's talk about the practical mechanics. How do you actually get an image into the API?

EXPERT: Three ways. And this is worth going through because each one has a different sweet spot. First, base64 encoding — you read the image file, encode it, and embed it directly in your request. Second, URL reference — you just point to a publicly accessible image URL and the API fetches it. And third, the Files API, where you upload once and get back a file ID you can reuse.

HOST: Oh, that third one is interesting. So you're saying if I have an image I want to ask multiple questions about, I don't have to keep re-uploading it?

EXPERT: Exactly. Upload it once, get your file ID, and then reference it in as many requests as you want. It's a beta feature still, but it's really useful for workflows where you're doing iterative analysis on the same document.

HOST: Okay so what formats are we talking about? Like, can I throw a TIFF at it or...

EXPERT: JPEG, PNG, GIF, and WebP. Those are your four. And there are some limits people should know. You can send up to a hundred images in a single request through the API — though on claude.ai directly it's twenty. And individual images can be up to eight thousand by eight thousand pixels.

HOST: Wait — a hundred images in one request?

EXPERT: Yeah, but here's the catch. If you go over twenty images, each one is capped at two thousand by two thousand pixels. So there's a tradeoff.

HOST: Huh. That's... actually kind of a smart constraint. Like, you can do breadth or you can do depth, but there's a ceiling on both.

EXPERT: Right. And honestly, for most use cases you don't need anywhere near those limits. But it's good to know they exist.

HOST: Now, here's something I think is going to matter a lot to people building production systems. Token costs. Because images aren't free, right?

EXPERT: Oh no, they are definitely not free. So the formula is pretty straightforward — width times height divided by seven fifty. That gives you your token count. So a roughly thousand-by-thousand pixel image? That's about thirteen hundred tokens.

HOST: Okay so that adds up fast if you're doing batch processing.

EXPERT: It adds up really fast. And this is where the recommendation to resize your images before upload becomes critical. The sweet spot is about 1.15 megapixels — so max of fifteen sixty-eight pixels on the longest edge. Beyond that, you're paying more tokens without getting meaningfully better analysis.

HOST: So you're saying the model doesn't actually need an eight-thousand-pixel image to understand what's in it.

EXPERT: Not usually, no. You're just burning tokens on extra resolution that the model can't really leverage. Resize down, save money, and you often get the same quality of understanding. Let the API handle additional resizing only when you can't do it yourself.

HOST: Smart. Okay, I want to talk about something you mentioned earlier because I think this is where it gets really exciting. Structured data extraction. You said you can get JSON back from an image?

EXPERT: Yes! Okay, this is the part I've been dying to get into. So you can combine vision with tool use — and when I say tool use, I mean you define a function with a specific schema, right? Like, "here's an invoice, and I want back the vendor name, invoice number, date, line items, and total amount." You define that as a tool with a JSON schema.

HOST: And Claude fills in the schema by looking at the image.

EXPERT: Exactly. And because it's using constrained decoding on the tool call, you're guaranteed to get valid JSON that matches your schema. Not "here's some JSON that I hope is right" — actually schema-compliant output.

HOST: That's... okay, that's actually kind of wild. So going back to our accountant with the pile of invoices — they could set up a tool schema for invoice data, feed in photos of each invoice, and get back a perfectly structured dataset.

EXPERT: That's literally the use case. And it works for receipts, contracts, forms — anything where you need to go from unstructured visual content to structured data. The trick is getting your schema right. You want to be specific about formats — like telling it to give you dates in YYYY-MM-DD format.

HOST: Now there's a gotcha here, right? With the structured outputs?

EXPERT: Yeah, a couple. If you're using JSON schema constraints, you have to set additional properties to false. And citations don't work with structured outputs. So you can't do both at the same time.

HOST: Oh! That's one of those things that would bite you at two AM if you didn't know about it.

EXPERT: One hundred percent. You'd be staring at error messages wondering why your perfectly good schema isn't working.

HOST: Okay so let's talk about ordering. Because you mentioned something earlier about image-first ordering and I want to make sure we don't skip over that.

EXPERT: Right, so this is a best practice thing. When you're constructing your content array — your list of content blocks — put the images before the text prompt. Claude performs better when it sees the visual content first and then gets the instruction about what to do with it.

HOST: That's interesting. Like, "here's what you're looking at, and now here's what I want you to do with it."

EXPERT: Exactly that order. It still works if you put text first, but the results tend to be better with images first. And when you're working with multiple images, label them. Like, literally put a text block that says "Image 1:" before the first image and "Image 2:" before the second.

HOST: So the model knows which one you're referring to when you say "compare these."

EXPERT: Right. Otherwise you might get ambiguous references. "The first image" could mean different things depending on how the model interprets the input order.

HOST: Makes sense. Okay, now I want to pivot to something because I think this is where multimodal gets even more powerful. PDFs.

EXPERT: Oh, PDFs are a whole thing. And they're fascinating because of how Claude handles them differently from plain images.

HOST: How so?

EXPERT: So when you submit a PDF, Claude does something really clever — it processes each page in two ways simultaneously. It converts every page to an image, so it can see charts and diagrams and visual layouts. But it also extracts the text directly. So you get this dual-mode processing where the model understands both what is written and what is visually represented.

HOST: Wait, wait, wait. So it's not just doing OCR on a picture of the page? It's actually pulling the text layer AND looking at the visual rendering?

EXPERT: Both at the same time. And this matters hugely because think about a financial report. You've got paragraphs of text explaining the company's performance, but then you've got embedded bar charts, pie graphs, tables with specific numbers. A text-only approach misses all the visual stuff. An image-only approach might struggle with dense paragraphs. The dual-mode approach catches everything.

HOST: That's... honestly, that's really elegant. I mean, think about how much business data lives in PDFs. Like, what percentage of business documents are PDFs?

EXPERT: It's kind of terrifying if you think about it. The entire world runs on PDFs that are kind of terrible as a data format but absolutely everywhere.

HOST: Right! They're this weird hybrid where sometimes the text is selectable and sometimes it's just a picture of text and sometimes it's both and you never quite know what you're going to get.

EXPERT: And that's exactly why the dual-mode approach makes sense. Claude doesn't have to guess. It gets the text layer if it's there, and it gets the visual rendering regardless.

HOST: So how do you actually send a PDF to the API? Is it similar to images?

EXPERT: Very similar structure, but you use a document content block instead of an image content block. Set the type to "document," and then the source can be a URL, base64, or a file ID from the Files API — same three options as images.

HOST: And the Files API works the same way? Upload once, reuse the file ID?

EXPERT: Same concept, yeah. And this is where it really shines for PDFs because the Files API lets you upload files up to five hundred megabytes. So for big documents, you upload once and then you can ask it question after question without re-uploading a massive file each time.

HOST: Five hundred megs? That's... that's a big PDF.

EXPERT: It's a big PDF. Your org gets up to a hundred gigs of storage total. But here's the important nuance — the per-request limit is still thirty-two megabytes and a hundred pages max.

HOST: Oh! So you could have a five-hundred-meg PDF sitting in the Files API, but you can only process a hundred pages at a time?

EXPERT: Right. So for longer documents, you'd need to split them into chunks. And that's actually a pattern people run into pretty commonly — take your two-hundred-page document, break it into two-page batches, process each batch.

HOST: Okay, let's talk about the elephant in the room. Token costs for PDFs. Because you said each page gets the dual treatment — text AND image. So I'm guessing...

EXPERT: Yeah, it's higher than people expect. So text extraction is typically fifteen hundred to three thousand tokens per page, depending on how dense the content is. But then on top of that, you're also paying image tokens because each page is rendered as an image. So a three-page PDF might use around seven thousand tokens total.

HOST: Compared to what, like a thousand tokens if you were just doing text extraction?

EXPERT: About that, yeah. So you're paying roughly seven times more for the visual understanding. Which is worth it if you need to interpret charts and diagrams, but if your PDF is pure text? You might want to just extract the text yourself and send it as a text prompt.

HOST: That's a really practical tip. Know your document before you decide how to process it.

EXPERT: Exactly. And this is where prompt caching comes in too. If you're going to ask multiple questions about the same PDF, you can add a cache control block — set it to ephemeral — and the document gets cached. So you pay the full token cost once, and subsequent queries against that same document are much cheaper and faster.

HOST: Oh, that's huge for the use case we talked about earlier. Like, first pass: "give me an overview of this financial report." Second pass: "what were the Q4 revenue figures?" Third pass: "compare year-over-year growth." Same document, three different angles.

EXPERT: And you're not re-processing the whole PDF each time. The caching handles that.

HOST: Okay, I want to circle back to something because there are some really important gotchas with PDFs that I think people need to know about.

EXPERT: Oh yeah, there are some doozies.

HOST: The Bedrock one. Tell me about the Bedrock one.

EXPERT: Okay so this is... this is one of those things where if you don't know it, you will lose hours debugging. On Amazon Bedrock, if you're using the Converse API to process PDFs, visual understanding — charts, images, diagrams in the PDF — only works if you enable citations.

HOST: Sorry, go back to that for a second. You're saying the ability to see what's in the PDF is gated behind a completely unrelated-sounding feature?

EXPERT: That's exactly what I'm saying. If you don't turn on citations, you get text extraction only. All the visual stuff just... doesn't happen. You'll get answers, but they'll be based only on the text layer. So if someone asks about a chart that's in the PDF, it'll basically not see it.

HOST: That's... okay, that would be incredibly confusing to debug. "Why is it ignoring my charts?" "Oh, you need to enable citations."

EXPERT: Right? And the workaround is to use the InvokeModel API instead, which doesn't have that restriction. But yeah, it's a gotcha that's caught a lot of people.

HOST: What about encrypted PDFs? Password-protected stuff?

EXPERT: Nope. Standard, unencrypted PDFs only. If it's password-protected or encrypted in any way, it fails.

HOST: And the Files API — you mentioned it's beta?

EXPERT: It is. And here's another gotcha — it's not available on Bedrock or Vertex. Only direct API access. And files you upload through it? You can't download them back. You can only download files that were created by the model, like through code execution. So don't think of it as cloud storage. It's a processing pipeline tool.

HOST: Huh. Okay so it's upload-only from your end. That's... yeah, that's good to know.

EXPERT: Also worth mentioning — the Files API is not covered by Zero Data Retention arrangements. So if you're in an industry with strict data handling requirements, that's something to factor in.

HOST: Let me come back to the image side for a second because there are some limitations there that I think are really interesting to talk about. Like, the person identification thing.

EXPERT: Oh yeah. So Claude cannot and will not identify specific individuals in images. And this is important — it's a policy constraint, not a technical limitation. It's a deliberate choice.

HOST: So even if you show it a photo of a really famous person...

EXPERT: It's not going to name them. It'll describe what it sees — "a person in a suit standing at a podium" — but it won't say who it is.

HOST: That's a pretty clear line in the sand. What about spatial reasoning?

EXPERT: This is where things get interesting. Claude is really good at understanding what's in an image conceptually, but it struggles with precise spatial tasks. So reading an analog clock face? Not great. Describing exact positions of chess pieces on a board? Hit or miss. Counting specific objects, especially when there are a lot of them? You're getting an estimate, not an exact count.

HOST: So don't use it for inventory.

EXPERT: Please don't use it for inventory. If someone sends you a photo of a warehouse shelf and asks "how many boxes are there," the answer you get back is going to be approximate. It's good enough for "about how many" but not for "exactly how many."

HOST: That's a good way to think about it. Approximate intelligence versus precise measurement.

EXPERT: And same thing with image quality. If the image is blurry, or under two hundred pixels on any edge, or rotated weirdly, accuracy drops significantly. So always verify critical extractions from low-quality inputs.

HOST: Here's one that surprised me — Claude can't tell if an image is AI-generated?

EXPERT: Nope. Don't use it for synthetic image detection. It's not reliable for that at all.

HOST: And EXIF data? Metadata?

EXPERT: Nothing. It doesn't see EXIF data, it doesn't parse any metadata embedded in the image file. It only sees the visual content.

HOST: Okay, so let me try to pull this all together because I think there's a bigger picture here that's really compelling. We've got image understanding — analyzing charts, extracting data from photos, processing screenshots. We've got PDF processing — dual-mode text and visual analysis. We've got structured output — guaranteed JSON schemas from visual inputs. And we've got the Files API for reusable upload workflows.

EXPERT: And the thing that connects all of it is that same fundamental idea — it's not just seeing, it's understanding. Whether it's an image or a PDF or a screenshot of a dashboard, you're not asking "what pixels are here." You're asking "what does this mean."

HOST: And that's a fundamentally different kind of tool than traditional OCR or image classification.

EXPERT: Totally different. Traditional OCR gives you characters. Image classification gives you labels. This gives you comprehension. You can say "look at this quarterly report and tell me if we should be worried about the European market" and get a thoughtful, reasoned answer that combines text it read with charts it interpreted.

HOST: I mean, think about the implications for someone building a document processing pipeline. You could take in mixed-format inputs — some PDFs, some photos of paper documents, some screenshots — define your output schema once, and get uniform structured data out the other end.

EXPERT: That's the play. And with batch processing support, you can scale it up. Feed in hundreds of documents, get back structured data for all of them.

HOST: With the caveat that you should resize your images, cache your PDFs, and be aware of the token costs.

EXPERT: Always be aware of the token costs.

HOST: You know what I keep coming back to though? That dual-mode PDF processing. The fact that it's simultaneously reading the text AND looking at the page as an image. Because that's how humans read documents, right? You don't just parse the words. You notice when something is in a box, or in a different color, or formatted as a table. The layout carries meaning.

EXPERT: That's... yeah, that's actually a really good observation. The visual layout of a document is information. A number in a table header means something different from the same number in a footnote. And the dual-mode approach captures that.

HOST: So where does this go next? Like, if you're building something today with these capabilities, what should you be thinking about for the long game?

EXPERT: I think the biggest thing is designing your systems with the understanding that the boundary between "text data" and "visual data" is kind of dissolving. You don't have to choose anymore. Your input pipeline can handle both, and the model gives you a unified understanding. The question isn't "do I need image processing or text processing." It's "what do I want to know about this content?"

HOST: And that shift — from thinking about data types to thinking about questions — that feels like it changes how you architect applications from the ground up.

EXPERT: It really does. Because suddenly, the user doesn't need to know or care what format a document is in. They just ask their question, and the system figures out how to extract the answer. Whether it's reading text, interpreting a chart, or parsing a table layout — it all happens behind the scenes.

HOST: Take a photo of a whiteboard from a meeting, a PDF of the meeting notes, and a screenshot of the project dashboard, throw them all in one request, and say "what's the status of this project." And you get a real answer.

EXPERT: From three completely different input formats. In one call.

HOST: That's the kind of thing that would have been a multi-month engineering project five years ago.

EXPERT: And now it's, what, fifteen lines of code?

HOST: Maybe twenty if you're doing structured output.

EXPERT: Twenty if you're being thorough. But yeah. The hard part isn't the integration anymore. The hard part is asking the right questions.

HOST: Which, honestly? Has always been the hard part.

EXPERT: It really has. The technology just finally caught up.
