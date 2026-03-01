# Podcast: Multimodal Capabilities

**Episode Topic:** Multimodal Capabilities
**Estimated Duration:** 30 minutes
**Based on:** /Users/jackjin/dev/harness-v2-test/research/_combined_multimodal.md

---

## Opening

HOST: Imagine you're building an app that needs to process invoices. Hundreds of them, from different vendors, each with its own layout. Some are scanned PDFs, some are photos from phones, tables are all over the place. You could hire someone to manually enter all that data, or... you could teach your AI to actually *see* the invoice and understand it. That's what we're talking about today—how Claude can process images and documents, and why this is way more interesting than just fancy OCR.

EXPERT: That's the perfect setup, because a lot of people think vision capabilities in AI are just about reading text from images. But that's selling it way short. When Claude looks at an invoice—or a chart, or a UI screenshot, or a PDF full of diagrams—it's not just extracting pixels. It's understanding context, reasoning about what the visual content *means*, and connecting it to whatever you asked in your prompt.

HOST: So it's less "here's what I see" and more "here's what this means in the context of your question"?

EXPERT: Exactly. If you show Claude a line chart and ask "what's the trend?", it won't just tell you there are some lines going up and down. It'll analyze the trajectory, identify inflection points, and explain what story the data is telling. That's the interpretive piece that makes it so powerful for real applications.

## Understanding Image Processing

HOST: Let's start with the basics. How do you actually send an image to Claude? I'm guessing it's not as simple as attaching a file to an email.

EXPERT: It's actually pretty straightforward—you've got three options. The simplest is passing a URL if your image is already hosted somewhere. Just give Claude the URL and it fetches the image. The second option is base64 encoding, which is what you'd use for local files or when you don't have a URL. You read the file, encode it as a base64 string, and include that in your API request. And the third option is the Files API, which is newer and really useful if you're going to reference the same image multiple times.

HOST: Wait, why would I need to reference the same image multiple times?

EXPERT: Think about a workflow where you upload a complex diagram and then ask a series of follow-up questions about it. "What's in the upper-left corner? What does this arrow indicate? How does component A connect to component B?" With the Files API, you upload once, get a file ID, and then you can use that ID in subsequent requests without re-uploading the whole image every time. It saves bandwidth and makes your workflow cleaner.

HOST: That makes sense. So which format should I be using? JPEG, PNG, something else?

EXPERT: Claude accepts JPEG, PNG, GIF, and WebP. In practice, PNG and JPEG are your workhorses. PNG is great for screenshots, diagrams, or anything with text because it's lossless. JPEG is fine for photographs or cases where file size matters more than perfect fidelity. The API will handle any of those without you needing to do conversions.

HOST: Okay, but I'm sure there are limits. I can't just throw a hundred ultra-high-res images at it and expect magic, right?

EXPERT: Right. There's a sweet spot. You can include up to 100 images per API request—though if you're using claude.ai directly, it's capped at 20. Individual images can be up to 8,000 by 8,000 pixels if you're sending 20 or fewer. But if you're sending more than 20, the size limit drops to 2,000 by 2,000 per image. And there's a 32MB total request size limit.

HOST: So if I have a giant 5,000-pixel screenshot, should I resize it first?

EXPERT: Absolutely. One of the best practices is to resize images to around 1.15 megapixels—roughly 1,568 pixels on the longest edge—before uploading. The API can resize for you, but doing it yourself reduces latency and keeps your token costs down, because images are billed as tokens based on their dimensions.

HOST: Wait, images cost tokens? How does that work?

EXPERT: Yeah, it's calculated as width times height divided by 750. So a 1,092 by 1,092 pixel image uses about 1,590 tokens. Those add up quickly if you're processing a lot of images, so resizing ahead of time is one of those small optimizations that pays dividends at scale.

## Structuring Requests and Working with Multiple Images

HOST: Let's say I want to compare two images—like a before-and-after UI mockup. How do I structure that request?

EXPERT: You include both images in the content array of your message, and the key is to *label* them explicitly in your prompt. So you'd have a text block that says "Image 1:", then the first image block, then "Image 2:", then the second image block, and finally your actual question like "Compare these two designs and tell me what changed." That labeling helps Claude keep track of which image is which when it's reasoning through your question.

HOST: Does the order matter? Like, should images come before the text or after?

EXPERT: Great question. The recommendation is to put images *before* the text prompt. Claude performs best when you structure it as: image, image, then your question. Images placed after the text still work, but image-first is the documented best practice.

HOST: Interesting. So there's an actual performance difference just from ordering?

EXPERT: Yeah, it has to do with how the model processes the content sequence. It's a subtle thing, but when you're optimizing for production use, these little patterns matter. Same reason you'd put your schema definitions in a certain order when extracting structured data—it helps the model orient itself to what you're asking.

## Structured Data Extraction

HOST: You mentioned structured data—that's where this gets really powerful, right? Taking an image and pulling out JSON or something machine-readable?

EXPERT: Exactly. This is where Claude's vision pairs beautifully with tool use. Let's stick with that invoice example from the top. You define a tool—basically a JSON schema—that describes what an invoice looks like: vendor name, invoice number, date, total amount, maybe an array of line items with quantities and prices. Then you send Claude the invoice image and tell it to extract the data using that tool.

HOST: And it actually conforms to the schema? Like, it won't just give me freeform text?

EXPERT: Right. When you use tool definitions or JSON output mode, Claude uses constrained decoding to guarantee the output matches your schema. So if you said the date field must be a string in YYYY-MM-DD format, you'll get exactly that. No surprises, no parsing headaches.

HOST: That feels like a game-changer for automation. But I'm guessing there are still things Claude can't do with images?

EXPERT: Definitely. Let's talk about the limitations, because they're important.

## Limitations and Gotchas

HOST: Okay, hit me. What trips people up?

EXPERT: First big one: Claude cannot identify specific people. It's a policy constraint—if you upload a photo of someone, Claude won't tell you who they are, even if they're famous. It can describe attributes like "a person wearing a blue shirt," but no names, no identification.

HOST: Makes sense from a privacy standpoint.

EXPERT: Totally. Second gotcha: spatial reasoning tasks. Claude struggles with precise localization. If you show it a chessboard and ask "which square is the knight on?", or if you show it an analog clock and ask "what time is it?", those are hard for the model. It can describe the scene generally, but exact positions or coordinates—not its strong suit.

HOST: What about counting? Like, if I have a photo of a warehouse shelf and I want to know how many boxes are stacked there?

EXPERT: Approximate counts only. Claude can give you an estimate, especially for small numbers, but if you need an exact inventory count, don't rely on it. The counts get less accurate as the number of objects increases or if they're small and cluttered.

HOST: So not a replacement for a barcode scanner.

EXPERT: Not yet. Another important one: image quality really matters. If your image is below 200 pixels on any edge, or if it's blurry or rotated, accuracy tanks. Always verify critical extractions if you're working with poor-quality inputs.

HOST: What about base64 encoding? Earlier you said that's one of the methods—any gotchas there?

EXPERT: Yeah, a formatting thing that catches people: the API expects raw base64 data, not a data URL. So don't include the `data:image/png;base64,` prefix that you'd use in an HTML image tag. Just the encoded string itself.

HOST: Little things like that can eat up debugging time.

EXPERT: Absolutely. And here's one more that surprises people: when you're using JSON schema constraints with structured outputs, you have to set `additionalProperties` to false. And citations are incompatible with structured outputs, so you can't use both at the same time.

HOST: Why's that?

EXPERT: It's about how the constrained decoding works—citations would require the model to inject extra metadata into the output structure, which breaks the schema guarantee. So you have to pick: do you want strict schema compliance, or do you want citations showing where information came from?

## PDF Processing

HOST: Let's shift gears to PDFs. I feel like everyone has a mountain of PDFs they wish they could process programmatically. How's that different from just image processing?

EXPERT: PDFs are fascinating because Claude processes them in a dual-mode approach. When you send a PDF, it converts each page into an image *and* extracts the text simultaneously. That means it can understand both what's written and what's visually represented—charts, diagrams, tables, photos embedded in the document.

HOST: So it's like getting the best of both worlds—OCR for the text and vision for the graphics?

EXPERT: Exactly. And that's crucial for real-world documents. Think about a financial report. There's narrative text explaining the quarter, but there are also bar charts showing revenue trends, tables with breakdowns by region, maybe some graphs illustrating projections. Pure text extraction would miss all that visual context. Claude's approach lets you ask questions like "what does the Q4 revenue chart show?" and it can actually analyze the chart.

HOST: How do you send a PDF? Same three methods as images?

EXPERT: Yep—URL reference, base64 encoding, or Files API. URL is simplest if your PDF is hosted. Base64 works for local files. And Files API is great for documents you'll query multiple times, which is super common with PDFs. Upload once, get a file ID, reuse it.

HOST: What are the limits on PDFs? I'm guessing you can't just upload a 500-page manual and expect instant results.

EXPERT: Hard limit is 100 pages per request via the Messages API. If you've got a bigger document, you need to split it into chunks. The total request size cap is still 32MB. But here's the cool part—if you use the Files API for uploading, individual files can be up to 500MB, and you get 100GB of storage per organization.

HOST: That's a huge difference. Why is the Files API so much more generous?

EXPERT: Because it decouples upload from processing. You're not shoving the entire file into a single API call—you upload it once to their storage, and then you reference it by ID in your requests. It's a cleaner architecture for handling large documents.

HOST: What about costs? I imagine PDFs are expensive token-wise.

EXPERT: They can be. Each page incurs both text tokens—typically 1,500 to 3,000 depending on content density—plus image tokens since the page is rendered as an image. So a 3-page PDF might use around 7,000 tokens with full visual analysis. That's way more than the 1,000 or so you'd get with text-only extraction.

HOST: So if I'm processing hundreds of PDFs, I need to think about that.

EXPERT: For sure. But there's a mitigation strategy: prompt caching. You can mark a PDF with a cache control flag, and then if you ask multiple questions about the same document, the second and subsequent requests hit the cache. Costs go way down, and latency improves.

HOST: How does that work in practice?

EXPERT: You add a `cache_control` field to the document block with `type: "ephemeral"`. Then, within a certain time window—I think it's a few minutes—if you send another request referencing the same PDF, Claude reuses the cached processing. Perfect for workflows where you upload a document and then have a back-and-forth conversation about it.

## Practical Patterns and Real-World Use Cases

HOST: Let's talk about what people actually build with this. What's a common pattern?

EXPERT: Document analysis pipelines are huge. The typical flow is: upload documents via Files API to get reusable file IDs, enable caching for documents that will receive multiple queries, structure your requests with PDFs before the text prompt, and use batch processing for high-volume workflows.

HOST: Give me a concrete example.

EXPERT: Okay, financial report analysis. You've got a company's annual report—a PDF with dozens of pages, full of charts and tables. You upload it via the Files API, get a file ID. Then you send a request like: "Extract Q4 revenue figures from the charts and compare year-over-year growth." Claude scans through the pages, finds the relevant charts, reads the data, and gives you a comparison. You can follow up with "what were the main drivers mentioned in the CEO's letter?" and it pulls that from the text sections.

HOST: That's way better than manually scraping through a 50-page PDF.

EXPERT: Yeah, and it scales. Another pattern: multi-document comparison. Say you have two versions of a contract. You include both as document blocks in a single request and ask "what clauses changed between these versions?" Claude compares them side-by-side and highlights the differences.

HOST: What about structured data extraction from PDFs, like we talked about with images?

EXPERT: Same idea—you send the PDF and use a prompt that asks for JSON output. For example, you upload an invoice PDF and say "extract invoice data as JSON with fields for vendor, invoice number, date, line items, and total." Claude parses the PDF and returns structured data you can immediately use in your database or workflow.

HOST: This all sounds amazing, but I'm sure there are gotchas here too. What's the first thing I'll mess up?

EXPERT: If you're using Amazon Bedrock—and a lot of enterprises are—there's a weird one: visual PDF understanding only works if you enable citations. Without citations, Bedrock falls back to basic text extraction and ignores all the charts and diagrams.

HOST: Wait, seriously? Why is that?

EXPERT: It's a quirk of the Bedrock Converse API implementation. If you need visual analysis without citations, you have to use the InvokeModel API instead. It's one of those platform-specific gotchas that can be frustrating if you don't know it ahead of time.

HOST: What else?

EXPERT: Password-protected or encrypted PDFs won't work—only standard, unencrypted PDFs are supported. Handwritten notes or stylized fonts can challenge the text extraction accuracy. And page orientation matters—rotate your pages to upright before processing for best results.

HOST: I feel like a lot of this is just "clean your data first."

EXPERT: Exactly. It's the classic garbage-in-garbage-out principle. The better your input quality, the better Claude's output will be.

## Advanced Techniques and Edge Cases

HOST: Let's talk about edge cases. What happens if I upload a PDF with images inside it—like a scanned document with photos?

EXPERT: Claude handles it. Remember, it's converting each page to an image anyway, so embedded images just become part of that page's visual content. It can describe photos, analyze embedded diagrams, read text overlaid on images—all of it.

HOST: What about things Claude *can't* do with images or PDFs? You mentioned it can't identify people. What else is off-limits?

EXPERT: It can't access metadata—so no EXIF data from photos. It can't reliably detect if an image is AI-generated, so don't use it for synthetic image detection. And there's a healthcare restriction: while Claude can analyze general medical images, it's not designed for diagnostic imaging like CT scans or MRIs. Never use its output as a substitute for professional medical diagnosis.

HOST: That makes sense—legal and ethical boundaries.

EXPERT: Right. And there's a technical limitation people sometimes hit: you can't download files you uploaded via the Files API. You can only download files that Claude *created*, like outputs from code execution or skills. If you upload a PDF, you can reference it, but you can't get it back out.

HOST: Why would I want to download something I uploaded?

EXPERT: You might not, but sometimes people think of the Files API as general cloud storage, and it's not. It's specifically for providing inputs to Claude, not for archiving or retrieving your own files later.

## Comparing Image and PDF Workflows

HOST: Okay, big picture question: when should I use image processing versus PDF processing? Like, if I have a document that's saved as a PNG screenshot versus a PDF, does it matter?

EXPERT: Good question. If it's a single-page document, image processing is simpler and cheaper—just one image block. If it's multi-page, PDF is way better because Claude can navigate through pages and maintain context across the whole document. Also, PDFs give you that dual-mode text-and-visual processing automatically, whereas with images you're relying purely on vision.

HOST: So PDFs are kind of the "premium" option?

EXPERT: In a sense, yeah. They're more token-expensive, but they unlock richer analysis for complex documents. If you're working with invoices, contracts, reports—anything that's inherently document-shaped—PDF processing is the way to go. If you're analyzing UI screenshots, photos, or single-page graphics, images are perfect.

HOST: What about mixing them? Can I send both images and PDFs in the same request?

EXPERT: You can. The content array in the Messages API can have multiple blocks of different types—images, documents, text. So if you wanted to send a PDF report plus a separate chart image and ask Claude to cross-reference them, that's totally doable.

HOST: That's wild. You could build some really sophisticated analysis pipelines that way.

EXPERT: Absolutely. And this is where the Files API really shines—upload your assets once, reference them by ID, mix and match as needed for different queries.

## Common Mistakes

HOST: Alright, let's get into the mistakes section. If I'm just getting started with multimodal Claude, what are the top things I'm going to screw up?

EXPERT: Number one: not resizing images before upload. People send massive high-res images and wonder why their latency is terrible and their token costs are through the roof. Resize to around 1,568 pixels on the longest edge and you'll have a way better experience.

HOST: Preprocess your inputs.

EXPERT: Yep. Number two: forgetting that image order matters. Put images before your text prompt for best performance. It's a small thing, but it makes a difference.

HOST: What about with structured data extraction?

EXPERT: Not validating your schema properly. If you're using JSON output mode or tool definitions, test your schema with a few examples first. Make sure `additionalProperties` is set to false, make sure your required fields are actually required. I've seen people get frustrated because Claude's output doesn't match their expectations, but it's because the schema was ambiguous.

HOST: So Claude is giving you exactly what you asked for, just not what you *meant* to ask for.

EXPERT: Exactly. And another big one: relying on approximate counts or precise localization. If your use case needs exact object counts or pixel-perfect coordinates, Claude's vision isn't the right tool. Use computer vision libraries for that stuff.

HOST: What about PDFs specifically?

EXPERT: Exceeding the 100-page limit and getting errors. People sometimes don't realize that's a hard cap. If you have a huge document, you need to chunk it. Also, not using caching when they should—if you're asking multiple questions about the same PDF, enable caching and save yourself a ton of tokens.

HOST: And the Bedrock citations thing you mentioned.

EXPERT: Yeah, that one burns people. They deploy on Bedrock, send a PDF with charts, and Claude only analyzes the text. They think it's broken, but it's just that Bedrock requires citations to be enabled for visual analysis. It's documented, but it's not obvious.

HOST: Any other platform-specific gotchas?

EXPERT: The Files API is beta and only works with direct API access—not Bedrock, not Vertex AI. If you're on one of those platforms and trying to use file IDs, it won't work. You'll need to use URL or base64 methods instead.

## Wrap-up

HOST: Okay, we've covered a ton. Let's bring it home. If someone's listening to this and thinking "I want to add multimodal capabilities to my app," what are the three or four things they absolutely need to remember?

EXPERT: First: Claude doesn't just describe images, it *interprets* them in context. Use that to your advantage—ask it to analyze trends in charts, extract meaning from documents, reason about visual content. Second: there are three ways to provide images and PDFs—URL, base64, and Files API. Choose based on your workflow. Files API for repeated use, base64 for local files, URL for simplicity. Third: token costs are real and based on image dimensions. Resize your images before uploading to optimize performance and cost. And fourth: combine vision with structured outputs for powerful data extraction pipelines. Define your schema, let Claude do the interpretation, and you get back clean JSON you can immediately use.

HOST: And if I remember one gotcha, what should it be?

EXPERT: Image quality and preprocessing matter. Garbage in, garbage out. Clean your inputs, resize appropriately, make sure text is legible and pages are oriented correctly. Claude's amazing, but it's not magic—good inputs get you good outputs.

HOST: Perfect. I think we've demystified multimodal AI for a lot of people today. Thanks for breaking this down.

EXPERT: Anytime. It's a powerful set of capabilities, and we're just scratching the surface of what people are building with it.

HOST: If you're working with images, documents, or PDFs in your applications, this is definitely worth exploring. Thanks for listening, and we'll catch you next time.
